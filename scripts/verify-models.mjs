import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {engineeringRoot} from './paths.mjs';
const dir=path.join(engineeringRoot,'generated');
const data=await readFile(path.join(dir,'assembly.glb')),buffer=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
const gltf=await new GLTFLoader().parseAsync(buffer,'');gltf.scene.updateMatrixWorld(true);let wheels=0,parts=0;
gltf.scene.traverse(o=>{if(o.userData.kind==='wheel')wheels++;if(o.userData.id)parts++;});assert.equal(wheels,4);assert.ok(parts>=30);
const bounds=new T.Box3().setFromObject(gltf.scene);assert.ok(Math.abs(bounds.min.y)<.0001);assert.ok(bounds.max.y<.1);assert.ok(bounds.max.x-bounds.min.x>.1);
const stlLoader=new STLLoader(),files=await readdir(path.join(dir,'printable-concepts'));let printableTriangles=0;
for(const name of files){const b=await readFile(path.join(dir,'printable-concepts',name)),g=stlLoader.parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));g.computeBoundingBox();assert.ok(g.attributes.position.count>0);for(const n of g.attributes.position.array)assert.ok(Number.isFinite(n));printableTriangles+=g.attributes.position.count/3;}
const result={fourTires:wheels,assemblyParts:parts,glbUnit:'meter, Y-up',glbBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},printableFiles:files.length,printableTriangles,verifiedAt:new Date().toISOString()};await writeFile(path.join(dir,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
