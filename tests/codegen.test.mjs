import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultProject} from '../src/project.mjs';
import {generateFiles} from '../src/codegen.mjs';
test('firmware is generated from current geometry, pins, polarity and limits',()=>{
 const c=defaultProject();c.geometry.wheelDiameter=48;c.geometry.wheelTrack=110;c.pins.leftA=12;c.motion.maxDuty=35;
 const f=generateFiles(c);assert.match(f['car_config.h'],/CAR_WHEEL_DIAMETER_MM 48/);assert.match(f['car_config.h'],/CAR_TRACK_MM 110/);assert.match(f['car_config.h'],/CAR_LEFT_A 12/);assert.match(f['car_config.h'],/CAR_MAX_DUTY 0.35f/);
 assert.match(f['car_control.c'],/CAR_WATCHDOG_MS/);assert.match(f['car_control.c'],/CAR_DEADTIME_MS/);assert.match(f['car_control.c'],/isfinite/);assert.match(f['car_control.c'],/xSemaphoreTake/);
 assert.match(f['README.md'],/未编译/);assert.ok(f['CMakeLists.txt']);assert.ok(f['car_control.h']);
});
test('generated controller preserves reversal history across explicit stop',()=>{
 const text=generateFiles(defaultProject())['car_control.c'];
 assert.match(text,/last_powered_l/);assert.match(text,/cleared_at/);
 assert.match(text,/opposite\(l,last_powered_l\)/);
 assert.match(text,/cleared_at_l\s*\+\s*CAR_DEADTIME_MS/);
 assert.match(text,/cleared_at_r\s*\+\s*CAR_DEADTIME_MS/);
 assert.match(text,/current_l!=0 && target_l==0/);
 assert.match(text,/current_r!=0 && target_r==0/);
 const stop=text.split('static void stop_locked(void)')[1].split('static void service')[0];
 assert.doesNotMatch(stop,/last_powered_l\s*=\s*0/);
});
