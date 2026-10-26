import * as T from 'three';
import {dimensions} from './project.mjs';
export const partGroups={frame:'机架组件',drive:'四轮与传动',electronics:'电子组件'};
export function roundedPath(w,l,r=2,x=0,y=0,Path=T.Shape){const s=new Path(),a=x-w/2,b=y-l/2;r=Math.min(r,w/2,l/2);s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+l-r);s.quadraticCurveTo(a+w,b+l,a+w-r,b+l);s.lineTo(a+r,b+l);s.quadraticCurveTo(a,b+l,a,b+l-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);return s;}
const mat=(color,metalness=.12,roughness=.5)=>new T.MeshStandardMaterial({color,metalness,roughness});
function mesh(g,m,pos=[0,0,0]){const o=new T.Mesh(g,m);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;return o;}
function box(w,l,h,m,pos){return mesh(new T.BoxGeometry(w,l,h),m,pos);}
function cylinder(r,h,m,pos,axis='z',inner=0){let geo;if(inner){const s=new T.Shape();s.absarc(0,0,r,0,Math.PI*2);const hole=new T.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);s.holes.push(hole);geo=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:36});geo.translate(0,0,-h/2);}else{geo=new T.CylinderGeometry(r,r,h,48);geo.rotateX(Math.PI/2);}if(axis==='x')geo.rotateY(Math.PI/2);return mesh(geo,m,pos);}
function plate(w,l,h,m,pos,holes=[],radius=3){const s=roundedPath(w,l,radius);for(const hole of holes){if(hole.r){const p=new T.Path();p.absarc(hole.x,hole.y,hole.r,0,Math.PI*2,true);s.holes.push(p);}else s.holes.push(roundedPath(hole.w,hole.l,hole.radius??1,hole.x,hole.y,T.Path));}return mesh(new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:8}),m,pos);}
function gear(r,h,m,pos){const shape=new T.Shape(),teeth=14;for(let i=0;i<=teeth*4;i++){const a=i/(teeth*4)*Math.PI*2,R=r*(i%4===0||i%4===3?.87:1),x=R*Math.cos(a),y=R*Math.sin(a);if(!i)shape.moveTo(x,y);else shape.lineTo(x,y);}const g=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});g.translate(0,0,-h/2);g.rotateY(Math.PI/2);return mesh(g,m,pos);}
export function createAssembly(c){const p=c.geometry,d=dimensions(c),root=new T.Group();root.name='MakerCar-four-wheel-48';
 const white=mat('#dce2eb',.12,.48),blue=mat('#315bef',.32,.32),rubber=mat('#252b33',.03,.88),steel=mat('#bdc7d1',.78,.28),brass=mat('#bba269',.7,.32),pcb=mat('#166352',.25,.46),dark=mat('#141c2a',.3,.35),gearMat=mat('#d9c99a',.25,.56);
 const part=(id,label,group,bomId,manufactured,position=[0,0,0],explode=[0,0,0],kind='part')=>{const g=new T.Group();g.name=id;g.position.set(...position);g.userData={id,label,group,bomId,manufactured,basePosition:position,explode,kind};root.add(g);return g;};
 const holes=[{x:0,y:0,w:20,l:14,radius:2}];for(const s of [-1,1])for(const t of [-1,1]){holes.push({x:s*21,y:t*14,w:3,l:17});holes.push({x:s*((p.boardWidth+2*p.clearance+4)/2-5),y:t*((p.boardLength+2*p.clearance+4)/2-5),r:1.35});}
 part('chassis','底盘框架','frame','chassis',true,[0,0,d.deckBottom],[0,0,-22]).add(plate(p.width,p.length,p.thickness,white,[0,0,0],holes,5));
 const trayW=p.boardWidth+2*p.clearance+4,trayL=p.boardLength+2*p.clearance+4;
 const tray=part('tray','Mosaico 安装托架','frame','tray',true,[0,0,d.boardZ-2.4],[0,0,22]);
 const trayHoles=[{x:0,y:0,w:p.boardWidth-14,l:p.boardLength-14,radius:3}];for(const s of [-1,1])for(const t of [-1,1])trayHoles.push({x:s*(trayW/2-5),y:t*(trayL/2-5),r:1.35});
 tray.add(plate(trayW,trayL,2.4,white,[0,0,0],trayHoles,3));
 for(const s of [-1,1]){tray.add(box(2,trayL-8,3.5,white,[s*(trayW/2-1),0,4.15]));tray.add(box(trayW-16,2,3.5,white,[0,s*(trayL/2-1),4.15]));}
 for(const s of [-1,1])for(const t of [-1,1]){const x=s*(trayW/2-5),y=t*(trayL/2-5),h=p.standoff-2.4;part(`post-${s}-${t}`,'主机支撑柱','frame','fastener',true,[x,y,d.deckTop],[0,0,10]).add(cylinder(2.5,h,brass,[0,0,h/2],'z',1.25));part(`screw-${s}-${t}`,'托架固定螺钉','frame','fastener',false,[x,y,d.boardZ],[0,0,24]).add(cylinder(2,1,steel,[0,0,-1.8]));}
 // Each side has a gearbox at the rear, a supported front shaft, and an internal 1:1 belt.
 for(const side of [-1,1]){const sideName=side<0?'left':'right',x=side*d.gearX,gearY=-p.wheelbase/2+p.gearLength/2-4;
  const g=part(`gearbox-${sideName}`,`${side<0?'左':'右'} 1:48 齿轮包包络`,'drive','motor',false,[x,gearY,d.axleZ+1],[side*18,-8,-12]);
  g.add(box(p.gearWidth,p.gearLength,p.gearHeight,gearMat,[0,0,0]));
  g.add(box(p.gearWidth+.5,p.gearLength,.9,steel,[0,0,p.gearHeight/2+.2]));
  // Schematic gears are intentionally not a manufacturing definition of the original 1:48 pack.
  for(let j=0;j<4;j++)g.add(gear(3+j*.55,1.1,brass,[side*(p.gearWidth/2+.4),-p.gearLength/2+5+j*9,0]));
  const motor=part(`motor-${sideName}`,`${side<0?'左':'右'} 电机包络`,'drive','motor',false,[x,gearY+9,d.axleZ+1],[side*18,-8,-12]);motor.add(box(p.gearWidth-2,16,10,steel,[0,0,0]));motor.add(box(p.gearWidth-1,3,10,dark,[0,9,0]));
  const bracket=part(`bracket-${sideName}`,'齿轮箱夹持座','frame','bracket',true,[x,gearY,d.axleZ+1-p.gearHeight/2-1],[side*9,0,-18]);
  const inner=p.gearWidth+1,outer=inner+3.2,H=d.deckBottom-bracket.position.z+p.thickness,top=p.gearHeight+1.6;
  const s=new T.Shape();s.moveTo(-outer/2,0);s.lineTo(-outer/2,H);s.lineTo(outer/2,H);s.lineTo(outer/2,0);s.lineTo(inner/2,0);s.lineTo(inner/2,top);s.lineTo(-inner/2,top);s.lineTo(-inner/2,0);s.closePath();const bg=new T.ExtrudeGeometry(s,{depth:9,bevelEnabled:false});bg.rotateX(Math.PI/2);bg.translate(0,4.5,0);bracket.add(mesh(bg,blue));
  for(const t of [-1,1]){const y=t*p.wheelbase/2;
   part(`shaft-${sideName}-${t}`,'独立轮轴','drive','axle',false,[side*(d.gearX+p.gearWidth/2+4),y,d.axleZ],[side*14,t*5,-4]).add(cylinder(p.shaftDiameter/2,14,steel,[0,0,0],'x'));
   const pulleyX=side*(p.wheelTrack/2-p.wheelWidth/2-3);
   part(`pulley-${sideName}-${t}`,'同步带轮 · 等齿数示意','drive','pulley',false,[pulleyX,y,d.axleZ],[side*22,t*4,0]).add(gear(6,2.5,dark,[0,0,0]));
   if(t===1){const b=part(`bearing-${sideName}`,'前轮轴支承座','frame','bracket',true,[x,y,d.axleZ],[side*12,8,-12]);b.add(cylinder(4.5,7,blue,[0,0,0],'x',p.shaftDiameter/2+.2));b.add(box(7,8,d.deckBottom-d.axleZ-3,blue,[0,0,(d.deckBottom-d.axleZ+3)/2]));}
   const w=part(`wheel-${sideName}-${t===1?'front':'rear'}`,`${side<0?'左':'右'}${t===1?'前':'后'}轮胎与轮毂`,'drive','wheel',false,[side*p.wheelTrack/2,y,d.axleZ],[side*30,t*10,0],'wheel');w.userData.side=sideName;
   w.add(cylinder(p.wheelDiameter/2-.65,p.wheelWidth,rubber,[0,0,0],'x',p.wheelDiameter*.34));w.add(cylinder(p.wheelDiameter*.34,p.wheelWidth*.88,blue,[0,0,0],'x',p.wheelDiameter*.25));w.add(cylinder(p.wheelDiameter*.12,p.wheelWidth+1,steel,[0,0,0],'x',p.shaftDiameter/2));
   for(let j=0;j<7;j++){const a=j*Math.PI*2/7,sp=box(p.wheelWidth*.65,p.wheelDiameter*.23,2,blue,[0,Math.cos(a)*p.wheelDiameter*.215,Math.sin(a)*p.wheelDiameter*.215]);sp.rotation.x=a;w.add(sp);}
   for(let j=0;j<40;j++){const a=j*Math.PI*2/40,tread=box(p.wheelWidth*.94,1.2,1.5,rubber,[0,Math.cos(a)*(p.wheelDiameter/2-.75),Math.sin(a)*(p.wheelDiameter/2-.75)]);tread.rotation.x=a-Math.PI/2;w.add(tread);}
  }
  const belt=part(`belt-${sideName}`,'内置同步带 · 非履带','drive','belt',false,[side*(p.wheelTrack/2-p.wheelWidth/2-3),0,d.axleZ],[side*22,0,-3]);
  for(const z of [-6,6])belt.add(box(1.6,p.wheelbase,.9,rubber,[0,0,z]));
  for(const t of [-1,1]){const tor=new T.Mesh(new T.TorusGeometry(6,.6,6,40,Math.PI),rubber);tor.rotation.y=Math.PI/2;tor.rotation.x=t<0?Math.PI:0;tor.position.y=t*p.wheelbase/2;belt.add(tor);}
 }
 const board=part('mosaico','ESP-Mosaico · 临时包络','electronics','mosaico',false,[0,0,d.boardZ],[0,0,42]);board.add(plate(p.boardWidth,p.boardLength,1.6,pcb,[0,0,0],[],3));board.add(box(p.boardWidth-3,p.boardLength-3,p.boardHeight-3.6,dark,[0,0,(p.boardHeight-3.6)/2+2]));board.add(plate(p.boardWidth-6,p.boardLength-6,.5,mat('#0d1724',.1,.24),[0,0,p.boardHeight-.5],[],2));board.add(box(9,4,3,steel,[0,-p.boardLength/2-1,3]));
 // Code-native geometric face, not part of the board's measured geometry.
 const face=new T.MeshBasicMaterial({color:'#51dfe3'});for(const x of [-10,10])board.add(box(4,7,.2,face,[x,-5,p.boardHeight+.05]));for(let i=0;i<7;i++)board.add(box(2,1.5,.2,face,[(i-3)*2,7+Math.sin(i/6*Math.PI)*2,p.boardHeight+.05]));
 const driver=part('driver','双 H 桥驱动 · 建议包络','electronics','driver',false,[0,-9,d.deckTop+2],[0,-12,28]);driver.add(box(20,18,1.4,pcb,[0,0,.7]));driver.add(box(7,6,2,dark,[0,0,2.4]));for(const y of [-6,6])driver.add(box(15,3,3,blue,[0,y,2]));
 part('battery','电池与电源预留','electronics','battery',false,[0,8,d.deckBottom-7],[0,10,-30]).add(box(40,25,12,mat('#555f6e',.12,.65),[0,0,0]));
 root.updateMatrixWorld(true);return root;
}
export function disposeAssembly(root){const geos=new Set(),mats=new Set();root.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);});for(const g of geos)g.dispose();for(const m of mats)m.dispose();}
