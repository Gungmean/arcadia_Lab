import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as k from './kit/iso-kit.mjs';
import { kitScript } from './scripts/inline-kit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const WIDTH = 900, HEIGHT = 600;
const P = k.fitProjection(k.boxCorners({ x:-245, y:-160, w:490, d:320, r:16 }, -16, 8), WIDTH, HEIGHT, { pad:55, azimuth:43, elevation:42 });
const S = (paths, tone) => k.solidSvg(paths, { tone, crease:'faint' });
const L = (path, tone='lo') => k.lineSvg(path, { tone });
const plate = { x:-245, y:-160, w:490, d:320, r:16 };

// One microscope specimen stage; the biological cutaway remains the subject.
const stageParts = [
  `<path class="iso-halo" d="${k.haloOf(plate,-20,4,P)}"/>`,
  ...k.corners(plate,24).sort((a,b)=>k.depthOf([a[0],a[1],0],P)-k.depthOf([b[0],b[1],0],P))
    .map(([x,y])=>S(k.cylinder(x,y,8,-20,5,P,24),'lo')),
  S(k.slabOf(plate,-15,15,P,8,1.1),'mid'),
  L(k.planOutline(k.insetPlan(plate,6),0,P),'faint'),
  ...k.corners(plate,17).map(([x,y])=>L(k.ring(x,y,2.4,0,P,20),'lo')),
  k.dotsSvg(k.corners(plate,17).map(([x,y])=>k.iso([x,y,0],P)),{size:.55}),
].join('');

