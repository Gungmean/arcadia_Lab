import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as k from './kit/iso-kit.mjs';
import * as G from './kit/lathe.mjs';
import { kitScript } from './scripts/inline-kit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const WIDTH = 900, HEIGHT = 600;
const P = k.fitProjection(k.boxCorners({ x:-165, y:-110, w:330, d:220, r:16 }, -16, 8), WIDTH, HEIGHT, { pad:40, azimuth:43, elevation:42 });
const S = (paths, tone) => k.solidSvg(paths, { tone, crease:'faint' });
const L = (path, tone='lo', free) => k.lineSvg(path, { tone, free });
const plate = { x:-165, y:-110, w:330, d:220, r:16 };

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
    phospholipid:['인지질 이중층','친수성 머리와 소수성 꼬리','인지질은 물과 닿는 친수성 머리를 바깥으로, 소수성 꼬리를 안쪽으로 향하게 배열합니다. 이중층은 세포막의 기본 골격입니다.','세포막 가장자리에 나란히 반복되는 작은 입자입니다.'],
    cytoplasm:['세포질','반응이 일어나는 공간','세포질에는 세포질액과 소기관이 포함됩니다. 여러 대사 반응이 이 공간에서 진행됩니다.','소기관 사이를 채우는 옅은 바탕입니다.'],
    nucleus:['핵','유전 정보의 보관','핵은 DNA를 담고 있습니다. 핵 안에서 전사가 일어나며, 핵막의 통로를 통해 물질이 오갑니다.','겹막과 핵공을 둘러싼 큰 원형 구조입니다.'],
    nuclearEnvelope:['핵막','핵과 세포질 사이의 이중막','핵막은 안팎의 두 막으로 이뤄지고, 바깥막은 소포체 막과 이어집니다. 핵공 복합체가 두 막을 관통합니다.','핵 가장자리의 나란한 두 겹 선을 따라가 보세요.'],
    nuclearPore:['핵공','핵과 세포질 사이의 선택적 수송','핵공 복합체는 단백질과 RNA의 출입을 조절합니다. 작은 분자는 확산할 수 있고, 큰 분자는 운반 단백질의 도움을 받습니다.','핵막 가장자리에 반복되는 작은 고리입니다.'],
    nucleolus:['인','리보솜 부품의 조립','인에서는 리보솜 RNA가 만들어지고 리보솜 소단위체가 조립됩니다. 막으로 둘러싸인 소기관은 아닙니다.','핵 안쪽의 진한 작은 원을 누르세요.'],
    chromatin:['염색질','DNA와 단백질','DNA가 히스톤 등 단백질과 결합한 상태입니다. 세포 분열 때 응축되어 염색체로 뚜렷하게 보입니다.','핵 내부의 가느다란 실 같은 무늬입니다.'],
    roughER:['거친면 소포체','분비 단백질의 합성·가공','표면에 붙은 리보솜이 분비되거나 막에 들어갈 단백질을 합성합니다. 소포체 내부에서 접힘과 초기 가공이 이어집니다.','핵 곁의 층진 막에 작은 점들이 붙어 있습니다.'],
    smoothER:['매끈면 소포체','지질 합성과 해독','리보솜이 붙지 않은 소포체 영역입니다. 지질 합성, 해독, 칼슘 이온 저장 등에 관여합니다.','작은 점이 없는 구불구불한 막 관입니다.'],
    ribosome:['리보솜','단백질 합성','mRNA의 정보를 읽어 아미노산을 연결합니다. 세포질에 자유롭게 있거나 거친면 소포체에 붙어 있습니다.','흩어진 작은 점과 소포체 표면의 점을 보세요.'],
    golgi:['골지체','분류와 포장','소포체에서 온 단백질과 지질을 변형·분류하고 목적지에 맞게 소낭으로 포장합니다.','나란히 휘어진 납작한 막 주머니입니다.'],
    mitochondrion:['미토콘드리아','세포 호흡과 ATP 생성','내막의 주름인 크리스타를 가진 이중막 소기관입니다. 세포 호흡의 여러 단계에 관여해 ATP를 만듭니다.','타원 안에 접힌 안쪽 막을 살펴보세요.'],
    cristae:['크리스타','미토콘드리아 내막의 주름','내막이 접혀 표면적을 넓힙니다. 전자 전달계와 ATP 합성효소가 내막에 있어 산화적 인산화가 일어납니다.','미토콘드리아 안쪽의 촘촘한 주름을 누르세요.'],
    lysosome:['리소좀','분해와 재활용','산성 내부의 가수분해 효소가 큰 분자와 낡은 세포 구성 요소를 분해합니다.','작고 짙은 구형 소낭입니다.'],
    peroxisome:['퍼옥시좀','산화 반응과 과산화수소 처리','일부 지방산을 분해하고 산화 반응에서 생긴 과산화수소를 카탈레이스로 처리합니다.','리소좀과 구별되는 노란 작은 소낭입니다.'],
    centrosome:['중심체','미세소관 조직','동물세포의 중심체는 미세소관을 조직합니다. 보통 서로 직각으로 놓인 중심립 한 쌍을 포함합니다.','짧은 원통 두 개가 엇갈린 곳입니다.'],
    vesicle:['수송 소낭','물질의 운반','막으로 싸인 작은 주머니가 소포체·골지체·세포막 사이에서 화물을 옮깁니다.','골지체 주변의 작은 막 구슬입니다.'],
    cytoskeleton:['세포 골격','형태 유지와 세포 내 이동','미세소관·미세섬유 등으로 이뤄진 동적인 그물입니다. 형태 유지와 세포 내 물질 이동에 관여합니다.','세포 내부를 지나는 가느다란 섬유입니다.'],
  },
  plant: {
    wall:['세포벽','지지와 보호','주로 셀룰로스로 이뤄진 단단한 층으로, 세포막 바깥에 있습니다. 세포의 모양과 기계적 지지를 제공합니다.','가장 바깥쪽의 두꺼운 사각 경계입니다.'],
    membrane:['세포막','선택적 물질 이동','세포벽 바로 안쪽의 인지질 이중층입니다. 물질 이동과 신호 인식을 조절합니다.','세포벽 안쪽의 가는 연속선입니다.'],
    phospholipid:['인지질 이중층','친수성 머리와 소수성 꼬리','인지질은 친수성 머리를 물이 있는 양쪽으로, 소수성 꼬리를 서로 마주 보게 배열합니다.','세포막 가장자리에 나란히 반복되는 작은 입자입니다.'],
    cytoplasm:['세포질','소기관이 놓이는 공간','세포질액과 소기관을 포함합니다. 큰 중앙 액포 때문에 성숙한 식물세포에서는 가장자리의 얇은 띠처럼 보이기도 합니다.','액포와 세포막 사이의 바탕을 보세요.'],
    nucleus:['핵','유전 정보의 보관','DNA가 들어 있고 유전자 발현을 조절하는 핵심 공간입니다. 핵막은 소포체와 이어집니다.','액포 옆으로 밀려난 큰 둥근 구조입니다.'],
    nuclearEnvelope:['핵막','핵과 세포질 사이의 이중막','안팎의 막이 핵을 감싸며 바깥막은 소포체와 이어집니다. 핵공 복합체가 핵과 세포질 사이의 수송을 조절합니다.','핵 가장자리의 나란한 두 겹 선을 따라가 보세요.'],
    nuclearPore:['핵공','핵과 세포질 사이의 선택적 수송','핵공 복합체는 RNA와 단백질의 출입을 조절합니다.','핵막 가장자리의 작은 고리를 찾으세요.'],
    nucleolus:['인','리보솜 소단위체 조립','리보솜 RNA와 단백질을 이용해 리보솜 소단위체를 조립합니다.','핵 안의 진한 작은 원입니다.'],
    roughER:['거친면 소포체','단백질 합성과 초기 가공','표면의 리보솜에서 분비·막 단백질을 합성합니다. 막 공간에서 단백질의 접힘과 초기 가공이 일어납니다.','핵 주변의 점이 붙은 층진 막입니다.'],
    ribosome:['리보솜','단백질 합성','자유 리보솜과 거친면 소포체에 붙은 리보솜이 모두 단백질을 만듭니다.','세포질과 막 표면의 작은 점입니다.'],
    golgi:['골지체','변형·분류·운반','단백질과 지질을 처리해 소낭으로 보냅니다. 식물세포에서는 세포벽 다당류의 합성에도 관여합니다.','겹쳐진 굽은 막 주머니입니다.'],
    mitochondrion:['미토콘드리아','ATP 생성','식물세포도 세포 호흡을 합니다. 미토콘드리아는 유기물의 에너지를 ATP 형태로 전환하는 과정에 관여합니다.','안쪽 막이 접힌 타원입니다.'],
    cristae:['크리스타','미토콘드리아 내막의 주름','내막 표면을 넓혀 전자 전달과 ATP 합성에 관여합니다. 식물세포에도 미토콘드리아가 있습니다.','미토콘드리아 내부의 접힌 선을 누르세요.'],
    chloroplast:['엽록체','광합성','엽록소가 든 틸라코이드 막에서 빛 에너지를 이용하고, 스트로마에서 탄소 고정 반응이 진행됩니다.','초록 타원 두 개를 보세요.'],
    grana:['그라나·틸라코이드','빛 반응이 일어나는 막','틸라코이드는 납작한 막 주머니이며, 여러 개가 쌓인 구조가 그라나입니다. 빛 반응의 단백질 복합체가 막에 있습니다.','엽록체 안의 짧은 원반 더미를 누르세요.'],
    stromaLamella:['스트로마 라멜라','그라나를 잇는 틸라코이드 막','스트로마 라멜라는 서로 다른 그라나를 연결하는 틸라코이드 막입니다. 틸라코이드 내부 공간은 막을 사이에 두고 스트로마와 구분됩니다.','그라나 사이를 잇는 가는 막을 따라가 보세요.'],
    cellulose:['셀룰로스 미세섬유','세포벽의 인장 강도','셀룰로스 미세섬유는 세포벽의 다당류 기질에 놓여 벽의 기계적 성질을 만듭니다. 배열 방향과 벽의 층에 따라 성장 방향이 달라질 수 있습니다.','세포벽 가장자리의 교차 섬유 무늬입니다.'],
    vacuole:['중앙 액포','저장과 팽압 유지','물·이온·색소·노폐물 등을 저장할 수 있습니다. 물이 차 팽압을 만들면 세포벽과 함께 세포 형태를 지탱합니다.','세포 중심을 크게 차지하는 연푸른 공간입니다.'],
    tonoplast:['액포막','액포와 세포질의 경계','중앙 액포를 둘러싼 막으로, 물질의 출입을 조절해 액포 내부 조성을 유지합니다.','큰 액포의 가장자리를 따라가 보세요.'],
    plasmodesmata:['원형질 연락사','이웃 세포와의 통로','인접한 식물세포의 세포질을 잇는 통로로, 물질과 신호가 세포 사이를 이동할 수 있습니다.','세포벽을 가로지르는 짧은 통로입니다.'],
    peroxisome:['퍼옥시좀','산화 반응','지방산 분해 등 산화 반응에 관여하며, 생긴 과산화수소를 처리합니다.','작은 노란 소낭입니다.'],
  }
};

