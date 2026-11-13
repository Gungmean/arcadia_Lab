import {test} from 'node:test';import assert from 'node:assert/strict';
import{stateAt,N,R,T0,P0,V0,CP,CV,A,SCALE}from'./model.mjs';
test('ideal gas and first law hold across heating/cooling and both paths',()=>{
 for(const mode of ['free','locked'])for(let q=-60;q<=120;q++)for(const t of[0,.1,.5,1]){
 const s=stateAt(mode,q,t);assert.ok(Math.abs(s.P*s.V-N*R*s.T)<1e-9);assert.ok(Math.abs(s.residual)<1e-10);assert.ok(s.T>0);assert.equal(s.height,s.V/A*SCALE);
 if(mode==='free')assert.ok(Math.abs(s.P-P0)<1e-8);else{assert.equal(s.V,V0);assert.equal(s.W,0);}
 }});
test('same heat has different temperature rise with correct work split',()=>{
 const f=stateAt('free',100),l=stateAt('locked',100);
 assert.ok(Math.abs(f.W-40)<1e-10);assert.ok(Math.abs(f.dU-60)<1e-10);assert.ok(Math.abs(l.dU-100)<1e-10);
 assert.ok(Math.abs((l.T-T0)/(f.T-T0)-CP/CV)<1e-12);
});
test('insulated fixed-load/locked apparatus has no change; this is not adiabatic compression',()=>{
 for(const mode of['free','locked']){const s=stateAt(mode,120,1,true);assert.equal(s.Q,0);assert.equal(s.T,T0);assert.equal(s.V,V0);}
});
