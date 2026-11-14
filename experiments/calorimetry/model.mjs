export const SPECIFIC_HEAT=4.184,INITIAL_T=25,POWER=20,HEATING_TIME=60,REACTION_TIME=20;
export const REACTIONS={neutralization:{label:'염산·수산화 나트륨 중화',equation:'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)',enthalpy:-57.3,kind:'발열',note:'강산·강염기 중화의 근삿값을 일정하게 적용합니다. 생성된 물 1 mol 기준입니다.'},endothermic:{label:'흡열 비교 모형',equation:'A(aq) + B(aq) → C(aq)',enthalpy:25,kind:'흡열',note:'부호 비교를 위한 가상 반응입니다. 실제 시약의 실험값이 아닙니다.'}};
export const defaults={mode:'reaction',reaction:'neutralization',volumeA:50,volumeB:50,concentration:.5,calCapacity:35,loss:0};
export function setup(options={}){
 const o={...defaults,...options},mass=o.mode==='calibration'?100:o.volumeA+o.volumeB;
 const extent=Math.min(o.volumeA,o.volumeB)*o.concentration/1000;
 const duration=o.mode==='calibration'?HEATING_TIME:REACTION_TIME;
 const source=o.mode==='calibration'?POWER*HEATING_TIME:-REACTIONS[o.reaction].enthalpy*1000*extent;
 return{...o,mass,extent,duration,source,capacity:mass*SPECIFIC_HEAT+o.calCapacity};
}
export function stateAt(options={},time=0){
 const s=setup(options),t=Math.max(0,Math.min(120,time)),active=Math.min(t,s.duration),rate=s.source/s.duration;
 const rise=s.loss===0?rate*active/s.capacity:rate/s.loss*(-Math.expm1(-s.loss*active/s.capacity))*Math.exp(-s.loss*Math.max(0,t-s.duration)/s.capacity);
 const qsource=rate*active,qsolution=s.mass*SPECIFIC_HEAT*rise,qcal=s.calCapacity*rise,qexternal=qsource-qsolution-qcal;
 return{...s,time:t,temperature:INITIAL_T+rise,deltaT:rise,qsource,qsolution,qcal,qexternal,qreaction:s.mode==='reaction'?-qsource:0,complete:t>=s.duration,progress:active/s.duration};
}
export function observe(options,time,usedCapacity=35,includeCal=true){
 const s=stateAt(options,time),qsol=s.mass*SPECIFIC_HEAT*s.deltaT,qcal=(includeCal?usedCapacity:0)*s.deltaT;
 return{...s,estimatedHeat:-(qsol+qcal),estimatedEnthalpy:s.complete&&s.mode==='reaction'?-(qsol+qcal)/s.extent/1000:null,estimatedCapacity:s.mode==='calibration'&&s.complete&&Math.abs(s.deltaT)>1e-9?s.qsource/s.deltaT-s.mass*SPECIFIC_HEAT:null};
}