const esc = value => String(value).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const part = (mode,key,markup) => `<g class="organelle" data-key="${key}" data-mode="${mode}" tabindex="0" role="button" aria-label="${esc(DATA[mode][key][0])}"><title>${esc(DATA[mode][key][0])}</title>${markup}</g>`;
const ellipseRing=(x,y,rx,ry,n=48,a=0)=>Array.from({length:n},(_,i)=>{const t=i*2*Math.PI/n;return [x+rx*Math.cos(t)*Math.cos(a)-ry*Math.sin(t)*Math.sin(a),y+rx*Math.cos(t)*Math.sin(a)+ry*Math.sin(t)*Math.cos(a)]});
const solid=(ring,z,h,tone='hi',bevel=.7)=>S(k.extrude(ring,z,h,P,{convex:true,bevel}),tone);
const oval=(x,y,rx,ry,z,h,tone='hi',a=0)=>solid(ellipseRing(x,y,rx,ry,48,a),z,h,tone);
const ball=(x,y,z,r,tone='mid')=>S(G.sphereOf([x,y,z],r,P,{steps:r<=3?14:24}),tone);
// These isolated strands encode open-ended fibres and internal folds, rather than loose construction strokes.
const topLine=(pts,z,tone='lo')=>L(k.onTop(pts,z,P),tone,'both');
const closedEllipse=(x,y,rx,ry,z,tone='mid',steps=56)=>L(k.onTop(ellipseRing(x,y,rx,ry,steps),z,P,true),tone);
const ribbon=(x,y,length,z,phase=0)=>{const edge=Array.from({length:13},(_,i)=>{const t=i/12;return [x-length/2+length*t,y+Math.sin(t*2*Math.PI+phase)*4]});return [...edge.map(([a,b])=>[a,b-2.2]),...edge.slice().reverse().map(([a,b])=>[a,b+2.2])];};
const membraneCell=(mode)=>part(mode,'membrane',solid(ellipseRing(0,0,143,86,64),0,8,'mid',1.1)+solid(ellipseRing(0,0,136,79,64),8,1,'hi',0));
const phospholipidLayer=(mode)=>{const points=mode==='animal'?Array.from({length:36},(_,i)=>{const t=i*2*Math.PI/36;return [140*Math.cos(t),83*Math.sin(t),8.7]}):[
  ...Array.from({length:14},(_,i)=>[-122+i*18,-73,14.8]),...Array.from({length:14},(_,i)=>[122-i*18,73,14.8]),
  ...Array.from({length:4},(_,i)=>[-128,-48+i*32,14.8]),...Array.from({length:4},(_,i)=>[128,48-i*32,14.8])];
  return part(mode,'phospholipid',points.map(([x,y,z])=>ball(x,y,z,1.35,'hi')+ball(x*.985,y*.985,z-.6,1.05,'mid')).join(''));
};
const nuclearEnvelope=(mode,x,y,rx,ry,z)=>part(mode,'nuclearEnvelope',closedEllipse(x,y,rx,ry,z,'hi')+closedEllipse(x,y,rx-2.2,ry-2,z-.7,'mid'));
const nuclearPores=(mode,x,y,rx,ry,z,count=16)=>part(mode,'nuclearPore',Array.from({length:count},(_,i)=>{const t=i*2*Math.PI/count,px=x+rx*Math.cos(t),py=y+ry*Math.sin(t);return ball(px,py,z,2.7,'hi')+ball(px,py,z+.7,1.15,'lo')}).join(''));

