import {readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {engineeringRoot} from './paths.mjs';
const root=engineeringRoot,zip=new JSZip();
async function add(dir,prefix){for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.name==='__pycache__'||entry.name.endsWith('.pyc'))continue;const full=path.join(dir,entry.name),name=prefix+'/'+entry.name;if(entry.isDirectory())await add(full,name);else zip.file(name,await readFile(full));}}
await add(path.join(root,'generated'),'model');await add(path.join(root,'control'),'control');await add(path.join(root,'fusion/MakerCar'),'fusion/MakerCar');zip.file('README.md',await readFile(path.join(root,'README-MakerCar.md')));
const data=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}),checked=await JSZip.loadAsync(data);assert.ok(checked.file('model/assembly.glb'));assert.ok(checked.file('fusion/MakerCar/MakerCar.py'));const conf=JSON.parse(await checked.file('model/MakerCar-project.json').async('string'));assert.equal(conf.layout,'four-wheel-skid');assert.equal(conf.motor.gearRatio,48);const firmware=await checked.file('control/car_control.c').async('string');assert.ok(firmware.includes('cleared_at_l'));await writeFile(path.join(root,'MakerCar-project.zip'),data);console.log(`Verified engineering archive: ${data.length} bytes, ${Object.keys(checked.files).length} entries.`);
