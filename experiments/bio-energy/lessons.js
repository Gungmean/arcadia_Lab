// Amounts are per stated basis. Cumulative is historical production, not a live pool.
const item=(label,amount,note='')=>({label,amount:String(amount),note});
const scene=(title,narration,equation,outputs,kind)=>({title,narration,equation,outputs,kind});
const glycolysis={
 basis:'포도당 1개 기준 · 세포질',summary:'ATP 2개 투자 후 4개 회수: 순 ATP 2개, NADH 2개, 피루브산 2개를 얻습니다.',
 products:[item('피루브산',2,'각 3탄소'),item('순 ATP',2,'4 생성 − 2 소비'),item('NADH',2)],
 cumulative:[item('순 ATP',2),item('지금까지 생성한 NADH',2,'전자 운반체로 보관'),item('탄소',6,'피루브산 2 × 3C')],
 ledger:{atp:2,nadh:2,fadh2:0,co2:0},carbonBalance:{input:6,output:6},
 scenes:[
  scene('먼저 ATP 2개를 투자','포도당을 인산화하고 재배열해 과당 1,6-이인산을 만듭니다. ATP 두 분자의 인산기가 당으로 옮겨가며 ATP는 ADP가 됩니다. 아직 ATP 순생산은 −2입니다.','포도당 + 2 ATP → 과당 1,6-이인산 + 2 ADP (개략식)',[item('과당 1,6-이인산',1,'6C'),item('ADP',2,'ATP 2 소비')],'investment'),
  scene('6탄소를 3탄소 둘로 분할','6탄소 당이 G3P와 DHAP로 갈라집니다. DHAP도 G3P로 바뀌므로 이후 반응은 포도당 한 개당 두 번씩 일어납니다.','과당 1,6-이인산 → G3P + DHAP → 2 G3P',[item('G3P',2,'각 3C')],'split'),
  scene('산화하며 NADH 2개 생성','G3P 두 개가 산화되고 NAD⁺ 두 개가 전자를 받아 NADH가 됩니다. ATP가 아니라 무기 인산(Pi)을 붙여 1,3-이인산글리세르산을 만듭니다.','2 G3P + 2 Pi + 2 NAD⁺ → 2 1,3-BPG + 2 NADH + 2 H⁺',[item('1,3-BPG',2),item('NADH',2,'이 단계에서 생성')],'oxidation'),
  scene('ATP 4개를 회수','두 3탄소 분자 각각에서 1,3-BPG와 PEP의 인산기가 ADP로 직접 전달됩니다. ATP 총 4개를 만들지만 앞서 쓴 2개를 빼면 순수율은 2개입니다.','인산화된 3탄소 중간체 + 4 ADP → 피루브산 2개 + 4 ATP (여러 단계의 개략식)',[item('피루브산',2),item('ATP',4,'단계 생성량; 해당 과정 순생산은 2')],'substrate-phosphorylation')
 ]
};
const pyruvate={
 basis:'피루브산 2개 = 포도당 1개 분량 · 미토콘드리아 기질',summary:'탄소를 하나씩 떼고 산화한 뒤 CoA에 연결합니다. ATP 직접 생산은 0입니다.',
 products:[item('아세틸 CoA',2,'각 2C'),item('CO₂',2),item('NADH',2)],
 cumulative:[item('순 ATP',2),item('지금까지 생성한 NADH',4),item('지금까지 생성한 CO₂',2)],ledger:{atp:0,nadh:2,fadh2:0,co2:2},carbonBalance:{input:6,output:6},
 scenes:[
  scene('탄소 하나씩을 CO₂로','피루브산 탈수소효소 복합체에 들어온 두 피루브산은 각각 탄소 하나를 CO₂로 내보냅니다. 남은 2탄소 조각은 효소에 붙어 있습니다.','피루브산 2 × 3C → 효소에 붙은 2C 조각 2개 + 2 CO₂',[item('CO₂',2),item('효소 결합 2C 조각',2,'자유 아세트알데하이드로 방출되지 않음')],'decarboxylation'),
  scene('전자 전달로 NADH 생성','2탄소 조각이 산화되는 동안 전자가 효소 보조인자들을 거쳐 NAD⁺로 전달됩니다. 포도당 한 개 분량에서 NADH 두 개를 더 얻습니다.','2 NAD⁺ + 전자·H → 2 NADH (개략식)',[item('NADH',2)],'oxidation'),
  scene('CoA가 아세틸기를 운반','CoA의 황에 아세틸기가 연결되어 아세틸 CoA가 됩니다. CoA는 탄소를 회로로 운반하는 재사용 가능한 조효소이며, ATP를 직접 만들지는 않습니다.','효소 결합 아세틸기 2개 + 2 CoA → 2 아세틸 CoA',[item('아세틸 CoA',2,'TCA 회로로 이동')],'coa-loading')
 ]
};
const tca={
 basis:'아세틸 CoA 2개 · 회로 2회전 = 포도당 1개 분량',summary:'아세틸기 탄소를 산화하고 옥살아세트산을 재생합니다. 회로 2회전에서 NADH 6개, FADH₂ 2개와 ATP 환산량 2개를 얻습니다.',
 products:[item('CO₂',4),item('NADH',6),item('FADH₂',2),item('ATP 환산량',2,'세포에 따라 ATP 또는 GTP')],
 cumulative:[item('순 ATP 환산량',4,'해당 2 + 회로 2'),item('지금까지 생성한 NADH',10),item('지금까지 생성한 FADH₂',2),item('지금까지 생성한 CO₂',6)],ledger:{atp:2,nadh:6,fadh2:2,co2:4},carbonBalance:{input:4,output:4},
 scenes:[
  scene('2탄소가 4탄소와 결합','각 아세틸 CoA의 2탄소 아세틸기가 4탄소 옥살아세트산과 만나 6탄소 시트르산을 만듭니다. CoA는 떨어져 나가 다시 쓰입니다. 수량은 두 회전의 합계입니다.','2 아세틸 CoA + 2 옥살아세트산 → 2 시트르산 + 2 CoA (개략식)',[item('시트르산',2,'각 6C'),item('CoA',2,'재활용')],'acetyl-entry'),
  scene('첫 탈탄산과 NADH','시트르산이 이소시트르산으로 재배열된 뒤 산화적 탈탄산을 거칩니다. 각 회전에서 CO₂ 하나와 NADH 하나가 나옵니다.','2 이소시트르산(6C) → 2 α-케토글루타르산(5C) + 2 CO₂; 2 NAD⁺ → 2 NADH',[item('α-케토글루타르산',2),item('CO₂',2),item('NADH',2)],'first-decarboxylation'),
  scene('둘째 탈탄산과 NADH','다시 탄소 하나씩을 CO₂로 내보내고 CoA가 붙어 숙시닐 CoA가 됩니다. 한 회전에서 방출한 탄소 원자가 반드시 그 회전에 들어온 아세틸기의 원자는 아닙니다.','2 α-케토글루타르산(5C) + 2 CoA → 2 숙시닐 CoA(4C) + 2 CO₂; 2 NAD⁺ → 2 NADH',[item('숙시닐 CoA',2),item('CO₂',2),item('NADH',2)],'second-decarboxylation'),
  scene('ATP를 얻고 출발 물질 재생','숙시닐 CoA에서 ATP 또는 GTP를 얻고, 숙신산 산화에서는 FADH₂를 만듭니다. 말산 산화가 NADH를 더 만들며 옥살아세트산을 재생합니다. 숙신산 탈수소효소는 내막에 있습니다.','숙시닐 CoA → 숙신산 → 푸마르산 → 말산 → 옥살아세트산 (각 2회)',[item('ATP 환산량',2),item('FADH₂',2),item('NADH',2),item('옥살아세트산',2,'회로 내 재생; 순생성 아님'),item('CoA',2,'재활용')],'regeneration')
 ]
};
const oxidative={
 basis:'포도당 1개에서 만든 NADH 10개 · FADH₂ 2개',summary:'전자 전달이 만든 H⁺ 기울기를 ATP 합성효소가 사용합니다. 산화적 인산화 약 26–28 ATP를 더해 전체 약 30–32 ATP입니다.',
 products:[item('ATP','약 26–28','세포질 NADH 셔틀 등에 따라 변동'),item('NAD⁺',10,'NADH 산화로 재생'),item('FAD',2,'효소 결합 보조인자 재생'),item('H₂O','생성','O₂가 전자를 받음')],
 cumulative:[item('순 ATP 환산량','약 30–32','이전 단계 4 + 이 단계 26–28'),item('지금까지 생성한 NADH',10,'이 단계에서 10 산화; 남은 NADH 0'),item('지금까지 생성한 FADH₂',2,'이 단계에서 2 산화; 남은 FADH₂ 0'),item('지금까지 생성한 CO₂',6,'전자전달계는 CO₂를 만들지 않음')],
 ledger:{atp:[26,28],nadh:-10,fadh2:-2,co2:0},carbonBalance:{input:0,output:0},
 scenes:[
  scene('NADH와 FADH₂가 전자를 전달','NADH 유래 전자는 보통 복합체 I로, FADH₂ 유래 전자는 복합체 II를 통해 들어옵니다. 세포질 NADH의 전자는 셔틀로 전달되므로 유입 위치와 ATP 수율이 달라질 수 있습니다.','10 NADH → 10 NAD⁺; 2 FADH₂ → 2 FAD + 전달된 전자 (개략식)',[item('NAD⁺',10,'전자 운반체 재생'),item('FAD',2,'효소 결합 상태로 재생')],'electron-donation'),
  scene('산소가 마지막으로 전자를 받음','전자가 유비퀴논, 복합체 III, 시토크롬 c, 복합체 IV를 거쳐 산소로 전달됩니다. 산소는 전자와 H⁺를 받아 물이 됩니다. ATP 합성효소로 전자가 들어가는 것은 아닙니다.','O₂ + 4 e⁻ + 4 H⁺ → 2 H₂O',[item('H₂O','생성','산소가 전자를 받아 물로 변함; 전체 호흡에서 남는 물의 양과는 구분')],'oxygen-reduction'),
  scene('H⁺를 막 사이 공간에 축적','복합체 I·III·IV는 전자 전달 에너지로 H⁺를 기질에서 막 사이 공간으로 옮깁니다. 복합체 II는 H⁺를 펌핑하지 않습니다. 앞 장면의 전자 전달과 동시에 결합되어 일어납니다.','H⁺(기질) → H⁺(막 사이 공간)',[item('H⁺ 전기화학적 기울기','형성','물질 순생성이 아니라 위치와 에너지 상태 변화')],'proton-gradient'),
  scene('H⁺ 복귀가 ATP 합성을 구동','H⁺가 ATP 합성효소를 통해 막 사이 공간에서 기질로 돌아옵니다. 회전과 구조 변화가 ADP와 무기 인산의 결합을 구동합니다. 26–28은 보편적 고정값이 아닌 대표 범위입니다.','ADP + Pi → ATP; H⁺(막 사이 공간) → H⁺(기질)',[item('ATP','약 26–28','포도당 1개 분량의 이 단계 수율')],'chemiosmosis')
 ]
};
const light={
 basis:'CO₂ 3개 → 순 G3P 1개에 공급할 에너지 기준',summary:'명반응은 물에서 전자를 얻고 빛을 이용해 ATP와 NADPH를 공급합니다. ATP 9개는 캘빈 회로가 소비하는 양이며, 부족한 ATP는 순환적 전자 흐름으로 보충할 수 있습니다.',
 products:[item('ATP',9,'캘빈 회로에 필요한 양; 빛을 흡수할 때마다 9개가 생긴다는 뜻은 아님'),item('NADPH',6),item('O₂',3,'물 6개의 산화에서 유래')],
 cumulative:[item('ATP 공급',9,'뒤의 캘빈 회로에서 소비'),item('NADPH 공급',6,'뒤의 캘빈 회로에서 소비'),item('O₂ 생성',3)],ledger:{atp:9,nadph:6,o2:3,co2:0},carbonBalance:{input:0,output:0},
 scenes:[
  scene('광계 II에서 빛 흡수','안테나 색소가 모은 에너지가 반응 중심으로 전달되고 엽록소의 전자가 들뜹니다. 광계 II에서 광계 I 순서로 진행합니다. 번호는 발견 순서입니다.','빛 + 광계 II → 들뜬 반응 중심',[item('들뜬 전자','에너지 상승','물질이 새로 생기는 것이 아니라 전자 상태 변화')],'light-harvesting'),
  scene('물에서 전자와 산소 얻기','광계 II에 연결된 물 산화 복합체가 물을 산화합니다. 전자는 광계 II를 보충하고 H⁺는 틸라코이드 내강에 남으며 O₂가 나옵니다.','6 H₂O → 3 O₂ + 12 H⁺ + 12 e⁻',[item('O₂',3),item('H⁺',12,'내강 쪽'),item('전자',12,'광계 II에 보충')],'water-splitting'),
  scene('전달·재여기로 H⁺ 기울기 형성','전자가 플라스토퀴논, 시토크롬 b₆f, 플라스토시아닌을 거쳐 광계 I로 갑니다. H⁺가 스트로마에서 내강 쪽으로 축적되고 광계 I에서 빛으로 전자를 다시 여기합니다.','광계 II → PQ → b₆f → PC → 광계 I → 페레독신',[item('H⁺ 기울기','형성','내강의 H⁺가 높아짐'),item('재여기된 전자','전달','NADP⁺ 환원에 사용')],'photosynthetic-electron-flow'),
  scene('ATP와 NADPH를 스트로마로','H⁺가 합성효소를 통해 내강에서 스트로마로 복귀해 ATP를 만듭니다. 전자는 NADP⁺ 환원효소를 통해 NADPH에 저장됩니다. 필요한 ATP의 추가 공급에는 순환적 전자 흐름이 기여할 수 있습니다.','ADP + Pi → ATP; 6 NADP⁺ + 12 e⁻ + 6 H⁺ → 6 NADPH',[item('ATP',9,'캘빈 회로에 필요한 양; 순환적 전자 흐름으로 보충 가능'),item('NADPH',6,'스트로마에서 생성')],'photophosphorylation')
 ]
};
const calvin={
 basis:'CO₂ 3개 고정 · 순 G3P 1개 반출 · 스트로마',summary:'ATP 9개와 NADPH 6개를 소비합니다. 6개 G3P 중 1개만 순반출되고, 5개는 RuBP 재생에 쓰입니다.',
 products:[item('순 G3P',1,'3C; 두 개가 6탄소 당 합성에 해당'),item('ADP',9),item('NADP⁺',6),item('RuBP',3,'회로 내 재생; 순생성 아님')],
 cumulative:[item('순 G3P',1,'순고정 탄소 3개'),item('사용 후 남은 ATP',0,'명반응 공급 9 − 캘빈 소비 9'),item('사용 후 남은 NADPH',0,'명반응 공급 6 − 캘빈 소비 6'),item('지금까지 생성한 O₂',3,'명반응에서 생성')],ledger:{atp:-9,nadph:-6,o2:0,co2:-3},carbonBalance:{input:3,output:3},
 scenes:[
  scene('CO₂를 RuBP에 고정','루비스코가 5탄소 RuBP에 CO₂를 붙입니다. 불안정한 6탄소 중간체가 둘로 갈라져 CO₂ 3개와 RuBP 3개에서 3-PGA 6개가 됩니다.','3 CO₂(3C) + 3 RuBP(15C) → 6 3-PGA(18C)',[item('3-PGA',6,'각 3C')],'carbon-fixation'),
  scene('ATP와 NADPH로 환원','3-PGA 여섯 개를 인산화하고 환원해 G3P 여섯 개로 바꿉니다. ATP 6개와 NADPH 6개를 소비하며 ADP와 NADP⁺는 명반응으로 돌아갑니다.','6 3-PGA + 6 ATP + 6 NADPH → 6 G3P + 6 ADP + 6 NADP⁺ (개략식)',[item('G3P',6,'이 중 순반출은 1개'),item('ADP',6),item('NADP⁺',6)],'carbon-reduction'),
  scene('G3P 하나만 순반출','G3P 여섯 개 중 하나가 탄수화물 합성에 기여합니다. 나머지 다섯 개의 탄소 15개는 다음 CO₂를 받을 RuBP를 재생하는 데 남겨 둡니다.','6 G3P → 반출 G3P 1 + 재생용 G3P 5',[item('반출 G3P',1,'새 분자의 추가 생성이 아니라 기존 G3P의 분배')],'g3p-export'),
  scene('RuBP를 재생해 회로 지속','남은 G3P 다섯 개의 탄소를 재배열하고 ATP 3개를 더 써 RuBP 세 개를 재생합니다. 전체 소비량은 9 ATP와 6 NADPH입니다. 빛을 직접 쓰지 않아도 명반응과 빛 조절에 의존합니다.','5 G3P(15C) + 3 ATP → 3 RuBP(15C) + 3 ADP (개략식)',[item('RuBP',3,'재생; 순산물 아님'),item('ADP',3)],'rubp-regeneration')
 ]
};
const alcoholDecarb={
 basis:'피루브산 2개 · 포도당 1개 분량 · 세포질',summary:'피루브산에서 CO₂가 떨어져 아세트알데하이드가 됩니다. 추가 ATP와 NADH 생성은 없습니다.',
 products:[item('아세트알데하이드',2,'각 2C'),item('CO₂',2)],cumulative:[item('순 ATP',2,'해당에서만 생성'),item('지금까지 생성한 NADH',2,'다음 단계에서 산화'),item('지금까지 생성한 CO₂',2)],ledger:{atp:0,nadh:0,fadh2:0,co2:2},carbonBalance:{input:6,output:6},
 scenes:[
  scene('피루브산이 탈탄산효소에 결합','효모 등의 피루브산 탈탄산효소가 3탄소 피루브산을 결합합니다. 미토콘드리아의 피루브산 산화와 다른 경로이며 CoA를 쓰지 않습니다.','2 피루브산 + 효소 ⇄ 효소·피루브산 복합체',[],'pyruvate-binding'),
  scene('탄소 하나씩을 CO₂로 방출','각 피루브산에서 탄소 하나가 CO₂로 빠져나갑니다. 효모가 반죽을 부풀리는 기체가 여기서 나옵니다.','피루브산 2 × 3C → 2 CO₂ + 효소 결합 2C 조각 2개',[item('CO₂',2)],'fermentation-decarboxylation'),
  scene('아세트알데하이드 방출','남은 2탄소 조각이 아세트알데하이드로 방출됩니다. 전자 운반체나 ATP를 이 단계에서 새로 얻지는 않습니다.','효소 결합 2C 조각 2개 → 아세트알데하이드 2개',[item('아세트알데하이드',2,'각 2C')],'acetaldehyde-release')
 ]
};
function fermentationReduction(alcohol){
 const acceptor=alcohol?'아세트알데하이드':'피루브산',product=alcohol?'에탄올':'젖산염';
 return {
  basis:'포도당 1개에서 온 2개 분자 · 세포질',summary:`NADH가 ${acceptor}을 환원하여 ${product}을 만들고 NAD⁺로 되돌아갑니다. 이 단계의 ATP 생성은 0입니다.`,
  products:[item(product,2,alcohol?'각 2C':'각 3C'),item('NAD⁺',2,'해당 과정으로 재활용')],
  cumulative:[item('순 ATP',2,'해당 4 생성 − 2 소비'),item(product,2),item('지금까지 생성한 CO₂',alcohol?2:0),item('지금까지 생성한 NADH',2,'이 단계에서 2개를 사용하므로 남은 NADH는 0')],ledger:{atp:0,nadh:-2,fadh2:0,co2:0},carbonBalance:{input:alcohol?4:6,output:alcohol?4:6},
  scenes:[
   scene('NADH가 전자를 전달',`탈수소효소가 NADH와 ${acceptor}을 결합시켜 전자 전달을 촉진합니다. 별도 ATP 투자가 아니라 NADH의 환원력을 사용합니다. 이 장면과 다음 장면은 하나의 효소 반응을 나누어 보여 줍니다.`,`2 NADH → 2 NAD⁺ + 전달된 전자·H (개략식)`,[item('NAD⁺',2,'효소의 환원 반응과 결합해 재생')],'fermentation-electron-donation'),
   scene(`${product} 생성`,`${acceptor} 두 개가 NADH의 전자를 받아 ${product} 두 개로 바뀝니다. ${alcohol?'CO₂는 앞의 탈탄산 단계에서 이미 방출되었습니다.':'탄소를 떼지 않으므로 이 젖산 발효 경로에서는 CO₂가 나오지 않습니다. 생리적 pH에서는 주로 젖산염입니다.'}`,`2 ${acceptor} + 2 NADH + 2 H⁺ → 2 ${product} + 2 NAD⁺ (개략식)`,[item(product,2,'ATP 추가 생성 0; NAD⁺ 생성은 앞 장면에서 표시')],'fermentation-reduction'),
   scene('NAD⁺를 해당 과정으로 재활용','NAD⁺가 G3P 산화 단계의 전자 수용체로 다시 사용됩니다. NAD⁺가 충분히 돌아와야 해당 과정의 기질 수준 인산화가 지속됩니다. 발효의 의의는 ATP 추가 생성보다 이 재생에 있습니다.','재생된 NAD⁺ → 해당 과정으로 복귀',[],'nad-recycling')
  ]
 };
}
export const LESSONS={
 respiration:{stages:[glycolysis,pyruvate,tca,oxidative]},
 photosynthesis:{stages:[light,calvin]},
 alcohol:{stages:[glycolysis,alcoholDecarb,fermentationReduction(true)]},
 lactate:{stages:[glycolysis,fermentationReduction(false)]}
};
export const LESSON_NOTE='수량은 각 단계의 기준량을 따릅니다. 총생성량은 지금까지 만든 양이며, 사용 후 남은 양과 다릅니다. 확대 장면은 서로 결합된 반응을 학습용 순서로 나눈 것으로 실제 세포에서는 동시에 진행됩니다. 간략한 반응식은 물·H⁺·무기 인산(Pi) 등을 모두 표시하지 않을 수 있습니다.';
