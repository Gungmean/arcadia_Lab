export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const eyepieceFieldNumbers={10:18,15:12,20:9};
export const semWorldMicrometres=1.25;
export const semSpecimenBase=65;
export const semExitZ=137;
export const semProjectedRadius=10/Math.sqrt(1-(10/(semExitZ-semSpecimenBase))**2);
export function wavelengthRGB(nm) {
  if(nm<440)return[(440-nm)/60,0,1];
  if(nm<490)return[0,(nm-440)/50,1];
  if(nm<510)return[0,1,(510-nm)/20];
  if(nm<580)return[(nm-510)/70,1,0];
  if(nm<645)return[1,(645-nm)/65,0];
  return[1,0,0];
}
export const temSpecimenZ=192.6;
export const temPoleGap=[190,193.5];
// Signed heights cross an image plane without reflecting at that plane.
// These are equivalent teaching rays constrained by real openings, not a
// numerical solution of Maxwell/Lorentz equations or a lens prescription.
export function beamSections(mode) {
  const source=[[299,0],[296,1],[292,1.4],[287,2],[283,2],[263,3.5],[254,4],[251,4],[235,2.5],[226,4],[223,4],[216,2],[207,2]];
  if(mode==='optical')return [
    [[28,4],[32,6],[62,2.4],[67,2.4],[77,3.2],[97,6],[127.6,1.2]],
    [[127.6,0],[147,6],[173,6],[241,0],[262,-6*21/68],[283,-2.5],[309,-2.5]]
  ];
  if(mode==='tem')return [[...source,[196,1.5],[temSpecimenZ,1.5]],
    [[temSpecimenZ,1.5],[190,1.7],[179,3],[170,4],[167,4],[160,1.4],[155,0],[151,-1.12],[125,-8.4],[116,-4],[113,-4],[106,-4],[93,0],[81,48/13],[72,4],[69,4],[62,4],[22,24]]];
  return [[...source,[195,2],[159,3.5],[151,3.5],[137,.3]]];
}
export function beamRadiusAt(levels,z) {
  for(let i=1;i<levels.length;i++) {
    const [za,ra]=levels[i-1],[zb,rb]=levels[i];
    if(z>=Math.min(za,zb)-1e-9&&z<=Math.max(za,zb)+1e-9)return ra+(rb-ra)*(z-za)/(zb-za);
  }
  return null;
}
export function beamPointAt(levels,q,fraction=0) {
  const lengths=levels.slice(1).map(([z,r],i)=>Math.hypot(z-levels[i][0],(r-levels[i][1])*fraction));
  let distance=clamp(q,0,1)*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++) {
    if(distance<=lengths[i]||i===lengths.length-1){const t=distance/lengths[i];return[levels[i][0]+(levels[i+1][0]-levels[i][0])*t,(levels[i][1]+(levels[i+1][1]-levels[i][1])*t)*fraction];}
    distance-=lengths[i];
  }
}
export const semRadiusAtHeight=z=>Math.sqrt(Math.max(0,100-z*z));
export const semSlopeAtHeight=z=>-z/Math.sqrt(Math.max(1e-8,100-z*z));
export function semSurfaceZ(x,y) {
  const r=Math.hypot(x,y);
  if(r<=10)return semSpecimenBase+Math.sqrt(Math.max(0,100-r*r));
  return semSpecimenBase;
}
export function semScanAt(time,state) {
  const period=7*state.dwell/5,progress=((time/period)%1+1)%1;
  const row=Math.floor(progress*512),column=(progress*512)%1;
  const worldWidth=state.fov/semWorldMicrometres;
  const planeX=(column-.5)*worldWidth,planeY=(row/511-.5)*worldWidth*440/720;
  const height=semExitZ-semSpecimenBase,a=planeX*planeX+planeY*planeY+height*height;
  const discriminant=height**4-a*(height*height-100);
  const t=discriminant>=0?(height*height-Math.sqrt(discriminant))/a:1;
  const hitSphere=discriminant>=0&&t>=0&&t<=1;
  const fraction=hitSphere?t:1;
  return {progress,row,column,planeX,planeY,x:planeX*fraction,y:planeY*fraction,z:semExitZ-height*fraction,period,hitSphere};
}
export function cubicPoint(points,t) {
  const q=1-t;
  return [0,1,2].map(i=>q*q*q*points[0][i]+3*q*q*t*points[1][i]+3*q*t*t*points[2][i]+t*t*t*points[3][i]);
}
export function semSignalPath(scan,kind) {
  const p=[scan.x,scan.y,scan.z],d=kind==='SE'?[25,-1,94]:[6,-4,132];
  let a,b;
  if(kind==='SE'){
    const n=scan.hitSphere?[p[0]/10,p[1]/10,(p[2]-semSpecimenBase)/10]:[0,0,1];
    a=[p[0]+12*n[0],p[1]+12*n[1],p[2]+12*n[2]+12];
    b=[d[0]-10,d[1],d[2]+12];
  }else{a=p.map((v,i)=>v+(d[i]-v)/3);b=p.map((v,i)=>v+2*(d[i]-v)/3);}
  const points=[p,a,b,d];let visible=true;
  if(kind==='BSE'){
    // Exact segment/sphere closest approach: discrete samples miss very
    // short re-entry immediately after emission near the specimen limb.
    const c=[p[0],p[1],p[2]-semSpecimenBase],v=d.map((n,i)=>n-p[i]);
    const t=clamp(-c.reduce((sum,n,i)=>sum+n*v[i],0)/v.reduce((sum,n)=>sum+n*n,0),0,1);
    const nearest=c.reduce((sum,n,i)=>sum+(n+t*v[i])**2,0);
    return {points,visible:nearest>=100-1e-8};
  }
  for(let i=1;i<80;i++){
    const [x,y,z]=cubicPoint(points,i/80);
    if(z<semSpecimenBase-1e-6||(z>=semSpecimenBase&&x*x+y*y+(z-semSpecimenBase)**2<100-1e-5)){visible=false;break;}
  }
  return {points,visible};
}
export function electronWavelength(kV) {
  const h=6.62607015e-34,m=9.1093837139e-31,e=1.602176634e-19,c=299792458,V=kV*1000;
  return h/Math.sqrt(2*m*e*V*(1+e*V/(2*m*c*c)))*1e12;
}
export const defaults={
  optical:{focus:0,objective:40,wavelength:550,brightness:65,eyepiece:10},
  tem:{focus:0,voltage:120,thickness:70,aperture:1,magnification:20000,vacuum:true},
  sem:{focus:0,voltage:10,dwell:5,fov:60,detector:'SE',coating:true,vacuum:true}
};
export const electronLessons={
 tem:[
  {id:'baseline',label:'70 nm 기준',values:{},step:2,hint:'같은 배율·초점에서 기준 영상을 확인한 뒤 두께 또는 조리개 한 조건을 바꾸세요.'},
  {id:'thick',label:'200 nm 절편',values:{thickness:200},step:2,hint:'같은 노출 조건에서 직접빔이 감소해 영상이 어두워집니다. 다중 산란과 재료별 차이는 계산하지 않습니다.'},
  {id:'aperture',label:'좁은 조리개',values:{aperture:.25},step:3,hint:'명시야에서 일부 산란전자를 제외하는 효과를 비교합니다. 이 모형에서는 신호가 줄고 정성적 대비가 커집니다.'}
 ],
 sem:[
  {id:'baseline',label:'SE 기준',values:{},step:4,hint:'표면 형상 대비를 관찰하세요. 다음 실험은 같은 시료·시야에서 한 조건만 바꿉니다.'},
  {id:'bse',label:'BSE 비교',values:{detector:'BSE'},step:4,hint:'밝은 고원자번호 입자의 조성 대비를 비교하세요. 검출기도 옆쪽 SE에서 환형 BSE로 바뀝니다.'},
  {id:'charging',label:'코팅 해제',values:{coating:false},step:3,hint:'비전도성 시료의 대전으로 생기는 밝기 왜곡·줄무늬의 예시입니다. 실제 대전량을 예측하지는 않습니다.'},
  {id:'dwell',label:'긴 주사',values:{dwell:20},step:2,hint:'5→20 µs: 획득 시간은 4배, 이 모형의 잡음 표준편차는 절반입니다. 긴 체류시간은 실제 시료의 대전·손상을 늘릴 수도 있습니다.'}
 ]
};
export function measure(mode,s) {
  if(mode==='optical') {
    const na={4:.1,10:.25,40:.65,100:1.25}[s.objective];
    const fieldNumber=eyepieceFieldNumbers[s.eyepiece],fov=1000*fieldNumber/s.objective;
    const diffractionSigma=.22*(s.wavelength/1000)/na*720/fov;
    return {na,fieldNumber,magnification:s.objective*s.eyepiece,resolution:.61*s.wavelength/na,fov,diffractionSigma,blur:Math.abs(s.focus)*.09*450/fov,signal:s.brightness/100};
  }
  const wavelength=electronWavelength(s.voltage);
  if(mode==='tem')return {wavelength,transmission:Math.exp(-s.thickness/160),signal:s.vacuum?Math.exp(-s.thickness/160)*(.6+.4*s.aperture):0,blur:Math.abs(s.focus)*.1,magnification:s.magnification,fov:100000/s.magnification};
  return {wavelength,signal:s.vacuum?1:0,blur:Math.abs(s.focus)*.09,frameTime:512*512*s.dwell/1e6,magnification:100000/s.fov,fov:s.fov};
}
export const catalog={
  optical:{title:'광학 현미경',english:'LIGHT MICROSCOPE',short:'빛으로 보는 세포',tag:'가시광선 · 유리 렌즈 · 투과광',sample:'염색한 상피세포',imageNote:'단색 명시야 · 도립상',summary:'유리 렌즈로 빛을 굴절시켜, 시료를 통과한 빛의 상을 확대합니다.',
    stages:[['source','광원','LED가 시료 아래에서 빛을 보냅니다. 집광렌즈는 빛을 조명계로 모읍니다.'],['condenser','조명계','콘덴서가 시료 면에 조명 원뿔을 만듭니다. 조리개는 조명 각도와 대비에 영향을 줍니다.'],['specimen','시료','얇은 시료의 염색 부위마다 빛을 흡수하는 정도가 달라 밝기와 색의 차이가 생깁니다.'],['objective','대물렌즈','시료가 초점 바로 바깥에 놓이면 대물렌즈가 확대된 도립 실상을 경통 안에 만듭니다.'],['image','중간상','여기서는 유한 경통 광학계를 사용합니다. 실제로 맺힌 중간상은 원래 시료에 대해 상하좌우가 뒤집혀 있습니다.'],['eyepiece','접안렌즈','중간상을 돋보기처럼 확대해 눈에 허상을 제공합니다. 총배율은 대물배율 × 접안배율입니다.']],
    parts:{source:['LED 광원 · 집광렌즈','빛을 내보내는 조명부입니다. 이 모형은 단색광을 사용하며 색조는 파장의 예시입니다. 염색 물질의 흡수 스펙트럼은 계산하지 않습니다. 광량으로 분해능이 개선되지는 않습니다.'],condenser:['콘덴서 · 개구 조리개','유리 렌즈가 조명광을 시료에 모읍니다. 실제 해상도는 대물렌즈뿐 아니라 조명의 개구수와 정렬에도 영향을 받습니다.'],specimen:['재물대 · 슬라이드 · 시료','슬라이드는 클립으로 고정됩니다. 미동 조절로 시료와 대물렌즈 사이의 거리를 바꿔 초점을 맞춥니다.'],objective:['회전판 · 대물렌즈','대물렌즈를 바꾸면 배율과 개구수(NA)가 함께 달라집니다. 100× / NA 1.25는 오일을 사용하는 유침 조건입니다.'],image:['경통 · 중간상면','대물렌즈가 만든 도립 실상이 형성됩니다. 이 모형은 튜브렌즈를 쓰는 무한광학계와 구분되는 유한 경통 방식입니다.'],eyepiece:['접안렌즈','중간상을 확대합니다. 접안배율만 높이면 분해 가능한 세부 구조는 그대로인 공배율이 생길 수 있습니다.'],focus:['조동 · 미동 나사','재물대 높이를 바꿔 시료를 대물렌즈의 초점 근처에 놓습니다. 고배율에서는 미동 조절이 특히 중요합니다.'],frame:['스탠드 · 지지대','조명부와 광학계의 축을 유지하고 진동을 줄입니다. 앞쪽 외장을 절개해 내부 렌즈를 드러냈습니다.']}},
  tem:{title:'투과 전자 현미경',english:'TRANSMISSION ELECTRON MICROSCOPE',short:'전자로 보는 내부',tag:'전자 투과 · 전자기 렌즈 · 진공',sample:'미토콘드리아의 초박 절편',imageNote:'명시야 TEM · 2차원 투영',summary:'얇은 시료를 통과한 전자를 전자기 렌즈로 확대해 내부 미세구조를 관찰합니다.',
    stages:[['source','전자총','음극에서 나온 전자를 Wehnelt 전극이 제어하고 양극과의 전위차가 가속합니다.'],['condenser','집속','전자기 렌즈의 자기장이 전자 궤적을 휘게 해 시료를 비춥니다. 유리 렌즈는 사용하지 않습니다.'],['specimen','초박 절편','얇은 절편을 통과하면서 전자의 일부가 산란합니다. 두껍거나 무거운 원소가 많은 곳은 명시야에서 대체로 어둡게 보입니다.'],['objective','대비 형성','시료는 대물렌즈의 상·하 폴피스 간극에 놓입니다. 대물렌즈가 첫 확대상을 만듭니다. 대물조리개가 고각 산란전자를 제외해 명시야의 진폭 대비를 높입니다.'],['image','확대','중간렌즈와 투영렌즈가 상을 추가로 확대합니다. 시료를 지난 여러 깊이의 정보가 한 영상에 겹칩니다.'],['detector','검출','카메라가 전자 신호를 밝기로 변환합니다. 이 모형은 영상 모드이며 회절 모드나 STEM 주사는 다루지 않습니다.']],
    parts:{source:['전자총 · Wehnelt 전극 · 양극','이 절개도는 Wehnelt 전극을 사용하는 열전자총의 예입니다. 위쪽 음극이 전자를 내보냅니다. 가속전압을 높이면 드브로이 파장이 짧아지지만 실제 분해능은 수차·안정성·시료에도 제한됩니다.'],condenser:['콘덴서 렌즈 · 조리개','코일 전류가 만든 자기장으로 전자빔을 제어합니다. 절개면의 여러 겹은 코일, 바깥 고리는 철심을 나타냅니다.'],specimen:['시료 홀더 · 그리드 · 초박 절편','생물 시료는 보통 고정·탈수·포매·초박절편 제작·중금속 염색 등을 거칩니다. 여기서는 70 nm 절편에서 시작합니다. 생시료 그대로의 관찰은 아닙니다.'],objective:['대물렌즈 · 대물조리개','명시야에서는 주로 직접 투과한 전자를 사용합니다. 작은 조리개는 일부 산란전자를 차단해 대비를 높이지만 신호량과 전달되는 정보도 바꿉니다.'],image:['중간렌즈 · 투영렌즈','전자 상을 검출기까지 확대합니다. 배율은 렌즈 전류와 배치에 따라 정해지며, 확대와 분해능은 서로 다른 값입니다.'],detector:['전자 검출 카메라','검출기는 아래쪽에 있습니다. 두꺼운 시료에서는 다중 산란 때문에 단순히 전압을 올리는 것만으로 좋은 상을 얻기 어렵습니다.'],vacuum:['진공 펌프 · 경통','공기 분자와의 충돌을 줄이고 전자원과 시료를 보호합니다. 진공을 끄면 이 교육 모형에서는 빔과 영상이 멈춥니다.'],frame:['스탠드 · 기둥','긴 전자광학계를 정렬하고 지지합니다. 그림의 빔 폭과 부품 비율은 작동 원리를 잘 보이도록 조정했습니다.']}},
  sem:{title:'주사 전자 현미경',english:'SCANNING ELECTRON MICROSCOPE',short:'훑어서 보는 표면',tag:'전자 주사 · 방출 신호 · 진공',sample:'건조한 꽃가루 표면',imageNote:'SE · 표면 형상 대비',summary:'가느다란 전자 탐침으로 표면을 훑고, 위치마다 검출한 신호를 픽셀 밝기로 기록합니다.',
    stages:[['source','전자총','이 도해의 열전자총에서 나온 전자가 가속전압에 의해 아래로 진행합니다.'],['condenser','탐침 형성','콘덴서와 조리개가 빔을 줄입니다. 최종 대물렌즈는 시료 표면에 작은 전자 탐침을 만듭니다.'],['scan','래스터 주사','X·Y 주사 코일이 빔을 편향시켜 한 줄씩 표면을 훑습니다. 화면의 주사는 이해를 돕기 위해 느리게 표시합니다.'],['specimen','표면 상호작용','입사 전자가 시료와 상호작용해 이차전자(SE)와 후방산란전자(BSE) 등을 만듭니다.'],['detector','신호 수집','옆쪽 SE 검출기는 표면 형상, 대물렌즈 아래의 BSE 검출기는 주로 조성 차이에 민감합니다.'],['image','영상 조립','빔의 X·Y 좌표에 검출 신호를 대응시켜 2차원 영상을 만듭니다. 입체감은 표면 대비에서 생깁니다.']],
    parts:{source:['전자총 · 가속부','가속전압은 전자 에너지를 결정합니다. 전압을 높이면 상호작용 부피가 커지는 경향이 있어 표면의 작은 구조가 항상 더 선명해지는 것은 아닙니다.'],condenser:['콘덴서 · 조리개','전자기 렌즈로 빔을 좁힙니다. 렌즈 수차와 탐침 전류 사이의 절충이 있으므로 전자 파장만으로 장비 분해능을 계산할 수 없습니다.'],scan:['X·Y 주사 코일','네 권선 블록은 X·Y 편향 코일 쌍의 단면을 단순화한 것입니다. 두 방향의 자기장으로 빔을 편향합니다. 각 줄을 읽은 뒤 되돌아가는 래스터 주사를 반복합니다. 실제 편향은 코일에서 일어납니다. 그림 아래쪽 주사선은 등가 피벗에서 표시한 모식 경로이며 픽셀 기록과 같은 좌표를 씁니다.'],objective:['최종 대물렌즈 · 폴피스','시료 위에 작은 탐침을 형성합니다. 초점과 작업거리, 수차가 탐침 크기에 영향을 줍니다.'],specimen:['시료실 · 스테이지 · 스텁','이 모형의 시료는 건조한 비전도성 꽃가루입니다. 일반 고진공 관찰에서 얇은 전도성 코팅은 대전을 줄입니다. 저진공·저전압 등 다른 방법도 있습니다.'],detector:['SE 검출기 · 환형 BSE 검출기','SE는 주로 얕은 표면에서 발생해 지형 정보를 줍니다. BSE는 더 깊은 영역에서도 나올 수 있고 평균 원자번호가 큰 부분이 보통 더 밝습니다.'],image:['주사 좌표 · 픽셀 영상','SEM이 직접 3차원 지도를 측정하는 것은 아닙니다. 관찰 영상은 표면 형상의 입체감이 있는 2차원 영상입니다.'],vacuum:['진공 펌프 · 시료실','전자빔의 기체 산란을 줄입니다. 일반적인 고진공 SEM 조건을 모형화했으며 저진공 모드는 별도 원리입니다.'],frame:['장비 프레임 · 챔버','단단한 하부판과 기둥이 전자광학계와 시료실을 지지합니다. 앞쪽 벽을 열어 스테이지와 검출기 위치를 드러냈습니다.']}}
};
