import {STLExporter} from 'three/addons/exporters/STLExporter.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createAssembly,disposeAssembly} from './assembly.mjs';
import {bomCSV,validateProject} from './project.mjs';
import {generateFiles} from './codegen.mjs';
function checked(c){const e=validateProject(c);if(e.length)throw new Error(e.join('\n'));}
export function stlParts(c){checked(c);const root=createAssembly(c),exporter=new STLExporter(),parts={};for(const part of root.children){if(!part.userData.manufactured)continue;part.position.set(0,0,0);part.updateMatrixWorld(true);parts[part.name+'.stl']=exporter.parse(part,{binary:true});}disposeAssembly(root);return parts;}
export function assemblySTL(c){checked(c);const root=createAssembly(c),data=new STLExporter().parse(root,{binary:true});disposeAssembly(root);return data;}
export async function assemblyGLB(c){checked(c);const root=createAssembly(c);root.scale.setScalar(.001);root.rotation.x=-Math.PI/2;root.updateMatrixWorld(true);try{return await new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true});}finally{disposeAssembly(root);}}
export function download(name,data,type='application/octet-stream'){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
export async function fusionFiles(){const paths=['MakerCar.py','MakerCar.manifest','config_core.py','README.md'];const values=await Promise.all(paths.map(async name=>{const r=await fetch(import.meta.env.BASE_URL+'fusion/MakerCar/'+name);if(!r.ok)throw new Error('Fusion脚本文件缺失：'+name);return [name,await r.text()];}));return Object.fromEntries(values);}
export async function exportProject(c,kind='all'){checked(c);const {default:JSZip}=await import('jszip'),zip=new JSZip();zip.file('MakerCar-project.json',JSON.stringify(c,null,2));if(kind==='all'){
 zip.file('BOM.csv',bomCSV(c));zip.file('model/assembly.glb',await assemblyGLB(c));zip.file('model/assembly-preview-mm.stl',assemblySTL(c).buffer);
 for(const [name,data]of Object.entries(stlParts(c)))zip.file('printable-concepts/'+name,data.buffer);
 for(const [name,data]of Object.entries(generateFiles(c)))zip.file('control/'+name,data);
 zip.file('README.md','# Maker Car 四轮参数工程\n\n四个轮胎、双1:48齿轮箱、内置同侧1:1同步传动，无履带。\nGLB以米/Y-up保存；STL以毫米/Z-up保存。打印件为待核对尺寸的概念件，未做实物配合验证。Fusion脚本创建新设计，未在Fusion运行验证。控制代码为ESP-IDF集成模块，未烧录。\n');
 }
 for(const [name,data]of Object.entries(await fusionFiles()))zip.file('fusion/MakerCar/'+name,data);
 return zip.generateAsync({type:'blob',compression:'DEFLATE'});
}