const animal = [
  membraneCell('animal'),
  phospholipidLayer('animal'),
  part('animal','cytoplasm',solid(ellipseRing(0,0,133,76,64),8.2,.8,'hi',0)),
  part('animal','cytoskeleton',[-1,0,1].map(i=>topLine([[-115,-28+i*24],[-46,-15+i*19],[28,17+i*13],[110,36+i*7]],9,'faint')).join('')),
  part('animal','roughER',Array.from({length:6},(_,i)=>solid(ribbon(-60,-22+i*8,64,9, i*.6),9,2,'mid',.2)+Array.from({length:9},(_,j)=>ball(-88+j*7,-22+i*8+Math.sin(j*.5+i)*3,12,1.35,'lo')).join('')).join('')),
  part('animal','smoothER',Array.from({length:4},(_,i)=>solid(ribbon(65,-47+i*10,54,9,i*.7),9,2,'hi',.2)).join('')),
  part('animal','nucleus',oval(-7,0,37,31,9,18,'hi')+closedEllipse(-7,0,28,23,27,'faint')),
  nuclearEnvelope('animal',-7,0,37,31,27),
  nuclearPores('animal',-7,0,35,29,27.5,18),
  part('animal','chromatin',[-1,0,1].map(i=>topLine([[-34,-7+i*12],[-15,-14+i*10],[4,5+i*8],[27,1+i*10]],27,'mid')).join('')),
  part('animal','nucleolus',ball(4,3,30,8,'mid')),
  part('animal','mitochondrion',[[-91,48,-.4],[80,40,.35]].map(([x,y,a])=>oval(x,y,28,14,9,7,'mid',a)+oval(x,y,24,10,16,1,'hi',a)).join('')),
  part('animal','cristae',[[-91,48],[80,40]].map(([x,y])=>Array.from({length:8},(_,i)=>{const yy=y-6+i*1.7;return topLine([[x-19,yy],[x-12,yy-2],[x-5,yy+2],[x+2,yy-2],[x+9,yy+2],[x+18,yy]],17,'lo')}).join('')).join('')),
  part('animal','golgi',Array.from({length:6},(_,i)=>solid(ribbon(67,4+i*5,38,9,i*.1),9+i*1.5,2,'hi',.2)).join('')),
  part('animal','lysosome',[[-47,53],[43,-53],[112,4]].map(([x,y])=>ball(x,y,14,5,'mid')).join('')),
  part('animal','peroxisome',ball(-106,-54,14,5,'hi')),
  part('animal','centrosome',oval(42,55,15,5,10,5,'mid',.55)+oval(45,56,5,15,15,4,'hi',-.8)+Array.from({length:8},(_,i)=>topLine([[45,56],[45+Math.cos(i*Math.PI/4)*17,56+Math.sin(i*Math.PI/4)*17]],10,'faint')).join('')),
  part('animal','vesicle',[[18,-56],[26,-47],[34,-57],[42,-47]].map(([x,y])=>ball(x,y,14,3.5,'hi')).join('')),
  part('animal','ribosome',Array.from({length:12},(_,i)=>ball(-116+(i*37)%232,-61+((i*23)%116),12,1.4,'lo')).join('')),
].join('');

