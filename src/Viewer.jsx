import {forwardRef,useEffect,useImperativeHandle,useRef} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createAssembly,disposeAssembly} from './assembly.mjs';
import {dimensions} from './project.mjs';

export default forwardRef(function Viewer({project,exploded=false,hidden=[],selected,onSelect,motion,grid=true},ref){
 const host=useRef(null),api=useRef(null),latest=useRef({onSelect,motion});latest.current={onSelect,motion};
 useImperativeHandle(ref,()=>({view:(v)=>api.current?.view(v),reset:()=>api.current?.reset(),snapshot:()=>api.current?.renderer.domElement.toDataURL('image/png')}),[]);
 useEffect(()=>{
  const container=host.current;let renderer;
  try{renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}catch{container.textContent='当前浏览器未能启用 WebGL。请使用支持 WebGL 的 Chrome / Edge 打开。';return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor('#eef1f5');renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.domElement.setAttribute('aria-label','四轮小车三维装配，拖动旋转、滚轮缩放、点击选择组件');container.append(renderer.domElement);
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-100,100,100,-100,.1,3000);camera.up.set(0,0,1);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minZoom=.35;controls.maxZoom=8;
  const pm=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pm.fromScene(room,.03);scene.environment=env.texture;scene.environmentIntensity=.5;room.dispose();pm.dispose();
  scene.add(new T.HemisphereLight(0xffffff,0x6f798a,2));const light=new T.DirectionalLight(0xffffff,3);light.position.set(100,50,220);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-200,right:200,top:200,bottom:-200,near:1,far:600});light.shadow.bias=-.0003;scene.add(light);const fill=new T.DirectionalLight(0xe9f2ff,1.5);fill.position.set(-100,-150,80);scene.add(fill);
  const ground=new T.Mesh(new T.PlaneGeometry(4000,4000),new T.ShadowMaterial({opacity:.14}));ground.position.z=-.5;ground.receiveShadow=true;scene.add(ground);
  const gridObject=new T.GridHelper(4000,200,0xcdd5df,0xdde3eb);gridObject.rotation.x=Math.PI/2;gridObject.position.z=-.6;scene.add(gridObject);
  const assemblyHolder=new T.Group();scene.add(assemblyHolder);
  let assembly,boxHelper,last=0,dirty=true;controls.addEventListener('change',()=>{dirty=true;});const resize=()=>{const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight),span=api.current?.span??150;camera.left=-span*w/h;camera.right=span*w/h;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();renderer.setSize(w,h);dirty=true;};
  const state={renderer,scene,camera,controls,holder:assemblyHolder,grid:gridObject,span:100,load:(c)=>{if(assembly){assemblyHolder.remove(assembly);disposeAssembly(assembly);}assembly=createAssembly(c);assemblyHolder.add(assembly);state.assembly=assembly;state.diameter=c.geometry.wheelDiameter;state.config=c;state.reset();},reset:()=>{assemblyHolder.position.set(0,0,0);assemblyHolder.rotation.z=0;state.view('iso');},view:(v)=>{if(!assembly)return;const d=dimensions(state.config),center=new T.Vector3(0,0,d.boardTop/2).add(assemblyHolder.position);const offsets={iso:[170,200,150],front:[0,250,30],side:[250,0,30],top:[0,.01,300]};camera.up.set(0,v==='top'?1:0,v==='top'?0:1);camera.position.copy(center).add(new T.Vector3(...(offsets[v]??offsets.iso)));controls.target.copy(center);state.span=Math.max(d.totalLength,d.totalWidth,d.boardTop)*.7;camera.zoom=1;resize();controls.update();},selection:(id)=>{if(boxHelper){scene.remove(boxHelper);boxHelper.geometry.dispose();boxHelper.material.dispose();boxHelper=null;}const obj=assembly?.getObjectByName(id);if(obj){boxHelper=new T.BoxHelper(obj,0x315bef);scene.add(boxHelper);}}};api.current=state;
  state.invalidate=()=>{dirty=true;};const ro=new ResizeObserver(resize);ro.observe(container);resize();
  const raycaster=new T.Raycaster();let start=[0,0];const down=e=>{start=[e.clientX,e.clientY];},up=e=>{if(e.button!==0||Math.hypot(e.clientX-start[0],e.clientY-start[1])>4)return;const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=assembly&&raycaster.intersectObjects(assembly.children,true).find(h=>{let a=h.object;while(a&&a!==assembly){if(!a.visible)return false;a=a.parent;}return true;});let obj=hit?.object;while(obj&&!obj.userData.id)obj=obj.parent;latest.current.onSelect?.(obj?.userData.id??null);};renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
  const lost=e=>{e.preventDefault();container.setAttribute('data-context-lost','true');};renderer.domElement.addEventListener('webglcontextlost',lost);
  renderer.setAnimationLoop(time=>{const dt=Math.min(.04,(time-last)/1000||0);last=time;const m=latest.current.motion;if(assembly&&m){for(const w of assembly.children.filter(o=>o.userData.kind==='wheel'))w.rotation.x-=(w.userData.side==='left'?m.leftRPM:m.rightRPM)*Math.PI/30*dt;
   if((Math.abs(m.linear)+Math.abs(m.angular))>0){dirty=true;assemblyHolder.rotation.z+=m.angular*dt;const yaw=assemblyHolder.rotation.z,delta=new T.Vector3(-Math.sin(yaw)*m.linear*1000*dt,Math.cos(yaw)*m.linear*1000*dt,0);assemblyHolder.position.add(delta);camera.position.add(delta);controls.target.add(delta);}}
   if(boxHelper&&dirty)boxHelper.update();controls.update();if(dirty){renderer.render(scene,camera);dirty=false;}});
  return()=>{renderer.setAnimationLoop(null);ro.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('webglcontextlost',lost);if(assembly)disposeAssembly(assembly);if(boxHelper){boxHelper.geometry.dispose();boxHelper.material.dispose();}ground.geometry.dispose();ground.material.dispose();gridObject.geometry.dispose();gridObject.material.dispose();env.dispose();renderer.dispose();container.replaceChildren();api.current=null;};
 },[]);
 const geometryKey=JSON.stringify(project.geometry);
 useEffect(()=>{api.current?.load(project);},[geometryKey]);
 useEffect(()=>{const a=api.current?.assembly;if(!a)return;for(const part of a.children){const base=part.userData.basePosition,offset=part.userData.explode;part.position.set(...base);if(exploded)part.position.addScaledVector(new T.Vector3(...offset),1);part.visible=!hidden.includes(part.userData.group);}api.current.selection(selected);api.current.invalidate();},[geometryKey,exploded,hidden,selected]);
 useEffect(()=>{if(api.current){api.current.grid.visible=grid;api.current.invalidate();}},[grid]);
 return <div className="viewer-host" ref={host} data-testid="viewer"/>;
});
