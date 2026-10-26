export const fieldGroups = [
 {title:'底盘与框架',fields:[['length','底盘长度',90,180,1],['width','底盘宽度',70,140,1],['thickness','底板厚度',2,6,.2],['standoff','上层支撑高度',8,30,1]]},
 {title:'四轮与传动',fields:[['wheelDiameter','轮胎直径',28,64,1],['wheelWidth','轮胎宽度',6,18,1],['wheelbase','前后轴距',50,130,1],['wheelTrack','左右轮距',88,180,1],['shaftDiameter','轮轴直径 · 待核',2,6,.1]]},
 {title:'Mosaico 安装包络',note:'临时包络，固定采用托架；按实物尺寸调整。',fields:[['boardLength','主机长度',40,110,1],['boardWidth','主机宽度',40,100,1],['boardHeight','主机高度',8,30,1],['clearance','每侧装配余量',.3,2,.1]]},
 {title:'1:48 齿轮箱包络',note:'按说明书装配逻辑重建，包络与接口待实测。',fields:[['gearLength','齿轮箱长度',30,65,1],['gearWidth','齿轮箱宽度',10,24,1],['gearHeight','齿轮箱高度',12,28,1]]}
];
export function defaultProject(){return {
 schemaVersion:1,name:'Mosaico · 四轮差速小车',layout:'four-wheel-skid',
 geometry:{length:110,width:76,thickness:2.4,standoff:10,wheelDiameter:40,wheelWidth:8,wheelbase:70,wheelTrack:94,shaftDiameter:3,boardLength:60,boardWidth:60,boardHeight:18,clearance:.6,gearLength:44,gearWidth:14,gearHeight:18},
 motor:{gearRatio:48,outputRPM:160,voltage:6,rpmVerified:false},
 pins:{leftA:11,leftB:10,rightA:46,rightB:47},motion:{maxDuty:40,watchdogMs:400,deadtimeMs:40,leftSign:1,rightSign:-1},prices:{},
 provenance:{mechanical:'CyberBrick Mini T 组装说明.pdf，第6–14、29–33页；轮胎替代履带，新增内置1:1同步带联动。',board:'ESP-Mosaico，包络待实测',motor:'1:48 齿轮包，轴/接口/电压/转速待实测。原42:1电机照片仅作备选。'}
};}
export function dimensions(c){const p=c.geometry,r=p.wheelDiameter/2;return {axleZ:r,deckBottom:r+12,deckTop:r+12+p.thickness,boardZ:r+12+p.thickness+p.standoff,boardTop:r+12+p.thickness+p.standoff+p.boardHeight,motorTop:r+10,gearTop:r+1+p.gearHeight/2,driverTop:r+12+p.thickness+5,wheelGroundZ:0,totalWidth:p.wheelTrack+p.wheelWidth,totalLength:Math.max(p.length,p.wheelbase+p.wheelDiameter),beltPitchLength:2*p.wheelbase+Math.PI*12,gearX:p.wheelTrack/2-p.wheelWidth/2-4-p.gearWidth/2};}
const finite=(n)=>typeof n==='number'&&Number.isFinite(n);
export function validateProject(c){
 const e=[];if(!c||typeof c!=='object'||c.schemaVersion!==1||c.layout!=='four-wheel-skid')return ['配置版本或底盘类型不匹配。'];
 if(typeof c.name!=='string'||!c.name.trim()||c.name.length>80)e.push('工程名称需要1–80个字符。');
 if(!c.geometry||!c.motor||!c.pins||!c.motion||!c.prices)return [...e,'缺少结构、传动、电气或价格配置。'];
 for(const group of fieldGroups)for(const [key,label,min,max] of group.fields){const n=c.geometry[key];if(!finite(n)||n<min||n>max)e.push(`${label}应为 ${min}–${max} mm。`);}
 for(const [k,min,max,label] of [['gearRatio',48,48,'当前齿轮包减速比'],['outputRPM',20,500,'估算输出转速'],['voltage',3,6,'电机额定电压']])if(!finite(c.motor[k])||c.motor[k]<min||c.motor[k]>max)e.push(`${label}应为 ${min}–${max}。`);
 for(const [k,min,max] of [['maxDuty',1,60],['watchdogMs',100,1000],['deadtimeMs',20,100]])if(!finite(c.motion[k])||!Number.isInteger(c.motion[k])||c.motion[k]<min||c.motion[k]>max)e.push(`${k} 超出允许范围 ${min}–${max}。`);
 for(const k of ['leftSign','rightSign'])if(![1,-1].includes(c.motion[k]))e.push('左右电机极性只能为 +1 或 -1。');
 const allowed=[10,11,12,13,15,16,17,18,19,38,46,47,48,53,55];
 const pins=['leftA','leftB','rightA','rightB'].map(k=>c.pins[k]);
 if(pins.some(n=>!Number.isInteger(n)||!allowed.includes(n)))e.push('请选择未占用的扩展 GPIO；默认46/47、11/10来自已有工程。');
 if(new Set(pins).size!==4)e.push('四路电机 GPIO 不可重复。');
 for(const [id,v] of Object.entries(c.prices))if(!/^[a-z_]+$/.test(id)||!(v===null||finite(v)&&v>=0&&v<=100000))e.push('BOM单价应为空或0–100000的数值。');
 if(e.length)return e;
 const p=c.geometry,d=dimensions(c);
 if(p.wheelTrack-p.wheelWidth-p.width<4)e.push('轮胎内侧与底盘每侧至少需要2 mm间隙；增大轮距或减小宽度。');
 if(p.boardWidth+2*p.clearance+6>p.width||p.boardLength+2*p.clearance+6>p.length)e.push('Mosaico包络及托架超出底盘；增大底盘或核对主机尺寸。');
 if(p.wheelbase>p.length-24)e.push('前后轴安装位距底盘端面至少12 mm。');
 if(p.wheelbase<p.wheelDiameter+6)e.push('前后轮胎之间至少需要6 mm间隔。');
 if(d.gearTop>d.deckBottom-1)e.push('齿轮箱顶面与底盘需至少1 mm间隙；减小齿轮箱高度。');
 if(d.gearX-p.gearWidth/2<22)e.push('齿轮箱与中央电池空间冲突；增大左右轮距或减小齿轮箱宽度。');
 if(p.gearLength>p.wheelbase-8)e.push('齿轮箱长度与前轮轴支座冲突；增大轴距或减小齿轮箱。');
 return e;
}
export function parseProject(text){let raw;try{raw=JSON.parse(text);}catch{throw new Error('不是有效的 JSON 文件。');}const e=validateProject(raw);if(e.length)throw new Error(e.join('\n'));const c=defaultProject();for(const k of ['name','layout','geometry','motor','pins','motion','prices'])c[k]=structuredClone(raw[k]);return c;}
export function differential(c,linear,angular){const p=c.geometry;const vL=linear-angular*p.wheelTrack/2000,vR=linear+angular*p.wheelTrack/2000;let leftRPM=vL*60000/(Math.PI*p.wheelDiameter),rightRPM=vR*60000/(Math.PI*p.wheelDiameter);const limit=c.motor.outputRPM*c.motion.maxDuty/100;const scale=Math.max(1,Math.abs(leftRPM)/limit,Math.abs(rightRPM)/limit);leftRPM/=scale;rightRPM/=scale;return {leftRPM,rightRPM,leftDuty:leftRPM/c.motor.outputRPM,rightDuty:rightRPM/c.motor.outputRPM,linear:(leftRPM+rightRPM)/2*Math.PI*p.wheelDiameter/60000,angular:(rightRPM-leftRPM)*Math.PI*p.wheelDiameter/(60*p.wheelTrack),saturated:scale>1};}
export function buildBOM(c){const p=c.geometry,d=dimensions(c);const rows=[
 ['chassis','底盘框架','自制件',1,`${p.length} × ${p.width} × ${p.thickness} mm`,'参数化概念','frame'],
 ['tray','Mosaico 可调托架','自制件',1,`${p.boardLength} × ${p.boardWidth} + ${p.clearance} mm余量`,'待试装','frame'],
 ['bracket','齿轮箱安装座 / 前轴支座','自制件',4,`轴径 ${p.shaftDiameter} mm`,'接口待核','frame'],
 ['motor','1:48 单轴减速齿轮包','动力件',2,`${p.gearLength} × ${p.gearWidth} × ${p.gearHeight} mm（暂定）`,'方案指定 · 待核尺寸','drive'],
 ['wheel','橡胶轮胎与轮毂','动力件',4,`Ø${p.wheelDiameter} × ${p.wheelWidth} mm`,'建议件 · 待选型','drive'],
 ['axle','独立轮轴','传动件',4,`Ø${p.shaftDiameter} mm；长度待适配`,'建议件 · 待选型','drive'],
 ['bearing','轮轴支承 / 衬套','传动件',4,`内径 ${p.shaftDiameter} mm`,'建议件 · 待选型','drive'],
 ['pulley','1:1 同步带轮','传动件',4,'等齿数一对；节圆Ø12 mm为预览值','建议件 · 待选型','drive'],
 ['belt','内置同步带（非履带）','传动件',2,`理论节长 ${d.beltPitchLength.toFixed(1)} mm，需按实际节距选型/张紧`,'建议件 · 待选型','drive'],
 ['mosaico','ESP-Mosaico 主机','电子件',1,`${p.boardLength} × ${p.boardWidth} × ${p.boardHeight} mm包络`,'已有主控 · 尺寸待测','electronics'],
 ['driver','双 H 桥驱动模块','电子件',1,'建议 DRV8833 类3.3 V逻辑模块；电流与接口待核','建议件 · 待选型','electronics'],
 ['battery','电池与电源适配','电子件',1,`40 × 25 × 12 mm预留；电机供电≤${c.motor.voltage} V`,'待选型 · 非直连电池方案','electronics'],
 ['fastener','M2.5 紧固与支撑件','标准件',1,`支撑 ${p.standoff} mm；数量按最终安装核定`,'建议套件','frame'],
 ['wiring','线束 / 开关 / 插头','标准件',1,'主控与电机电源分路、共地','待选型','electronics']
 ].map(([id,name,category,qty,spec,status,group])=>{const price=finite(c.prices[id])?c.prices[id]:null;return {id,name,category,qty,spec,status,group,price,subtotal:price===null?null:Math.round(price*100)*qty/100};});return {rows,totalKnown:rows.reduce((sum,r)=>sum+(r.subtotal??0),0),unknownCount:rows.filter(r=>r.price===null).length};}
export function bomCSV(c){const b=buildBOM(c),q=v=>'"'+String(v??'').replaceAll('"','""')+'"';return '\uFEFF'+[['零件','类别','数量','规格','选型状态','单价(CNY)','小计(CNY)'],...b.rows.map(r=>[r.name,r.category,r.qty,r.spec,r.status,r.price,r.subtotal])].map(row=>row.map(q).join(',')).join('\r\n');}
