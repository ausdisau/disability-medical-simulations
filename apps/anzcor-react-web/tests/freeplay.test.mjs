import test from 'node:test';
import assert from 'node:assert/strict';
import {
 FREEPLAY_CASES,freeplayActions
} from '../src/freeplay-data.mjs';
import {
 FREEPLAY_CONTROL_POLICY,createFreeplay,freeplayDispatch,replayFreeplay,
 freeplayGate,freeplayDebrief,freeplayExport,validateFreeplayScene
} from '../src/freeplay-engine.mjs';
const go=(s,kind,id,text,extra={})=>freeplayDispatch(s,{kind,id,text,...extra});
function start(audience,caseId){
 let s=createFreeplay({audience,caseId});s=go(s,'ACK_WARNING');return go(s,'START');
}
test('all authored scenes define accessible fiction and unknown evidence',()=>{
 for(const scene of FREEPLAY_CASES)assert.deepEqual(validateFreeplayScene(scene),{valid:true,failures:[],requiresHumanReview:true});
});
test('the default mode is non-clinician patient education, not Code Blue',()=>{
 const s=createFreeplay();assert.equal(s.audience,'patient');assert.equal(s.caseId,'patient-chest-education');assert.equal(s.phase,'PREFLIGHT');
});
test('sensitive Code Blue requires prebrief acknowledgement',()=>{
 const s=go(createFreeplay({audience:'student',caseId:'alex-codeblue-review'}),'START');
 assert.equal(s.phase,'PREFLIGHT');
});
test('patient education cannot run clinician action or medication',()=>{
 let s=start('patient','patient-chest-education');
 assert.equal(freeplayGate(s,'medication').allow,false);
 s=go(s,'ACTION','medication');
 assert.equal(s.completed.length,0);
 assert.equal(s.patientSnapshot.stateChangeAuthority,'NONE');
});
test('student action allows learning but never treatment, consent, physiology or ROSC',()=>{
 let s=start('student','alex-codeblue-review');
 s=go(s,'ACTION','respiratory');s=go(s,'ACTION','aac');
 assert.equal(s.completed.length,2);
 assert.equal(s.patientSnapshot.existingPatientWords,'NO_NEW_AUTHORED_MESSAGE');
 assert.equal(s.patientSnapshot.status,'READ_ONLY_FICTIONAL');
 assert.ok(s.ledger.every(x=>x.clinicalEffect==='NONE'));
 assert.ok(s.ledger.every(x=>x.patientMessageEffect==='NONE'));
});
test('medication, cold saline, defibrillating PEA and writing ROSC are always held',()=>{
 let s=start('student','alex-codeblue-review');
 for(const id of ['medication','cooling','defib-pea','invent-outcome']){
  assert.equal(freeplayGate(s,id).allow,false);
  s=go(s,'ACTION',id);
 }
 assert.equal(s.completed.length,0);
 assert.equal(s.ledger.filter(x=>x.type==='HOLD').length,4);
});
test('creative cues are deterministic, source-bound, never alter physiology',()=>{
 let s=start('student','alex-respiratory-freeplay');s=go(s,'CUE');s=go(s,'CUE');
 const r=replayFreeplay({audience:s.audience,caseId:s.caseId,seed:s.seed,commands:s.commands});
 assert.deepEqual(r.ledger,s.ledger);
 assert.deepEqual(r.revealed,s.revealed);
 assert.deepEqual(r.patientSnapshot,s.patientSnapshot);
 assert.equal(r.revealed[0].clinicalEffect,'NONE');
});
test('no cues beyond finite templates or hidden physiology',()=>{
 let s=start('patient','patient-respiratory-choices');
 for(let k=0;k<10;k++)s=go(s,'CUE');
 assert.equal(s.revealed.length,2);
 assert.equal(s.patientSnapshot.unknown.length,3);
});
test('creative editor drafts remain unreviewed and do not acquire clinical authority',()=>{
 let s=start('creator','creator-blank');
 s=freeplayDispatch(s,{kind:'DRAFT',title:'A patient asks for time',focus:'AAC and consent',description:'The clinician explains a choice.'});
 assert.equal(s.creativeDraft.reviewStatus,'NOT_APPROVED');
 assert.equal(s.creativeDraft.allowedClinicalEffect,false);
 assert.equal(s.patientSnapshot.stateChangeAuthority,'NONE');
});
test('patient questions are local author notes, not patient factual communications',()=>{
 let s=start('patient','patient-chest-education');s=go(s,'NOTE',null,'What is the purpose of this test?');
 assert.equal(s.privateNotes.length,1);
 assert.equal(s.privateNotes[0].medicalAuthority,false);
 assert.equal(s.patientSnapshot.existingPatientWords,'NO_NEW_AUTHORED_MESSAGE');
});
test('notes are bounded, and no storage/network permission is promised',()=>{
 let s=start('patient','patient-chest-education');
 s=go(s,'NOTE',null,'a'.repeat(900));assert.equal(s.privateNotes[0].text.length,500);
 assert.equal(FREEPLAY_CONTROL_POLICY.noRemoteSave,true);
 assert.equal(FREEPLAY_CONTROL_POLICY.noLiveDevice,true);
});
test('can explore and debrief in any order without a numerical grade',()=>{
 let s=start('student','alex-respiratory-freeplay');
 s=go(s,'ACTION','aac');s=go(s,'ACTION','differential');s=go(s,'DEBRIEF');
 assert.equal(s.phase,'DEBRIEF');assert.equal(freeplayDebrief(s).prompts.length,6);
 assert.match(freeplayDebrief(s).summary,/No numerical grade/);
});
test('replay of drafts and notes preserves order and return state',()=>{
 let s=start('creator','creator-blank');
 s=go(s,'CUE');s=go(s,'NOTE',null,'How should agency remain visible?');
 s=freeplayDispatch(s,{kind:'DRAFT',title:'Test',focus:'Capacity',description:'Do not assume.'});
 s=go(s,'DEBRIEF');const r=replayFreeplay({audience:s.audience,caseId:s.caseId,seed:s.seed,commands:s.commands});
 assert.deepEqual(r,s);
});
test('read-only export does not claim medical review or accreditation',()=>{
 let s=start('patient','patient-chest-education');
 const out=freeplayExport(s);
 assert.equal(out.externalApproval,'PENDING');assert.equal(out.userIsHealthcareProfessional,'NOT_ASSUMED');
 assert.equal(out.noClinicalEffect,true);
 assert.equal(out.policy.review.disabilityLed,'PENDING');
});
test('reset preserves chosen case but clears local notes and simulation progression',()=>{
 let s=start('patient','patient-chest-education');s=go(s,'NOTE',null,'My question');
 s=go(s,'RESET');
 assert.equal(s.phase,'PREFLIGHT');assert.equal(s.privateNotes.length,0);assert.equal(s.ledger.length,0);
});
test('audience cannot open a scenario from another mode',()=>{
 assert.throws(()=>createFreeplay({audience:'patient',caseId:'alex-codeblue-review'}));
 assert.ok(freeplayActions('patient').every(x=>x.domain!=='treatment'));
});