const plant = [
  part('plant','wall',S(k.slabOf({x:-145,y:-91,w:290,d:182,r:14},0,14,P,8,1.2),'mid')+L(k.planOutline(k.insetPlan({x:-145,y:-91,w:290,d:182,r:14},5),14,P),'lo')),
  part('plant','membrane',S(k.slabOf({x:-135,y:-81,w:270,d:162,r:10},14,1.3,P,8,.35),'hi')),
  phospholipidLayer('plant'),
  part('plant','cytoplasm',S(k.slabOf({x:-129,y:-75,w:258,d:150,r:8},15.3,.8,P,8,0),'hi')),
  part('plant','vacuole',S(k.slabOf({x:-43,y:-54,w:108,d:108,r:18},16.1,5,P,8,.9),'hi')),
  part('plant','tonoplast',L(k.planOutline(k.insetPlan({x:-43,y:-54,w:108,d:108,r:18},5),21.1,P),'mid')),
  part('plant','nucleus',oval(-82,2,27,23,17,15,'hi')+closedEllipse(-82,2,20,16,32,'faint')),
  nuclearEnvelope('plant',-82,2,27,23,32),
  nuclearPores('plant',-82,2,25,21,32.5,14),
  part('plant','nucleolus',ball(-77,3,34,6,'mid')),
  part('plant','roughER',Array.from({length:5},(_,i)=>solid(ribbon(-48,-5+i*7,43,17,i*.6),16,2,'mid',.2)+Array.from({length:8},(_,j)=>ball(-70+j*6,-5+i*7,19,1.25,'lo')).join('')).join('')),
  part('plant','chloroplast',[[91,-48,-.3],[97,55,.2],[-91,55,-.2]].map(([x,y,a])=>oval(x,y,25,12,17,7,'hi',a)).join('')),
  part('plant','grana',[[91,-48],[97,55],[-91,55]].map(([x,y])=>[x-7,x+7].map(cx=>Array.from({length:5},(_,i)=>oval(cx,y-4+i*1.8,6.5,1.3,24+i*.45,.65,'mid')).join('')).join('')).join('')),
  part('plant','stromaLamella',[[91,-48],[97,55],[-91,55]].map(([x,y])=>Array.from({length:3},(_,i)=>topLine([[x-4,y-2+i*2],[x+4,y-2+i*2]],24,'lo')).join('')).join('')),
  part('plant','cellulose',[
    ...Array.from({length:7},(_,i)=>topLine([[-137+i*3.5,-74],[-132+i*3.5,-57]],13.8,'mid')),
    ...Array.from({length:7},(_,i)=>topLine([[-137+i*3.5,74],[-132+i*3.5,57]],13.8,'mid')),
    ...Array.from({length:5},(_,i)=>topLine([[-137,-66+i*6],[ -120,-63+i*6]],13.8,'lo')),
    ...Array.from({length:5},(_,i)=>topLine([[137,-66+i*6],[120,-63+i*6]],13.8,'lo')),
  ].join('')),
  part('plant','mitochondrion',oval(38,56,21,10,17,6,'mid')+Array.from({length:5},(_,i)=>topLine([[25+i*6,51],[27+i*6,56],[25+i*6,61]],23,'lo')).join('')),
  part('plant','golgi',Array.from({length:5},(_,i)=>solid(ribbon(63,1+i*4,29,17,i*.1),16+i*1.5,2,'hi',.2)).join('')),
  part('plant','plasmodesmata',[-48,0,48].map(y=>solid([[-149,y-2],[-136,y-2],[-136,y+2],[-149,y+2]],14,8,'hi',.2)).join('')),
  part('plant','peroxisome',ball(38,-58,21,5,'mid')),
  part('plant','ribosome',Array.from({length:10},(_,i)=>ball(-119+(i*47)%238,-66+((i*31)%126),18,1.2,'lo')).join('')),
].join('');

