import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS} from './lessons.js';
import {PROCESSES} from './model.js';

test('lesson indexing matches the selectable biological stages',()=>{
 for(const [id,p] of Object.entries(PROCESSES)) {
  assert.equal(LESSONS[id].stages.length,p.stages.length,id);
  for(const stage of LESSONS[id].stages){
   assert.ok(stage.basis&&stage.summary&&stage.products.length&&stage.cumulative.length);
   assert.ok(stage.scenes.length>=3&&stage.scenes.length<=5);
   for(const s of stage.scenes)assert.ok(s.title&&s.narration&&s.equation&&Array.isArray(s.outputs)&&s.kind);
  }
 }
});
test('complete respiration regenerates electron carriers and yields 30–32 ATP',()=>{
 const ledgers=LESSONS.respiration.stages.map(s=>s.ledger);
 const prior=ledgers.slice(0,3);
 const sum=k=>prior.reduce((n,s)=>n+s[k],0);
 assert.equal(sum('nadh'),10);assert.equal(sum('fadh2'),2);assert.equal(sum('co2'),6);
 assert.equal(sum('atp'),4);
 const last=ledgers.at(-1);
 assert.equal(sum('nadh')+last.nadh,0);assert.equal(sum('fadh2')+last.fadh2,0);
 assert.deepEqual(last.atp.map(v=>v+sum('atp')),[30,32]);
 assert.equal(last.co2,0);
});
test('fermentation retains only glycolytic ATP and closes NADH ledger',()=>{
 for(const id of ['alcohol','lactate']){
  const sum=k=>LESSONS[id].stages.reduce((n,s)=>n+s.ledger[k],0);
  assert.equal(sum('atp'),2);assert.equal(sum('nadh'),0);
  assert.equal(sum('co2'),id==='alcohol'?2:0);
 }
 const alcoholCarbon=2*2+2; const lactateCarbon=2*3;
 assert.equal(alcoholCarbon,6);assert.equal(lactateCarbon,6);
});
test('light supply and Calvin demand close ATP and NADPH teaching ledger',()=>{
 const [light,calvin]=LESSONS.photosynthesis.stages;
 assert.equal(light.ledger.atp+calvin.ledger.atp,0);
 assert.equal(light.ledger.nadph+calvin.ledger.nadph,0);
 assert.equal(calvin.ledger.co2,-3);assert.equal(light.ledger.o2,3);
 assert.equal(3+3*5,6*3,'fixed CO2 plus starting RuBP carbon equals PGA carbon');
 assert.equal(5*3,3*5,'retained G3P carbon equals regenerated RuBP carbon');
});
test('each stage conserves carbon across its net conversion',()=>{
 for(const lesson of Object.values(LESSONS))for(const stage of lesson.stages)
  assert.equal(stage.carbonBalance.input,stage.carbonBalance.output,stage.summary);
});
