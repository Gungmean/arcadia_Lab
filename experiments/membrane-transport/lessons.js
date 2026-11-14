const output=(label,amount,note='')=>({label,amount:String(amount),note});
const scene=(title,narration,equation,outputs,kind)=>({title,narration,equation,outputs,kind});
const stage=(name,location,summary,why,basis,products,scenes,transport={})=>({name,location,summary,why,basis,products,scenes,transport});
export const DEFAULT_OPTIONS=Object.freeze({solution:'hypotonic',cell:'animal'});
export const MODEL_NOTE='분자는 가상색과 과장한 크기로 표시합니다. 고정된 예시 조건의 이동을 보여 주며 실제 이동 속도·막전위·농도 수치를 계산하지 않습니다. 이온은 실제로 농도차와 막전위를 합친 전기화학적 기울기에 따라 이동합니다. 삼투에서는 막을 통과하지 못하는 용질과 초기 압력이 같은 조건을 가정합니다. 식물세포에서는 팽압이 물의 순유입을 멈출 수 있습니다. 관찰 결과에는 이동한 물질과 달라진 상태, ATP 사용 등이 포함됩니다.';
export const SOURCES=[
 {title:'OpenStax Biology 2e · 수동 수송과 삼투',url:'https://openstax.org/books/biology-2e/pages/5-2-passive-transport'},
 {title:'OpenStax Biology 2e · 능동 수송',url:'https://openstax.org/books/biology-2e/pages/5-3-active-transport'},
 {title:'Molecular Biology of the Cell · 막 수송의 원리',url:'https://www.ncbi.nlm.nih.gov/books/NBK26815/'},
 {title:'Molecular Biology of the Cell · 운반체와 능동 수송',url:'https://www.ncbi.nlm.nih.gov/books/NBK26896/'},
 {title:'The Cell: A Molecular Approach · 작은 분자의 수송',url:'https://www.ncbi.nlm.nih.gov/books/NBK9847/'},
 {title:'College Board AP Biology · 확산·삼투 실험과 수분 퍼텐셜',url:'https://apcentral.collegeboard.org/media/pdf/Bio_Lab4-DiffusionandOsmosis.pdf'},
 {title:'Australian Society of Plant Scientists · 식물의 물 이동',url:'https://www.asps.org.au/wp-content/uploads/2020/06/Chapter-3-Water-movement-in-plants-for-PDF-corrected.pdf'}
];