const svg = k.figureSvg({ width:WIDTH, height:HEIGHT,
  label:'동물세포와 식물세포의 구조를 선택하여 탐색하는 모식도',
  body:`<defs><filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="13"/></filter></defs>
    <g opacity=".55">${stageParts}</g>
    <g class="cell-mode" data-mode="animal">${animal}</g><g class="cell-mode" data-mode="plant">${plant}</g>` });

const plateHtml = k.plateHtml({ fig:'FIG 01', title:'세포 구조', hint:'소기관을 클릭하거나 목록에서 선택', readout:'동물세포 · 핵',
  caption:'교육용 모식도입니다. 소기관의 실제 크기·수·배치는 세포 종류와 상태에 따라 달라집니다.',
  body:`<div class="cell-stage">${svg}</div>` });

const lists = Object.entries(DATA).map(([mode,entries])=>`<div class="part-list" data-list="${mode}">${Object.entries(entries).map(([key,[name]])=>`<button type="button" data-select="${key}" data-mode="${mode}">${esc(name)}</button>`).join('')}</div>`).join('');
const body = `<header class="cell-header"><div><span class="small-label">ARCADIA / CELL ATLAS</span><h1>세포 구조 탐색</h1><p>구조를 선택해 각 소기관의 역할을 살펴보세요.</p></div><span class="draft-label">독립 프로토타입</span></header>
<nav class="cell-switch" aria-label="세포 종류"><button type="button" data-switch="animal" aria-pressed="true">동물세포</button><button type="button" data-switch="plant" aria-pressed="false">식물세포</button></nav>
<div class="explorer-layout">${plateHtml}<aside class="info-panel" aria-live="polite"><span class="small-label" data-mode-label>동물세포 / NUCLEUS</span><h2 data-name>핵</h2><p class="part-role" data-role></p><p data-detail></p><div class="observation"><span>그림에서 찾기</span><p data-observe></p></div><section class="organ-detail"><div class="organ-detail-head"><span>선택 구조 확대</span><span data-zoom-name>핵</span></div><svg class="organ-zoom" data-organ-zoom viewBox="0 0 160 100" role="img" aria-label="핵 확대 그림"><rect class="zoom-back" x="0" y="0" width="160" height="100" rx="4"/><g data-zoom-slot></g></svg><p>그림과 목록에서 다른 구조를 고르면 확대 그림도 바뀝니다.</p></section><div class="info-list-title">소기관 목록</div>${lists}</aside></div>
<p class="source-line">구조와 기능: <a href="https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells" target="_blank" rel="noopener noreferrer">OpenStax Biology 2e · Eukaryotic Cells</a></p>`;

