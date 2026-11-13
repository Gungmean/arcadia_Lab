export const R=8.31446261815324,N=.04,T0=300,P0=120000,A=.005,SCALE=400;
export const CV=1.5*R,CP=2.5*R,V0=N*R*T0/P0;
export const limits={min:-60,max:120};
export function stateAt(mode,heat,progress=1,insulated=false){
  const Q=insulated?0:Math.max(limits.min,Math.min(limits.max,heat))*Math.max(0,Math.min(1,progress));
  const T=T0+Q/(N*(mode==='locked'?CV:CP));
  const V=mode==='locked'?V0:N*R*T/P0,P=N*R*T/V;
  const dU=N*CV*(T-T0),W=mode==='locked'?0:P0*(V-V0);
  return{Q,T,V,P,dU,W,height:V/A*SCALE,residual:Q-dU-W};
}
export function pathOf(mode,heat,insulated=false){return Array.from({length:81},(_,i)=>stateAt(mode,heat,i/80,insulated));}