const DATA = {
  animal: {
    membrane:['세포막','경계와 선택적 이동','인지질 이중층과 막단백질이 세포 안팎을 구분합니다. 필요한 물질의 이동과 신호 전달을 조절합니다.','가장 바깥의 연속된 경계를 따라가 보세요.'],
    cytoplasm:['세포질','반응이 일어나는 공간','세포질에는 세포질액과 소기관이 포함됩니다. 여러 대사 반응이 이 공간에서 진행됩니다.','소기관 사이를 채우는 옅은 바탕입니다.'],
    nucleus:['핵','유전 정보의 보관','핵은 DNA를 담고 있습니다. 핵 안에서 전사가 일어나며, 핵막의 통로를 통해 물질이 오갑니다.','겹막과 핵공을 둘러싼 큰 원형 구조입니다.'],
    nucleolus:['인','리보솜 부품의 조립','인에서는 리보솜 RNA가 만들어지고 리보솜 소단위체가 조립됩니다. 막으로 둘러싸인 소기관은 아닙니다.','핵 안쪽의 진한 작은 원을 누르세요.'],
    chromatin:['염색질','DNA와 단백질','DNA가 히스톤 등 단백질과 결합한 상태입니다. 세포 분열 때 응축되어 염색체로 뚜렷하게 보입니다.','핵 내부의 가느다란 실 같은 무늬입니다.'],
    roughER:['거친면 소포체','분비 단백질의 합성·가공','표면에 붙은 리보솜이 분비되거나 막에 들어갈 단백질을 합성합니다. 소포체 내부에서 접힘과 초기 가공이 이어집니다.','핵 곁의 층진 막에 작은 점들이 붙어 있습니다.'],
    smoothER:['매끈면 소포체','지질 합성과 해독','리보솜이 붙지 않은 소포체 영역입니다. 지질 합성, 해독, 칼슘 이온 저장 등에 관여합니다.','작은 점이 없는 구불구불한 막 관입니다.'],
    ribosome:['리보솜','단백질 합성','mRNA의 정보를 읽어 아미노산을 연결합니다. 세포질에 자유롭게 있거나 거친면 소포체에 붙어 있습니다.','흩어진 작은 점과 소포체 표면의 점을 보세요.'],
    golgi:['골지체','분류와 포장','소포체에서 온 단백질과 지질을 변형·분류하고 목적지에 맞게 소낭으로 포장합니다.','나란히 휘어진 납작한 막 주머니입니다.'],
    mitochondrion:['미토콘드리아','세포 호흡과 ATP 생성','내막의 주름인 크리스타를 가진 이중막 소기관입니다. 세포 호흡의 여러 단계에 관여해 ATP를 만듭니다.','타원 안에 접힌 안쪽 막을 살펴보세요.'],
    lysosome:['리소좀','분해와 재활용','산성 내부의 가수분해 효소가 큰 분자와 낡은 세포 구성 요소를 분해합니다.','작고 짙은 구형 소낭입니다.'],
    peroxisome:['퍼옥시좀','산화 반응과 과산화수소 처리','일부 지방산을 분해하고 산화 반응에서 생긴 과산화수소를 카탈레이스로 처리합니다.','리소좀과 구별되는 노란 작은 소낭입니다.'],
    centrosome:['중심체','미세소관 조직','동물세포의 중심체는 미세소관을 조직합니다. 보통 서로 직각으로 놓인 중심립 한 쌍을 포함합니다.','짧은 원통 두 개가 엇갈린 곳입니다.'],
    vesicle:['수송 소낭','물질의 운반','막으로 싸인 작은 주머니가 소포체·골지체·세포막 사이에서 화물을 옮깁니다.','골지체 주변의 작은 막 구슬입니다.'],
    cytoskeleton:['세포 골격','형태 유지와 세포 내 이동','미세소관·미세섬유 등으로 이뤄진 동적인 그물입니다. 형태 유지와 세포 내 물질 이동에 관여합니다.','세포 내부를 지나는 가느다란 섬유입니다.'],
  },
  plant: {
    wall:['세포벽','지지와 보호','주로 셀룰로스로 이뤄진 단단한 층으로, 세포막 바깥에 있습니다. 세포의 모양과 기계적 지지를 제공합니다.','가장 바깥쪽의 두꺼운 사각 경계입니다.'],
    membrane:['세포막','선택적 물질 이동','세포벽 바로 안쪽의 인지질 이중층입니다. 물질 이동과 신호 인식을 조절합니다.','세포벽 안쪽의 가는 연속선입니다.'],
    cytoplasm:['세포질','소기관이 놓이는 공간','세포질액과 소기관을 포함합니다. 큰 중앙 액포 때문에 성숙한 식물세포에서는 가장자리의 얇은 띠처럼 보이기도 합니다.','액포와 세포막 사이의 바탕을 보세요.'],
    nucleus:['핵','유전 정보의 보관','DNA가 들어 있고 유전자 발현을 조절하는 핵심 공간입니다. 핵막은 소포체와 이어집니다.','액포 옆으로 밀려난 큰 둥근 구조입니다.'],
    nucleolus:['인','리보솜 소단위체 조립','리보솜 RNA와 단백질을 이용해 리보솜 소단위체를 조립합니다.','핵 안의 진한 작은 원입니다.'],
    roughER:['거친면 소포체','단백질 합성과 초기 가공','표면의 리보솜에서 분비·막 단백질을 합성합니다. 막 공간에서 단백질의 접힘과 초기 가공이 일어납니다.','핵 주변의 점이 붙은 층진 막입니다.'],
    ribosome:['리보솜','단백질 합성','자유 리보솜과 거친면 소포체에 붙은 리보솜이 모두 단백질을 만듭니다.','세포질과 막 표면의 작은 점입니다.'],
    golgi:['골지체','변형·분류·운반','단백질과 지질을 처리해 소낭으로 보냅니다. 식물세포에서는 세포벽 다당류의 합성에도 관여합니다.','겹쳐진 굽은 막 주머니입니다.'],
    mitochondrion:['미토콘드리아','ATP 생성','식물세포도 세포 호흡을 합니다. 미토콘드리아는 유기물의 에너지를 ATP 형태로 전환하는 과정에 관여합니다.','안쪽 막이 접힌 타원입니다.'],
    chloroplast:['엽록체','광합성','엽록소가 든 틸라코이드 막에서 빛 에너지를 이용하고, 스트로마에서 탄소 고정 반응이 진행됩니다.','초록 타원 두 개를 보세요.'],
    grana:['그라나·틸라코이드','빛 반응이 일어나는 막','틸라코이드는 납작한 막 주머니이며, 여러 개가 쌓인 구조가 그라나입니다. 빛 반응의 단백질 복합체가 막에 있습니다.','엽록체 안의 짧은 원반 더미를 누르세요.'],
    vacuole:['중앙 액포','저장과 팽압 유지','물·이온·색소·노폐물 등을 저장할 수 있습니다. 물이 차 팽압을 만들면 세포벽과 함께 세포 형태를 지탱합니다.','세포 중심을 크게 차지하는 연푸른 공간입니다.'],
    tonoplast:['액포막','액포와 세포질의 경계','중앙 액포를 둘러싼 막으로, 물질의 출입을 조절해 액포 내부 조성을 유지합니다.','큰 액포의 가장자리를 따라가 보세요.'],
    plasmodesmata:['원형질 연락사','이웃 세포와의 통로','인접한 식물세포의 세포질을 잇는 통로로, 물질과 신호가 세포 사이를 이동할 수 있습니다.','세포벽을 가로지르는 짧은 통로입니다.'],
    peroxisome:['퍼옥시좀','산화 반응','지방산 분해 등 산화 반응에 관여하며, 생긴 과산화수소를 처리합니다.','작은 노란 소낭입니다.'],
  }
};

