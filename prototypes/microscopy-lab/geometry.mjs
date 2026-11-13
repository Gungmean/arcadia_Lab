import * as k from './kit/iso-kit.mjs';
import * as G from './kit/lathe.mjs';
import * as A from './kit/audit.mjs';
import {temPoleGap,semSpecimenBase,semRadiusAtHeight,semSlopeAtHeight} from './model.mjs';

export const P = k.fitProjection([...k.boxCorners({x:-94,y:-72,w:210,d:156,r:8},-6,16),[-18,-10,320]],760,660,{pad:42,azimuth:40,elevation:23});
const S=(p,tone='mid',inner='')=>k.solidSvg(p,{tone,crease:'faint',inner});
const L=(d,tone='lo')=>k.lineSvg(d,{tone});
const at=p=>k.iso(p,P);
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;');

export function makeInstrument(mode,{audit=false}={}) {
  const R=A.recorder(P), owner=mode;
  let serial=0;const apertures=[];
  const meta=(name)=>({name:`${mode}.${name}.${serial++}`,owner,ground:name==='stand.foot'});
  function put(shape,svg,group,extra='') {
    R.put({name:shape.name,svg:`<g class="component ${extra}" data-component="${group}">${svg}</g>`,shapes:[R.solid(shape)]});
  }
  function box(name,x,y,z,w,d,h,group='frame',tone='mid',detail=true) {
    const p={x,y,w,d,r:Math.min(2,w/8,d/8)};
    let inner='';
    if(detail&&w>15&&d>10) {
      const dots=k.corners(p,3).map(([a,b])=>at([a,b,z+h]));
      inner=k.dotsSvg(dots,{size:.65,tone:'hi'});
      inner+=L(k.corners(p,3).map(([a,b])=>k.ring(a,b,1.15,z+h,P,12)).join(''),'lo');
    }
    if(name==='stand.base'||name==='stand.deck')inner+=L(k.planOutline(k.insetPlan(p,2),z+h,P),'faint');
    if(name==='stand.plate')for(let row=0;row<3;row++)inner+=k.lineSvg(k.lineOnTop([x+7,y+4+row*3.5],[x+w-7-row*4,y+4+row*3.5],z+h,P),{tone:'lo',free:'both'});
    put(A.slab(p,z,h,meta(name)),S(k.slabOf(p,z,h,P,4,.5),tone,inner),group);
  }
  function disc(name,x,y,z,r,h,group='frame',tone='mid',extra='') {
    const F=G.frameAlong([x,y,z],[0,0,1]);
    const profile=[[0,r],[h,r]];
    put(A.solid(F,profile,meta(name)),S(G.solidOf(profile,F,P,{steps:48,smooth:{slope:()=>0}}),tone),group,extra);
  }
  function ring(name,z,ri,ro,h,group='frame',tone='mid',x=0,y=0,bolts=false,skip=[]) {
    if(x===0&&y===0&&ri>0)apertures.push({name,z0:z,z1:z+h,r:ri});
    // The opening faces the viewer. Each sector is a real concave prism.
    const from=105*Math.PI/180,to=335*Math.PI/180,n=8;
    for(let i=0;i<n;i++) {
      if(skip.includes(i))continue;
      const a=from+(to-from)*i/n,b=from+(to-from)*(i+1)/n;
      const poly=[];
      for(let j=0;j<=5;j++) {const t=a+(b-a)*j/5;poly.push([x+ro*Math.cos(t),y+ro*Math.sin(t)]);}
      for(let j=5;j>=0;j--) {const t=a+(b-a)*j/5;poly.push([x+ri*Math.cos(t),y+ri*Math.sin(t)]);}
      let inner='';
      if(bolts&&i%2===0) {
        const t=(a+b)/2,r=(ri+ro)/2;
        inner=k.dotsSvg([at([x+r*Math.cos(t),y+r*Math.sin(t),z+h])],{size:.9,tone:'hi'});
      }
      put(A.extruded(poly,z,h,meta(name)),S(k.extrude(poly,z,h,P,{convex:false}),tone,inner),group);
    }
  }
  function lens(name,z,r,group) {
    disc(name,0,0,z,r,1.7,group,'hi','glass');
  }
  function radialArm(name,z,h,r,group='frame',right=false,y0=-14,y1=-8) {
    const edge=[];
    for(let j=0;j<=40;j++){const a=(105+230*j/40)*Math.PI/180;edge.push([r*Math.cos(a),r*Math.sin(a)]);}
    const chain=edge.filter(p=>(right?p[0]>0:p[0]<0)).sort((a,b)=>a[1]-b[1]);
    const pointAt=y=>{for(let i=1;i<chain.length;i++){const a=chain[i-1],b=chain[i];if(y>=a[1]&&y<=b[1])return[a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]),y];}throw Error('arm outside host');};
    const cut=[pointAt(y0),...chain.filter(p=>p[1]>y0&&p[1]<y1),pointAt(y1)];
    const terminal=right?38:-55,poly=[[terminal,y0],...cut,[terminal,y1]];
    put(A.extruded(poly,z,h,meta(name)),S(k.extrude(poly,z,h,P,{convex:false})),group);
  }
  function knob(name,x,y,z,r,len,group='focus') {
    const F=G.frameAlong([x,y,z],[1,0,0]);
    const profile=[[0,r],[len,r]];
    let inner='';
    // Rib marks meet the two circular end outlines.
    for(let i=0;i<36;i++) {
      const t=i*Math.PI/18;
      if(Math.sin(t)<-.1)continue;
      inner+=L(k.pathOf([G.pointOf(F,0,r,t),G.pointOf(F,len,r,t)].map(at)),'lo');
    }
    put(A.solid(F,profile,meta(name)),S(G.solidOf(profile,F,P,{steps:56,smooth:{slope:()=>0}}),'mid',inner),group);
  }
  function emLens(z,name,group='condenser',r=25) {
    ring(`${name}.iron`,z,r-3,r,19,group,'mid',0,0,true);
    ring(`${name}.yoke.bottom`,z,10,r-3,2,group,'mid');
    ring(`${name}.yoke.top`,z+17,10,r-3,2,group,'mid');
    for(let i=0;i<5;i++)ring(`${name}.coil`,z+2+i*3,13,r-3,1.5,group,'lo');
    ring(`${name}.pole`,z+7,5,13,3,group,'hi');
  }
  // Bench, feet, frame and fasteners: these are actual support surfaces.
  for(const x of [-74,74])for(const y of [-51,51]) {
    disc('stand.foot',x,y,-6,8,5,'frame','lo');
    disc('stand.pad',x,y,-1,9,1,'frame','mid');
  }
  box('stand.base',-91,-68,0,182,136,12,'frame','lo');
  box('stand.deck',-88,-65,12,176,130,3,'frame','mid');
  box('stand.plate',29,38,15,43,16,.8,'frame','lo');
  box('stand.column',-75,-28,15,20,20,274,'frame','lo');
  box('stand.columncap',-75,-28,289,20,20,3,'frame');
  for(const x of [-72,-60])box('stand.rail',x,-8,30,2.4,2.6,231,'frame','mid',false);
  if(mode==='optical') {
    radialArm('arm',244,6,18);
    ring('lamp',15,0,24,12,'source','mid',0,0,true);
    disc('LED',0,0,27,8,1,'source','hi','emitter');
    ring('collector',27,10,17,9,'source');lens('collector.lens',32,10,'source');
    ring('iris.holder',62,3,19,5,'condenser','mid');
    // A real bracket holds the condenser and iris to the rear rail.
    radialArm('condenser.bracket',62,5,19,'condenser');
    ring('condenser.barrel',67,10,18,34,'condenser');
    lens('condenser.lower',77,10,'condenser');lens('condenser.upper',97,10,'condenser');
    box('stage.back',-39,-36,119,80,19,7,'specimen');
    box('stage.left',-39,-17,119,20,64,7,'specimen');
    box('stage.right',19,-17,119,22,64,7,'specimen');
    box('stage.front',-19,25,119,38,22,7,'specimen');
    box('stage.bridge',-30,-26,116,6,60,3,'specimen');
    box('stage.support',-55,-28,119,16,17,7,'specimen');
    box('slide',-27,-12,126,54,24,1.2,'specimen','hi');
    box('coverglass',-9,-8,127.2,18,16,.4,'specimen','hi');
    disc('sample',0,0,127.6,4,.15,'specimen','hi','sample');
    for(const x of [-24,20])box('clip',x,0,127.2,4,22,1,'specimen','mid');
    knob('focus.axle',-55,-18,140,3,25);knob('coarse',-30,-18,140,10,14);knob('fine',-16,-18,140,5,9);
    ring('objective.tip',143,7,9,7,'objective','hi');
    ring('objective.body',150,7,15,29,'objective','hi',0,0,true);
    for(const z of [147,155,164,173])lens('objective.glass',z,7,'objective');
    ring('nosepiece',179,9,26,6,'objective','mid',0,0,true);
    // Two parked objectives, supported by the revolver.
    disc('parked.objective',-18,-16,151,4.3,28,'objective','mid');
    disc('parked.objective',-22,6,160,4.3,19,'objective','mid');
    ring('tube',189,13,18,61,'image','mid');
    ring('tube.upper',254,13,18,4,'image','mid');
    ring('tube.join',185,13,20,4,'image','mid',0,0,true);
    ring('tube.join',250,13,20,4,'image','mid',0,0,true);
    ring('eyepiece.barrel',258,10,17,34,'eyepiece','mid');
    lens('eyepiece.field',262,10,'eyepiece');lens('eyepiece.eye',283,10,'eyepiece');
    ring('eyecup',292,10,19,6,'eyepiece','lo');
  } else {
    // TEM and SEM share an electron source but not an imaging path.
    radialArm('upper.arm',273,6,20);
    ring('gun.vessel',282,15,23,28,'source','mid',0,0,true);
    ring('gun.lid',310,2.5,25,5,'source','mid',0,0,true);
    box('cathode.mount',-13,-3,302,13,6,3,'source','hi');
    box('cathode.suspension',-13,-3,305,3,6,5,'source','mid',false);
    disc('cathode',0,0,299,1.9,6,'source','hi','emitter');
    ring('wehnelt',292,2.5,14,4,'source','hi');
    ring('wehnelt.insulator',296,12,15,6,'source','lo');
    ring('anode',283,3,15,4,'source','hi');
    ring('accelerator',270,10,20,12,'source');
    ring('accelerator.spacer',263,10,20,7,'source');
    emLens(244,'condenser.1');
    ring('spacer',235,10,21,9,'condenser');
    emLens(216,'condenser.2');
    ring('aperture',207,3,21,9,'condenser','hi');
    if(mode==='tem') {
      ring('specimen.chamber.lower',179,13,29,8,'specimen','mid',0,0,true);
      ring('specimen.chamber.port',187,13,29,9,'specimen','mid',0,0,false,[2]);
      ring('specimen.chamber.upper',196,13,29,11,'specimen','mid',0,0,true);
      box('holder.port',-30,-3,187,4,6,3,'specimen','mid',false);
      knob('holder.handle',-53,0,191,3,24,'specimen');
      box('holder',-29,-2,190,27,4,2,'specimen','hi',false);
      ring('grid',192,2,7,.6,'specimen','hi');
      disc('section',0,0,192.6,2,.15,'specimen','hi','sample');
      emLens(160,'objective','objective',29);
      // The specimen lies between the objective's upper and lower poles.
      ring('objective.lower.neck',179,4,10,temPoleGap[0]-179,'objective','hi');
      ring('objective.upper.neck',temPoleGap[1],4,10,207-temPoleGap[1],'objective','hi');
      ring('objective.lower.yoke',185,10,13,2,'objective');
      ring('objective.upper.yoke',196,10,13,2,'objective');
      ring('objective.aperture',151,2.2,22,9,'objective','hi');
      ring('drift.upper',125,12,22,26,'image');
      emLens(106,'intermediate','image');
      ring('drift.lower',81,12,22,25,'image');
      emLens(62,'projector','image',28);
      ring('camera.chamber',21,26,35,41,'detector','mid',0,0,true);
      box('camera.mount',-28,-19,15,56,38,6,'detector');
      disc('sensor',0,0,21,26,1,'detector','hi','sensor');
      radialArm('lower.arm',106,6,25);
    } else {
      ring('scan.coils.housing',183,14,24,24,'scan','mid',0,0,true);
      ring('scan.mount',185,7,14,2,'scan');
      for(const x of [-12,8])box('scan.x.winding',x,-4,187,4,8,12,'scan','hi',false);
      for(const y of [-12,8])box('scan.y.winding',-4,y,187,8,4,12,'scan','hi',false);
      ring('scan.spacer',173,9,22,10,'scan');
      ring('scan.lower.spacer',170,9,22,3,'scan');
      emLens(151,'objective','objective',27);
      ring('pole.lower',136,4,18,15,'objective','hi');
      // Chamber is physically open at the front, not a transparent wire box.
      box('chamber.floor',-43,-40,15,99,86,10,'specimen');
      box('chamber.back',-43,-40,25,99,9,111,'specimen','lo');
      box('chamber.side',-43,-31,25,9,77,104,'specimen','lo');
      box('chamber.ceiling',-43,-31,129,22,70,7,'specimen');
      box('chamber.roof',-21,-31,129,73,12,7,'specimen');
      box('chamber.rightroof',30,-19,129,22,58,7,'specimen');
      radialArm('chamber.lensmount',136,4,18,'objective');
      disc('stage.pedestal',0,0,25,23,25,'specimen');
      disc('stage.plate',0,0,50,26,5,'specimen');
      disc('stub',0,0,55,14,9,'specimen','hi');
      box('sample.substrate',-26,-17,64,52,34,1,'specimen','mid');
      const F=G.frameAlong([0,0,semSpecimenBase],[0,0,1]);
      const profile=Array.from({length:11},(_,z)=>[z,semRadiusAtHeight(z),1]);
      put(A.solid(F,profile,{...meta('pollen'),radius:semRadiusAtHeight}),S(G.solidOf(profile,F,P,{smooth:{radius:semRadiusAtHeight,slope:semSlopeAtHeight}}),'hi'),'specimen','sample');
      // SE detector is mounted on the chamber wall; BSE ring sits below the pole.
      box('SE.mount',32,-31,86,17,20,15,'detector');
      box('SE.detector',27,-12,88,19,18,11,'detector','hi');
      knob('SE.collector',25,-1,94,5,2,'detector');
      ring('BSE.detector',132,5,18,2,'detector','hi');
      ring('BSE.mount',134,5,18,2,'detector');
    }
    // Side pump attached flush to a vacuum port and supported on the deck.
    const pumpX=mode==='sem'?62:38,pumpW=mode==='sem'?28:37;
    box('pump',pumpX,-46,15,pumpW,27,42,'vacuum','lo');
    for(let z=19;z<52;z+=5)box('pump.fin',pumpX,-19,z,pumpW,2,1,'vacuum','mid',false);
    if(mode==='tem')radialArm('pump.port',33,10,35,'vacuum',true,-30,-24);
    else box('pump.port',56,-40,33,6,9,10,'vacuum','mid',false);
  }
  // Sorting is solved from the recorded true geometry, never manual key offsets.
  A.settle(R,P,{step:1,least:.3,states:[0]});
  if(audit) A.auditOrExit(R,P);
  const parts=R.items.sort((a,b)=>a.key-b.key).map(i=>i.svg).join('');
  return {svg:`<svg class="iso-svg instrument" viewBox="0 0 760 660" role="img" aria-label="${esc({optical:'광학 현미경: 아래 LED에서 위 접안렌즈로 이어지는 광학계 절개도',tem:'TEM: 위 전자총에서 얇은 절편을 지나 아래 카메라로 이어지는 전자광학계',sem:'SEM: 전자총과 주사 코일, 시료실, 이차전자 검출기 절개도'}[mode])}"><defs><radialGradient id="shadow-${mode}"><stop stop-color="currentColor" stop-opacity=".12"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs><ellipse cx="380" cy="570" rx="236" ry="65" fill="url(#shadow-${mode})"/>${parts}<g class="beam-layer" aria-hidden="true"></g><g class="particle-layer" aria-hidden="true"></g></svg>`,count:R.solids.length,apertures};
}