export const LESSONS={
 diffusion:{title:'단순 확산',summary:'O₂가 인지질 이중층을 직접 통과합니다. 농도가 높은 쪽에서 낮은 쪽으로 순이동하며 ATP를 쓰지 않습니다.',stages:[
  stage('농도 차이와 순이동','세포 밖과 세포질','밖에 O₂가 더 많은 예시입니다. 개별 분자는 양방향으로 움직이지만 안으로 들어오는 수가 더 많습니다.','순이동은 들어오는 양에서 나가는 양을 뺀 결과입니다. 모든 분자가 한 방향만 향하는 것은 아닙니다.','외부 O₂ 농도 > 내부 O₂ 농도',[output('O₂ 순이동','밖 → 안'),output('ATP 소비',0)],[
   scene('밖에 O₂가 더 많음','같은 부피를 비교할 때 세포 밖의 O₂ 분자 수가 더 많습니다. 이 차이를 농도 기울기라고 합니다.','[O₂]밖 > [O₂]안',[output('농도 기울기','존재')],'concentration-difference'),
   scene('분자는 양쪽에서 움직임','O₂ 분자는 열운동으로 여러 방향을 향합니다. 안쪽 분자도 막에 접근하며 밖으로 나올 수 있습니다.','O₂밖 ⇄ O₂안',[output('분자 운동','양방향')],'random-approach'),
   scene('차이만큼 안으로 순이동','같은 시간에 들어오는 O₂가 나가는 O₂보다 많아 농도 차이가 줄어듭니다.','유입량 > 유출량 → O₂ 순유입',[output('O₂','순유입'),output('농도 차이','감소')],'net-diffusion')
  ]),
  stage('인지질 이중층 통과','세포막의 지질 부분','작고 전하가 없는 O₂가 지질 부분에 들어갔다가 반대편으로 나옵니다.','이 경로에는 채널이나 운반체가 필요하지 않습니다. 모든 분자가 지질 부분을 쉽게 통과하는 것은 아닙니다.','O₂ 한 분자의 대표 이동',[output('O₂','세포질에 도착'),output('ATP 소비',0)],[
   scene('O₂가 막 표면에 접근','O₂가 바깥 수용액에서 인지질층에 접근합니다. 작은 비극성 분자라는 성질이 통과를 돕습니다.','O₂(세포 밖 수용액) → 막 표면',[output('O₂','막에 접근')],'lipid-approach'),
   scene('소수성 중심부 통과','O₂는 인지질의 소수성 중심부에 들어가 확산합니다. 전하를 띤 Na⁺나 큰 포도당은 같은 방식으로 잘 통과하지 못합니다.','O₂ → 인지질 이중층 내부',[output('O₂','지질층을 통과')],'lipid-crossing'),
   scene('반대편 물로 나옴','O₂가 막에서 세포질의 수용액으로 나옵니다. O₂ 자체가 다른 물질로 바뀌지는 않습니다.','O₂(지질층) → O₂(세포질)',[output('O₂','내부로 이동 완료')],'lipid-release')
  ]),
  stage('동적 평형','막 양쪽의 수용액','농도 차이가 사라지면 양방향 이동량이 같아집니다. 분자의 운동은 계속됩니다.','평형에서 멈추는 것은 개별 분자가 아니라 순이동입니다. O₂ 소비 등 다른 과정은 이 예시에서 제외합니다.','닫힌 계 · 양쪽 같은 부피 · 같은 O₂ 농도',[output('O₂ 순이동',0),output('분자 운동','계속')],[
   scene('농도가 같아짐','시간이 지나 양쪽의 O₂ 농도가 같아집니다. 같은 농도라도 분자들은 가만히 있지 않습니다.','[O₂]밖 = [O₂]안',[output('농도 차이',0)],'equal-concentration'),
   scene('같은 양이 서로 통과','충분히 긴 시간의 평균으로 보면 들어오는 양과 나가는 양이 같습니다. 순간적인 작은 흔들림은 가능합니다.','평균 유입량 = 평균 유출량',[output('O₂ 이동','양방향 같은 평균량')],'balanced-crossing'),
   scene('순이동 0, 운동은 계속','입자를 따라가면 계속 움직이고 막도 통과합니다. 전체적으로 어느 쪽의 O₂도 더 늘어나지 않는 동적 평형입니다.','순이동 = 유입 − 유출 = 0',[output('동적 평형','유지')],'dynamic-equilibrium')
  ])
 ]},
 osmosis:{title:'삼투와 세포 변화',summary:'물은 막을 통과하지만 비교에 쓰는 용질은 통과하지 못합니다. 바깥 용액과 세포 종류를 골라 물의 순이동을 관찰하세요.',stages:[
  stage('물과 용질의 통과 차이','세포막과 아쿠아포린','막은 물의 이동을 허용하지만 이 예시의 용질은 통과시키지 않습니다.','삼투 방향을 판단할 때는 막을 통과하지 못하는 유효 용질을 비교해야 합니다.','용액 조건은 세포 밖을 기준으로 표시',[output('용질','각 쪽에 남음'),output('물','막 양쪽을 오감')],[
   scene('용질은 막을 통과하지 못함','여기서 비교하는 용질은 세포막을 건너지 못합니다. 용질의 이동으로 농도 차이가 바로 해소되지는 않습니다.','용질밖 ↛ 용질안',[output('비투과성 용질','각 쪽에 유지')],'impermeant-solute'),
   scene('물은 아쿠아포린을 통과','물 분자는 양방향으로 움직입니다. 아쿠아포린은 빠른 통과 경로이며 물은 지질층으로도 느리게 통과할 수 있습니다.','H₂O밖 ⇄ H₂O안',[output('물 이동','양방향'),output('ATP 소비',0)],'aquaporin-water'),
   scene('밖과 안의 유효 용질 비교','조건에 따라 이 장면의 비교와 뒤의 물 이동 방향이 바뀝니다.','외부 용액의 유효 용질 농도를 세포 안과 비교',[output('바깥 용액','선택한 조건')],'tonicity-comparison')
  ]),
  stage('물의 순이동','세포막 양쪽','초기 압력이 같을 때 물은 비투과성 용질이 더 진한 쪽으로 순이동합니다.','압력도 물 이동에 영향을 줍니다. 특히 식물세포의 최종 상태는 농도 비교만으로 설명할 수 없습니다.','초기 압력 차이 없음 · 용질 이동 없음',[output('물의 순이동','선택한 조건에 따라 결정')],[
   scene('물은 양방향으로 오감','한쪽으로 순이동하더라도 개별 물 분자는 양방향으로 통과합니다.','H₂O밖 ⇄ H₂O안',[output('물 이동','양방향')],'bidirectional-water'),
   scene('더 많은 쪽의 이동을 비교','선택한 용액 조건에 맞추어 유입과 유출의 차이를 확인합니다.','물 순이동 = 유입량 − 유출량',[output('물 순이동','조건별 방향')],'net-water'),
   scene('부피와 압력 변화','물의 이동은 세포 부피와 용질 농도를 바꿉니다. 조건에 따라 압력 변화도 순이동을 줄입니다.','물 이동 → 부피·농도·압력 변화',[output('세포 상태','변화')],'water-balance')
  ]),
  stage('동물세포와 식물세포','세포 전체','세포벽 유무에 따라 같은 용액에서도 모양의 변화가 다릅니다.','세포벽은 물이 못 지나는 막이 아닙니다. 팽창을 제한해 팽압을 만들며, 원형질 분리에서는 세포막이 벽에서 떨어집니다.','동물세포 또는 식물세포의 대표 예시',[output('세포 모양','선택한 조건에 따라 변화')],[
   scene('물이 드나들며 부피 변화','선택한 세포에서 물의 순이동에 따른 부피 변화를 따라갑니다.','물 이동 → 세포 부피 변화',[output('세포 부피','변화')],'cell-volume'),
   scene('세포벽 유무의 차이','동물세포에는 세포벽이 없지만 식물세포에는 세포막 바깥에 세포벽이 있습니다.','세포막 변형 ↔ 세포벽의 기계적 제한',[output('세포 형태','조건별 반응')],'cell-response'),
   scene('선택한 조건의 최종 모습','마지막 모양은 대표적인 결과입니다. 실제 변화량과 파열 여부는 세포 종류와 시간에 따라 달라집니다.','선택한 조건 → 대표적인 최종 상태',[output('최종 상태','선택한 조건')],'cell-final')
  ])
 ]},
 facilitated:{title:'촉진 확산',summary:'채널이나 운반체가 막 통과를 돕습니다. 이동 자체에 ATP를 직접 쓰지 않고 기울기를 따릅니다.',stages:[
  stage('채널을 지나는 Na⁺','세포막의 Na⁺ 채널','Na⁺는 지질 중심부를 쉽게 통과하지 못하지만 열린 선택적 채널을 지날 수 있습니다.','이온 방향은 농도 차이와 막전위를 합친 전기화학적 기울기로 정해집니다. 여기서는 막전위를 생략합니다. 이 Na⁺ 채널과 다음 단계의 GLUT는 서로 별개의 수송 경로입니다.','막전위 효과 생략 · Na⁺ 바깥 농도 > 안쪽 농도',[output('Na⁺ 순이동','밖 → 안'),output('직접 ATP 소비',0)],[
   scene('닫힌 채널','채널이 닫혀 있으면 이 통로를 통한 Na⁺ 이동은 막힙니다. 열린 상태와 비교하기 위한 장면입니다.','닫힌 채널 → 이 통로의 Na⁺ 이동 없음',[output('채널 통과','막힘')],'channel-closed'),
   scene('열린 친수성 통로','채널이 열리면 Na⁺가 물과 접하는 통로를 통과합니다. 실제 문을 여는 신호의 종류는 이 모형에서 생략합니다.','Na⁺밖 → 열린 Na⁺ 채널 → Na⁺안',[output('Na⁺','채널 통과')],'channel-open'),
   scene('안쪽으로 순이동','선택한 조건에서 Na⁺가 안으로 순이동합니다. 채널이 Na⁺를 기울기에 거슬러 밀어 넣는 것은 아닙니다.','전기화학적 기울기를 따르는 Na⁺ 이동',[output('Na⁺','세포 안에 도착')],'channel-release')
  ]),
  stage('포도당 운반체 GLUT','세포막의 GLUT 운반체','포도당이 결합하면 운반체의 모양이 바뀌어 반대편으로 열립니다.','GLUT의 촉진 확산과 Na⁺에 결합한 포도당 공동수송은 서로 다른 경로입니다.','포도당 바깥 농도 > 안쪽 농도 · 대표 GLUT 한 번의 운반',[output('포도당',1,'밖에서 안으로 이동'),output('직접 ATP 소비',0)],[
   scene('포도당이 결합','바깥을 향한 GLUT 결합 자리에 포도당이 붙습니다. 단백질이 아무 물질이나 똑같이 운반하지는 않습니다.','GLUT + 포도당밖 ⇄ GLUT·포도당',[output('포도당-GLUT 복합체',1)],'carrier-binding'),
   scene('운반체의 모양 변화','결합 자리가 잠시 양쪽에서 닫힌 상태를 거쳐 안쪽을 향합니다. 막을 관통한 열린 구멍으로 계속 이어지는 채널과 다릅니다.','바깥 향한 결합 자리 → 닫힌 중간 상태 → 안쪽 향한 결합 자리',[output('GLUT','안쪽을 향한 상태')],'carrier-alternating-access'),
   scene('안쪽에서 포도당 방출','포도당이 세포질로 떨어지고 운반체는 다시 운반할 수 있습니다. 농도 기울기가 반대라면 순이동도 반대가 될 수 있습니다.','GLUT·포도당 → GLUT + 포도당안',[output('포도당',1,'세포 안으로 이동')],'carrier-release')
  ]),
  stage('에너지와 운반 한계','막 수송 경로의 비교','촉진 확산은 이동 자체에 ATP를 직접 쓰지 않습니다. 운반체 수와 처리 속도에는 한계가 있습니다.','운반체가 포화된다는 설명을 모든 채널에 같은 속도 법칙으로 적용하지 않습니다.','GLUT 운반체 수 고정 · 포도당 공급 비교',[output('직접 ATP 소비',0),output('운반체 포화','가능')],[
   scene('운반체 한 자리가 사용 중','포도당과 결합한 GLUT는 한 번의 구조 변화와 방출을 마쳐야 다음 운반을 할 수 있습니다.','결합 → 구조 변화 → 방출 → 재사용',[output('운반체','재사용')],'carrier-busy'),
   scene('모든 운반체가 바쁜 상태','운반체가 모두 사용 중이면 포도당을 더 공급해도 운반 속도가 비례해서 계속 증가하지 않습니다. 이 현상을 포화라고 합니다.','운반체 모두 사용 중 → 처리 속도에 한계',[output('운반체 포화','최대 처리 속도 접근')],'carrier-saturation'),
   scene('단백질을 써도 수동 수송','막 단백질의 존재가 능동 수송을 뜻하지는 않습니다. 촉진 확산은 기울기를 따르며 이 운반에 ATP를 직접 결합하지 않습니다.','촉진 확산: 기울기를 따름 · 직접 ATP 소비 0',[output('수송 방식','수동 수송')],'passive-comparison')
  ])
 ]},
 active:{title:'Na⁺·K⁺ 펌프',summary:'한 회전에 ATP 1개를 사용해 Na⁺ 3개를 밖으로, K⁺ 2개를 안으로 옮깁니다. 두 이온의 농도 차이를 거스르는 일차 능동 수송입니다.',stages:[
  stage('Na⁺ 결합과 ATP 사용','세포막 펌프의 세포질 쪽','안쪽의 Na⁺ 3개가 결합하고 ATP의 인산기가 펌프에 전달됩니다.','이 펌프는 ATP 가수분해에 직접 결합하는 예입니다. 모든 능동 수송이 ATP를 직접 쓰는 것은 아닙니다.','펌프 1회전의 시작 · Na⁺ 3개 · ATP 1개',[output('ADP',1),output('인산화된 펌프',1)], [
   scene('안쪽 Na⁺ 3개 결합','세포질 쪽으로 열린 펌프에 Na⁺ 세 개가 결합합니다. 아직 바깥으로 방출된 이온은 없습니다.','펌프 + 3 Na⁺안 → 펌프·3 Na⁺',[output('펌프에 결합한 Na⁺',3,'세포질에서 결합')],'pump-na-binding'),
   scene('ATP 1개 사용','ATP가 분해되며 인산기가 펌프로 옮겨지고 ADP가 떨어집니다. ATP는 이온과 함께 막 밖으로 운반되지 않습니다.','펌프 + ATP → 펌프-P + ADP',[output('ADP',1),output('펌프-P',1)],'pump-phosphorylation'),
   scene('안쪽 통로가 닫힘','인산화와 결합된 구조 변화로 Na⁺를 둘러싼 상태가 됩니다. 펌프가 양쪽으로 동시에 열린 통로가 되는 것은 아닙니다.','Na⁺ 결합·인산화 → 안쪽이 닫힌 펌프',[output('Na⁺ 3개','펌프 안에 갇힌 중간 상태')],'pump-occlusion')
  ],{atpUsed:1,naOut:0,kIn:0}),
  stage('Na⁺ 방출과 K⁺ 결합','펌프의 세포 바깥쪽','바깥으로 열린 펌프에서 Na⁺가 떨어지고 K⁺ 두 개가 결합합니다. 이후 인산기가 떨어집니다.','같은 단백질도 구조에 따라 Na⁺와 K⁺에 대한 결합 성질이 달라집니다.','동일한 펌프 회전의 중간 · ATP 추가 소비 없음',[output('바깥으로 이동한 Na⁺',3),output('결합한 K⁺',2),output('무기 인산 Pi',1)], [
   scene('바깥에 Na⁺ 3개 방출','펌프가 바깥을 향하고 Na⁺에 대한 결합력이 낮아집니다. Na⁺ 세 개가 세포 밖으로 나옵니다.','펌프-P·3 Na⁺ → 펌프-P + 3 Na⁺밖',[output('Na⁺',3,'세포 밖에 방출')],'pump-na-release'),
   scene('바깥 K⁺ 2개 결합','바뀐 구조에 세포 바깥의 K⁺ 두 개가 결합합니다. Na⁺가 나오는 단계와 순서대로 연결되어 있습니다.','펌프-P + 2 K⁺밖 → 펌프-P·2 K⁺',[output('결합한 K⁺',2)],'pump-k-binding'),
   scene('인산기가 떨어짐','K⁺ 결합에 이어 펌프의 인산기가 Pi로 떨어집니다. 이 탈인산화는 안쪽을 향하는 구조로 돌아가는 과정과 연결됩니다.','펌프-P·2 K⁺ → 펌프·2 K⁺ + Pi',[output('Pi',1,'기존 ATP에서 온 인산기')],'pump-dephosphorylation')
  ],{atpUsed:0,naOut:3,kIn:0}),
  stage('K⁺ 방출과 초기 상태 회복','펌프의 세포질 쪽','K⁺가 안으로 나오고 펌프가 다음 Na⁺를 받을 상태로 돌아옵니다.','한 회전의 총 이동은 Na⁺ 3개 밖, K⁺ 2개 안입니다. 양전하가 순수하게 하나 바깥으로 이동하지만 전체 막전위를 이 수만으로 계산하지는 않습니다.','같은 펌프 1회전의 마무리',[output('안으로 이동한 K⁺',2),output('펌프','다음 회전 준비')],[
   scene('K⁺를 품고 안쪽으로 전환','인산기가 떨어진 펌프가 K⁺ 두 개를 결합한 채 안쪽을 향하는 구조로 돌아옵니다.','바깥 향한 펌프·2 K⁺ → 안쪽 향한 펌프·2 K⁺',[output('K⁺ 2개','안쪽에 접근')],'pump-return'),
   scene('안쪽에 K⁺ 2개 방출','안쪽을 향한 상태에서 K⁺에 대한 결합력이 낮아져 K⁺ 두 개가 세포질로 떨어집니다.','펌프·2 K⁺ → 펌프 + 2 K⁺안',[output('K⁺',2,'세포질에 방출')],'pump-k-release'),
   scene('한 회전의 수지 확인','펌프가 처음 구조로 돌아옵니다. 재생된 펌프를 이용해 다음 회전을 시작할 수 있습니다.','ATP 1 + 3 Na⁺안 + 2 K⁺밖 → ADP + Pi + 3 Na⁺밖 + 2 K⁺안 (수송 개략식)',[output('Na⁺ 총이동',3,'밖으로'),output('K⁺ 총이동',2,'안으로'),output('총 ATP 소비',1,'이 장면에서 추가 소비하는 양 아님')],'pump-cycle-complete')
  ],{atpUsed:0,naOut:0,kIn:2})
 ]}
};