const esc = value => String(value).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const part = (mode,key,markup) => `<g class="organelle" data-key="${key}" data-mode="${mode}" tabindex="0" role="button" aria-label="${esc(DATA[mode][key][0])}"><title>${esc(DATA[mode][key][0])}</title>${markup}</g>`;
const ellipse = (cx,cy,rx,ry,fill,stroke='none',sw=1)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const path = (d,fill='none',stroke='none',sw=1)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;

function mito(x,y,angle=0) {
  const crests = Array.from({length:6},(_,i)=>path(`M${-34+i*12} -12 Q${-28+i*12} -2 ${-34+i*12} 12`,'none','#974e4b',2.7)).join('');
  return `<g transform="translate(${x} ${y}) rotate(${angle})">${ellipse(0,0,48,25,'#d9887c','#a05d58',3)}${ellipse(0,0,40,18,'#f5b5a1','#b96f67',1.5)}${crests}</g>`;
}
function chloroplast(x,y,angle=0) {
  const stacks = [-28,0,28].map(cx=>`<g>${[-7,-3,1,5].map(dy=>ellipse(cx,dy,11,2.8,'#3e8a68','#276c52',.7)).join('')}</g>`).join('');
  return `<g transform="translate(${x} ${y}) rotate(${angle})">${ellipse(0,0,62,28,'#70b58b','#348061',3)}${ellipse(0,0,54,21,'#c0ddaa','#5da077',1.5)}${stacks}</g>`;
}
function nucleus(x,y,r=74) {
  return `${ellipse(x,y,r+6,r-5,'#aa86b6','#704f85',4)}${ellipse(x,y,r-2,r-13,'#d9c6dc','#805b92',2)}${Array.from({length:10},(_,i)=>{let a=i*Math.PI/5;return ellipse(x+Math.cos(a)*(r+2),y+Math.sin(a)*(r-10),2.4,2.4,'#f6e6ef','#704f85',.8)}).join('')}`;
}
function golgi(x,y) {
  return Array.from({length:6},(_,i)=>path(`M${x-48+i*3} ${y+i*9} Q${x} ${y-13+i*9} ${x+53-i*2} ${y+i*9}`,'none',i%2?'#e2a96d':'#f0c492',6)).join('');
}
function roughER(x,y) {
  const sheets=Array.from({length:5},(_,i)=>path(`M${x-68} ${y+i*13} C${x-30} ${y-16+i*13} ${x+23} ${y+16+i*13} ${x+70} ${y+i*13}`,'none','#8272af',8)).join('');
  const dots=Array.from({length:30},(_,i)=>ellipse(x-61+(i%10)*13,y+Math.floor(i/10)*20+((i%3)-1)*4,2.3,2.3,'#302a4c')).join('');
  return sheets+dots;
}
function ribosomes(points) { return points.map(([x,y])=>ellipse(x,y,3,3,'#514269')).join(''); }