const css = `
body.iso{--anatomy-page:#101720;--anatomy-card:#182331;--anatomy-paper:#314457;--anatomy-face:#3b5267;--anatomy-top:#40596e;--anatomy-shade-0:#111a24;--anatomy-shade-1:#1b2936;--anatomy-shade-2:#293b4c;--anatomy-shade-3:#344a5e;--anatomy-lit-top:#d9e9f0;--anatomy-lit-shade:#526b7e;--anatomy-text:#c8d1da;--anatomy-strong:#f1f5f7;--anatomy-muted:#9baab7;--anatomy-lit:#d9e9f0;--anatomy-hi:#c5d3da;--anatomy-mid:#8fa4b2;--anatomy-lo:#607889;--anatomy-faint:#40566a;--anatomy-halo:#07111d;--anatomy-halo-opacity:.2;}
.cell-mode .organelle{--anatomy-paper:#8195a2;--anatomy-face:#a7bbc4;--anatomy-top:#b7c9cf;--anatomy-shade-0:#40515e;--anatomy-shade-1:#5a6d79;--anatomy-shade-2:#718590;--anatomy-shade-3:#91a4ad;--anatomy-lit-top:#e2edf0;--anatomy-lit-shade:#9eb3bd;--anatomy-hi:#d7e4e7;--anatomy-mid:#8199a7;--anatomy-lo:#405665;--anatomy-faint:#607986;}
.cell-mode .organelle[data-key="membrane"],.cell-mode .organelle[data-key="wall"]{--anatomy-paper:#819aa2;--anatomy-top:#b3c9c9;--anatomy-shade-0:#3d5963;--anatomy-shade-1:#58717a;--anatomy-shade-2:#718a91;--anatomy-shade-3:#96aaad;}
.cell-mode .organelle[data-key="cytoplasm"]{--anatomy-paper:#82918c;--anatomy-top:#b6c2b6;--anatomy-shade-0:#45564f;--anatomy-shade-1:#5c6e65;--anatomy-shade-2:#72847a;--anatomy-shade-3:#93a198;}
.cell-mode .organelle[data-key="nucleus"],.cell-mode .organelle[data-key="chromatin"],.cell-mode .organelle[data-key="nucleolus"]{--anatomy-paper:#71869a;--anatomy-top:#a8bfd0;--anatomy-shade-0:#354b61;--anatomy-shade-1:#4a6278;--anatomy-shade-2:#61798e;--anatomy-shade-3:#859aa9;}
.cell-mode .organelle[data-key="roughER"],.cell-mode .organelle[data-key="smoothER"],.cell-mode .organelle[data-key="golgi"]{--anatomy-paper:#9a8c79;--anatomy-top:#c4b69f;--anatomy-shade-0:#5b4e43;--anatomy-shade-1:#746758;--anatomy-shade-2:#897b69;--anatomy-shade-3:#ac9d88;}
.cell-mode .organelle[data-key="mitochondrion"],.cell-mode .organelle[data-key="chloroplast"],.cell-mode .organelle[data-key="grana"]{--anatomy-paper:#78947c;--anatomy-top:#b4c5a6;--anatomy-shade-0:#3d5746;--anatomy-shade-1:#526e58;--anatomy-shade-2:#68836d;--anatomy-shade-3:#8ba28a;}
.cell-mode .organelle[data-key="vacuole"],.cell-mode .organelle[data-key="tonoplast"]{--anatomy-paper:#688d9a;--anatomy-top:#a7c5ce;--anatomy-shade-0:#2d4c59;--anatomy-shade-1:#436573;--anatomy-shade-2:#577a87;--anatomy-shade-3:#7899a1;}
.cell-mode .organelle[data-key="lysosome"],.cell-mode .organelle[data-key="peroxisome"],.cell-mode .organelle[data-key="vesicle"]{--anatomy-paper:#a38c72;--anatomy-top:#d0b994;--anatomy-shade-0:#5e4e3e;--anatomy-shade-1:#78664f;--anatomy-shade-2:#927b60;--anatomy-shade-3:#b29b7a;}
.organ-detail{border-bottom:1px solid #405366;margin:16px 0 20px;padding:0 0 16px}.organ-detail-head{display:flex;justify-content:space-between;gap:12px;margin:0 0 9px;color:#94b7d4;font-size:12px;font-weight:800}.organ-detail-head span:last-child{color:#c8d1da;font-weight:500}.organ-zoom{width:100%;height:150px;display:block;border:1px solid #405366;background:#111a24}.organ-zoom .zoom-back{fill:#111a24}.organ-zoom .zoom-organelle{pointer-events:none}.organ-detail>p{font-size:11px;color:#9baab7;margin:7px 0 0;line-height:1.5}.info-panel h2,.info-panel p{word-break:keep-all}
.iso-page{margin:32px auto 80px}.cell-header{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:22px}.cell-header h1{font-size:clamp(2rem,4vw,3.5rem);line-height:1.1;letter-spacing:-.04em;margin:8px 0}.cell-header p{margin:0;color:#a9b9c8}.small-label{font:700 11px/1.4 ui-monospace,monospace;letter-spacing:.14em;color:#93bce1}.draft-label{border:1px solid #4d6174;color:#b9c5d0;padding:7px 10px;font-size:12px;white-space:nowrap}.cell-switch{display:flex;gap:5px;margin:0 0 18px;border-bottom:1px solid #405366}.cell-switch button{background:transparent;border:0;color:#b8c8d5;padding:13px 24px;font:700 16px/1.3 ui-sans-serif,system-ui,sans-serif;cursor:pointer;border-bottom:3px solid transparent}.cell-switch button[aria-pressed=true]{color:#f5f8fa;border-color:#83b7e1}.cell-switch button:focus-visible,.part-list button:focus-visible,.organelle:focus-visible{outline:2px solid #a6d5f4;outline-offset:3px}.explorer-layout{display:grid;grid-template-columns:minmax(0,1.75fr) minmax(285px,.75fr);gap:20px;align-items:start}.explorer-layout .iso-figure{margin:0;min-width:0}.explorer-layout .iso-plate{background:#182331;min-height:0}.cell-stage{padding:36px 8px 27px}.cell-stage .iso-svg{width:100%;height:auto;display:block}.cell-mode{display:none}body[data-cell=animal] .cell-mode[data-mode=animal],body[data-cell=plant] .cell-mode[data-mode=plant]{display:block}.organelle{cursor:pointer;transition:filter .18s ease,opacity .18s ease}.organelle:hover,.organelle[data-selected=true]{filter:drop-shadow(0 0 8px #a8ddfa)}.info-panel{min-height:635px;padding:26px;background:#182331;border:1px solid #405366}.info-panel h2{font-size:clamp(1.7rem,3vw,2.5rem);line-height:1.2;margin:20px 0 8px;color:#f4f7f8}.part-role{font-weight:700;color:#9ec6e8}.info-panel p{line-height:1.8}.observation{border-top:1px solid #405366;border-bottom:1px solid #405366;margin:23px 0;padding:15px 0}.observation span,.info-list-title{font-size:12px;font-weight:800;color:#94b7d4}.observation p{margin:6px 0 0}.part-list{display:none;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:12px}body[data-cell=animal] .part-list[data-list=animal],body[data-cell=plant] .part-list[data-list=plant]{display:grid}.part-list button{text-align:left;background:#202e3c;border:1px solid #405366;color:#d5e0e7;min-height:35px;padding:7px 9px;cursor:pointer}.part-list button[aria-pressed=true]{border-color:#a9d9f7;background:#2c4257;color:white}.source-line{font-size:12px;color:#aebdc8;margin-top:20px}.source-line a{color:#9dc8ea}@media(max-width:900px){.explorer-layout{grid-template-columns:1fr}.info-panel{min-height:0}.cell-stage{padding:28px 2px 16px}}@media(max-width:500px){.iso-page{width:calc(100% - 22px);margin-top:20px}.cell-header{align-items:start}.draft-label{font-size:10px}.cell-stage{padding:18px 0 10px}.info-panel{padding:20px}.part-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;

const live = `
const entries=${JSON.stringify(DATA)};
const root=document.body;
const figure=document.querySelector('.cell-stage svg');
const zoom=document.querySelector('[data-organ-zoom]');
const zoomSlot=zoom.querySelector('[data-zoom-slot]');
const readout=document.querySelector('[data-readout]');
let mode='animal', selected='nucleus';
function updateZoom(key){
  const source=figure.querySelector('.organelle[data-mode="'+mode+'"][data-key="'+key+'"]');
  if(!source)return;
  const box=source.getBBox(),pad=Math.max(5,Math.max(box.width,box.height)*.2);
  zoom.setAttribute('viewBox',[box.x-pad,box.y-pad,Math.max(1,box.width+pad*2),Math.max(1,box.height+pad*2)].join(' '));
  zoom.setAttribute('aria-label',entries[mode][key][0]+' 확대 그림');
  document.querySelector('[data-zoom-name]').textContent=entries[mode][key][0];
  const copy=source.cloneNode(true);copy.classList.add('zoom-organelle');copy.dataset.selected='true';copy.removeAttribute('tabindex');copy.removeAttribute('role');
  for(const prop of ['--anatomy-paper','--anatomy-face','--anatomy-top','--anatomy-shade-0','--anatomy-shade-1','--anatomy-shade-2','--anatomy-shade-3','--anatomy-lit-top','--anatomy-lit-shade','--anatomy-hi','--anatomy-mid','--anatomy-lo','--anatomy-faint'])copy.style.setProperty(prop,getComputedStyle(source).getPropertyValue(prop));
  zoomSlot.replaceChildren(copy);
}
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
  updateZoom(key);
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
figure.addEventListener('click',event=>{const parts=[...new Set(document.elementsFromPoint(event.clientX,event.clientY).map(node=>node.closest?.('.organelle')).filter(el=>el&&el.dataset.mode===mode))];parts.sort((a,b)=>{const A=a.getBBox(),B=b.getBBox();return A.width*A.height-B.width*B.height});if(parts[0])select(parts[0].dataset.key)});
figure.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const item=event.target.closest('.organelle');if(item&&item.dataset.mode===mode){event.preventDefault();select(item.dataset.key)}});
switchMode('animal');
`;

let html=k.pageHtml({ title:'세포 구조 탐색 | Arcadia Lab', theme:'dark', body, width:1300, script:kitScript()+live });
html=html.replace('<html lang="en">','<html lang="ko">').replace('</style>',css+'</style>').replace('<body class="iso"','<body class="iso" data-cell="animal"');
writeFileSync(join(HERE,'index.html'),html);
console.log('wrote prototypes/cell-anatomy/index.html');
