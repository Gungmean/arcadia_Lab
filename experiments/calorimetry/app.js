const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],NS='http://www.w3.org/2000/svg';
const options={...defaults},reduced=matchMedia('(prefers-reduced-motion: reduce)'),compact=matchMedia('(max-width:850px)');
let time=0,target=0,playing=false,frame=0,last=0,visible=true,dirty=true,adopted=null;
const fmt=(v,n=2)=>(Math.abs(v)<1e-8?0:v).toFixed(n),signed=(v,n=1)=>(v>1e-8?'+':'')+fmt(v,n),set=(id,v)=>$('#'+id).textContent=v;
const usedCapacity=()=>adopted??options.calCapacity;
function iso([x,y,z]){const a=PROJECTION.azimuth*Math.PI/180,e=PROJECTION.elevation*Math.PI/180,k=PROJECTION.scale*Math.sqrt(1.6);return[PROJECTION.origin[0]+(x*Math.sin(a)-y*Math.cos(a))*k,PROJECTION.origin[1]+((x*Math.cos(a)+y*Math.sin(a))*Math.sin(e)-z*Math.cos(e))*k];}
const path=ps=>ps.map((p,i)=>(i?'L':'M')+iso(p).join(' ')).join('')+'Z';
const water=document.createElementNS(NS,'path'),surface=document.createElementNS(NS,'path');$('#liquid').append(water,surface);
function fitStage(){$('#stage svg').setAttribute('viewBox',compact.matches?'80 0 600 620':'0 0 760 620');}compact.addEventListener('change',fitStage);fitStage();
function stop(){playing=false;$('#play').textContent='실험 재생';$('#play').setAttribute('aria-pressed','false');}
function start(){if(!frame&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}
function reset(){stop();time=target=0;dirty=true;draw();start();}
function chooseMode(mode){options.mode=mode;$$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===mode));reset();}
function draw(){
 if(!dirty)return;
 const s=observe(options,time,usedCapacity(),$('#include-cal').checked),cal=options.mode==='calibration',r=REACTIONS[options.reaction];
 // Only the exposed front wedge is tinted. The back half remains behind
 // the opaque vessel, while immersed probes receive a translucent tint.
 const level=33+s.mass*.6,arc=z=>Array.from({length:37},(_,i)=>{const a=(108-i*136/36)*Math.PI/180;return[38*Math.cos(a),38*Math.sin(a),z];});
 water.setAttribute('d',path([...arc(level),...arc(33).reverse()]));surface.setAttribute('d',path([[0,0,level],...arc(level)]));
 const ink=getComputedStyle(document.body).getPropertyValue('--accent').trim();for(const p of[water,surface])p.setAttribute('fill',ink);water.setAttribute('opacity',String(.1+Math.min(.18,Math.abs(s.deltaT)*.018)));surface.setAttribute('opacity','.2');
 $('#reaction-picker').hidden=cal;$('#calibration-note').hidden=!cal;$$('[data-reaction-control]').forEach(n=>n.hidden=cal);
 $('#reaction-calculation').hidden=cal;$('#calibration-calculation').hidden=!cal;
 set('principle-kicker',cal?'01 · 장치의 열용량을 먼저 알아내기':'02 · 반응계와 열적 주위의 에너지 보존');
 set('principle-title',cal?'물만 데워지는 것은 아닙니다':'용액이 따뜻해지면, 반응은 열을 내보냅니다');
 if(!cal&&r.kind==='흡열')set('principle-title','용액이 차가워지면, 반응은 열을 받습니다');
 set('principle-caption',cal?'전기 에너지를 물과 장치가 함께 받습니다. 외부 열교환이 없으면 E = (mc + C열량계)ΔT입니다.':'용액의 온도 변화에서 반응이 주고받은 열을 추정합니다. 반응 1 mol 기준값과 한 회 실험의 열을 구별하세요.');
 set('main-formula',cal?'C열량계 = E/ΔT − mc':'q반응 = −(mc + C열량계)ΔT');
 set('reaction-equation',r.equation);set('reaction-note',r.note);
 set('source-end',cal?'가열 종료 · 60 s':'반응 완료 · 20 s');set('quick-end',cal?'60 s 가열 결과 보기':'20 s 반응 결과 보기');
 set('calculation-title',cal?'전기 가열로 열량계 보정':'온도로부터 반응열 계산');
 set('time-out',fmt(time,1)+' s');if(document.activeElement!==$('#time'))$('#time').value=time;
 set('temperature',fmt(s.temperature));set('instrument-temperature',fmt(s.temperature)+' °C');set('deltaT',signed(s.deltaT,3));set('mass',fmt(s.mass,0));
 set('meter-temperature',fmt(s.temperature)+' °C');
 for(const [id,unit,n]of[['volumeA','mL',0],['concentration','mol/L',1],['calCapacity','J/K',0],['loss','W/K',2]])set(id+'-out',fmt(options[id],n)+' '+unit);
 set('capacity-status',`${adopted===null?'장치에 주어진 값 사용':'보정 실험에서 채택한 값 사용'} · C열량계 = ${fmt(usedCapacity())} J/K${!cal&&!$('#include-cal').checked?' · 측정 계산에서는 제외':''}`);
 set('qsolution',signed(s.qsolution)+' J');set('qcal',signed(($('#include-cal').checked?usedCapacity():0)*s.deltaT)+' J');set('qreaction',signed(s.estimatedHeat)+' J');
 set('extent',fmt(s.extent,4)+' mol');set('enthalpy',s.estimatedEnthalpy===null?'완료 후 계산':signed(s.estimatedEnthalpy,2));
 set('electric-energy',fmt(s.qsource,1)+' J');set('calibration-estimate',s.estimatedCapacity===null?'가열 완료 후':fmt(s.estimatedCapacity));
 $('#adopt').disabled=s.estimatedCapacity===null;set('instrument-status',time===0?'초기 25 °C · 실험 준비':!s.complete?(cal?'전기 가열 중':'반응 열전달 중'):(options.loss>0?'열전달 종료 · 실내와 열교환 중':'열전달 종료 · 이상 단열 유지'));
 if(time<1e-6)set('story',cal?'20 W로 60 s 가열한 후, 온도 상승으로 장치의 열용량을 추정해 보세요.':'반응 완료 시점을 선택해 ΔT의 부호와 q반응의 부호가 어떻게 반대가 되는지 확인하세요.');
 else if(cal)set('story',`${fmt(s.qsource,0)} J를 전달해 온도가 ${fmt(s.deltaT)} K 상승했습니다. ${s.estimatedCapacity===null?'보정값은 60 s 가열 완료 후 계산합니다.':`현재 온도로 추정한 장치 열용량은 ${fmt(s.estimatedCapacity)} J/K입니다.`}${options.loss>0?' 외부 열손실을 무시하면 보정값이 실제보다 커집니다.':''}`);
 else set('story',`${r.kind} 과정에서 용액 온도가 ${fmt(Math.abs(s.deltaT))} K ${s.deltaT>=0?'상승':'하강'}했습니다. 반응이 ${s.qreaction<=0?'내보낸':'받은'} 열의 부호는 ${s.qreaction<=0?'음수':'양수'}입니다. ${s.complete?`외부 열교환을 무시한 몰 반응 엔탈피 추정값은 ${signed(s.estimatedEnthalpy,2)} kJ/mol입니다.`:'몰 반응 엔탈피는 반응 완료 후 계산합니다.'}`);
 set('model-reference',cal?`장치의 실제 열용량: ${fmt(options.calCapacity)} J/K. 채택한 보정값은 같은 장치를 사용하는 반응 실험에 이어집니다. 실제 열용량을 바꾸면 보정값은 초기화됩니다.`:`모델 입력 ΔᵣH = ${signed(r.enthalpy,2)} kJ/mol · 반응 진행량 ξ = ${fmt(s.extent,4)} mol · 완료 후 한 회 실험의 ΔH = ${signed(r.enthalpy*s.extent*1000)} J. ${s.complete?`측정식의 상대 오차: ${fmt(Math.abs((s.estimatedEnthalpy-r.enthalpy)/r.enthalpy)*100)}%.`:''}`);
 const term=v=>v< -1e-8?`(${fmt(v,1)})`:fmt(v,1);
 set('energy-balance',cal?`E = q물 + q장치 + q외부 : ${fmt(s.qsource,1)} = ${term(s.qsolution)} + ${term(s.qcal)} + ${term(s.qexternal)} J`:`q반응 + q용액 + q장치 + q외부 = 0 : ${term(s.qreaction)} + ${term(s.qsolution)} + ${term(s.qcal)} + ${term(s.qexternal)} = 0 J`);
 plot(s);dirty=false;
}
function plot(current){
 const c=$('#plot').getContext('2d'),w=900,h=380,l=70,r=870,t=25,b=325,dark=document.body.dataset.theme==='dark';
 const ink=dark?'#d5e1d2':'#36513e',grid=dark?'#425646':'#dce2d8',full=dark?'#7b9478':'#afbdac',points=Array.from({length:121},(_,i)=>stateAt(options,i));
 const low=Math.floor(Math.min(23,...points.map(s=>s.temperature))-1),high=Math.ceil(Math.max(28,...points.map(s=>s.temperature))+1);
 const x=v=>l+v/120*(r-l),y=v=>b-(v-low)/(high-low)*(b-t);
 c.clearRect(0,0,w,h);c.font='13px "Malgun Gothic",sans-serif';c.lineWidth=1;c.strokeStyle=grid;c.fillStyle=ink;
 for(let i=0;i<=4;i++){const v=low+(high-low)*i/4;c.beginPath();c.moveTo(l,y(v));c.lineTo(r,y(v));c.stroke();c.fillText(v.toFixed(1),20,y(v)+4);}
 for(let i=0;i<=120;i+=30)c.fillText(String(i),x(i)-7,b+24);c.fillText('°C',23,16);c.fillText('t / s',r-22,h-7);
 c.setLineDash([4,5]);c.strokeStyle=grid;c.beginPath();c.moveTo(x(current.duration),t);c.lineTo(x(current.duration),b);c.stroke();c.setLineDash([]);
 const trace=(ps,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();ps.forEach((s,i)=>i?c.lineTo(x(s.time),y(s.temperature)):c.moveTo(x(s.time),y(s.temperature)));c.stroke();};
 trace(points,full,1.5);trace([...points.filter(s=>s.time<=time),current],ink,3);c.beginPath();c.arc(x(time),y(current.temperature),5,0,Math.PI*2);c.fillStyle=ink;c.fill();
 c.fillText(`현재 ${fmt(time,1)} s · ${fmt(current.temperature)} °C`,l+12,t+13);
}
function tick(now){frame=0;if(!visible||document.hidden)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;
 if(playing){target=Math.min(120,target+dt*15);if(target===120)stop();}
 const next=reduced.matches?target:time+(target-time)*(1-Math.exp(-dt/.14));if(Math.abs(next-time)>1e-6){time=next;dirty=true;}if(Math.abs(target-time)<.001&&time!==target){time=target;dirty=true;}
 draw();if(playing||time!==target)frame=requestAnimationFrame(tick);
}
$$('[data-mode]').forEach(b=>b.onclick=()=>chooseMode(b.dataset.mode));
for(const id of['volumeA','concentration','calCapacity','loss'])$('#'+id).oninput=e=>{options[id]=Number(e.target.value);if(id==='calCapacity')adopted=null;reset();};
$('#reaction').onchange=e=>{options.reaction=e.target.value;reset();};$('#include-cal').onchange=()=>{dirty=true;draw();};
$('#ideal').onclick=()=>{options.loss=0;$('#loss').value=0;reset();};
$('#time').oninput=e=>{stop();target=Number(e.target.value);dirty=true;start();};
$('#play').onclick=()=>{if(playing){stop();target=time;}else if(reduced.matches){target=setup(options).duration;}else{if(time>119.99)time=target=0;playing=true;$('#play').textContent='일시정지';$('#play').setAttribute('aria-pressed','true');}dirty=true;start();};
$('#source-end').onclick=()=>{stop();target=setup(options).duration;dirty=true;start();};$('#reset').onclick=reset;
$('#quick-end').onclick=()=>$('#source-end').click();
$('#adopt').onclick=()=>{const s=observe(options,time,usedCapacity());if(s.estimatedCapacity===null)return;adopted=Math.max(0,s.estimatedCapacity);chooseMode('reaction');};
$('#theme').onclick=()=>{document.body.dataset.theme=document.body.dataset.theme==='light'?'dark':'light';dirty=true;draw();};
const descriptions={cup:'이중 컵과 사이의 공기층은 외부 열교환을 줄입니다. 내컵·뚜껑·센서 등 장치의 열용량을 합쳐 C열량계로 모델링합니다.',lid:'뚜껑은 실제로 덮여 있지만 구조를 보여 주기 위해 앞부분을 절개했습니다. 일정 압력 용액 열량계이므로 기밀 압력 용기가 아닙니다.',sensor:'센서와 가열 카트리지가 통합된 모식 장치입니다. 보정에서는 전기 에너지를 전달하고, 반응 실험에서는 가열하지 않고 온도만 읽습니다.',stirrer:'교반 봉은 온도를 고르게 섞는 역할입니다. 이 모델은 항상 균일한 온도를 가정하며 교반 일은 무시합니다.',power:'전기 보정 때 20 W를 60 s 공급합니다. 전기 에너지 E를 반응의 일정 압력 열 qₚ와 구분하세요.'};
function selectPart(group){if(!descriptions[group])return;set('part-description',descriptions[group]);$$('[data-item]').forEach(n=>n.classList.toggle('selected',n.dataset.group===group));}
$$('[data-part]').forEach(b=>b.onclick=()=>selectPart(b.dataset.part));$('#parts').onclick=e=>{const n=e.target.closest('[data-item]');if(n)selectPart(n.dataset.group);};
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'}).observe($('main'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});reduced.addEventListener('change',()=>{stop();dirty=true;start();});
window.calorimetryLab={get state(){return observe(options,time,usedCapacity(),$('#include-cal').checked);},get time(){return time;},get options(){return{...options};},get adopted(){return adopted;}};
draw();