function optionsOf(options={}){return {solution:['hypotonic','isotonic','hypertonic'].includes(options.solution)?options.solution:DEFAULT_OPTIONS.solution,cell:['animal','plant'].includes(options.cell)?options.cell:DEFAULT_OPTIONS.cell};}
const scenarios={
 hypotonic:{label:'저장액',compare:'바깥의 비투과성 용질 농도 < 세포 안',direction:'밖 → 안',waterNet:'into',cell:{animal:{state:'팽윤 · 심하면 용혈 또는 파열',detail:'물이 들어와 세포가 부풉니다. 세포벽이 없어 충분한 물이 유입되면 터질 수 있습니다.'},plant:{state:'팽윤 · 팽압 형성',detail:'물이 들어오며 액포가 커지고 내용물이 세포벽을 밉니다. 벽의 저항으로 팽압이 생겨 순유입을 멈출 수 있습니다.'}}},
 isotonic:{label:'등장액',compare:'바깥과 세포 안의 비투과성 용질 농도 같음',direction:'순이동 없음',waterNet:'none',cell:{animal:{state:'부피 유지',detail:'유입과 유출이 평균적으로 같아 세포 부피가 유지됩니다. 물 분자는 계속 양방향으로 이동합니다.'},plant:{state:'뚜렷한 팽압 없이 이완',detail:'초기 압력 차이가 없는 등장 조건에서는 순유입이 없어 뚜렷한 팽압을 만들지 못합니다. 저장액에서처럼 팽팽한 상태가 아닙니다.'}}},
 hypertonic:{label:'고장액',compare:'바깥의 비투과성 용질 농도 > 세포 안',direction:'안 → 밖',waterNet:'out',cell:{animal:{state:'수축',detail:'물이 빠져나가 세포 부피가 줄어듭니다. 적혈구에서는 쭈그러진 모양을 볼 수 있습니다.'},plant:{state:'팽압 감소 · 심하면 원형질 분리',detail:'액포와 원형질의 부피가 줄고, 충분히 물을 잃으면 세포막이 세포벽에서 떨어집니다. 세포벽 전체가 같은 비율로 줄어드는 것은 아닙니다.'}}}
};