const animal = [
  part('animal','membrane',path('M121 293 C86 205 151 115 273 92 C369 56 439 105 526 81 C657 62 778 153 772 278 C779 407 662 488 530 476 C402 500 327 461 226 475 C121 471 83 382 121 293Z','#d2adbf','#815d7e',10)),
  part('animal','cytoplasm',path('M139 291 C103 211 167 131 279 109 C372 77 442 121 531 101 C654 81 752 163 752 279 C757 394 651 467 526 456 C408 481 328 442 228 455 C136 449 105 375 139 291Z','#f2e3e8')),
  part('animal','cytoskeleton',path('M171 322 Q299 351 375 438 M542 127 Q615 197 719 216 M522 433 Q626 375 696 345 M201 192 Q269 278 304 389','none','#c58dab',2)),
  part('animal','smoothER',Array.from({length:5},(_,i)=>path(`M${520+i*5} ${139+i*10} C${554+i*3} ${119+i*10} ${600+i*2} ${151+i*10} ${652-i*3} ${133+i*10}`,'none','#8c7dae',5)).join('')),
  part('animal','roughER',roughER(277,294)),
  part('animal','nucleus',nucleus(399,259)),
  part('animal','chromatin',path('M350 250 Q374 220 390 241 T438 245 M349 278 Q386 291 403 268 T447 277 M377 205 Q399 218 419 205','none','#a786b2',3)),
  part('animal','nucleolus',ellipse(412,272,21,19,'#855a93','#613f71',2)),
  part('animal','mitochondrion',mito(244,171,-24)+mito(596,375,27)),
  part('animal','golgi',golgi(562,210)),
  part('animal','lysosome',ellipse(654,272,18,18,'#c47587','#8d4d6f',2)+ellipse(648,267,4,4,'#f1d7d8')+ellipse(659,277,3,3,'#f1d7d8')),
  part('animal','peroxisome',ellipse(224,388,15,15,'#e0be67','#ac8c4a',2)+ellipse(224,388,5,5,'#f7e6ab')),
  part('animal','centrosome',`<g transform="translate(555 342) rotate(-24)"><rect x="-30" y="-9" width="54" height="18" rx="8" fill="#83a6bf" stroke="#4f7291" stroke-width="2"/>${Array.from({length:6},(_,i)=>path(`M${-23+i*8} -7v14`,'none','#d8e6e8',2)).join('')}<rect x="-8" y="-30" width="18" height="54" rx="8" fill="#6895b2" stroke="#4f7291" stroke-width="2"/></g>`),
  part('animal','vesicle',[[638,183,9],[681,196,7],[620,242,8]].map(([x,y,r])=>ellipse(x,y,r,r,'#f0bf92','#b88768',2)).join('')),
  part('animal','ribosome',ribosomes([[183,244],[202,263],[190,279],[264,425],[286,408],[645,337],[670,325],[590,150],[611,143]])),
].join('');

const plant = [
  part('plant','wall',`<rect x="97" y="66" width="710" height="458" rx="46" fill="#c5d3a0" stroke="#718e65" stroke-width="13"/><rect x="111" y="80" width="682" height="430" rx="38" fill="none" stroke="#f0e8b5" stroke-width="4"/>`),
  part('plant','membrane',`<rect x="126" y="95" width="652" height="400" rx="28" fill="#dce6b3" stroke="#638b76" stroke-width="6"/>`),
  part('plant','cytoplasm',`<rect x="138" y="107" width="628" height="376" rx="22" fill="#eef2cf"/>`),
  part('plant','plasmodesmata',[[138,175],[138,311],[766,230],[766,407]].map(([x,y])=>`<g>${path(`M${x-30} ${y}h60`,'none','#477f69',4)}${ellipse(x,y,5,5,'#dce8a4','#477f69',2)}</g>`).join('')),
  part('plant','tonoplast',`<rect x="389" y="161" width="303" height="269" rx="53" fill="#94c7ce" stroke="#508f9a" stroke-width="7"/>`),
  part('plant','vacuole',`<rect x="402" y="174" width="277" height="243" rx="46" fill="#c9e5e6"/>${[[488,241],[584,318],[521,362]].map(([x,y])=>ellipse(x,y,5,5,'#9fcbd2')).join('')}`),
  part('plant','roughER',roughER(260,340)),
  part('plant','nucleus',nucleus(286,230,63)),
  part('plant','nucleolus',ellipse(300,244,17,16,'#855a93','#613f71',2)),
  part('plant','chloroplast',chloroplast(254,137,13)+chloroplast(652,450,-8)),
  part('plant','grana',`<g transform="translate(254 137) rotate(13)">${[-28,0,28].map(cx=>[-7,-3,1,5].map(dy=>ellipse(cx,dy,11,2.8,'#2c795a','#1b644c',.8)).join('')).join('')}</g>`),
  part('plant','mitochondrion',mito(335,441,-12)),
  part('plant','golgi',golgi(591,122)),
  part('plant','peroxisome',ellipse(728,368,16,16,'#e0be67','#ac8c4a',2)+ellipse(728,368,5,5,'#f7e6ab')),
  part('plant','ribosome',ribosomes([[179,363],[193,373],[214,402],[734,162],[717,182],[706,447],[347,151]])),
].join('');

