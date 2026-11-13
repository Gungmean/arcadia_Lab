import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluate, DEFAULTS, PROCESSES, QUIZ} from './model.js';

test('aerobic full-path flux needs oxygen; zero substrate halts glucose catabolism',()=>{
  assert.equal(evaluate('respiration',{oxygen:0}).rate,0);
  for(const id of ['respiration','alcohol','lactate']) assert.equal(evaluate(id,{substrate:0}).rate,0);
});
test('steady-state carbon fixation needs light and carbon dioxide',()=>{
  assert.equal(evaluate('photosynthesis',{light:0}).rate,0);
  assert.equal(evaluate('photosynthesis',{co2:0}).rate,0);
  assert.equal(evaluate('photosynthesis').atp,0);
  assert.equal(evaluate('photosynthesis').atpLabel,'내부 소비');
});
test('supply limitation responds monotonically and saturates',()=>{
  for(const id of Object.keys(PROCESSES)) for(const key of PROCESSES[id].controls.filter(key=>key!=='temperature')) {
    let previous=-1;
    for(let value=0;value<=100;value+=5) {
      const rate=evaluate(id,{substrate:100,oxygen:100,co2:100,light:100,[key]:value}).rate;
      assert.ok(rate>=previous,`${id}:${key} at ${value}`); previous=rate;
    }
  }
});
test('ATP yield is separate from rate and fermentation makes only net 2',()=>{
  assert.equal(evaluate('respiration',{oxygen:5}).atp,evaluate('respiration',{oxygen:100}).atp);
  for(const id of ['alcohol','lactate']) {
    assert.equal(evaluate(id).atp,2);
    assert.equal(evaluate(id,{oxygen:0}).rate,evaluate(id,{oxygen:100}).rate);
  }
});
test('temperature model has a peak and output remains finite and bounded',()=>{
  assert.ok(evaluate('respiration',{temperature:30}).rate>evaluate('respiration',{temperature:5}).rate);
  assert.ok(evaluate('respiration',{temperature:30}).rate>evaluate('respiration',{temperature:60}).rate);
  for(const id of Object.keys(PROCESSES)) for(const temperature of [-50,0,30,60,100,NaN]) {
    const state=evaluate(id,{temperature,substrate:150,oxygen:-10});
    assert.ok(Number.isFinite(state.rate)&&state.rate>=0&&state.rate<=1);
  }
  assert.throws(()=>evaluate('unknown'),RangeError);
  assert.deepEqual(DEFAULTS,{temperature:30,substrate:75,oxygen:80,light:70,co2:65});
});
test('lessons include places, material accounts and quiz feedback',()=>{
  for(const process of Object.values(PROCESSES)) {
    assert.ok(process.stages.length>=2);
    for(const stage of process.stages) assert.ok(stage.location&&stage.inputs.length&&stage.outputs.length&&stage.why);
  }
  assert.equal(QUIZ.length,4);
  for(const quiz of QUIZ) assert.ok(quiz.options[quiz.answer]&&quiz.explanation);
});
