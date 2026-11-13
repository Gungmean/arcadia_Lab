const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],NS='http://www.w3.org/2000/svg';
let mode='free',heat=100,insulated=false,progress=0,target=0,playing=false,phase=0,visible=true,frame=0,last=0,dirty=true;
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),nodes=ITEMS.map(i=>document.querySelector(`[data-item="${i.id}"]`)),parts=$('#parts'),chart=$('#plot').getContext('2d');
const compact=matchMedia('(max-width: 850px)');
function fitStage(){$('#stage svg').setAttribute('viewBox',compact.matches?'80 0 600 650':'0 0 760 650');}
compact.addEventListener('change',fitStage);fitStage();
function iso([x,y,z]){const a=PROJECTION.azimuth*Math.PI/180,e=PROJECTION.elevation*Math.PI/180,k=PROJECTION.scale*Math.sqrt(1.6);return[PROJECTION.origin[0]+(x*Math.sin(a)-y*Math.cos(a))*k,PROJECTION.origin[1]+((x*Math.cos(a)+y*Math.sin(a))*Math.sin(e)-z*Math.cos(e))*k];}
const path=ps=>ps.map((p,i)=>(i?'L':'M')+iso(p).join(' ')).join('')+'Z';
function point(r,z){const a=PROJECTION.azimuth*Math.PI/180;return[r*Math.sin(a),-r*Math.cos(a),z];}
const gas=document.createElementNS(NS,'path');$('#gas').append(gas);
const particles=Array.from({length:22},()=>{const c=document.createElementNS(NS,'circle');c.setAttribute('class','gas-dot');c.setAttribute('r','1.7');$('#particles').append(c);return c;});
// Foreground mechanisms occlude the teaching particles, including the moving
// piston. Reuse their actual filled silhouettes rather than a stand-in box.
const mask=document.createElementNS(NS,'mask');mask.id='particle-mask';mask.setAttribute('maskUnits','userSpaceOnUse');mask.setAttribute('x','0');mask.setAttribute('y','0');mask.setAttribute('width','760');mask.setAttribute('height','650');
const white=document.createElementNS(NS,'rect');for(const[k,v]of Object.entries({x:0,y:0,width:760,height:650,fill:'white'}))white.setAttribute(k,v);mask.append(white);
const masks=[];ITEMS.forEach((item,i)=>{if(!['frame','piston','lock'].includes(item.group))return;const g=document.createElementNS(NS,'g');nodes[i].querySelectorAll('.iso-fill').forEach(p=>{const q=p.cloneNode(true);q.removeAttribute('class');q.setAttribute('fill','black');g.append(q);});mask.append(g);if(item.moving)masks.push(g);});
$('#stage svg').prepend(mask);$('#particles').setAttribute('mask','url(#particle-mask)');
const fmt=(v,d=1)=>(Math.abs(v)<1e-8?0:v).toFixed(d),text=(id,value)=>$('#'+id).textContent=value;
function stop(){playing=false;$('#play').textContent='과정 재생';$('#play').setAttribute('aria-pressed','false');}
function start(){if(!frame&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}
function resetPath(){stop();progress=target=0;$('#progress').value=0;dirty=true;draw();start();}
function draw(){
 const s=stateAt(mode,heat,progress,insulated),piston=42+s.height,share=(piston-LOW)/STROKE;
 const a=iso([0,0,STROKE*share]),b=iso([0,0,0]),transform=`translate(${a[0]-b[0]} ${a[1]-b[1]})`;
 ITEMS.forEach((i,j)=>{if(i.moving)nodes[j].setAttribute('transform',transform);});
 masks.forEach(n=>n.setAttribute('transform',transform));
 const ordered=[...ITEMS].sort((a,b)=>(a.key+a.lift*share)-(b.key+b.lift*share));
 const signature=ordered.map(i=>i.id).join(',');if(parts.dataset.order!==signature){for(const i of ordered)parts.append(nodes[i.id]);parts.dataset.order=signature;}
 gas.setAttribute('d',path([point(-25,42),point(25,42),point(25,piston),point(-25,piston)]));
 const t=reduced.matches?0:phase;
 particles.forEach((c,i)=>{const r=Math.sin(i*3.7+t*(.5+i%3*.07))*16,z=44+((i*.618+t*.12*Math.sqrt(s.T/T0))%1)*(s.height-4),[x,y]=iso(point(r,z));c.setAttribute('cx',x);c.setAttribute('cy',y);});
 if(!dirty)return;
 text('temperature',fmt(s.T));text('pressure',fmt(s.P/1000));text('volume',fmt(s.V*1000,3));
 text('height-readout',`피스톤 높이 ${fmt(s.V/A*100,1)} cm`);text('progress-out',fmt(progress*100,0)+'%');
 if(document.activeElement!==$('#progress'))$('#progress').value=progress*100;
 text('heat-out',insulated?'차단 · 전달 열 0 J':heat+' J');
 for(const [key,v]of[['Q',s.Q],['U',s.dU],['W',s.W]]){text('energy-'+key,(v>1e-8?'+':'')+fmt(v)+' J');$('#bar-'+key).style.width=Math.min(100,Math.abs(v)/120*100)+'%';}
 text('balance',`${fmt(s.Q)} = ${fmt(s.dU)} + ${fmt(s.W)} J`);
 text('status',insulated?'단열 · 외부 하중 일정 · 상태 변화 없음':mode==='free'?'등압 · 피스톤 자유 이동':'등적 · 피스톤 고정');
 text('mode-hint',mode==='free'?'피스톤이 일정한 외부 압력에 맞서 움직입니다. 받은 열은 온도 변화와 외부에 한 일로 나뉩니다.':'피스톤이 움직이지 않아 부피 변화와 기체가 한 일이 0입니다. 받은 열은 모두 내부 에너지 변화가 됩니다.');
 $('#stage').classList.toggle('locked',mode==='locked');
 $('#comparison').innerHTML=['free','locked'].map(m=>{const v=stateAt(m,heat,1,insulated);return`<tr><td>${m==='free'?'자유 · 등압':'고정 · 등적'}</td><td>${fmt(v.T)} K</td><td>${fmt(v.V*1000,3)} L</td><td>${fmt(v.dU)} J</td><td>${fmt(v.W)} J</td></tr>`;}).join('');
 plot(s);dirty=false;
}
function plot(s){
 const c=chart,w=990,h=375,left=85,right=960,top=26,bottom=319;
 const dark=document.body.dataset.theme==='dark',ink=dark?'#dce7da':'#344b3c',quiet=dark?'#adbeab':'#526556',line=dark?'#405745':'#dce2d8',accent=dark?'#c3dfba':'#305f49';
 c.clearRect(0,0,w,h);const x=v=>left+(v*1000-.4)/1*(right-left),y=p=>bottom-p/240000*(bottom-top);
 c.lineWidth=1;c.font='14px "Malgun Gothic",sans-serif';c.strokeStyle=line;c.fillStyle=quiet;
 for(let p=0;p<=240;p+=60){c.beginPath();c.moveTo(left,y(p*1000));c.lineTo(right,y(p*1000));c.stroke();c.fillText(String(p),34,y(p*1000)+5);}
 for(let v=.4;v<=1.401;v+=.2){c.fillText(v.toFixed(1),x(v/1000)-10,bottom+25);}
 c.fillText('P (kPa)',20,17);c.fillText('V (L)',right-30,h-7);
 const points=pathOf(mode,heat,insulated).filter((_,i)=>i<=Math.floor(progress*80));points.push(s);
 if(mode==='free'&&Math.abs(s.V-V0)>1e-10){c.beginPath();c.moveTo(x(V0),bottom);for(const p of points)c.lineTo(x(p.V),y(p.P));c.lineTo(x(s.V),bottom);c.closePath();c.fillStyle=dark?'#c3dfba25':'#305f4920';c.fill();}
 c.strokeStyle=accent;c.lineWidth=3;c.beginPath();points.forEach((p,i)=>i?c.lineTo(x(p.V),y(p.P)):c.moveTo(x(p.V),y(p.P)));c.stroke();
 c.beginPath();c.arc(x(V0),y(P0),4,0,Math.PI*2);c.fillStyle=quiet;c.fill();c.beginPath();c.arc(x(s.V),y(s.P),6,0,Math.PI*2);c.fillStyle=accent;c.fill();
 c.fillStyle=ink;c.font='15px "Malgun Gothic",sans-serif';c.fillText(mode==='free'?`W = ${fmt(s.W)} J`:'ΔV = 0 · W = 0',left+20,top+23);
}
function tick(now){frame=0;if(!visible||document.hidden)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;
 if(!reduced.matches)phase+=dt;
 if(playing){target=Math.min(1,target+dt/7);if(target===1)stop();}
 const next=reduced.matches?target:progress+(target-progress)*(1-Math.exp(-dt/.16));
 if(Math.abs(next-progress)>1e-6){progress=next;dirty=true;}if(Math.abs(target-progress)<1e-5&&progress!==target){progress=target;dirty=true;}
 draw();if(!reduced.matches||progress!==target||playing)frame=requestAnimationFrame(tick);
}
$$('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;$$('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',x===b));resetPath();});
$('#heat').oninput=e=>{heat=Number(e.target.value);resetPath();};
$('#heat100').onclick=()=>{heat=100;$('#heat').value=100;resetPath();target=1;dirty=true;start();};
$('#cool').onclick=()=>{heat=-60;$('#heat').value=-60;resetPath();target=1;dirty=true;start();};
$('#reset').onclick=()=>{heat=100;$('#heat').value=100;resetPath();};
$('#progress').oninput=e=>{stop();target=Number(e.target.value)/100;dirty=true;start();};
$('#play').onclick=()=>{if(playing){stop();target=progress;}else{if(progress>.999)progress=target=0;if(reduced.matches){target=1;}else{playing=true;$('#play').textContent='일시정지';$('#play').setAttribute('aria-pressed','true');}}dirty=true;start();};
$('#finish').onclick=()=>{stop();target=1;dirty=true;start();};
$('#insulation').onclick=()=>{insulated=!insulated;$('#insulation').setAttribute('aria-checked',insulated);$('#insulation').textContent=insulated?'켜짐':'꺼짐';$('#heat').disabled=insulated;$('#cool').disabled=insulated;$('#heat100').disabled=insulated;resetPath();};
$('#theme').onclick=()=>{document.body.dataset.theme=document.body.dataset.theme==='light'?'dark':'light';dirty=true;draw();};
const descriptions={cylinder:['밀폐 실린더','기체의 양은 일정합니다. 앞쪽 절개는 내부 구조를 보여 주기 위한 것으로 실제 구멍이 아닙니다.'],piston:['피스톤·로드·하중','밀봉 링이 기체를 가두고, 피스톤이 올라가면 외부에 일을 합니다. 일정한 하중은 이 모형에서 일정한 외부 압력을 뜻합니다.'],heater:['이상적인 가열·냉각판','Q는 기체에 전달한 누적 열입니다. 양수는 가열, 음수는 냉각입니다. 실제 장치의 열용량과 열손실은 생략했습니다.'],lock:['이상적인 피스톤 고정 장치','고정 모드에서는 부피 변화가0이고 W=0입니다. 잠금 손잡이는 구속 조건의 표시이며 실제 잠금 접촉부를 모두 구현한 것은 아닙니다.'],frame:['프레임·높이 눈금','피스톤의 높이는 V/A로 계산합니다. 장치의 가로 비율은 가독성을 위해 조정했으며 눈금은 구조를 표현하는 모식 눈금입니다.']};
function selectPart(group){const d=descriptions[group];if(!d)return;text('part-title',d[0]);text('part-text',d[1]);$$('[data-item]').forEach(n=>n.classList.toggle('selected',n.dataset.group===group));}
$$('[data-part]').forEach(b=>b.onclick=()=>selectPart(b.dataset.part));$('#parts').onclick=e=>{const item=e.target.closest('[data-item]');if(item)selectPart(item.dataset.group);};
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'}).observe($('#stage'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
reduced.addEventListener('change',()=>{stop();dirty=true;start();});
window.pistonLab={get state(){return stateAt(mode,heat,progress,insulated);},get mode(){return mode;},get progress(){return progress;}};
dirty=true;draw();start();
