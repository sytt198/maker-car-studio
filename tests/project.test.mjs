import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultProject, validateProject, parseProject, dimensions, differential, buildBOM} from '../src/project.mjs';

test('default project is a feasible four tire concept with coplanar ground contacts',()=>{
 const c=defaultProject();assert.deepEqual(validateProject(c),[]);
 const d=dimensions(c);assert.equal(d.axleZ,20);assert.equal(d.deckBottom,32);assert.equal(d.boardZ,44.4);assert.equal(d.wheelGroundZ,0);assert.equal(c.motor.gearRatio,48);
 assert.ok(d.motorTop<d.deckBottom);assert.ok(d.boardZ>d.driverTop);
});
test('rejects impossible wheel clearance, board size, duplicate GPIO and nonfinite data',()=>{
 for(const mutate of [c=>c.geometry.wheelTrack=60,c=>c.geometry.boardWidth=100,c=>c.pins.leftA=c.pins.rightA,c=>c.geometry.length=NaN,c=>c.motion.maxDuty=0]){
  const c=defaultProject();mutate(c);assert.ok(validateProject(c).length);
 }
});
test('import is strict and cannot coerce strings or omit critical fields',()=>{
 const c=defaultProject();assert.equal(parseProject(JSON.stringify(c)).schemaVersion,1);
 for(const bad of ['null','{}','{"schemaVersion":999}',JSON.stringify({...c,geometry:{...c.geometry,length:'90'}})])assert.throws(()=>parseProject(bad));
});
test('differential kinematics uses the live wheel track and diameter and preserves turn ratio on saturation',()=>{
 const c=defaultProject();const a=differential(c,.1,0);assert.ok(Math.abs(a.leftRPM-47.74648)<.001);assert.equal(a.leftRPM,a.rightRPM);
 const b=differential(c,0,1);assert.ok(b.leftRPM<0&&b.rightRPM>0);
 c.geometry.wheelDiameter=80;assert.ok(Math.abs(differential(c,.1,0).leftRPM-a.leftRPM/2)<.001);
 const fast=differential(c,10,5);assert.ok(Math.max(Math.abs(fast.leftRPM),Math.abs(fast.rightRPM))<=c.motor.outputRPM*c.motion.maxDuty/100+.001);assert.ok(fast.saturated);
});
test('BOM never treats unknown prices as zero-cost complete quotation',()=>{
 const c=defaultProject();const b=buildBOM(c);assert.equal(b.rows.find(r=>r.id==='motor').qty,2);assert.ok(b.unknownCount>0);assert.equal(b.totalKnown,0);
 c.prices.motor=18.5;assert.equal(buildBOM(c).totalKnown,37);assert.equal(buildBOM(c).rows.find(r=>r.id==='motor').status,'方案指定 · 待核尺寸');
});
