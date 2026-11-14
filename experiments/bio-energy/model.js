/** Educational steady-state model. Rates are illustrative, not experimental fits. */
export const DEFAULTS = Object.freeze({temperature:30, substrate:75, oxygen:80, light:70, co2:65});
export const MODEL_NOTE = '교육용 정성 모형 · 공급량은 상대값입니다. 속도는 실측값이 아니며, 효소량·pH·세포 종류·기공·광호흡·시간에 따른 저장량 변화는 생략합니다. 온도 최적값은 이 모형의 가정으로, 모든 생물에 적용되지 않습니다.';

const glycolysis = {
  name:'해당 과정', location:'세포질',
  description:'포도당 1개(6C)를 피루브산 2개(각 3C)로 나눕니다. ATP 2개를 먼저 쓰고 4개를 만들어 순수하게 2개를 얻습니다.',
  inputs:['포도당 1','NAD⁺ 2','ADP + Pi'],
  outputs:['피루브산 2','NADH 2','순 ATP 2'],
  why:'산소를 직접 쓰지 않습니다. NAD⁺가 계속 재생되어야 이 과정도 계속됩니다.'
};
export const PROCESSES = {
  respiration:{
    title:'세포호흡', subtitle:'포도당의 에너지를 ATP로', location:'세포질 · 미토콘드리아',
    equation:'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 에너지',
    controls:['temperature','substrate','oxygen'],
    stages:[glycolysis, {
      name:'피루브산 산화', location:'미토콘드리아 기질',
      description:'피루브산 2개를 아세틸 CoA 2개로 바꾸며, 탄소 2개를 CO₂로 내보냅니다.',
      inputs:['피루브산 2','CoA 2','NAD⁺ 2'], outputs:['아세틸 CoA 2','CO₂ 2','NADH 2'],
      why:'해당 과정의 산물을 TCA 회로에 연결합니다. 이 단계에서 ATP를 직접 만들지는 않습니다.'
    }, {
      name:'TCA 회로', location:'미토콘드리아 기질',
      description:'포도당 1개에서 온 아세틸 CoA 2개가 회로를 두 번 돌아, 나머지 탄소 4개를 CO₂로 내보냅니다.',
      inputs:['아세틸 CoA 2','NAD⁺ 6','FAD 2'], outputs:['CO₂ 4','NADH 6 · FADH₂ 2','ATP 환산량 2'],
      why:'ATP보다 전자 운반체를 많이 만듭니다. 산소를 직접 소비하지 않지만 전자전달계의 재산화에 의존합니다.'
    }, {
      name:'산화적 인산화', location:'미토콘드리아 내막',
      description:'전자가 전달되며 H⁺가 막 사이 공간에 쌓입니다. H⁺가 ATP 합성효소로 기질에 돌아올 때 ATP가 만들어집니다.',
      inputs:['NADH · FADH₂','O₂','ADP + Pi'], outputs:['ATP 약 26–28','H₂O','NAD⁺ · FAD'],
      why:'산소는 최종 전자 수용체입니다. 전체 수율은 포도당 1개당 보통 약 30–32 ATP이며 세포와 조건에 따라 달라집니다.'
    }]
  },
  photosynthesis:{
    title:'광합성', subtitle:'빛을 받아 탄소를 유기물로', location:'엽록체 · 틸라코이드와 스트로마',
    equation:'6CO₂ + 6H₂O + 빛 에너지 → C₆H₁₂O₆ + 6O₂',
    controls:['temperature','light','co2'],
    stages:[{
      name:'명반응', location:'틸라코이드 막',
      description:'빛으로 전자를 들뜨게 하고 물에서 전자를 보충하며 O₂를 방출합니다. H⁺ 기울기를 이용해 ATP를 만들고 NADPH도 얻습니다.',
      inputs:['빛','H₂O','NADP⁺ · ADP + Pi'], outputs:['O₂','ATP','NADPH'],
      why:'방출되는 산소는 CO₂가 아니라 물에서 옵니다. 만든 ATP와 NADPH는 탄소 동화에 공급됩니다.'
    }, {
      name:'캘빈 회로', location:'스트로마',
      description:'CO₂를 고정한 뒤 환원하고 RuBP를 재생합니다. CO₂ 3개당 순 G3P 1개를 내보내며 ATP 9개와 NADPH 6개를 씁니다.',
      inputs:['CO₂ 3','ATP 9','NADPH 6'], outputs:['순 G3P 1','ADP · Pi','NADP⁺'],
      why:'빛을 직접 쓰지 않지만 명반응 산물과 빛에 의한 조절에 의존합니다. G3P 두 개가 포도당 한 개에 해당하는 탄소를 공급합니다.'
    }]
  },
  alcohol:{
    title:'알코올 발효', subtitle:'NAD⁺를 재생하는 효모의 경로', location:'세포질',
    equation:'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ + 에너지',
    controls:['temperature','substrate'],
    stages:[glycolysis, {
      name:'탈탄산', location:'세포질',
      description:'피루브산 2개에서 CO₂ 2개가 떨어져 나가 아세트알데하이드 2개가 됩니다.',
      inputs:['피루브산 2'], outputs:['아세트알데하이드 2','CO₂ 2'],
      why:'효모가 빵 반죽을 부풀리는 기체는 이 단계의 CO₂입니다.'
    }, {
      name:'NAD⁺ 재생', location:'세포질',
      description:'NADH가 아세트알데하이드에 전자를 주어 에탄올을 만들고 NAD⁺로 돌아갑니다.',
      inputs:['아세트알데하이드 2','NADH 2'], outputs:['에탄올 2','NAD⁺ 2'],
      why:'이 환원 단계는 ATP를 더 만들지 않습니다. 전체 순 ATP 2개는 해당 과정에서 얻습니다.'
    }]
  },
  lactate:{
    title:'젖산 발효', subtitle:'피루브산을 환원해 해당을 계속', location:'세포질',
    equation:'포도당 1 → 젖산염 2 + 에너지',
    controls:['temperature','substrate'],
    stages:[glycolysis, {
      name:'피루브산 환원', location:'세포질',
      description:'NADH가 피루브산에 전자를 주어 젖산염을 만듭니다. 탄소 6개가 두 3탄소 분자에 남아 CO₂는 나오지 않습니다.',
      inputs:['피루브산 2','NADH 2'], outputs:['젖산염 2','NAD⁺ 2'],
      why:'재생한 NAD⁺ 덕분에 해당 과정이 이어집니다. 발효 환원 단계의 추가 ATP는 0이며 전체 순수율은 2 ATP입니다.'
    }]
  }
};

