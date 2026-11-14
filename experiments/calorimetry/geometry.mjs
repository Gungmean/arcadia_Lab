import * as k from '../../prototypes/microscopy-lab/kit/iso-kit.mjs';
import * as G from '../../prototypes/microscopy-lab/kit/lathe.mjs';
import * as A from '../../prototypes/microscopy-lab/kit/audit.mjs';
export const P=k.fitProjection([...k.boxCorners({x:-112,y:-72,w:224,d:144,r:6},-6,14),[-78,0,210],[0,0,190]],760,620,{pad:40,azimuth:42,elevation:35});
export function rig(){
 const R=A.recorder(P);let serial=0;
 const meta=(name,group)=>({name:name+'.'+serial++,owner:group,ground:name==='foot'});
 const put=(shape,svg,group)=>R.put({name:shape.name,svg,group,shapes:[R.solid(shape)]});
 function box(name,x,y,z,w,d,h,group='base',tone='mid'){
  const p={x,y,w,d,r:1.2};let inner='';
  if(w>13&&d>9)inner=k.dotsSvg(k.corners(p,3).map(([a,b])=>k.iso([a,b,z+h],P)),{size:.65});
  if(name==='deck')inner+=k.lineSvg(k.planOutline(k.insetPlan(p,3),z+h,P),{tone:'lo'});
  if(name==='sensor.window')inner+=k.faceTextSvg(k.sideMatrix([-8,6.01],191,P,'left'),'25.00 °C',{size:4.1,tone:'mid'}).replace('<text ','<text id="meter-temperature" style="font-family:Consolas,monospace" ');
  put(A.slab(p,z,h,meta(name,group)),k.solidSvg(k.slabOf(p,z,h,P,4,.5),{tone,inner}),group);
 }
 function disc(name,x,y,z,r,h,group='cup',tone='mid'){
  const F=G.frameAlong([x,y,z],[0,0,1]),profile=[[0,r],[h,r]];
  put(A.solid(F,profile,meta(name,group)),k.solidSvg(G.solidOf(profile,F,P,{smooth:{slope:()=>0}}),{tone}),group);
 }
 function ring(name,z,ri,ro,h,group='cup'){
  for(let i=0;i<8;i++){
   const a=(108+i*28)*Math.PI/180,b=a+28*Math.PI/180,poly=[];
   for(let j=0;j<=6;j++){const t=a+(b-a)*j/6;poly.push([ro*Math.cos(t),ro*Math.sin(t)]);}
   for(let j=6;j>=0;j--){const t=a+(b-a)*j/6;poly.push([ri*Math.cos(t),ri*Math.sin(t)]);}
   put(A.extruded(poly,z,h,meta(name,group)),k.solidSvg(k.extrude(poly,z,h,P,{convex:false}),{tone:'mid'}),group);
  }
 }
 for(const x of[-91,91])for(const y of[-51,51])disc('foot',x,y,-6,7,6,'base','lo');
 box('base',-112,-72,0,224,144,11);box('deck',-109,-69,11,218,138,3);
 box('nameplate',54,33,14,39,17,1);
 disc('cup.rest',0,0,14,56,6);disc('cup.bottom',0,0,20,53,8);disc('cup.inner-bottom',0,0,28,43,5);
 ring('cup.outer-wall',28,47,53,115);ring('cup.inner-wall',33,39,43,110);
 ring('cup.outer-lip',143,47,55,4);ring('cup.cut-lid',147,5,55,5,'lid');
 // The front wedge is deliberately cut away, including the lid. The gap
 // between the two shells is an insulating air space, not a transparent wall.
 box('post.foot',-88,-13,14,22,24,7,'stand');box('post',-83,-8,21,12,14,177,'stand');
 box('post.cap',-84,-9,198,14,16,3,'stand');
 box('arm',-71,-8,177,101,10,8,'stand');
 box('sensor.mount',-7,-8,169,14,10,8,'sensor');
 disc('sensor.shaft',0,-3,57,2,112,'sensor');disc('heater.cartridge',0,-3,40,4,17,'sensor','hi');disc('heater.tip',0,-3,37,4,3,'sensor');
 disc('stir.shaft',22,-3,46,1.5,131,'stirrer');
 box('stir.paddle',18,-5,42,8,4,4,'stirrer');
 box('sensor.head',-12,-9,185,30,14,17,'sensor');
 box('sensor.window',-9,5,188,24,1,10,'sensor','lo');
 disc('sensor.button1',-5,-2,202,2,1,'sensor');disc('sensor.button2',9,-2,202,2,1,'sensor');
 box('power.foot',64,-28,14,31,45,5,'power');box('power.body',64,-28,19,31,45,19,'power');
 box('power.panel',67,-25,38,25,39,1,'power');box('power.switch',71,1,39,13,7,3,'power');
 for(const x of[69,88])for(const y of[-22,10])disc('power.screw',x,y,39,1.2,1,'power');
 A.settle(R,P,{step:1,least:.3,states:[0]});
 if(process.argv.includes('--audit'))A.auditOrExit(R,P);
 const items=R.items.sort((a,b)=>a.key-b.key);
 const body=items.map((v,i)=>`<g data-item="${i}" data-group="${v.group}">${v.svg}</g>`).join('');
 return{svg:`<svg class="iso-svg" viewBox="0 0 760 620" role="img" aria-label="이중 단열 컵, 절개 뚜껑, 온도 센서와 가열 카트리지, 교반 봉의 등각 열량계"><g id="parts">${body}</g><g id="liquid" aria-hidden="true"></g></svg>`,count:items.length};
}
