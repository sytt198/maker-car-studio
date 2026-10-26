/* Integration example; include in your existing ESP-IDF application.
 * No USB/Wi-Fi parser is implied. Map your actual validated input transport.
 * Do NOT add another app_main to the existing voice_car project. */
#include "car_control.h"
void maker_car_begin(void) { ESP_ERROR_CHECK(car_control_init()); }
/* Invoke from your authenticated input task every 100 ms while held. */
void maker_car_on_command(float mps, float radps) { ESP_ERROR_CHECK(car_command(mps,radps)); }
void maker_car_on_disconnect(void) { car_stop(); }
/* Existing voice commands may call car_command; a held motion must refresh
 * the watchdog. Returning from the input task or a lost connection stops it. */
