import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS,getLesson,transportSummary,DEFAULT_OPTIONS,QUIZ} from './lessons.js';

test('36 selectable scenes have complete explanations and known stage order',()=>{
 let count=0;
 for(const id of ['diffusion','osmosis','facilitated','active']){
  const lesson=getLesson(id);assert.equal(lesson.stages.length,3);
  for(const st of lesson.stages){assert.equal(st.scenes.length,3);assert.ok(st.name&&st.summary&&st.why&&st.location&&st.basis);for(const s of st.scenes){assert.ok(s.title&&s.narration&&s.equation&&s.kind&&Array.isArray(s.outputs));count++;}}
 }
 assert.equal(count,36);
});
test('all six tonicity/cell combinations give consistent water direction and shape',()=>{
 for(const cell of ['animal','plant'])for(const [solution,waterNet,direction]of [['hypotonic','into','밖 → 안'],['isotonic','none','순이동 없음'],['hypertonic','out','안 → 밖']]){
  const lesson=getLesson('osmosis',{cell,solution}),summary=transportSummary('osmosis',{cell,solution});
  assert.equal(summary.waterNet,waterNet);assert.equal(summary.direction,direction);
  assert.equal(lesson.stages[1].scenes[1].outputs[0].amount,direction);
  assert.equal(lesson.stages[2].products[0].amount,summary.cellState);
  assert.equal(summary.atp,0);
 }
 assert.match(getLesson('osmosis',{cell:'plant',solution:'hypotonic'}).stages[1].scenes[2].narration,/팽압/);
 assert.match(transportSummary('osmosis',{cell:'plant',solution:'hypertonic'}).cellState,/원형질 분리/);
 assert.match(transportSummary('osmosis',{cell:'animal',solution:'hypertonic'}).cellState,/수축/);
 assert.match(transportSummary('osmosis',{cell:'plant',solution:'isotonic'}).cellState,/이완/);
});
test('pump cycle has ATP1, three Na out, two K in without consuming ATP per stage',()=>{
 const ledger=LESSONS.active.stages.map(st=>st.transport);
 const sum=k=>ledger.reduce((n,v)=>n+v[k],0);
 assert.equal(sum('atpUsed'),1);assert.equal(sum('naOut'),3);assert.equal(sum('kIn'),2);
 const summary=transportSummary('active');
 assert.equal(summary.atp,1);assert.equal(summary.netNa,-3);assert.equal(summary.netK,2);
 assert.equal(summary.netNa+summary.netK,-1,'one net positive charge transported outward');
});
test('passive pathways do not directly consume ATP and presets cannot change their lesson',()=>{
 for(const id of ['diffusion','facilitated']){
  assert.equal(transportSummary(id).atp,0);
  assert.deepEqual(getLesson(id,{solution:'hypertonic',cell:'plant'}),getLesson(id));
 }
});
test('lesson copies and invalid-preset fallback preserve shared data',()=>{
 const original=JSON.stringify(LESSONS),a=getLesson('osmosis');a.stages[0].scenes[0].title='edited';
 assert.equal(JSON.stringify(LESSONS),original);
 assert.notEqual(getLesson('osmosis').stages[0].scenes[0].title,'edited');
 assert.deepEqual(getLesson('osmosis',{solution:'invalid',cell:'invalid'}).options,DEFAULT_OPTIONS);
 assert.throws(()=>getLesson('missing'),RangeError);assert.throws(()=>transportSummary('missing'),RangeError);
 for(const q of QUIZ)assert.ok(q.options[q.answer]&&q.explanation);
});