const svg = k.figureSvg({ width:WIDTH, height:HEIGHT,
  label:'동물세포와 식물세포의 구조를 선택하여 탐색하는 모식도',
  body:`<defs><filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="13"/></filter></defs>
    <g opacity=".55">${stageParts}</g><ellipse cx="450" cy="525" rx="315" ry="42" fill="#152437" opacity=".28" filter="url(#soft-shadow)"/>
    <g class="cell-mode" data-mode="animal">${animal}</g><g class="cell-mode" data-mode="plant">${plant}</g>` });

const plateHtml = k.plateHtml({ fig:'FIG 01', title:'세포 구조', hint:'소기관을 클릭하거나 목록에서 선택', readout:'동물세포 · 핵',
  caption:'교육용 모식도입니다. 소기관의 실제 크기·수·배치는 세포 종류와 상태에 따라 달라집니다.',
  body:`<div class="cell-stage">${svg}</div>` });

const lists = Object.entries(DATA).map(([mode,entries])=>`<div class="part-list" data-list="${mode}">${Object.entries(entries).map(([key,[name]])=>`<button type="button" data-select="${key}" data-mode="${mode}">${esc(name)}</button>`).join('')}</div>`).join('');
const body = `<header class="cell-header"><div><span class="small-label">ARCADIA / CELL ATLAS</span><h1>세포 구조 탐색</h1><p>구조를 선택해 각 소기관의 역할을 살펴보세요.</p></div><span class="draft-label">독립 프로토타입</span></header>
<nav class="cell-switch" aria-label="세포 종류"><button type="button" data-switch="animal" aria-pressed="true">동물세포</button><button type="button" data-switch="plant" aria-pressed="false">식물세포</button></nav>
<div class="explorer-layout">${plateHtml}<aside class="info-panel" aria-live="polite"><span class="small-label" data-mode-label>동물세포 / NUCLEUS</span><h2 data-name>핵</h2><p class="part-role" data-role></p><p data-detail></p><div class="observation"><span>그림에서 찾기</span><p data-observe></p></div><div class="info-list-title">소기관 목록</div>${lists}</aside></div>
<p class="source-line">구조와 기능: <a href="https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells" target="_blank" rel="noopener noreferrer">OpenStax Biology 2e · Eukaryotic Cells</a></p>`;