/** Independent lesson copy; preset changes never mutate the shared original. */
export function getLesson(processId,options={}){
 if(!LESSONS[processId])throw new RangeError(`Unknown transport lesson: ${processId}`);
 const lesson=JSON.parse(JSON.stringify(LESSONS[processId]));
 if(processId!=='osmosis')return lesson;
 const opts=optionsOf(options),s=scenarios[opts.solution],c=s.cell[opts.cell],cellName=opts.cell==='plant'?'식물세포':'동물세포';
 lesson.summary=`세포 밖은 ${s.label}입니다. ${s.compare}. 물의 초기 순이동: ${s.direction}. ${cellName}의 변화를 관찰하세요.`;
 lesson.options=opts;lesson.cellState=c.state;
 const [select,water,cell]=lesson.stages;
 select.basis=`세포 밖 ${s.label} · ${cellName} · 초기 압력 같음`;
 select.scenes[2]={...select.scenes[2],title:`바깥 용액: ${s.label}`,narration:`${s.compare}. 이 비교는 막을 통과하지 못하는 용질을 기준으로 합니다.`,equation:s.compare,outputs:[output('바깥 용액',s.label)]};
 water.summary=`물의 초기 순이동은 ${s.direction}입니다. 물 분자 자체는 양방향으로 움직입니다.`;
 water.products=[output('물의 초기 순이동',s.direction),output('ATP 소비',0)];
 water.scenes[1]={...water.scenes[1],title:`물의 순이동: ${s.direction}`,narration:opts.solution==='isotonic'?'초기 압력도 같은 조건에서 유입과 유출이 평균적으로 같습니다. 물의 운동이 멈춘 것은 아닙니다.':`초기 압력이 같을 때 물이 ${s.direction}으로 더 많이 이동합니다. 방향은 막을 통과하지 못하는 용질의 차이로 판단합니다.`,equation:`물 순이동: ${s.direction}`,outputs:[output('물의 순이동',s.direction)]};
 water.scenes[2]={...water.scenes[2],title:opts.cell==='plant'&&opts.solution==='hypotonic'?'팽압이 순유입을 줄임':'물 이동 뒤의 상태',narration:c.detail,equation:opts.cell==='plant'&&opts.solution==='hypotonic'?'물 유입 → 팽압 증가 → 물의 순유입 감소':`초기 물 순이동 ${s.direction} → ${c.state}`,outputs:[output('세포 상태',c.state)]};
 cell.basis=`${cellName} · 세포 밖 ${s.label}`;cell.summary=c.detail;cell.products=[output('최종 대표 상태',c.state)];
 cell.scenes[0]={...cell.scenes[0],title:`${cellName}의 부피 변화`,narration:`세포 밖은 ${s.label}이며 물의 초기 순이동은 ${s.direction}입니다. ${c.detail}`,equation:`${cellName}: 물의 순이동 ${s.direction}`,outputs:[output('부피 변화',opts.solution==='isotonic'?'큰 순변화 없음':opts.solution==='hypotonic'?'증가':'감소')]};
 cell.scenes[1]={...cell.scenes[1],title:c.state,narration:c.detail,equation:opts.cell==='plant'?'세포벽의 기계적 지지와 세포막의 물 이동을 구분':'세포벽 없음 · 물 이동에 따라 세포막 변형',outputs:[output('세포 반응',c.state)]};
 cell.scenes[2]={...cell.scenes[2],title:`최종 상태: ${c.state}`,narration:`${c.detail} 이것은 대표적인 결과이며 실제 변화량과 시간은 계산하지 않습니다.`,equation:`${s.label} + ${cellName} → ${c.state}`,outputs:[output('최종 대표 상태',c.state)]};
 return lesson;
}

