import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAlexSession,alexDispatch,alexGate,alexStationStatus,replayAlex,alexSnapshot} from '../src/alex-infection.mjs';
import {createAURA} from '../src/runtime.mjs';
const caseSeed=JSON.parse(readFileSync(new URL('../content/scenarios/cerebral-palsy-respiratory-aac-v01.json',import.meta.url),'utf8'));
const d=(s,kind,id,seconds)=>alexDispatch(s,caseSeed,{kind,id,seconds});
function complete(s,id){
 return d(d(d(d(d(s,'SELECT',id),'CHECK',id),'ASSIGN',id),'COMMIT',id),'REASSESS',id);
}
test('Alex fever is explicitly synthetic and chest infection remains working diagnosis',()=>{
 const s=createAlexSession(caseSeed);
 assert.equal(s.clinical.measuredTemperatureC,39.4);
 assert.equal(s.clinical.temperatureOrigin,'AUTHOR_AUTHORED_SYNTHETIC');
 assert.match(s.clinical.workingDiagnosis,/Chest infection/);
 assert.equal(s.clinical.pneumonia,'NOT_CONFIRMED');
 assert.equal(s.clinical.lethargy,'MARKED_NEW_LETHARGY');
});
test('possible sepsis without organ dysfunction cannot be labelled proven sepsis',()=>{
 const s=createAlexSession(caseSeed);
 assert.match(s.clinical.sepsis,/NEEDS_CLINICAL_ASSESSMENT/);
 assert.equal(s.clinical.shock,'NOT_ESTABLISHED');
 assert.equal(s.clinical.oxygenation,'UNVERIFIED');
});
test('Rohan remains independent and medically unrelated to adult fever scenario',()=>{
 const rohan=createAURA();const alex=createAlexSession(caseSeed);
 assert.equal(rohan.person.aac,'WAIT');
 assert.equal(rohan.clinical.rhythm,'ASYSTOLE');
 assert.notEqual(rohan.caseId,alex.scenarioId);
 assert.equal(alex.clinical.measuredTemperatureC,39.4);
});
test('selection and checking do not order or author medication',()=>{
 let s=createAlexSession(caseSeed);s=d(d(s,'SELECT','MED'),'CHECK','MED');
 assert.equal(s.clinical.antibioticAdministered,false);
 assert.equal(s.completed.length,0);
});
test('high risk antibiotics and invasive airway never become committable',()=>{
 let s=d(createAlexSession(caseSeed),'RUN');
 for(const id of ['ANTIBIOTICS','AIRWAY']){
  assert.equal(alexGate(s,caseSeed,id).allow,false);
  s=complete(s,id);
  assert.equal(s.completed.includes(id),false);
 }
 assert.equal(s.clinical.antibioticAdministered,false);
 assert.equal(s.clinical.invasiveProcedurePerformed,false);
});
test('urgent assessment and CERS referral can be documented without invented results',()=>{
 let s=d(createAlexSession(caseSeed),'RUN');
 s=complete(s,'OBS');s=complete(s,'CERS');
 assert.equal(s.reassessed.includes('OBS'),true);
 assert.equal(s.reassessed.includes('CERS'),true);
 assert.equal(s.clinical.respiratoryRate,'NOT_MEASURED');
 assert.equal(s.clinical.bloodPressure,'NOT_MEASURED');
 assert.equal(s.clinical.consciousness,'UNASSESSED');
});
test('AAC support restores access conditions without new patient message or capacity finding',()=>{
 let s=d(createAlexSession(caseSeed),'RUN');s=complete(s,'AAC');
 assert.equal(s.access.communicationSupport,'ACCESS_ASSISTANCE_OFFERED');
 assert.equal(s.access.patientWords,'NO_NEW_VERIFIED_MESSAGE');
 assert.equal(s.access.capacity,'NOT_INFERRED');
});
test('sepsis and imaging stations cannot fabricate results or treatments',()=>{
 let s=d(createAlexSession(caseSeed),'RUN');
 s=complete(s,'SEPSIS');s=complete(s,'CHEST');s=complete(s,'MED');
 assert.equal(s.clinical.pneumonia,'NOT_CONFIRMED');
 assert.equal(s.clinical.sepsis,'SUSPECTED_RISK_NEEDS_CLINICAL_ASSESSMENT');
 assert.equal(s.clinical.chestImaging,'NO_RESULT');
 assert.equal(s.clinical.antibioticAdministered,false);
});
test('clock steps cannot automatically worsen or improve fever, alertness or oxygenation',()=>{
 let s=d(createAlexSession(caseSeed),'RUN');s=d(s,'STEP',null,12);
 assert.equal(s.clinical.measuredTemperatureC,39.4);
 assert.equal(s.clinical.lethargy,'MARKED_NEW_LETHARGY');
 assert.equal(s.clinical.oxygenation,'UNVERIFIED');
});
test('safety gate requires running, evidence check and an assigned synthetic role',()=>{
 let s=createAlexSession(caseSeed);s=d(s,'COMMIT','OBS');
 assert.equal(s.completed.length,0);
 s=d(s,'RUN');s=d(s,'COMMIT','OBS');
 assert.equal(s.completed.length,0);
 s=complete(s,'OBS');
 assert.equal(alexStationStatus(s,caseSeed,'OBS'),'REASSESSED');
});
test('replay reconstructs synthetic event log without physiology changes',()=>{
 let s=d(createAlexSession(caseSeed),'RUN');s=complete(s,'OBS');s=complete(s,'AAC');
 const replayed=replayAlex(caseSeed,s.commands);
 assert.deepEqual(replayed.clinical,s.clinical);
 assert.deepEqual(replayed.access,s.access);
 assert.deepEqual(replayed.ledger,s.ledger);
});
test('case has urgency, separate baseline, incident and uncertainty',()=>{
 assert.equal(caseSeed.caseLinkage,'SEPARATE_FROM_ROHAN');
 assert.ok(caseSeed.patient.baseline.speech.includes('Dysarthric'));
 assert.equal(caseSeed.clinicalOverlay.syntheticOnly,true);
 assert.equal(caseSeed.clinicalOverlay.lethargy.consciousness,'UNASSESSED');
 assert.equal(caseSeed.interventionStations.length,8);
 assert.equal(alexSnapshot(createAlexSession(caseSeed)).status,'FICTIONAL_ACUTE_ED');
});
