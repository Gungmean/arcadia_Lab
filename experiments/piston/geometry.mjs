import * as k from '../../prototypes/microscopy-lab/kit/iso-kit.mjs';
import * as G from '../../prototypes/microscopy-lab/kit/lathe.mjs';
import * as A from '../../prototypes/microscopy-lab/kit/audit.mjs';
import{stateAt}from'./model.mjs';
export const P=k.fitProjection([...k.boxCorners({x:-110,y:-70,w:220,d:140,r:9},-6,15),[0,0,290]],760,650,{pad:35,azimuth:40,elevation:28});
export const LOW=42+stateAt('free',-60).height,STROKE=48;
export function rig(){
 const R=A.recorder(P,{order:['piston'],spring:{stagger:0}});let id=0;
 const put=(shape,svg,group,move=false)=>R.put({name:shape.name,piece:move?'piston':'',move:move?[0,0,STROKE]:[0,0,0],svg,group,shapes:[R.solid(shape)]});
 const meta=(name,group)=>({name:name+'.'+id++,owner:group,ground:name==='stand.foot'});
 function box(name,x,y,z,w,d,h,group='frame'){
  const p={x,y,w,d,r:name==='ruler'?0:1.5};let inner='';
  if(w>14&&d>10)inner=k.dotsSvg(k.corners(p,3).map(([x,y])=>k.iso([x,y,z+h],P)),{size:.6});
  if(name==='stand.deck')inner+=k.lineSvg(k.planOutline(k.insetPlan(p,3),z+h,P),{tone:'lo'});
  put(A.slab(p,z,h,meta(name,group)),k.solidSvg(k.slabOf(p,z,h,P,4,.6),{tone:'mid',inner}),group);
 }
 function disc(name,x,y,z,r,h,group='frame',move=false){
  const F=G.frameAlong([x,y,z],[0,0,1]),prof=[[0,r],[h,r]];
  put(A.solid(F,prof,meta(name,group)),k.solidSvg(G.solidOf(prof,F,P,{smooth:{slope:()=>0}}),{tone:group==='piston'?'hi':'mid'}),group,move);
 }
 function ring(name,z,ri,ro,h,group='cylinder'){
  for(let i=0;i<8;i++){
   const a=(108+i*28)*Math.PI/180,b=a+28*Math.PI/180,poly=[];
   for(let j=0;j<=5;j++){const t=a+(b-a)*j/5;poly.push([ro*Math.cos(t),ro*Math.sin(t)]);}
   for(let j=5;j>=0;j--){const t=a+(b-a)*j/5;poly.push([ri*Math.cos(t),ri*Math.sin(t)]);}
   put(A.extruded(poly,z,h,meta(name,group)),k.solidSvg(k.extrude(poly,z,h,P,{convex:false}),{tone:'mid'}),group);
  }
 }
 for(const x of[-87,87])for(const y of[-48,48]){disc('stand.foot',x,y,-6,7,6);}
 box('stand.base',-108,-68,0,216,136,10);box('stand.deck',-105,-65,10,210,130,3);
 box('nameplate',47,34,13,40,18,1);
 box('heater.foot',-35,-35,13,70,70,8,'heater');box('heater.insulator',-34,-34,21,68,68,4,'heater');
 disc('heater.plate',0,0,25,34,7,'heater');
 for(const x of[-23,-9,5,19])box('heater.element',x,-24,32,4,48,2,'heater');
 disc('cylinder.bottom',0,0,34,34,8,'cylinder');
 ring('cylinder.wall',42,28,33,148);ring('cylinder.lip',190,28,36,4);
 // The top is open to atmosphere. No cap spans the moving load rod.
 for(const x of[-63,49]){
  box('post.foot',x-4,-25,13,20,24,7);box('post',x,-21,20,12,16,210);
  box('post.cap',x-1,-22,230,14,18,3);
 }
 box('bridge',-51,-21,194,100,16,8);
 // A split, rear-side travel guide leaves the central rod unobstructed.
 box('guide.mount',-5,-21,202,10,11,3);
 ring('guide.bush',205,4,10,11,'frame');
 box('ruler.foot',37,16,13,12,12,21);box('ruler',40,19,34,6,6,158);
 let ticks='';for(let z=42;z<=190;z+=4)ticks+=k.segment([40,25,z],[z%20<4?44:42.5,25,z],P);
 put(A.slab({x:40,y:24.9,w:6,d:.1,r:0},34,158,meta('ruler.print','frame')),k.lineSvg(ticks,{tone:'lo'}),'frame');
 // Moving seal bands meet the bore; piston body has clearance.
 disc('piston.lower',0,0,LOW,27.5,2,'piston',true);
 disc('piston.seal1',0,0,LOW+2,28,1,'piston',true);
 disc('piston.body',0,0,LOW+3,27.5,3,'piston',true);
 disc('piston.seal2',0,0,LOW+6,28,1,'piston',true);
 disc('piston.head',0,0,LOW+7,27.5,1,'piston',true);
 disc('piston.rod',0,0,LOW+8,3,120,'piston',true);
 disc('piston.tray',0,0,LOW+128,20,4,'piston',true);
 disc('piston.load1',0,0,LOW+132,14,7,'piston',true);
 disc('piston.load2',0,0,LOW+139,14,7,'piston',true);
 disc('piston.handle',0,0,LOW+146,4,4,'piston',true);
 // Lock is a visual indicator; its ideal constraint acts at the piston.
 box('lock.mount',49,-5,151,12,12,12,'lock');box('lock.knob',51,7,153,8,6,8,'lock');
 A.settle(R,P,{step:1,least:.3,states:[0,.125,.25,.5,.75,.875,1]});
 if(process.argv.includes('--audit'))A.auditOrExit(R,P);
 const items=R.items.sort((a,b)=>a.key-b.key),view=G.viewOf(P);
 const data=items.map((v,i)=>({id:i,key:v.key,lift:v.move.reduce((s,x,j)=>s+x*view[j],0),moving:v.piece==='piston',group:v.group}));
 const body=items.map((v,i)=>`<g data-item="${i}" data-group="${v.group}" ${v.piece?'data-moving="true"':''}>${v.svg}</g>`).join('');
 return{svg:`<svg class="iso-svg" viewBox="0 0 760 650" role="img" aria-label="실린더·피스톤 축·하중과 가열판의 내부 절개도"><g id="gas"></g><g id="parts">${body}</g><g id="particles" aria-hidden="true"></g></svg>`,data,count:items.length};
}