/** netNa/netK positive means into the cell; negative means out. ATP is consumed per pump cycle. */
export function transportSummary(processId,options={}){
 if(!LESSONS[processId])throw new RangeError(`Unknown transport lesson: ${processId}`);
 if(processId==='osmosis'){const o=optionsOf(options),s=scenarios[o.solution];return {direction:s.direction,atp:0,netNa:0,netK:0,waterNet:s.waterNet,cellState:s.cell[o.cell].state};}
 if(processId==='active')return {direction:'Na⁺: 안 → 밖 · K⁺: 밖 → 안',atp:1,netNa:-3,netK:2,waterNet:'not-modeled'};
 return {direction:processId==='diffusion'?'O₂: 높은 농도 → 낮은 농도':'기울기를 따름 · 이 예시는 밖 → 안',atp:0,netNa:0,netK:0,waterNet:'not-modeled'};
}
export const QUIZ=[
 {question:'단순 확산이 동적 평형에 도달하면 분자는 어떻게 될까요?',options:['운동을 멈춘다','계속 움직이지만 양방향 평균 이동량이 같다','한 방향으로만 이동한다'],answer:1,explanation:'평형에서 0이 되는 것은 순이동입니다. 개별 분자의 열운동과 막 통과는 계속됩니다.'},
 {question:'초기 압력이 같고 용질이 막을 통과하지 못할 때, 세포 밖이 고장액이면 물은 어디로 순이동할까요?',options:['세포 안으로','세포 밖으로','ATP를 넣어야 결정된다'],answer:1,explanation:'바깥의 비투과성 용질 농도가 더 높으므로 물이 안에서 밖으로 순이동합니다.'},
 {question:'GLUT가 포도당을 이동시키면 왜 촉진 확산일까요?',options:['단백질을 쓰므로 항상 ATP가 필요하다','농도 기울기를 따르며 ATP를 직접 쓰지 않는다','포도당을 Na⁺와 반드시 함께 옮긴다'],answer:1,explanation:'GLUT 촉진 확산과 Na⁺-포도당 공동수송은 다른 경로입니다. 후자는 이온 기울기 에너지를 이용하는 이차 능동 수송의 예입니다.'},
 {question:'Na⁺·K⁺ 펌프 한 회전의 수지는 무엇일까요?',options:['3 Na⁺ 밖 · 2 K⁺ 안 · ATP 1 소비','2 Na⁺ 밖 · 3 K⁺ 안 · ATP 1 생성','3 Na⁺ 안 · 2 K⁺ 밖 · ATP 소비 없음'],answer:0,explanation:'ATP 하나의 가수분해에 결합해 Na⁺ 세 개가 밖으로, K⁺ 두 개가 안으로 이동합니다.'},
 {question:'이온이 채널을 통해 이동하는 방향을 실제로 결정하는 것은?',options:['농도 차이만','전기화학적 기울기','채널의 색'],answer:1,explanation:'농도 차이와 막전위가 함께 작용합니다. 이 시뮬레이션은 농도 효과를 보기 위해 막전위를 생략한 조건을 사용합니다.'},
 {question:'저장액에 놓인 식물세포가 계속 물을 받아 터지지 않는 주된 이유는?',options:['세포벽을 물이 통과하지 못해서','세포벽의 저항에 따른 팽압이 순유입을 줄여서','물이 전혀 들어가지 않아서'],answer:1,explanation:'물은 들어올 수 있습니다. 세포벽이 팽창을 제한해 생기는 압력이 삼투에 의한 추가 유입과 균형을 이룰 수 있습니다.'}
];