const css = `
body.iso{--anatomy-page:#101720;--anatomy-card:#182331;--anatomy-paper:#182331;--anatomy-text:#c8d1da;--anatomy-strong:#f1f5f7;--anatomy-muted:#9baab7;--anatomy-lit:#b8dbf2;--anatomy-hi:#b6c6d0;--anatomy-mid:#758a9b;--anatomy-lo:#4d6071;--anatomy-faint:#354655;--anatomy-halo:#07111d;}
.iso-page{margin:32px auto 80px}.cell-header{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:22px}.cell-header h1{font-size:clamp(2rem,4vw,3.5rem);line-height:1.1;letter-spacing:-.04em;margin:8px 0}.cell-header p{margin:0;color:#a9b9c8}.small-label{font:700 11px/1.4 ui-monospace,monospace;letter-spacing:.14em;color:#93bce1}.draft-label{border:1px solid #4d6174;color:#b9c5d0;padding:7px 10px;font-size:12px;white-space:nowrap}.cell-switch{display:flex;gap:5px;margin:0 0 18px;border-bottom:1px solid #405366}.cell-switch button{background:transparent;border:0;color:#b8c8d5;padding:13px 24px;font:700 16px/1.3 ui-sans-serif,system-ui,sans-serif;cursor:pointer;border-bottom:3px solid transparent}.cell-switch button[aria-pressed=true]{color:#f5f8fa;border-color:#83b7e1}.cell-switch button:focus-visible,.part-list button:focus-visible,.organelle:focus-visible{outline:2px solid #a6d5f4;outline-offset:3px}.explorer-layout{display:grid;grid-template-columns:minmax(0,1.75fr) minmax(285px,.75fr);gap:20px;align-items:start}.explorer-layout .iso-figure{margin:0;min-width:0}.explorer-layout .iso-plate{background:#182331;min-height:0}.cell-stage{padding:36px 8px 27px}.cell-stage .iso-svg{width:100%;height:auto;display:block}.cell-mode{display:none}body[data-cell=animal] .cell-mode[data-mode=animal],body[data-cell=plant] .cell-mode[data-mode=plant]{display:block}.organelle{cursor:pointer;transition:filter .18s ease,opacity .18s ease}.organelle:hover,.organelle[data-selected=true]{filter:drop-shadow(0 0 8px #a8ddfa)}.info-panel{min-height:635px;padding:26px;background:#182331;border:1px solid #405366}.info-panel h2{font-size:clamp(1.7rem,3vw,2.5rem);line-height:1.2;margin:20px 0 8px;color:#f4f7f8}.part-role{font-weight:700;color:#9ec6e8}.info-panel p{line-height:1.8}.observation{border-top:1px solid #405366;border-bottom:1px solid #405366;margin:23px 0;padding:15px 0}.observation span,.info-list-title{font-size:12px;font-weight:800;color:#94b7d4}.observation p{margin:6px 0 0}.part-list{display:none;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:12px}body[data-cell=animal] .part-list[data-list=animal],body[data-cell=plant] .part-list[data-list=plant]{display:grid}.part-list button{text-align:left;background:#202e3c;border:1px solid #405366;color:#d5e0e7;min-height:35px;padding:7px 9px;cursor:pointer}.part-list button[aria-pressed=true]{border-color:#a9d9f7;background:#2c4257;color:white}.source-line{font-size:12px;color:#aebdc8;margin-top:20px}.source-line a{color:#9dc8ea}@media(max-width:900px){.explorer-layout{grid-template-columns:1fr}.info-panel{min-height:0}.cell-stage{padding:28px 2px 16px}}@media(max-width:500px){.iso-page{width:calc(100% - 22px);margin-top:20px}.cell-header{align-items:start}.draft-label{font-size:10px}.cell-stage{padding:18px 0 10px}.info-panel{padding:20px}.part-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;

const live = `
const entries=${JSON.stringify(DATA)};
const root=document.body;
const figure=document.querySelector('.cell-stage svg');
const readout=document.querySelector('[data-readout]');
let mode='animal', selected='nucleus';
function select(key){
  if(!entries[mode][key])return;
  selected=key;
  const [name,role,detail,observe]=entries[mode][key];
  document.querySelector('[data-name]').textContent=name;
  document.querySelector('[data-role]').textContent=role;
  document.querySelector('[data-detail]').textContent=detail;
  document.querySelector('[data-observe]').textContent=observe;
  document.querySelector('[data-mode-label]').textContent=(mode==='animal'?'동물세포':'식물세포')+' / '+name;
  readout.textContent=(mode==='animal'?'동물세포':'식물세포')+' · '+name;
  figure.querySelectorAll('.organelle').forEach(el=>el.dataset.selected=String(el.dataset.mode===mode&&el.dataset.key===key));
  document.querySelectorAll('[data-select]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.mode===mode&&el.dataset.select===key)));
}
function switchMode(next){
  if(!entries[next])return;
  mode=next;root.dataset.cell=next;
  document.querySelectorAll('[data-switch]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.switch===next)));
  figure.setAttribute('aria-label',(next==='animal'?'동물세포':'식물세포')+' 구조를 선택하여 탐색하는 모식도');
  select('nucleus');
}
document.querySelectorAll('[data-switch]').forEach(el=>el.addEventListener('click',()=>switchMode(el.dataset.switch)));
document.querySelectorAll('[data-select]').forEach(el=>el.addEventListener('click',()=>select(el.dataset.select)));
figure.addEventListener('click',event=>{const item=event.target.closest('.organelle');if(item&&item.dataset.mode===mode)select(item.dataset.key)});
figure.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const item=event.target.closest('.organelle');if(item&&item.dataset.mode===mode){event.preventDefault();select(item.dataset.key)}});
switchMode('animal');
`;

let html=k.pageHtml({ title:'세포 구조 탐색 | Arcadia Lab', theme:'dark', body, width:1300, script:kitScript()+live });
html=html.replace('<html lang="en">','<html lang="ko">').replace('</style>',css+'</style>').replace('<body class="iso"','<body class="iso" data-cell="animal"');
writeFileSync(join(HERE,'index.html'),html);
console.log('wrote prototypes/cell-anatomy/index.html');
