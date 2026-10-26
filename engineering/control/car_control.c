/* Maker Car ESP-IDF adapter, ESP32-S31. Not flashed or hardware-verified.
 * GPIO default provenance: local Mosaico voice_car project. Existing direction
 * interlock/stop approach reimplemented for this independent four-tire design.
 * Match the actual 3.3 V-compatible dual H-bridge and nSLEEP before enabling. */
#include "car_control.h"
#include "car_config.h"
#include <math.h>
#include <stdbool.h>
#include "driver/gpio.h"
#include "driver/ledc.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"

static SemaphoreHandle_t lock;
static float current_l, current_r, target_l, target_r;
static float last_powered_l, last_powered_r;
static int64_t expires, ready_at, cleared_at_l, cleared_at_r;
static bool initialized;
static const int pins[4] = {CAR_LEFT_A, CAR_LEFT_B, CAR_RIGHT_A, CAR_RIGHT_B};
static const int channels[4] = {4, 5, 6, 7};
static int64_t now_ms(void) { return esp_timer_get_time() / 1000; }
static bool opposite(float a, float b) { return a * b < -0.000001f; }
static void outputs(float l, float r) {
    l *= CAR_LEFT_SIGN; r *= CAR_RIGHT_SIGN;
    const float duties[4] = {fmaxf(0,l),fmaxf(0,-l),fmaxf(0,r),fmaxf(0,-r)};
    /* Clear every output before applying either direction. */
    for(int i=0;i<4;i++) { ESP_ERROR_CHECK(ledc_set_duty(LEDC_LOW_SPEED_MODE, channels[i], 0)); ESP_ERROR_CHECK(ledc_update_duty(LEDC_LOW_SPEED_MODE, channels[i])); }
    for(int i=0;i<4;i++) { ESP_ERROR_CHECK(ledc_set_duty(LEDC_LOW_SPEED_MODE, channels[i], (unsigned)(duties[i]*255.0f))); ESP_ERROR_CHECK(ledc_update_duty(LEDC_LOW_SPEED_MODE, channels[i])); }
}
static void stop_locked(void) {
    if(current_l!=0) cleared_at_l=now_ms();
    if(current_r!=0) cleared_at_r=now_ms();
    /* Preserve each side's powered direction and clear time across stops. */
    current_l=current_r=target_l=target_r=0; expires=ready_at=0; outputs(0,0);
}
static void service(void *unused) {
    (void)unused;
    while(1) {
        xSemaphoreTake(lock, portMAX_DELAY);
        int64_t now=now_ms();
        if(expires && now>=expires) stop_locked();
        else if(expires && (!ready_at || now>=ready_at)) {
            if(current_l!=0 && target_l==0) cleared_at_l=now;
            if(current_r!=0 && target_r==0) cleared_at_r=now;
            current_l=target_l; current_r=target_r; ready_at=0;
            if(current_l!=0) last_powered_l=current_l;
            if(current_r!=0) last_powered_r=current_r;
            outputs(current_l,current_r);
        }
        xSemaphoreGive(lock);
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}
esp_err_t car_control_init(void) {
    if(initialized || lock) return ESP_ERR_INVALID_STATE;
    for(int i=0;i<4;i++) { ESP_ERROR_CHECK(gpio_reset_pin(pins[i])); ESP_ERROR_CHECK(gpio_set_level(pins[i],0)); ESP_ERROR_CHECK(gpio_set_direction(pins[i],GPIO_MODE_OUTPUT)); }
    ledc_timer_config_t timer={.speed_mode=LEDC_LOW_SPEED_MODE,.duty_resolution=LEDC_TIMER_8_BIT,.timer_num=LEDC_TIMER_3,.freq_hz=CAR_PWM_HZ,.clk_cfg=LEDC_AUTO_CLK};
    esp_err_t result=ledc_timer_config(&timer); if(result!=ESP_OK) return result;
    for(int i=0;i<4;i++) {
        ledc_channel_config_t channel={.gpio_num=pins[i],.speed_mode=LEDC_LOW_SPEED_MODE,.channel=channels[i],.timer_sel=LEDC_TIMER_3,.duty=0,.hpoint=0};
        result=ledc_channel_config(&channel); if(result!=ESP_OK) return result;
    }
    lock=xSemaphoreCreateMutex(); if(!lock) return ESP_ERR_NO_MEM;
    if(xTaskCreate(service,"maker_car",3072,NULL,5,NULL)!=pdPASS) { vSemaphoreDelete(lock);lock=NULL;return ESP_ERR_NO_MEM; }
    initialized=true; return ESP_OK;
}
esp_err_t car_command(float linear, float angular) {
    if(!initialized) return ESP_ERR_INVALID_STATE;
    if(!isfinite(linear)||!isfinite(angular)) {car_stop();return ESP_ERR_INVALID_ARG;}
    /* Bound inputs before conversion to prevent overflow. */
    if(fabsf(linear)>2 || fabsf(angular)>10) {car_stop();return ESP_ERR_INVALID_ARG;}
    float circumference=3.14159265359f*CAR_WHEEL_DIAMETER_MM/1000.0f;
    float l=(linear-angular*CAR_TRACK_MM/2000.0f)*60.0f/circumference/CAR_ESTIMATED_OUTPUT_RPM;
    float r=(linear+angular*CAR_TRACK_MM/2000.0f)*60.0f/circumference/CAR_ESTIMATED_OUTPUT_RPM;
    float scale=fmaxf(1.0f,fmaxf(fabsf(l),fabsf(r))/CAR_MAX_DUTY); l/=scale;r/=scale;
    xSemaphoreTake(lock,portMAX_DELAY);
    if(fabsf(l)<0.00001f && fabsf(r)<0.00001f) stop_locked();
    else {
        int64_t now=now_ms();
        bool reverse_l=opposite(l,current_l) || (current_l==0 && opposite(l,last_powered_l) && now<cleared_at_l+CAR_DEADTIME_MS);
        bool reverse_r=opposite(r,current_r) || (current_r==0 && opposite(r,last_powered_r) && now<cleared_at_r+CAR_DEADTIME_MS);
        if(reverse_l || reverse_r) {
            if(current_l!=0) cleared_at_l=now;
            if(current_r!=0) cleared_at_r=now;
            current_l=current_r=0;outputs(0,0);
        }
        ready_at=0;
        if(current_l==0 && opposite(l,last_powered_l)) ready_at=cleared_at_l+CAR_DEADTIME_MS;
        if(current_r==0 && opposite(r,last_powered_r) && cleared_at_r+CAR_DEADTIME_MS>ready_at)
            ready_at=cleared_at_r+CAR_DEADTIME_MS;
        target_l=l;target_r=r;expires=now+CAR_WATCHDOG_MS;
    }
    xSemaphoreGive(lock);return ESP_OK;
}
void car_stop(void) {
    if(!initialized) return;
    xSemaphoreTake(lock,portMAX_DELAY);stop_locked();xSemaphoreGive(lock);
}
