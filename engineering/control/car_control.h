#pragma once
#include "esp_err.h"
/* Call once. Fails closed on initialization errors. */
esp_err_t car_control_init(void);
/* Refresh every <=100 ms while an explicit human command is active.
 * Units: linear m/s, angular rad/s. +angular turns left.
 * No encoder feedback: values only estimate desired PWM.
 * Call from a normal task, never an ISR. */
esp_err_t car_command(float linear, float angular);
void car_stop(void);