export const SOURCES = [
  {title:'OpenStax Biology 2e · 해당 과정',url:'https://openstax.org/books/biology-2e/pages/7-2-glycolysis'},
  {title:'OpenStax Biology 2e · 피루브산 산화와 TCA',url:'https://openstax.org/books/biology-2e/pages/7-3-oxidation-of-pyruvate-and-the-citric-acid-cycle'},
  {title:'OpenStax Biology 2e · 산화적 인산화',url:'https://openstax.org/books/biology-2e/pages/7-4-oxidative-phosphorylation'},
  {title:'OpenStax Biology 2e · 발효',url:'https://openstax.org/books/biology-2e/pages/7-5-metabolism-without-oxygen'},
  {title:'OpenStax Biology 2e · 명반응',url:'https://openstax.org/books/biology-2e/pages/8-2-the-light-dependent-reactions-of-photosynthesis'},
  {title:'OpenStax Biology 2e · 캘빈 회로',url:'https://openstax.org/books/biology-2e/pages/8-3-using-light-energy-to-make-organic-molecules'}
];
export const QUIZ = [
  {question:'산소 공급을 0으로 줄이면 호기성 호흡의 전자전달계는 어떻게 될까요?', options:['더 빨라진다','지속할 수 없다','ATP 수율이 두 배가 된다'],answer:1,explanation:'산소가 최종 전자를 받아 물이 되어야 전자 흐름이 지속됩니다. 해당 과정은 발효 등으로 NAD⁺를 재생하면 계속될 수 있습니다.'},
  {question:'광합성에서 밖으로 방출되는 O₂의 산소 원자는 어디에서 올까요?',options:['이산화 탄소','포도당','물'],answer:2,explanation:'광계 II에서 물이 산화되며 전자와 H⁺, 산소가 생깁니다.'},
  {question:'발효가 해당 과정을 계속하게 하는 핵심은 무엇일까요?',options:['NAD⁺ 재생','산소 생산','TCA 회로 가속'],answer:0,explanation:'NADH를 NAD⁺로 되돌려 해당 과정에 필요한 전자 수용체를 보충합니다. ATP 2개는 해당 과정의 순생산량입니다.'},
  {question:'빛을 끄면 캘빈 회로가 무한히 계속될까요?',options:['그렇다. 암반응이므로 밤에만 작동한다','아니다. ATP와 NADPH 공급 및 조절에 의존한다','그렇다. CO₂가 ATP를 대신한다'],answer:1,explanation:'빛을 직접 사용하지 않는다는 뜻이지 빛과 무관하다는 뜻은 아닙니다. 이 모형은 저장된 ATP·NADPH를 생략하므로 빛 0에서 정상상태 탄소 동화 속도를 0으로 둡니다.'}
];

