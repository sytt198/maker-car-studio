import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {defaultProject,dimensions} from '../src/project.mjs';
import {createAssembly} from '../src/assembly.mjs';
test('assembly has four independent tire groups, no tracks or caster, and printable components',()=>{
 const c=defaultProject(),a=createAssembly(c);a.updateMatrixWorld(true);
 const wheels=a.children.filter(p=>p.userData.kind==='wheel');assert.equal(wheels.length,4);assert.ok(a.children.filter(p=>p.userData.manufactured).length>=7);
 for(const p of wheels){const b=new THREE.Box3().setFromObject(p);assert.ok(Math.abs(b.min.z)<.001);assert.ok(Math.abs(b.max.z-c.geometry.wheelDiameter)<.001);}
 assert.ok(!a.children.some(p=>/track|caster/i.test(p.name)));
 const board=a.getObjectByName('mosaico');assert.ok(Math.abs(new THREE.Box3().setFromObject(board).min.z-dimensions(c).boardZ)<.001);
 a.traverse(o=>{if(o.isMesh){assert.ok(o.geometry.attributes.position.count>0);for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));}});
});
test('geometry follows wheelbase and tire diameter independently',()=>{
 const c=defaultProject();c.geometry.wheelbase=78;c.geometry.length=120;c.geometry.wheelDiameter=48;const a=createAssembly(c);a.updateMatrixWorld(true);
 const f=a.getObjectByName('wheel-left-front');assert.equal(f.position.y,39);assert.equal(f.position.z,24);
 const bounds=new THREE.Box3().setFromObject(a);assert.ok(Math.abs(bounds.min.z)<.001);
});
