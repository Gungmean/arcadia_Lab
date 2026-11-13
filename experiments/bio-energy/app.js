import {PROCESSES,QUIZ,SOURCES} from './model.js';
import {LESSONS,LESSON_NOTE} from './lessons.js';
import {organelleSvg} from './organelles.js';
import {reactionScene} from './reaction-scenes.js';

const $=id=>document.getElementById(id);
const put=(id,value)=>{$(id).textContent=value;};
let processId='respiration',stage=0,sceneIndex=0,playing=false,last=0,elapsed=0,clock=0,raf=0,visible=true,quizIndex=0;
let motionPaths=[],particles=[],records=[];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const storageKey='arcadia-bio-observations-v2';
const currentStage=()=>LESSONS[processId].stages[stage];
const currentScene=()=>currentStage().scenes[sceneIndex];
try{const parsed=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(parsed))records=parsed.filter(r=>r&&PROCESSES[r.processId]&&Number.isInteger(r.stage)&&LESSONS[r.processId].stages[r.stage]&&Number.isInteger(r.scene)&&LESSONS[r.processId].stages[r.stage].scenes[r.scene]&&typeof r.time==='string').slice(-50);}catch{}

function itemCard(item,compact=false){
 const card=document.createElement('div');card.className=compact?'output-card':'product-card';
 const value=document.createElement('strong');value.textContent=item.amount;
 const name=document.createElement('span');name.textContent=item.label;
 const note=document.createElement('p');note.textContent=item.note||'';
 card.append(name,value,note);return card;
}
function renderProcess(){
 stage=0;sceneIndex=0;stop();
 const p=PROCESSES[processId];
 document.querySelectorAll('[data-process]').forEach(b=>{const active=b.dataset.process===processId;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
 put('figure-number',String(Object.keys(PROCESSES).indexOf(processId)+1).padStart(2,'0'));
 put('equation',p.equation);
 $('stages').style.gridTemplateColumns='repeat('+p.stages.length+',1fr)';
 $('stages').replaceChildren(...p.stages.map((s,i)=>{const b=document.createElement('button'),n=document.createElement('span');n.textContent='STEP '+String(i+1).padStart(2,'0');b.append(n,s.name);b.addEventListener('click',()=>selectStage(i));return b;}));
 $('organelle-map').innerHTML=organelleSvg(processId);
 $('organelle-map').querySelectorAll('[data-stage][role="button"]').forEach(g=>{g.addEventListener('click',()=>selectStage(Number(g.dataset.stage)));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();g.dispatchEvent(new Event('click'));}});});
 selectStage(0);
}
function selectStage(index){
 stop();stage=index;sceneIndex=0;
 const p=PROCESSES[processId],s=p.stages[stage],lesson=currentStage();
 put('step-counter',String(stage+1).padStart(2,'0')+' / '+String(p.stages.length).padStart(2,'0'));
 [...$('stages').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===stage)));
 $('organelle-map').querySelectorAll('[data-stage]').forEach(g=>{const active=Number(g.dataset.stage)===stage;g.classList.toggle('is-active',active);if(g.getAttribute('role')==='button')g.setAttribute('aria-pressed',String(active));});
 put('process-title',s.name);put('process-subtitle',lesson.summary);put('location',s.location);put('stage-location',p.title+' / '+s.location);
 put('compartment-focus',s.location);put('stage-title',s.name);put('stage-description',s.description);put('stage-why',s.why);
 put('basis',lesson.basis);put('balance-basis',lesson.basis);put('balance-summary',lesson.summary);
 $('stage-products').replaceChildren(...lesson.products.map(x=>itemCard(x)));
 $('cumulative-products').replaceChildren(...lesson.cumulative.map(x=>itemCard(x)));
 $('scene-steps').replaceChildren(...lesson.scenes.map((sc,i)=>{const b=document.createElement('button'),n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');b.append(n,sc.title);b.addEventListener('click',()=>{stop();selectScene(i);});return b;}));
 $('next-stage').disabled=stage===p.stages.length-1;put('next-stage',stage===p.stages.length-1?'마지막 단계입니다':'다음 단계: '+p.stages[stage+1].name+' →');
 selectScene(0);
}
function selectScene(index){
 sceneIndex=Math.max(0,Math.min(index,currentStage().scenes.length-1));elapsed=0;clock=0;
 const sc=currentScene(),total=currentStage().scenes.length;
 put('scene-count','SCENE '+String(sceneIndex+1).padStart(2,'0')+' / '+String(total).padStart(2,'0'));
 put('scene-title',sc.title);put('scene-narration',sc.narration);put('scene-equation',sc.equation);
 $('scene-outputs').replaceChildren(...sc.outputs.map(x=>itemCard(x,true)));
 if(!sc.outputs.length){const p=document.createElement('p');p.className='empty';p.textContent='이 장면은 반응 준비·전달 단계입니다. 다음 장면에서 생성물을 확인하세요.';$('scene-outputs').append(p);}
 [...$('scene-steps').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===sceneIndex)));
 $('previous-scene').disabled=sceneIndex===0;$('next-scene').disabled=sceneIndex===total-1;
 $('instrument').innerHTML=reactionScene(processId,stage,sceneIndex,sc);$('instrument').setAttribute('aria-busy','false');
 mountMotion();updatePlayback();draw();kick();
}
function updatePlayback(){
 $('play').setAttribute('aria-pressed',String(playing));put('play',playing?'Ⅱ 잠시 멈추기':'▶ 순서대로 보기');
 put('run-state',playing?'세부 장면을 순서대로 보여 줍니다. 큰 단계는 자동으로 바뀌지 않습니다.':sceneIndex===currentStage().scenes.length-1?'이 단계의 마지막 장면입니다. 생성물 수지를 확인하고 다음 단계를 선택하세요.':'장면을 직접 선택하거나 순서대로 재생하세요. 재생 시간은 실제 반응 속도를 뜻하지 않습니다.');
}
function stop(){playing=false;cancelAnimationFrame(raf);raf=0;elapsed=0;last=0;}
function mountMotion(){
 const root=$('instrument').querySelector('svg');motionPaths=[];particles=[];if(!root)return;
 motionPaths=[...root.querySelectorAll('[data-motion]')].map(path=>({path,length:path.getTotalLength()})).filter(x=>x.length>0);
 const ns='http://www.w3.org/2000/svg',group=document.createElementNS(ns,'g');group.setAttribute('aria-hidden','true');group.style.pointerEvents='none';
 motionPaths.forEach((track,n)=>{for(let i=0;i<3;i++){const dot=document.createElementNS(ns,'circle');dot.setAttribute('r',3.5);dot.style.fill='var(--accent)';group.append(dot);particles.push({dot,track,offset:i/3+n*.13});}});root.append(group);
}
function draw(){
 for(const {dot,track,offset} of particles){const at=track.path.getPointAtLength(((clock*.12+offset)%1)*track.length);dot.setAttribute('cx',at.x);dot.setAttribute('cy',at.y);}
}
function tick(now){
 raf=0;const dt=last?Math.min((now-last)/1000,.1):0;last=now;
 if(playing){if(!reduced.matches)clock+=dt;elapsed+=dt;if(elapsed>=6){if(sceneIndex<currentStage().scenes.length-1)selectScene(sceneIndex+1);else{stop();updatePlayback();}}}
 draw();if(playing&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(tick);
}
function kick(){if(playing&&visible&&!document.hidden&&!raf){last=0;raf=requestAnimationFrame(tick);}}
$('play').addEventListener('click',()=>{if(playing){stop();updatePlayback();}else{if(sceneIndex===currentStage().scenes.length-1)selectScene(0);playing=true;updatePlayback();kick();}});
$('previous-scene').addEventListener('click',()=>{stop();selectScene(sceneIndex-1);});
$('next-scene').addEventListener('click',()=>{stop();selectScene(sceneIndex+1);});
$('next-stage').addEventListener('click',()=>{if(stage<PROCESSES[processId].stages.length-1)selectStage(stage+1);});
$('replay').addEventListener('click',()=>{stop();selectScene(0);});
$('zoom').addEventListener('click',()=>{const active=$('instrument').classList.toggle('is-zoomed');$('zoom').setAttribute('aria-pressed',String(active));put('zoom',active?'− 전체 보기':'＋ 확대');});
document.querySelectorAll('[data-process]').forEach(b=>b.addEventListener('click',()=>{processId=b.dataset.process;renderProcess();}));
document.querySelector('.process-nav').addEventListener('keydown',e=>{const tabs=[...document.querySelectorAll('[data-process]')];let i=tabs.indexOf(document.activeElement);if(i<0)return;if(e.key==='ArrowRight')i=(i+1)%tabs.length;else if(e.key==='ArrowLeft')i=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else return;e.preventDefault();tabs[i].click();tabs[i].focus();});
$('theme').addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('theme').setAttribute('aria-label',dark?'밝은 테마로 전환':'어두운 테마로 전환');try{localStorage.setItem('arcadia-bio-theme',dark?'dark':'light');}catch{}});
try{const dark=localStorage.getItem('arcadia-bio-theme')==='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('theme').setAttribute('aria-label',dark?'밝은 테마로 전환':'어두운 테마로 전환');}catch{}

function renderRecords(){
 if(!records.length)return;
 $('records').replaceChildren(...records.slice().reverse().map((r,i)=>{const p=PROCESSES[r.processId],lesson=LESSONS[r.processId].stages[r.stage],sc=lesson.scenes[r.scene];const div=document.createElement('div');div.className='record-row';const title=document.createElement('strong');title.textContent=String(records.length-i).padStart(2,'0')+' / '+p.title+' · '+p.stages[r.stage].name;const sub=document.createElement('p');sub.textContent=sc.title;const outputs=document.createElement('small');outputs.textContent=sc.outputs.map(o=>o.label+' '+o.amount).join(' · ')||'반응 준비·전달';div.append(title,sub,outputs);return div;}));
}
$('record').addEventListener('click',()=>{records.push({processId,stage,scene:sceneIndex,time:new Date().toISOString()});records=records.slice(-50);let saved=true;try{localStorage.setItem(storageKey,JSON.stringify(records));}catch{saved=false;}renderRecords();put('record-message',saved?records.length+'개 관찰 저장됨 · 이 브라우저에 보관됩니다.':'화면에 기록했습니다. CSV로 내보내 보관하세요.');});
$('download').addEventListener('click',()=>{if(!records.length){put('record-message','먼저 관찰한 장면을 기록해 주세요.');return;}const quote=v=>'"'+String(v).replaceAll('"','""')+'"';const rows=[['과정','단계','장면','장소','생성물','기준','기록시각'],...records.map(r=>{const p=PROCESSES[r.processId],lesson=LESSONS[r.processId].stages[r.stage],sc=lesson.scenes[r.scene];return[p.title,p.stages[r.stage].name,sc.title,p.stages[r.stage].location,sc.outputs.map(x=>x.label+' '+x.amount).join(' / '),lesson.basis,r.time];})];const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='arcadia-bio-observations.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
function renderQuiz(){
 const q=QUIZ[quizIndex];put('quiz-number',(quizIndex+1)+' / '+QUIZ.length);put('quiz-question',q.question);put('quiz-feedback','');$('quiz-next').hidden=true;
 $('quiz-options').replaceChildren(...q.options.map((o,i)=>{const b=document.createElement('button');b.textContent=String.fromCharCode(65+i)+'. '+o;b.addEventListener('click',()=>{[...$('quiz-options').children].forEach((x,j)=>{x.disabled=true;x.classList.toggle('correct',j===q.answer);});if(i!==q.answer)b.classList.add('incorrect');put('quiz-feedback',(i===q.answer?'정답입니다. ':'다시 살펴보세요. ')+q.explanation);$('quiz-next').hidden=false;});return b;}));
}
$('quiz-next').addEventListener('click',()=>{quizIndex=(quizIndex+1)%QUIZ.length;renderQuiz();});
for(const source of SOURCES){const a=document.createElement('a');a.href=source.url;a.textContent=source.title+' ↗';a.target='_blank';a.rel='noopener';$('sources').append(a,document.createElement('br'));}
const lessonNote=document.createElement('p');lessonNote.textContent=LESSON_NOTE;$('sources').prepend(lessonNote);
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(!visible){cancelAnimationFrame(raf);raf=0;last=0;}else kick();},{rootMargin:'80px'}).observe($('instrument'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else kick();});
reduced.addEventListener('change',()=>{if(reduced.matches){stop();updatePlayback();draw();}});
renderProcess();renderRecords();renderQuiz();