const clamp=(value,lo,hi)=>Math.min(hi,Math.max(lo,value));
function supply(value) {const x=value/100; return 1.2*x/(.2+x);}
function thermal(t,optimum) {
  // A reversible illustrative curve, not a universal denaturation temperature.
  return Math.exp(-Math.pow((t-optimum)/(t<=optimum?23:14),2));
}

export function evaluate(processId, conditions={}) {
  const process=PROCESSES[processId];
  if (!process) throw new RangeError(`Unknown process: ${processId}`);
  const c={};
  for (const [key,value] of Object.entries(DEFAULTS)) {
    const supplied=Number(conditions[key] ?? value);
    c[key]=clamp(Number.isFinite(supplied)?supplied:value,key==='temperature'?0:0,key==='temperature'?60:100);
  }
  const factors=[{key:'temperature',label:'온도',value:thermal(c.temperature,processId==='photosynthesis'?27:processId==='lactate'?37:30)}];
  for (const key of process.controls.filter(key=>key!=='temperature')) factors.push({key,label:{substrate:'포도당 공급',oxygen:'산소 공급',light:'빛 세기',co2:'CO₂ 공급'}[key],value:supply(c[key])});
  // Supplies act as a bottleneck. Temperature scales enzyme activity separately.
  const supplies=factors.slice(1);
  const bottleneck=Math.min(...supplies.map(f=>f.value));
  const rate=clamp(factors[0].value*bottleneck,0,1);
  const limitingFactor=[...factors].sort((a,b)=>a.value-b.value)[0];
  let note=MODEL_NOTE;
  if(processId==='respiration') note+=' 산소 0에서는 호기성 전체 경로의 지속 속도를 0으로 둡니다. 해당 과정 자체가 산소를 쓰는 것은 아닙니다. ATP 수율은 완전 산화된 포도당 기준으로, 속도와 별개입니다.';
  else if(processId==='photosynthesis') note+=' 정상상태의 탄소 동화 속도입니다. 빛을 끈 직후의 일시적 반응이나 식물의 호흡은 생략합니다. 총괄식은 단순화한 식이며 직접 산물은 G3P입니다.';
  else note+=' 발효 경로를 선택해 고정한 비교입니다. 산소에 따른 경로 전환은 생물마다 달라 자동 전환하지 않습니다. 생리적 pH에서는 대부분 젖산염 형태입니다.';
  const atp=processId==='respiration'?32:processId==='photosynthesis'?0:2;
  const atpLabel=processId==='respiration'?'약 30–32':processId==='photosynthesis'?'내부 소비':'2';
  const metrics=processId==='photosynthesis' ? [
    {label:'탄소 동화 속도',value:Math.round(rate*100),unit:'% (상대)'},
    {label:'G3P 1개에 필요한 CO₂',value:3,unit:'개'},
    {label:'G3P 1개에 소비하는 ATP',value:9,unit:'개'}
  ] : [
    {label:'경로 진행 속도',value:Math.round(rate*100),unit:'% (상대)'},
    {label:'포도당 1개당 순 ATP',value:atpLabel,unit:'개'},
    {label:'포도당 1개당 CO₂',value:processId==='respiration'?6:processId==='alcohol'?2:0,unit:'개'}
  ];
  return {rate,atp,atpLabel,status:rate===0?'공급 중단':rate<.25?'느리게 진행':rate<.65?'진행 중':'활발하게 진행',limiting:limitingFactor.label,metrics,note};
}
