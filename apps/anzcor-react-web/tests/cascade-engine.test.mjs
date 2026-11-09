import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAURA} from '../src/runtime.mjs';
import {CRISIS_VARIANTS,selectCrisisVariant,crisisEvidence} from '../src/cascade-engine.mjs';
import {createAlexSession,alexDispatch,replayAlex} from '../src/alex-infection.mjs';
const seed=JSON.parse(readFileSync(new URL('../content/scenarios/cerebral-palsy-respiratory-aac-v01.json',import.meta.url),'utf8'));
const d=(s,kind,crisisSeed)=>alexDispatch(s,seed,{kind,crisisSeed});
test('each crisis has 4 timestamped events with source and uncertainty',()=>{
 for(const v of CRISIS_VARIANTS){assert.equal(v.events.length,4);assert.deepEqual(v.events.map(e=>e.second),[18,29,39,50]);
 for(const e of v.events){assert.ok(e.source);assert.ok(e.known);assert.ok(e.unknown);assert.ok(e.workstream);}
 }
});
test('the same seed reproduces the same bounded surprise, other seeds may vary',()=>{
 assert.equal(selectCrisisVariant(0).id,'airway-perfusion-artifact');
 assert.equal(selectCrisisVariant(232).id,selectCrisisVariant(232).id);
 assert.ok(new Set(Array.from({length:15},(_,i)=>selectCrisisVariant(i+1).id)).size>1);
});
test('the crisis does not advance when paused',()=>{
 let s=d(createAlexSession(seed),'TRIGGER_CASCADE',0);assert.equal(s.crisis.index,1);
 s=d(s,'PAUSE');const clock=s.clock; s=d(s,'NEXT_CASCADE');assert.equal(s.clock,clock);assert.equal(s.crisis.index,1);
});
test('default trigger authors respiratory cue but not diagnosis, shock or therapy',()=>{
 let s=d(createAlexSession(seed),'TRIGGER_CASCADE',0);
 assert.equal(s.clock,14*3600+10*60+18);assert.equal(s.clinical.breathingEffort,'INCREASED_OBSERVED_SYNTHETIC');
 assert.equal(s.clinical.shock,'NOT_ESTABLISHED');
 assert.equal(s.clinical.antibioticAdministered,false);
 assert.equal(s.clinical.invasiveProcedurePerformed,false);
 assert.equal(s.clinical.oxygenation,'UNVERIFIED');
});
test('a monitor alarm is not verified ventricular arrhythmia or cardiac arrest',()=>{
 let s=d(createAlexSession(seed),'TRIGGER_CASCADE',0);s=d(s,'NEXT_CASCADE');
 assert.equal(s.system.telemetry,'POOR_SIGNAL_DANGEROUS_RHYTHM_UNVERIFIED');
 assert.equal(s.clinical.rhythm,'UNKNOWN_NOT_ACQUIRED');
 assert.equal(s.clinical.rosc,'NOT_APPLICABLE_NO_ARREST_DIAGNOSIS');
});
test('one low BP measurement does not establish shock or replace earlier observation history',()=>{
 let s=d(createAlexSession(seed),'TRIGGER_CASCADE',0);s=d(s,'NEXT_CASCADE');s=d(s,'NEXT_CASCADE');
 assert.equal(s.clock,14*3600+10*60+39);
 assert.match(s.clinical.bloodPressure,/88\/54/);
 assert.equal(s.clinical.shock,'NOT_ESTABLISHED');
 assert.equal(s.clinical.measuredTemperatureC,39.4);
});
test('AAC dislodgement is not a capacity judgement, consent or patient utterance',()=>{
 let s=d(createAlexSession(seed),'TRIGGER_CASCADE',0);
 for(let i=0;i<3;i++)s=d(s,'NEXT_CASCADE');
 assert.equal(s.clock,14*3600+10*60+50);
 assert.equal(s.access.communicationSupport,'DEVICE_OUT_OF_REACH');
 assert.equal(s.access.patientWords,'NO_NEW_VERIFIED_MESSAGE');
 assert.equal(s.access.capacity,'NOT_INFERRED');
 assert.equal(s.access.supporterAuthority,'NOT_ASSUMED');
 assert.equal(s.crisis.status,'DECISION_HOLD');
});
test('unrecognised treatment command and duplicate trigger do not invent effects',()=>{
 let s=d(createAlexSession(seed),'TRIGGER_CASCADE',0);
 s=d(s,'TRIGGER_CASCADE',200);
 assert.equal(s.crisis.seed,0);
 s=d(s,'SHOCK_PATIENT');
 assert.equal(s.clinical.antibioticAdministered,false);
 assert.equal(s.clinical.rosc,'NOT_APPLICABLE_NO_ARREST_DIAGNOSIS');
});
test('Rohan case remains untouched by Alex crisis',()=>{
 const before=createAURA();let s=d(createAlexSession(seed),'TRIGGER_CASCADE',0);s=d(s,'NEXT_CASCADE');
 assert.equal(before.clinical.rhythm,'ASYSTOLE');assert.equal(before.person.aac,'WAIT');assert.equal(before.clinical.rosc,false);
});
test('replay all commands produces exact same event clock and ledger',()=>{
 let s=d(createAlexSession(seed),'TRIGGER_CASCADE',0);
 for(let i=0;i<3;i++)s=d(s,'NEXT_CASCADE');
 assert.deepEqual(replayAlex(seed,s.commands).ledger,s.ledger);
 assert.deepEqual(replayAlex(seed,s.commands).crisis,s.crisis);
 assert.deepEqual(replayAlex(seed,s.commands).clinical,s.clinical);
});
test('source-labelled facts never grant treatment authority',()=>{
 const e=crisisEvidence('airway-perfusion-artifact',2);
 assert.equal(e.treatmentAuthority,false);
 assert.equal(e.scope,'AUTHORED_FICTIONAL_CASE_OBSERVATION');
});
