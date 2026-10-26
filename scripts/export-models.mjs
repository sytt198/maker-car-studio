import {mkdir,writeFile,readFile,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {defaultProject,bomCSV} from '../src/project.mjs';
import {assemblyGLB,assemblySTL,stlParts} from '../src/exports.mjs';
import {generateFiles} from '../src/codegen.mjs';
import {engineeringRoot,webRoot} from './paths.mjs';
// GLTFExporter uses the browser FileReader API for binary buffers; no images are exported.
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();}).catch(error=>this.onerror?.(error));}readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result='data:'+blob.type+';base64,'+Buffer.from(result).toString('base64');this.onloadend?.();});}};
const web=webRoot,target=engineeringRoot,out=path.join(target,'generated');
await mkdir(path.join(out,'printable-concepts'),{recursive:true});await mkdir(path.join(target,'control'),{recursive:true});await mkdir(path.join(web,'public/fusion/MakerCar'),{recursive:true});
const c=defaultProject();await writeFile(path.join(out,'MakerCar-project.json'),JSON.stringify(c,null,2));await writeFile(path.join(out,'BOM.csv'),bomCSV(c));
await writeFile(path.join(out,'assembly.glb'),Buffer.from(await assemblyGLB(c)));await writeFile(path.join(out,'assembly-preview-mm.stl'),Buffer.from(assemblySTL(c).buffer));
for(const [name,data]of Object.entries(stlParts(c)))await writeFile(path.join(out,'printable-concepts',name),Buffer.from(data.buffer));
for(const [name,data]of Object.entries(generateFiles(c)))await writeFile(path.join(target,'control',name),data);
for(const name of ['MakerCar.py','MakerCar.manifest','config_core.py','README.md'])await copyFile(path.join(target,'fusion/MakerCar',name),path.join(web,'public/fusion/MakerCar',name));
await copyFile(path.join(out,'MakerCar-project.json'),path.join(web,'public/default-project.json'));
// Verify actual GLB header and the STL triangle count before declaring artifact generation successful.
const glb=await readFile(path.join(out,'assembly.glb'));if(glb.readUInt32LE(0)!==0x46546c67||glb.readUInt32LE(8)!==glb.length)throw new Error('Invalid GLB');
const stl=await readFile(path.join(out,'assembly-preview-mm.stl'));if(stl.length!==84+50*stl.readUInt32LE(80))throw new Error('Invalid STL');
console.log(`Models written and headers verified: ${glb.length} byte GLB, ${stl.readUInt32LE(80)} STL triangles.`);
