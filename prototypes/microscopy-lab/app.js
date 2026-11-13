'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let mode='optical',states=structuredClone(defaults),step=0,playing=false,zoom=1,beamOn=true,isolate=false,selected='source',panX=0,panY=0,drag=null,suppressClick=false;
let phase=0,stepClock=0,frame=0,last=0,visible=true,renderDirty=true;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const beamCache=new Map(), canvas=$('#image'),ctx=canvas.getContext('2d');
const scene=document.createElement('canvas');scene.width=720;scene.height=440;const sc=scene.getContext('2d');
const NS='http://www.w3.org/2000/svg';
let activeLesson='baseline';
const svg=()=>document.querySelector(`[data-instrument="${mode}"] svg`);
const fmt=(v,d=0)=>Number(v).toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});
const txt=(id,t)=>{$('#'+id).textContent=t;};
const randFactory=(seed)=>()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;}
function project([x,y,z]) {const a=PROJECTION.azimuth*Math.PI/180,e=PROJECTION.elevation*Math.PI/180,k=PROJECTION.scale*Math.sqrt(1.6);return[PROJECTION.origin[0]+(x*Math.sin(a)-y*Math.cos(a))*k,PROJECTION.origin[1]+((x*Math.cos(a)+y*Math.sin(a))*Math.sin(e)-z*Math.cos(e))*k];}
function path(points,closed=false){return points.map((p,i)=>(i?'L':'M')+project(p).map(n=>n.toFixed(2)).join(' ')).join('')+(closed?'Z':'');}
function along(z,r=0){const a=PROJECTION.azimuth*Math.PI/180;return[r*Math.sin(a),-r*Math.cos(a),z];}
function getBeam(){
  if(beamCache.has(mode))return beamCache.get(mode);
  const parent=svg().querySelector('.beam-layer'),particleLayer=svg().querySelector('.particle-layer');
  const cones=[],rays=[];
  const addBundle=(levels)=>{
    cones.push(el('path',{class:'beam-cone',d:path([...levels.map(([z,r])=>along(z,-Math.abs(r))),...levels.toReversed().map(([z,r])=>along(z,Math.abs(r)))],true)},parent));
    for(const f of [-1,0,1])rays.push(el('path',{class:'beam-path',d:path(levels.map(([z,r])=>along(z,r*f)))},parent));
  };
  for(const section of beamSections(mode))addBundle(section);
  const scan=mode==='sem'?el('path',{class:'beam-path'},parent):null;
  const secondary=mode==='sem'?el('path',{class:'beam-path secondary'},parent):null;
  const dot=mode==='sem'?el('circle',{r:2.3,class:'beam-dot'},particleLayer):null;
  const particles=Array.from({length:18},()=>el('circle',{r:1.65,class:'beam-dot'},particleLayer));
  const signals=mode==='sem'?Array.from({length:6},()=>el('circle',{r:1.2,class:'beam-dot'},particleLayer)):[];
  const result={cones,rays,scan,secondary,dot,particles,signals,parent,particleLayer};beamCache.set(mode,result);return result;
}
function updateBeam(){
  const b=getBeam(),s=states[mode],active=mode==='optical'||s.vacuum;
  b.parent.style.opacity=active?'1':'.08';b.particleLayer.style.opacity=active?'1':'0';
  const t=reduced.matches?.35:phase;
  b.particles.forEach((p,i)=>{
    const q=(t*.23+i/18)%1,sections=beamSections(mode),section=sections[i%sections.length];
    const [z,r]=beamPointAt(section,q,Math.sin(i*2.4)*.8);
    const xy=project(along(z,r));p.setAttribute('cx',xy[0]);p.setAttribute('cy',xy[1]);p.style.opacity=String(.35+.5*Math.sin(q*Math.PI));
  });
  if(mode==='sem') {
    const scan=semScanAt(t,s),target=[scan.x,scan.y,scan.z];
    b.scan.setAttribute('d',path([[0,0,137],target]));
    const signal=semSignalPath(scan,s.detector),[p,a,c,d]=signal.points.map(project);
    b.secondary.setAttribute('d',s.detector==='SE'?`M${p}C${a} ${c} ${d}`:`M${p}L${d}`);b.secondary.style.visibility=signal.visible?'visible':'hidden';b.dot.setAttribute('cx',p[0]);b.dot.setAttribute('cy',p[1]);
    b.signals.forEach((dot,i)=>{const q=(t*.6+i/6)%1,[x,y]=project(cubicPoint(signal.points,q));dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.style.visibility=signal.visible?'visible':'hidden';});
  }
}
function range(id,label,min,max,stepSize,unit,format){
  const value=states[mode][id],out=format?format(value):fmt(value)+(unit?' '+unit:'');
  return `<div class="control"><div class="control-row"><label for="control-${id}">${label}</label><output for="control-${id}" id="out-${id}">${out}</output></div><input id="control-${id}" data-setting="${id}" type="range" min="${min}" max="${max}" step="${stepSize}" value="${value}" aria-valuetext="${out}"></div>`;
}
function select(id,label,options){return `<div class="control compact"><label for="control-${id}">${label}</label><select id="control-${id}" data-setting="${id}">${options.map(([v,t])=>`<option value="${v}" ${String(states[mode][id])===String(v)?'selected':''}>${t}</option>`).join('')}</select></div>`;}
function toggle(id,label){const v=states[mode][id];return`<div class="switch-row"><span id="label-${id}">${label}</span><button class="switch" id="control-${id}" data-toggle="${id}" role="switch" aria-checked="${v}" aria-labelledby="label-${id}"></button></div>`;}
function markCustom(){activeLesson=null;$$('[data-lesson]').forEach(b=>b.setAttribute('aria-pressed','false'));}
function buildControls(){
  let html='<h2 class="section-title">실험 조건 <span>조절하면 영상이 바뀝니다</span></h2>';
  if(mode!=='optical')html+=`<div class="electron-guide"><strong>한 조건씩 비교하기</strong><div class="lesson-buttons">${electronLessons[mode].map(l=>`<button class="mini" data-lesson="${l.id}" aria-pressed="${activeLesson===l.id}">${l.label}</button>`).join('')}</div><p id="lesson-hint" aria-live="polite"></p><p class="model-boundary">전압은 전자 파장만 계산합니다. 실제 해상도·손상·산란의 전압 의존성은 계산하지 않습니다.</p></div>`;
  html+=range('focus','미동 초점',-30,30,1,'',v=>v===0?'0 · 초점면':(v>0?'+':'')+v+' · 상대값');
  html+='<div class="control compact"><span class="control-row" style="margin:0">초점 맞추기</span><div class="focus-tools"><button class="mini" id="defocus">흐리게</button><button class="mini" id="autofocus">초점면으로</button></div></div>';
  if(mode==='optical') {
    html+=select('objective','대물렌즈',[[4,'4× / NA 0.10'],[10,'10× / NA 0.25'],[40,'40× / NA 0.65'],[100,'100× / NA 1.25 · 유침']]);
    html+=select('eyepiece','접안렌즈 · 시야수',[[10,'10× / FN 18 mm'],[15,'15× / FN 12 mm'],[20,'20× / FN 9 mm']]);
    html+=range('wavelength','조명 파장',420,680,10,'nm');
    html+=range('brightness','광량',10,100,1,'%');
  }else if(mode==='tem') {
    html+=range('voltage','가속전압',80,300,10,'kV');
    html+=range('thickness','시료 두께',30,240,5,'nm');
    html+=select('magnification','명목 배율',[[10000,'10,000×'],[20000,'20,000×'],[50000,'50,000×']] );
    html+=range('aperture','대물조리개 수용 범위',.25,1,.05,'',v=>v.toFixed(2)+' · 상대값');
    html+=toggle('vacuum','고진공 유지');
  }else {
    html+=range('voltage','가속전압',1,30,1,'kV');
    html+=range('dwell','픽셀 체류시간',1,20,1,'µs');
    html+=range('fov','관찰 시야 너비',25,60,5,'µm');
    html+=select('detector','검출 신호',[['SE','SE · 표면 형상'],['BSE','BSE · 조성 대비']]);
    html+=toggle('coating','전도성 코팅');html+=toggle('vacuum','고진공 유지');
  }
  html+='<p class="notice" id="notice"></p>';
  $('#controls').innerHTML=html;
  $$('#controls [data-lesson]').forEach(button=>button.onclick=()=>{
    const lesson=electronLessons[mode].find(l=>l.id===button.dataset.lesson);
    states[mode]={...structuredClone(defaults[mode]),...lesson.values};activeLesson=lesson.id;
    setPlaying(false);buildControls();chooseStep(lesson.step);sync();renderDirty=true;run();
  });
  $$('#controls [data-setting]').forEach(input=>input.addEventListener(input.tagName==='SELECT'?'change':'input',()=>{
    states[mode][input.dataset.setting]=input.dataset.setting==='detector'?input.value:Number(input.value);
    markCustom();
    sync();renderDirty=true;run();
  }));
  $$('#controls [data-toggle]').forEach(button=>button.addEventListener('click',()=>{
    const id=button.dataset.toggle;states[mode][id]=!states[mode][id];button.setAttribute('aria-checked',states[mode][id]);markCustom();sync();renderDirty=true;run();
  }));
  $('#autofocus').onclick=()=>{states[mode].focus=0;$('#control-focus').value=0;sync();renderDirty=true;run();};
  $('#defocus').onclick=()=>{states[mode].focus=23;$('#control-focus').value=23;sync();renderDirty=true;run();};
}
function metric(k,label,value,unit){txt(`metric-${k}-label`,label);txt(`metric-${k}`,value);txt(`metric-${k}-unit`,unit);}
function sync(){
  const s=states[mode],m=measure(mode,s),c=catalog[mode];
  if(mode!=='optical'){
    const lesson=electronLessons[mode].find(l=>l.id===activeLesson);
    const reading=mode==='tem'?`기준 대비 가정한 검출 신호 ${fmt(m.signal/measure('tem',defaults.tem).signal*100)}%`:`시야 ${s.fov} µm · 한 프레임 ${fmt(m.frameTime,2)} s`;
    txt('lesson-hint',(lesson?.hint||'조건을 조절하며 기준 영상과 비교하세요.')+' '+reading);
  }
  for(const input of $$('#controls input')) {
    const id=input.dataset.setting,v=s[id];let value;
    if(id==='focus')value=v===0?'0 · 초점면':(v>0?'+':'')+v+' · 상대값';
    else if(id==='aperture')value=v.toFixed(2)+' · 상대값';
    else value=fmt(v)+' '+({wavelength:'nm',brightness:'%',voltage:'kV',thickness:'nm',dwell:'µs',fov:'µm'}[id]||'');
    txt('out-'+id,value);input.setAttribute('aria-valuetext',value);
  }
  let note='';
  if(mode==='optical') {
    metric('a','총배율',fmt(m.magnification),'×');metric('b','Rayleigh 분해 한계',fmt(m.resolution/1000,2),'µm');
    txt('fig-readout',`λ ${s.wavelength} nm / NA ${m.na.toFixed(2)}`);
    note=s.objective===100?'100× 대물렌즈: 오일을 사용한 유침 조건으로 계산합니다.':s.eyepiece>10?'접안배율을 올려도 대물렌즈의 분해 한계는 그대로입니다.':'대물렌즈를 바꿔 배율과 분해 한계가 어떻게 달라지는지 비교하세요.';
    txt('screen-title',`BRIGHTFIELD / ${m.magnification}×`);
  }else if(mode==='tem') {
    metric('a','명목 배율',fmt(m.magnification),'×');metric('b','전자 파장',fmt(m.wavelength,2),'pm');
    txt('fig-readout',`${s.voltage} kV / ${s.thickness} nm`);
    note=`가정한 직접빔 분율 ${fmt(m.transmission*100)}%. `+(s.thickness>140?'두꺼워지면 직접빔 신호가 줄어듭니다. 다중 산란은 계산하지 않습니다.':'전자 파장은 장비 분해능이 아닙니다. 감쇠율은 교육용 가정입니다.');
    txt('screen-title',`TEM / ${s.voltage} kV / ${s.thickness} nm`);
  }else {
    metric('a','한 프레임 · 512² 픽셀',fmt(m.frameTime,2),'s');metric('b','전자 파장',fmt(m.wavelength,2),'pm');
    txt('fig-readout',`${s.voltage} kV / ${s.detector} / 명목 ${fmt(m.magnification)}×`);
    note=!s.coating?'코팅 없는 비전도성 꽃가루: 대전을 예시합니다. 긴 체류시간은 대전을 악화시킬 수 있습니다.':s.detector==='BSE'?'밝은 점은 고원자번호 입자를 가정한 조성 대비입니다. 명목배율은 표시 너비 100 mm 기준입니다.':s.voltage>20?'전압 효과는 재료·장비마다 다르므로 이 모형은 전자 파장만 계산합니다. 명목배율은 100 mm 기준입니다.':'체류시간↑: 잡음↓·주사 시간↑. 화면 주사는 약 5.34배 느립니다. 명목배율은 100 mm 기준입니다.';
    txt('screen-title',`SEM / ${s.detector} / ${s.voltage} kV`);
    txt('image-note',s.detector==='SE'?'SE · 표면 형상 대비':'BSE · 조성 대비');
  }
  if(mode!=='optical'&&!s.vacuum)note='진공이 해제되었습니다. 전자가 기체와 충돌하는 조건을 단순화해 빔과 검출 영상을 중지했습니다.';
  const n=$('#notice');n.textContent=note;n.classList.toggle('warn',mode!=='optical'&&(!s.vacuum||(mode==='sem'&&!s.coating)));
  txt('beam-label',mode==='optical'?'광원에서 접안렌즈까지':s.vacuum?'전자빔 · 진공 유지 중':'전자빔 정지 · 진공 해제');
  txt('legend-ray',mode==='optical'?'빛의 진행 경로':mode==='tem'?'입사·투과 전자 경로':'입사빔 · 검출기로 향하는 방출 전자');
  updateScale();updateBeam();
}
function updateScale(){
  const m=measure(mode,states[mode]),w=$('.screen').clientWidth,ideal=m.fov*64/w;
  const power=10**Math.floor(Math.log10(ideal)),q=ideal/power,nice=[1,2,5,10].find(v=>v>=q)*power;
  txt('scale-label',nice>=1?fmt(nice,Math.max(0,-Math.floor(Math.log10(nice))))+' µm':fmt(nice*1000)+' nm');
  $('#scale-label').style.setProperty('--bar-width',(nice/m.fov*w)+'px');
  let style=$('#scale-style');if(!style){style=document.createElement('style');style.id='scale-style';document.head.append(style);}style.textContent='.scale-bar:after{width:var(--bar-width,64px)}';
}
function buildStages(){
  $('#steps').innerHTML=catalog[mode].stages.map(([id,name],i)=>`<button class="step" data-step="${i}" aria-label="${i+1}단계 ${name}"><span class="stepno">0${i+1}</span><strong>${name}</strong><div class="step-line"><i></i></div></button>`).join('');
  $$('#steps button').forEach(b=>b.onclick=()=>{setPlaying(false);chooseStep(Number(b.dataset.step));});
  $('#part-list').innerHTML=Object.entries(catalog[mode].parts).map(([id,[name]])=>`<button data-part="${id}" aria-pressed="false">${name.split(' · ')[0]}</button>`).join('');
  $$('#part-list button').forEach(b=>b.onclick=()=>{setPlaying(false);choosePart(b.dataset.part);});
}
function highlight(id){
  selected=id;
  svg().querySelectorAll('.component').forEach(c=>{c.classList.toggle('active',c.dataset.component===id);});
  $$('#part-list button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.part===id));
  const part=catalog[mode].parts[id];if(part){txt('preview-title',part[0]);txt('preview-text',part[1]);}
}
function chooseStep(i){
  step=(i+6)%6;stepClock=0;const [id,name,text]=catalog[mode].stages[step];
  highlight(id);txt('detail-index',`PROCESS / 0${step+1}`);txt('detail-title',name);txt('detail-text',text);txt('step-position',`0${step+1} / 06`);
  $$('#steps button').forEach((b,j)=>{if(j===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  $('#prev').disabled=false;$('#next').disabled=false;run();
}
function choosePart(id){
  const part=catalog[mode].parts[id];if(!part)return;
  highlight(id);txt('detail-index','COMPONENT / '+id.toUpperCase());txt('detail-title',part[0]);txt('detail-text',part[1]);
  $$('#steps button').forEach(b=>b.removeAttribute('aria-current'));
}
function setPlaying(value){playing=value&&!reduced.matches;$('#play').setAttribute('aria-pressed',playing);$('#play').textContent=reduced.matches?'한 단계 보기':playing?'Ⅱ 일시정지':'▶ 과정 재생';stepClock=0;run();}
function setMode(value){
  activeLesson=Object.entries(defaults[value]).every(([key,val])=>states[value][key]===val)?'baseline':null;
  mode=value;phase=0;stepClock=0;zoom=1;panX=panY=0;svg().style.transform='';$('#zoom-out').disabled=true;$('#zoom-in').disabled=false;$('#stage').style.touchAction='pan-y';$('#stage').style.cursor='';
  $$('.tab').forEach(b=>{b.setAttribute('aria-selected',b.dataset.mode===mode);b.tabIndex=b.dataset.mode===mode?0:-1;});
  $$('.instrument-slot').forEach(slot=>slot.hidden=slot.dataset.instrument!==mode);
  $('#lab-panel').setAttribute('aria-labelledby','tab-'+mode);
  const c=catalog[mode];txt('fig-number',`FIG. 0${['optical','tem','sem'].indexOf(mode)+1} / CUTAWAY`);txt('fig-title',c.title+' · '+c.short);txt('sample-name',c.sample);txt('image-note',c.imageNote);
  svg().classList.toggle('hide-beam',!beamOn);svg().classList.toggle('isolate',isolate);
  buildControls();buildStages();chooseStep(0);sync();renderDirty=true;run();
  fitView();
  $('.view-badge').textContent='등각 절개도 · 부품을 선택해 보세요';
}

// Procedural teaching images. Seeds are stable, so changing a control changes
// the same specimen rather than replacing it with an unrelated picture.
function irregular(cx,cy,rx,ry,rng,points=12){sc.beginPath();for(let j=0;j<=points;j++){const t=(j%points)/points*Math.PI*2,r=1+(rng()-.5)*.16,x=cx+Math.cos(t)*rx*r,y=cy+Math.sin(t)*ry*r;j?sc.lineTo(x,y):sc.moveTo(x,y);}sc.closePath();}
function opticalImage(s,m){
  const rng=randFactory(14098),w=720,h=440;
  sc.fillStyle='#d8d5b8';sc.fillRect(0,0,w,h);
  sc.save();const z=450/m.fov;sc.translate(w/2,h/2);sc.scale(-z,-z);sc.translate(-w/2,-h/2);
  // Cell diameter about 45–65 µm at the default 450 µm field.
  for(let row=-12;row<18;row++)for(let col=-14;col<24;col++){
    const x=col*82+(row%2)*39+(rng()-.5)*23,y=row*66+(rng()-.5)*23,rx=33+rng()*8,ry=26+rng()*8;
    irregular(x,y,rx,ry,rng);sc.fillStyle=`rgba(129,101,151,${.10+rng()*.10})`;sc.fill();sc.strokeStyle='#8f779783';sc.lineWidth=.9;sc.stroke();
    for(let j=0;j<25;j++){const a=rng()*Math.PI*2,r=rng()*.8;sc.fillStyle='#8f789d32';sc.fillRect(x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r,1.2,1.2);}
    irregular(x+4,y-3,9+rng()*4,8+rng()*3,rng,16);sc.fillStyle='#706080bd';sc.fill();sc.strokeStyle='#584b69';sc.lineWidth=.7;sc.stroke();
    sc.beginPath();sc.ellipse(x+7,y-4,2.4,2,0,0,Math.PI*2);sc.fillStyle='#41354da0';sc.fill();
  }sc.restore();
}
function temImage(s,m){
  const rng=randFactory(7835),w=720,h=440;sc.fillStyle='#aeb0a9';sc.fillRect(0,0,w,h);
  sc.save();const z=5/m.fov;sc.translate(w/2,h/2);sc.scale(z,z);sc.translate(-w/2,-h/2);
  for(let j=0;j<1800;j++){const x=rng()*1500-400,y=rng()*1000-300,r=.5+rng()*1.7;sc.beginPath();sc.arc(x,y,r,0,Math.PI*2);sc.fillStyle=j%3?'#555b5145':'#d7d8c535';sc.fill();}
  for(let i=0;i<12;i++){
    const x=(i%4)*245-60+(rng()-.5)*70,y=Math.floor(i/4)*185+20+(rng()-.5)*65;
    sc.save();sc.translate(x,y);sc.rotate((rng()-.5)*1.4);const rx=90+rng()*20,ry=37+rng()*9;
    sc.beginPath();sc.ellipse(0,0,rx,ry,0,0,Math.PI*2);sc.fillStyle='#80867b';sc.fill();sc.strokeStyle='#30372e';sc.lineWidth=2.8;sc.stroke();
    sc.beginPath();sc.ellipse(0,0,rx-5,ry-4,0,0,Math.PI*2);sc.strokeStyle='#c4c7ba';sc.lineWidth=2;sc.stroke();
    sc.save();sc.beginPath();sc.ellipse(0,0,rx-7,ry-6,0,0,Math.PI*2);sc.clip();
    for(let x=-rx+15;x<rx-12;x+=17){sc.beginPath();sc.moveTo(x,-ry);sc.bezierCurveTo(x+20,-5,x-13,12,x+6,ry-9);sc.bezierCurveTo(x+12,ry-2,x+15,9,x+10,-ry);sc.strokeStyle='#31392ebd';sc.lineWidth=3;sc.stroke();sc.strokeStyle='#d3d4c559';sc.lineWidth=.8;sc.stroke();}
    sc.restore();sc.restore();
  }sc.restore();
  // A smaller objective aperture rejects more scattered signal, increasing
  // this simplified amplitude contrast while reducing detected intensity.
  const contrast=1+(1-s.aperture)*.8;
  const data=sc.getImageData(0,0,w,h);const signal=m.signal/measure('tem',defaults.tem).signal;
  for(let i=0;i<data.data.length;i+=4){let v=(data.data[i]-128)*contrast+128;v*=signal;data.data[i]=data.data[i+1]=data.data[i+2]=clamp(v,0,255);}sc.putImageData(data,0,0);
}
function semImage(s,m){
  const rng=randFactory(43541),w=720,h=440;sc.fillStyle='#181c19';sc.fillRect(0,0,w,h);
  sc.save();const zoom=60/s.fov;sc.translate(w/2,h/2);sc.scale(zoom,zoom);sc.translate(-w/2,-h/2);
  for(let k=0;k<1;k++){
    const cx=360,cy=220,r=150*semProjectedRadius/10;
    const grad=sc.createRadialGradient(cx-r*.4,cy-r*.5,r*.05,cx,cy,r);
    if(s.detector==='SE'){grad.addColorStop(0,'#dadbd1');grad.addColorStop(.5,'#9fa49b');grad.addColorStop(.85,'#575e55');grad.addColorStop(1,'#20261f');}
    else{grad.addColorStop(0,'#858d82');grad.addColorStop(1,'#60685f');}
    sc.beginPath();sc.arc(cx,cy,r,0,Math.PI*2);sc.fillStyle=grad;sc.fill();
    sc.save();sc.clip();
    for(let j=0;j<580;j++){
      const a=rng()*Math.PI*2,rr=Math.sqrt(rng())*r,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr,ss=2.4+rng()*3.6;
      sc.beginPath();sc.ellipse(x,y,ss,ss*(.4+.6*Math.sqrt(1-rr*rr/(r*r))),a,0,Math.PI*2);sc.fillStyle=s.detector==='SE'?'#232b2380':'#515b5180';sc.fill();
      sc.strokeStyle=s.detector==='SE'?'#f2f2d95c':'#79847344';sc.lineWidth=1.1;sc.stroke();
    }
    if(s.detector==='BSE')for(let j=0;j<9;j++){
      sc.beginPath();sc.ellipse(cx+(rng()-.5)*r*1.5,cy+(rng()-.5)*r*1.5,7+rng()*9,5+rng()*7,rng()*3,0,Math.PI*2);sc.fillStyle='#e3e4d4d0';sc.fill();
    }
    sc.restore();
    if(s.detector==='SE')for(let j=0;j<47;j++){
      const a=j/47*Math.PI*2,x=cx+Math.cos(a)*r*.975,y=cy+Math.sin(a)*r*.975;
      sc.beginPath();sc.moveTo(x+Math.sin(a)*2.5,y-Math.cos(a)*2.5);sc.lineTo(cx+Math.cos(a)*(r+8),cy+Math.sin(a)*(r+8));sc.lineTo(x-Math.sin(a)*2.5,y+Math.cos(a)*2.5);sc.fillStyle='#a3aa96';sc.fill();
    }
  }sc.restore();
  const d=sc.getImageData(0,0,w,h),noise=20/Math.sqrt(s.dwell);
  for(let i=0;i<d.data.length;i+=4){let v=d.data[i]+(rng()-.5)*noise;if(!s.coating){const y=Math.floor(i/4/w),x=i/4%w;v+=35+35*Math.sin(y*.1)+40*Math.exp(-(((x-360)/180)**2));}d.data[i]=d.data[i+1]=d.data[i+2]=clamp(v,0,255);}sc.putImageData(d,0,0);
}
function renderImage(){
  const s=states[mode],m=measure(mode,s),w=720,h=440;
  if(mode!=='optical'&&!s.vacuum){ctx.fillStyle='#101713';ctx.fillRect(0,0,w,h);ctx.fillStyle='#a5b4a6';ctx.textAlign='center';ctx.font='15px "Malgun Gothic",sans-serif';ctx.fillText('고진공을 켜면 관찰이 시작됩니다',360,220);return;}
  ({optical:opticalImage,tem:temImage,sem:semImage}[mode])(s,m);
  ctx.save();ctx.fillStyle='#121715';ctx.fillRect(0,0,w,h);
  let blur=m.blur;if(mode==='optical')blur=Math.hypot(blur,m.diffractionSigma);
  const brightness=mode==='optical'?.25+s.brightness/100:1;
  ctx.filter=`blur(${blur.toFixed(2)}px) brightness(${brightness})`;ctx.drawImage(scene,0,0);ctx.filter='none';
  if(mode==='optical'){
    // Single-wavelength illustration: spectral absorption is not modelled.
    const rgb=wavelengthRGB(s.wavelength),pixels=ctx.getImageData(0,0,w,h);
    for(let i=0;i<pixels.data.length;i+=4){const v=.2126*pixels.data[i]+.7152*pixels.data[i+1]+.0722*pixels.data[i+2];for(let j=0;j<3;j++)pixels.data[i+j]=v*rgb[j];}ctx.putImageData(pixels,0,0);
  }
  const vignette=ctx.createRadialGradient(360,220,100,360,220,430);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#0004');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);ctx.restore();
}
function scanOverlay(){
  if(mode!=='sem'||!states.sem.vacuum||reduced.matches)return;
  const y=semScanAt(phase,states.sem).row/512*440;
  // The image is revealed in synchrony with the raster position on the sample.
  ctx.fillStyle='rgba(9,15,11,.30)';ctx.fillRect(0,y+2,720,440-y);
  ctx.fillStyle='rgba(224,243,217,.20)';ctx.fillRect(0,y,720,1.1);
}
let baseImage=null;
function tick(now){
  frame=0;if(!visible||document.hidden)return;
  const elapsed=last?Math.max(0,(now-last)/1000):0,dt=Math.min(elapsed,1/30);last=now;
  if(!reduced.matches)phase+=dt;
  if(playing&&!reduced.matches){stepClock+=Math.min(elapsed,1);if(stepClock>=4.8)chooseStep(step+1);}
  if(renderDirty){renderImage();baseImage=ctx.getImageData(0,0,720,440);renderDirty=false;}
  if(mode==='sem'&&baseImage){ctx.putImageData(baseImage,0,0);scanOverlay();}
  updateBeam();
  if(!reduced.matches)frame=requestAnimationFrame(tick);
}
function run(){if(!frame&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}

$$('.tab').forEach(b=>{
  b.onclick=()=>{setPlaying(false);setMode(b.dataset.mode);};
  b.onkeydown=e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();const modes=['optical','tem','sem'],i=modes.indexOf(mode);const v=e.key==='Home'?'optical':e.key==='End'?'sem':modes[(i+(e.key==='ArrowRight'?1:2))%3];setPlaying(false);setMode(v);$('#tab-'+v).focus();};
});
$$('.instrument').forEach(instrument=>{
  // SVG shapes share focus through the corresponding accessible part buttons.
  instrument.addEventListener('click',e=>{if(suppressClick){suppressClick=false;return;}const target=e.target.closest('[data-component]');if(target){setPlaying(false);choosePart(target.dataset.component);}});
});
$('#prev').onclick=()=>{setPlaying(false);chooseStep(step-1);};$('#next').onclick=()=>{setPlaying(false);chooseStep(step+1);};
$('#play').onclick=()=>{if(reduced.matches){chooseStep(step+1);return;}setPlaying(!playing);};
$('#theme').onclick=()=>{document.body.dataset.theme=document.body.dataset.theme==='light'?'dark':'light';};
$('#reset').onclick=()=>{states[mode]=structuredClone(defaults[mode]);setPlaying(false);setMode(mode);};
$('#beam-toggle').onclick=()=>{beamOn=!beamOn;$('#beam-toggle').setAttribute('aria-pressed',beamOn);svg().classList.toggle('hide-beam',!beamOn);};
$('#isolate').onclick=()=>{isolate=!isolate;$('#isolate').setAttribute('aria-pressed',isolate);svg().classList.toggle('isolate',isolate);};
function positionView(){const r=$('#stage').getBoundingClientRect();panX=clamp(panX,-r.width*(zoom-1)/2,r.width*(zoom-1)/2);panY=clamp(panY,-r.height*(zoom-1)/2,r.height*(zoom-1)/2);svg().style.transform=`translate(${panX}px,${panY}px) scale(${zoom})`;}
function fitView(){for(const s of $$('.instrument'))s.setAttribute('viewBox',innerWidth<=760?'150 10 460 640':'0 0 760 660');positionView();}
function zoomBy(delta){zoom=clamp(zoom+delta,1,2);if(zoom===1)panX=panY=0;positionView();$('#zoom-out').disabled=zoom<=1;$('#zoom-in').disabled=zoom>=2;$('#stage').style.touchAction=zoom>1?'none':'pan-y';$('#stage').style.cursor=zoom>1?'grab':'';$('.view-badge').textContent=zoom>1?'확대한 구조는 드래그 · 방향키로 이동':'등각 절개도 · 부품을 선택해 보세요';}
$('#zoom-in').onclick=()=>zoomBy(.25);$('#zoom-out').onclick=()=>zoomBy(-.25);
const stageEl=$('#stage');stageEl.tabIndex=0;stageEl.setAttribute('role','group');stageEl.setAttribute('aria-label','현미경 내부 구조. 부품을 누르면 설명을 봅니다. 확대 상태에서는 드래그 또는 방향키로 이동합니다.');
stageEl.addEventListener('pointerdown',e=>{if(zoom<=1||e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,px:panX,py:panY};suppressClick=false;stageEl.setPointerCapture(e.pointerId);svg().style.transition='none';});
stageEl.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)suppressClick=true;panX=drag.px+dx;panY=drag.py+dy;positionView();});
function releaseDrag(e){if(!drag)return;drag=null;svg().style.transition='';if(stageEl.hasPointerCapture(e.pointerId))stageEl.releasePointerCapture(e.pointerId);}
stageEl.addEventListener('pointerup',releaseDrag);stageEl.addEventListener('pointercancel',releaseDrag);
stageEl.addEventListener('keydown',e=>{if(zoom<=1||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();panX+=e.key==='ArrowLeft'?25:e.key==='ArrowRight'?-25:0;panY+=e.key==='ArrowUp'?25:e.key==='ArrowDown'?-25:0;positionView();});
document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.target.matches('input,select,button,summary,a'))return;
  if(['1','2','3'].includes(e.key)){e.preventDefault();setPlaying(false);setMode(['optical','tem','sem'][Number(e.key)-1]);}
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();setPlaying(false);chooseStep(step+(e.key==='ArrowRight'?1:-1));}
  if(e.code==='Space'){e.preventDefault();$('#play').click();}
});
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)run();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'120px'}).observe($('#lab-panel'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else run();});
reduced.addEventListener('change',()=>{if(reduced.matches)setPlaying(false);renderDirty=true;run();});
new ResizeObserver(()=>{updateScale();fitView();}).observe($('.screen'));
window.microscopyLab={get mode(){return mode;},get state(){return structuredClone(states[mode]);},get step(){return step;},measure:()=>measure(mode,states[mode]),select:setMode};
const requestedMode=new URLSearchParams(location.search).get('mode');
setPlaying(false);setMode(['optical','tem','sem'].includes(requestedMode)?requestedMode:'optical');zoomBy(0);
