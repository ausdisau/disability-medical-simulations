import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAlexSession,alexDispatch} from '../src/alex-infection.mjs';
import {ETIOLOGIES,createDifferential,authorDifferential,evidenceRevealGate,medicationGateForDifferential,diagnosticCoaching} from '../src/infection-differential.mjs';
const seed=JSON.parse(readFileSync(new URL('../content/scenarios/cerebral-palsy-respiratory-aac-v01.json',import.meta.url),'utf8'));
const d=(s,kind,id)=>alexDispatch(s,seed,{kind,id});
const complete=(s,id)=>d(d(d(d(d(s,'SELECT',id),'CHECK',id),'ASSIGN',id),'COMMIT',id),'REASSESS',id);
test('viral is itself microbial; distinguish viral, bacterial, mixed and aspiration causes',()=>{
 assert.deepEqual(ETIOLOGIES.map(x=>x.id),['viral-supported','bacterial-supported','mixed-supported','aspiration-uncertain']);
});
test('facilitator cannot author test evidence before assessment and infection source workup',()=>{
 const s=createAlexSession(seed);const r=authorDifferential(createDifferential(),s,'viral-supported','FACILITATOR');
 assert.equal(r.ok,false);assert.equal(r.state.revealed,null);
});
test('JMO cannot author etiology or lab results regardless of completed workup',()=>{
 let s=d(createAlexSession(seed),'RUN');s=complete(s,'OBS');s=complete(s,'CHEST');
 assert.equal(evidenceRevealGate(s,'viral-supported').allow,true);
 const result=authorDifferential(createDifferential(),s,'viral-supported','JMO');
 assert.equal(result.ok,false);
});
test('each reviewed fork only reveals synthetic evidence and never prescribes or changes physiology',()=>{
 let s=d(createAlexSession(seed),'RUN');s=complete(s,'OBS');s=complete(s,'CHEST');
 for(const etiology of ETIOLOGIES){
  const r=authorDifferential(createDifferential(),s,etiology.id,'FACILITATOR');
  assert.equal(r.ok,true);
  assert.equal(r.state.sepsis,'NOT_ESTABLISHED');
  assert.equal(r.state.clinicalDiagnosis,'UNCONFIRMED');
  assert.deepEqual(r.state.medicalOrders,[]);
  assert.deepEqual(r.state.physiologyEffects,[]);
  assert.equal(s.clinical.measuredTemperatureC,39.4);
  assert.equal(s.clinical.antibioticAdministered,false);
 }
});
test('positive viral test does not exclude bacterial co-infection',()=>{
 assert.match(ETIOLOGIES[0].ambiguity,/does not exclude/);
});
test('focal infiltrate does not independently prove bacterial cause',()=>{
 assert.match(ETIOLOGIES[1].ambiguity,/do not prove/);
});
test('mixed fork does not claim organism coinfection confirmed',()=>{
 assert.match(ETIOLOGIES[2].evidence[2].finding,/not proven/);
});
test('aspiration branch does not equate disability with cause',()=>{
 assert.match(ETIOLOGIES[3].actionAuthority,/cerebral palsy/);
});
test('medication guardian stays held even when viral PCR is detected',()=>{
 const gate=medicationGateForDifferential(createDifferential(),createAlexSession(seed),'antiviral');
 assert.equal(gate.canAdminister,false);assert.equal(gate.canPrescribe,false);
});
test('diagnostic coaching is read-only',()=>{
 const coach=diagnosticCoaching(createDifferential());
 assert.equal(coach.canCommit,false);assert.equal(coach.medicineOrder,null);
});
