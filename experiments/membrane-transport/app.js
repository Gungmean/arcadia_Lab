import {LESSONS,getLesson,DEFAULT_OPTIONS,QUIZ,SOURCES,MODEL_NOTE,transportSummary} from './lessons.js';
import {membraneMotion,membraneOverview} from './motion.js';
const PROCESSES=LESSONS;
const $=id=>document.getElementById(id);
const put=(id,value)=>{$(id).textContent=value;};
let processId='diffusion',stage=0,sceneIndex=0,playing=false,last=0,elapsed=0,clock=0,raf=0,visible=true,quizIndex=0;
let sceneMotion=null,motionRoot=null,motionPlaying=false,diagramMode=false,records=[];
const motionDuration=8;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const storageKey='arcadia-membrane-observations-v1';
let options={...DEFAULT_OPTIONS},activeLesson=null;
const currentStage=()=>activeLesson.stages[stage];
const currentScene=()=>currentStage().scenes[sceneIndex];
try{const parsed=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(parsed))records=parsed.filter(r=>r&&PROCESSES[r.processId]&&Number.isInteger(r.stage)&&LESSONS[r.processId].stages[r.stage]&&Number.isInteger(r.scene)&&LESSONS[r.processId].stages[r.stage].scenes[r.scene]&&typeof r.time==='string').slice(-50);}catch{}

function itemCard(item,compact=false){
 const card=document.createElement('div');card.className=compact?'output-card':'product-card';
 const value=document.createElement('strong');value.textContent=item.amount;
 const name=document.createElement('span');name.textContent=item.label;
 const note=document.createElement('p');note.textContent=item.note||'';
 card.append(name,value,note);return card;
}
function renderProcess(preferredStage=0,preferredScene=0){
 stage=0;sceneIndex=0;stop();
 activeLesson=getLesson(processId,options);const p=activeLesson;updatePresets();
 document.querySelectorAll('.process-nav [data-process]').forEach(b=>{const active=b.dataset.process===processId;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
 put('figure-number',String(Object.keys(PROCESSES).indexOf(processId)+1).padStart(2,'0'));
 put('equation',p.summary);
 $('stages').style.gridTemplateColumns='repeat('+p.stages.length+',1fr)';
 $('stages').replaceChildren(...p.stages.map((s,i)=>{const b=document.createElement('button'),n=document.createElement('span');n.textContent='단계 '+String(i+1).padStart(2,'0');b.append(n,s.name);b.addEventListener('click',()=>selectStage(i));return b;}));
 $('organelle-map').innerHTML=membraneOverview(processId,options);
 $('organelle-map').querySelectorAll('[data-stage][role="button"]').forEach(g=>{g.addEventListener('click',()=>selectStage(Number(g.dataset.stage)));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();g.dispatchEvent(new Event('click'));}});});
 selectStage(preferredStage,preferredScene);
}
function selectStage(index,preferredScene=0){
 stop();stage=index;sceneIndex=0;
 const p=activeLesson,s=p.stages[stage],lesson=currentStage();
 put('step-counter',String(stage+1).padStart(2,'0')+' / '+String(p.stages.length).padStart(2,'0'));
 [...$('stages').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===stage)));
 $('organelle-map').querySelectorAll('[data-stage]').forEach(g=>{const active=Number(g.dataset.stage)===stage;g.classList.toggle('is-active',active);if(g.getAttribute('role')==='button')g.setAttribute('aria-pressed',String(active));});
 put('process-title',s.name);put('process-subtitle',lesson.summary);put('location',s.location);put('stage-location',p.title+' / '+s.location);
 put('compartment-focus',s.location);put('stage-title',s.name);put('stage-description',s.summary);put('stage-why',s.why);
 put('basis',lesson.basis);put('balance-basis',lesson.basis);put('balance-summary',lesson.summary);
 $('stage-products').replaceChildren(...lesson.products.map(x=>itemCard(x)));
 $('cumulative-products').replaceChildren(...summaryCards().map(x=>itemCard(x)));
 $('scene-steps').replaceChildren(...lesson.scenes.map((sc,i)=>{const b=document.createElement('button'),n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');b.append(n,sc.title);b.addEventListener('click',()=>{stop();selectScene(i);});return b;}));
 $('next-stage').disabled=stage===p.stages.length-1;put('next-stage',stage===p.stages.length-1?'마지막 단계입니다':'다음 단계: '+p.stages[stage+1].name+' →');
 selectScene(preferredScene);
}
function selectScene(index){
 sceneIndex=Math.max(0,Math.min(index,currentStage().scenes.length-1));elapsed=0;clock=reduced.matches?motionDuration:0;motionPlaying=!reduced.matches;diagramMode=false;
 const sc=currentScene(),total=currentStage().scenes.length;
 put('scene-count','장면 '+String(sceneIndex+1).padStart(2,'0')+' / '+String(total).padStart(2,'0'));
 put('scene-title',sc.title);put('scene-narration',sc.narration);put('scene-equation',sc.equation);
 $('scene-outputs').replaceChildren(...sc.outputs.map(x=>itemCard(x,true)));
 if(!sc.outputs.length){const p=document.createElement('p');p.className='empty';p.textContent='이 장면은 이동을 준비하는 단계입니다. 다음 장면에서 물질의 위치를 확인하세요.';$('scene-outputs').append(p);}
 [...$('scene-steps').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===sceneIndex)));
 $('previous-scene').disabled=sceneIndex===0;$('next-scene').disabled=sceneIndex===total-1;
 $('instrument').setAttribute('aria-busy','false');
 mountMotion();updatePlayback();draw();kick();
}
let lastPhase=-1,playbackSpeed=1;
function updatePlayback(){
 $('play').setAttribute('aria-pressed',String(playing));put('play',playing?'Ⅱ 단계 재생 멈추기':'▶ 단계 전체 재생');
 $('motion-play').setAttribute('aria-pressed',String(motionPlaying));put('motion-play',motionPlaying?'Ⅱ 일시정지':clock>=motionDuration?'▶ 재생':'▶ 재생');
 $('diagram-mode').setAttribute('aria-pressed',String(diagramMode));put('diagram-mode',diagramMode?'움직이는 수송 보기':'정리 그림 보기');
 $('motion-seek').disabled=diagramMode;
 put('run-state',diagramMode?'세포막 전체 구조을 정리한 그림입니다. 움직이는 수송 보기로 돌아가 재생하세요.':reduced.matches&&!motionPlaying?'동작 줄이기 설정으로 자동 재생을 멈췄습니다. 진행 막대로 원하는 순간을 살펴볼 수 있습니다.':playing?'각 장면의 수송을 이어서 재생합니다. 현재 관찰 단계의 마지막 장면에서 멈춥니다.':motionPlaying?'지금 선택한 수송을 재생하고 있습니다. 멈추거나 진행 막대를 움직여 자세히 관찰하세요.':clock>=motionDuration?'이동이 끝났습니다. 결과를 확인하거나 다시 재생하세요.':'멈춘 장면입니다. 진행 막대를 움직여 분자의 변화 과정을 살펴보세요.');
}
function stop(){playing=false;motionPlaying=false;cancelAnimationFrame(raf);raf=0;elapsed=0;last=0;}
function mountMotion(){
 const sc=currentScene();lastPhase=-1;
 sceneMotion=membraneMotion(processId,stage,sceneIndex,sc,options);
 if(!sceneMotion)throw new Error('Missing biological motion: '+processId+'/'+stage+'/'+sceneIndex);
 $('instrument').innerHTML=diagramMode?membraneOverview(processId,options):sceneMotion.svg;
 motionRoot=$('instrument').querySelector('svg');motionRoot.setAttribute('aria-label',sc.title+' — 수송 영상. 아래의 진행 막대로 재생 위치를 조절할 수 있습니다.');
 $('motion-phases').replaceChildren(...sceneMotion.phases.map((label,i)=>{const b=document.createElement('button'),n=document.createElement('span'),full=document.createElement('span'),short=document.createElement('span');n.className='phase-number';n.textContent=String(i+1).padStart(2,'0')+' ';full.className='phase-full';full.textContent=label;short.className='phase-short';short.textContent=['관찰 시작','이동 과정','결과 확인'][i];b.setAttribute('aria-label',label);b.append(n,full,short);b.addEventListener('click',()=>seek([0,.45,.83][i]??1));return b;}));
 $('motion-phases').hidden=diagramMode;
}
function seek(progress){
 stop();clock=Math.max(0,Math.min(1,progress))*motionDuration;lastPhase=-1;draw();updatePlayback();
}
function draw(){
 const progress=Math.min(1,Math.max(0,clock/motionDuration));
 if(sceneMotion&&!diagramMode){sceneMotion.render(motionRoot,progress);motionRoot.dataset.progress=progress.toFixed(4);}
 $('motion-seek').value=Math.round(progress*1000);put('motion-percent',Math.round(progress*100)+'%');
 const phase=Math.min(2,Math.floor(progress*3));
 if(phase!==lastPhase){lastPhase=phase;put('motion-phase',diagramMode?'정리 그림 · 세포막 전체 구조':sceneMotion.phases[phase]);[...$('motion-phases').children].forEach((b,i)=>{b.classList.toggle('is-active',i===phase);b.classList.toggle('is-complete',i<phase);b.setAttribute('aria-pressed',String(i===phase));});$('motion-seek').setAttribute('aria-valuetext',sceneMotion.phases[phase]);}
 $('scene-outputs').classList.toggle('is-produced',progress>=.72&&!diagramMode);
}
function tick(now){
 raf=0;const dt=last?Math.min((now-last)/1000,1/30):0;last=now;
 if(motionPlaying){clock=Math.min(motionDuration,clock+dt*playbackSpeed);if(clock>=motionDuration){if(playing&&sceneIndex<currentStage().scenes.length-1){selectScene(sceneIndex+1);}else{motionPlaying=false;playing=false;updatePlayback();}}}
 draw();if(motionPlaying&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(tick);
}
function kick(){if(motionPlaying&&visible&&!document.hidden&&!raf){last=0;raf=requestAnimationFrame(tick);}}
$('play').addEventListener('click',()=>{if(playing){stop();updatePlayback();}else{if(sceneIndex===currentStage().scenes.length-1)selectScene(0);if(diagramMode){diagramMode=false;mountMotion();}if(clock>=motionDuration)clock=0;playing=true;motionPlaying=true;updatePlayback();kick();}});
$('motion-play').addEventListener('click',()=>{if(motionPlaying){stop();updatePlayback();}else{if(diagramMode){diagramMode=false;mountMotion();}if(clock>=motionDuration)clock=0;motionPlaying=true;updatePlayback();kick();}});
$('motion-seek').addEventListener('input',()=>seek(Number($('motion-seek').value)/1000));
$('motion-speed').addEventListener('change',()=>{playbackSpeed=Number($('motion-speed').value);});
$('diagram-mode').addEventListener('click',()=>{stop();diagramMode=!diagramMode;if(!diagramMode){if(clock>=motionDuration)clock=0;motionPlaying=!reduced.matches;}mountMotion();draw();updatePlayback();kick();});
$('previous-scene').addEventListener('click',()=>{stop();selectScene(sceneIndex-1);});
$('next-scene').addEventListener('click',()=>{stop();selectScene(sceneIndex+1);});
$('next-stage').addEventListener('click',()=>{if(stage<PROCESSES[processId].stages.length-1)selectStage(stage+1);});
$('replay').addEventListener('click',()=>{stop();diagramMode=false;clock=reduced.matches?motionDuration:0;motionPlaying=!reduced.matches;mountMotion();draw();updatePlayback();kick();});
$('zoom').addEventListener('click',()=>{const active=$('instrument').classList.toggle('is-zoomed');$('zoom').setAttribute('aria-pressed',String(active));put('zoom',active?'− 전체 보기':'＋ 확대');});
function updatePresets(){
 $('preset-panel').hidden=processId!=='osmosis';
 document.querySelectorAll('[data-solution]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.solution===options.solution)));
 document.querySelectorAll('[data-cell]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cell===options.cell)));
}
function summaryCards(){
 const summary=transportSummary(processId,options);
 const routes={diffusion:'지질 이중층',osmosis:'물에 투과적인 막',facilitated:'통로·운반체 단백질',active:'나트륨·칼륨 펌프'};
 return [{label:'이동 방향',amount:summary.direction,note:processId==='facilitated'?'이온은 전기적 힘의 영향도 받습니다.':''},{label:'ATP 직접 사용',amount:summary.atp?'1개 / 펌프 1회':'없음',note:processId==='active'?'Na⁺ 3개를 밖으로, K⁺ 2개를 안으로 운반합니다.':'물질의 순이동은 기울기를 따라 일어납니다.'},{label:'통과 경로',amount:routes[processId],note:''},{label:processId==='osmosis'?'선택한 세포':'관찰할 물질',amount:processId==='osmosis'?(options.cell==='plant'?'식물세포':'동물세포'):{diffusion:'O₂',facilitated:'Na⁺·포도당',active:'Na⁺·K⁺'}[processId],note:''}];
}
function choosePreset(key,value){
 const oldStage=stage,oldScene=sceneIndex;options={...options,[key]:value};renderProcess(oldStage,oldScene);
}
document.querySelectorAll('[data-solution]').forEach(b=>b.addEventListener('click',()=>choosePreset('solution',b.dataset.solution)));
document.querySelectorAll('[data-cell]').forEach(b=>b.addEventListener('click',()=>choosePreset('cell',b.dataset.cell)));
document.querySelectorAll('.process-nav [data-process]').forEach(b=>b.addEventListener('click',()=>{processId=b.dataset.process;renderProcess();}));
document.querySelector('.process-nav').addEventListener('keydown',e=>{const tabs=[...document.querySelectorAll('.process-nav [data-process]')];let i=tabs.indexOf(document.activeElement);if(i<0)return;if(e.key==='ArrowRight')i=(i+1)%tabs.length;else if(e.key==='ArrowLeft')i=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else return;e.preventDefault();tabs[i].click();tabs[i].focus();});
$('theme').addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('theme').setAttribute('aria-label',dark?'밝은 테마로 전환':'어두운 테마로 전환');try{localStorage.setItem('arcadia-bio-theme',dark?'dark':'light');}catch{}});
try{const dark=localStorage.getItem('arcadia-bio-theme')==='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('theme').setAttribute('aria-label',dark?'밝은 테마로 전환':'어두운 테마로 전환');}catch{}

function renderRecords(){
 if(!records.length)return;
 $('records').replaceChildren(...records.slice().reverse().map((r,i)=>{const p=getLesson(r.processId,r.options||DEFAULT_OPTIONS),lesson=p.stages[r.stage],sc=lesson.scenes[r.scene];const div=document.createElement('div');div.className='record-row';const title=document.createElement('strong');title.textContent=String(records.length-i).padStart(2,'0')+' / '+p.title+' · '+p.stages[r.stage].name;const sub=document.createElement('p');sub.textContent=sc.title;const outputs=document.createElement('small');outputs.textContent=sc.outputs.map(o=>o.label+' '+o.amount).join(' · ')||'수송 준비·이동';div.append(title,sub,outputs);return div;}));
}
$('record').addEventListener('click',()=>{records.push({processId,stage,scene:sceneIndex,options:{...options},time:new Date().toISOString()});records=records.slice(-50);let saved=true;try{localStorage.setItem(storageKey,JSON.stringify(records));}catch{saved=false;}renderRecords();put('record-message',saved?records.length+'개 관찰 저장됨 · 이 브라우저에 보관됩니다.':'화면에 기록했습니다. CSV로 내보내 보관하세요.');});
$('download').addEventListener('click',()=>{if(!records.length){put('record-message','먼저 관찰한 장면을 기록해 주세요.');return;}const quote=v=>'"'+String(v).replaceAll('"','""')+'"';const rows=[['과정','단계','장면','위치','관찰 결과','관찰 기준','기록시각'],...records.map(r=>{const p=getLesson(r.processId,r.options||DEFAULT_OPTIONS),lesson=p.stages[r.stage],sc=lesson.scenes[r.scene];return[p.title,p.stages[r.stage].name,sc.title,p.stages[r.stage].location,sc.outputs.map(x=>x.label+' '+x.amount).join(' / '),lesson.basis,r.time];})];const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='arcadia-membrane-observations.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
function renderQuiz(){
 const q=QUIZ[quizIndex];put('quiz-number',(quizIndex+1)+' / '+QUIZ.length);put('quiz-question',q.question);put('quiz-feedback','');$('quiz-next').hidden=true;
 $('quiz-options').replaceChildren(...q.options.map((o,i)=>{const b=document.createElement('button');b.textContent=String.fromCharCode(65+i)+'. '+o;b.addEventListener('click',()=>{[...$('quiz-options').children].forEach((x,j)=>{x.disabled=true;x.classList.toggle('correct',j===q.answer);});if(i!==q.answer)b.classList.add('incorrect');put('quiz-feedback',(i===q.answer?'정답입니다. ':'다시 살펴보세요. ')+q.explanation);$('quiz-next').hidden=false;});return b;}));
}
$('quiz-next').addEventListener('click',()=>{quizIndex=(quizIndex+1)%QUIZ.length;renderQuiz();});
for(const source of SOURCES){const a=document.createElement('a');a.href=source.url;a.textContent=source.title+' ↗';a.target='_blank';a.rel='noopener';$('sources').append(a,document.createElement('br'));}
const lessonNote=document.createElement('p');lessonNote.textContent=MODEL_NOTE;$('sources').prepend(lessonNote);
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(!visible){cancelAnimationFrame(raf);raf=0;last=0;}else kick();},{rootMargin:'80px'}).observe($('instrument'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else kick();});
reduced.addEventListener('change',()=>{if(reduced.matches){stop();clock=motionDuration;draw();updatePlayback();}});
renderProcess();renderRecords();renderQuiz();
