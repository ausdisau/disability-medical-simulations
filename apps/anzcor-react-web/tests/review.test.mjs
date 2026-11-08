import test from 'node:test';
import assert from 'node:assert/strict';
import {VIDEO_REFERENCES,validateVideos,videoProposal,findVideo} from '../src/video-evidence.mjs';
import {REVIEW_CASES,REVIEW_DOMAINS,SOURCE_CROSSWALK,createReviewSession,crosswalk,recordFinding,readiness,sourceReference,reviewExport,applyReviewToClinicalController} from '../src/review.mjs';
test('direct user video is inspected with exact source and limitations',()=>{
 assert.equal(validateVideos(),true);
 const v=findVideo('yt-6qOGZvKZOLQ');assert.equal(v.inspection,'VIDEO_AND_TRANSCRIPT_INSPECTED');
 assert.equal(v.source,'USER_SUPPLIED_VIDEO');assert.match(v.notEstablished,/lived disability/);
});
test('video search metadata never implies frames were inspected',()=>{
 for(const v of VIDEO_REFERENCES.filter(v=>v.inspection==='METADATA_ONLY'))assert.equal(v.observations.length,0);
});
test('video sources cannot authorise clinical treatment or physiology',()=>{
 for(const v of VIDEO_REFERENCES){const result=videoProposal(v.id);assert.equal(result.authorisesTreatment,false);assert.equal(result.clinicalEffect,false);}
});
test('two fictional cases have distinct review mappings',()=>{
 const a=REVIEW_CASES[0].id,b=REVIEW_CASES[1].id;
 assert.notEqual(a,b);assert.equal(crosswalk(a,'yt-934vEj2yl_8'),null);assert.ok(crosswalk(b,'yt-934vEj2yl_8'));
});
test('each review has clinical, disability, facilitator, access and governance domains',()=>assert.deepEqual(REVIEW_DOMAINS.map(d=>d.id),['clinical','disability','facilitator','accessibility','governance']));
test('empty and partial review never approves production',()=>{
 const s=createReviewSession();let r=readiness(s);assert.equal(r.simulationReleaseApproved,false);assert.equal(r.pendingDomains.length,5);
 const x=recordFinding(s,{domain:'clinical',sourceId:'pmid-41814483',severity:'OBSERVATION',evidenceState:'NOT_TESTED',
  note:'Clinical protocol needs qualified NSW paediatric ALS review.',repair:'Link applicable local protocol and record external clinician signoff.'});
 assert.equal(x.ok,true);r=readiness(x.session);assert.equal(r.pendingDomains.length,4);assert.equal(r.externalReviewVerified,false);
});
test('authored major safety concern prompts repair',()=>{
 const x=recordFinding(createReviewSession(),{domain:'clinical',sourceId:'pmid-41814483',severity:'MAJOR',evidenceState:'UNVERIFIED',
 note:'Respiratory arrest pathway has no signed local NSW specialist protocol.',repair:'Hold proposed treatment branch.'});
 assert.equal(readiness(x.session).state,'CHANGES_REQUIRED');assert.equal(readiness(x.session).simulationReleaseApproved,false);
});
test('source cannot cross cases or invent its provenance',()=>{
 const x=recordFinding(createReviewSession(),{domain:'clinical',sourceId:'yt-934vEj2yl_8',severity:'OBSERVATION',evidenceState:'NOT_TESTED',
 note:'This is CP rehabilitation material, not Rohan DMD evidence.',repair:''});
 assert.equal(x.ok,false);
 assert.equal(sourceReference('yt-934vEj2yl_8').inspection,'TRANSCRIPT_INSPECTED_VISUALS_NOT_INSPECTED');
});
test('incomplete or unsupported note is rejected',()=>{
 const s=createReviewSession();const base={domain:'facilitator',sourceId:'yt-6qOGZvKZOLQ',severity:'OBSERVATION',evidenceState:'NOT_TESTED',repair:''};
 assert.equal(recordFinding(s,{...base,note:'short'}).ok,false);
 assert.equal(recordFinding(s,{...base,note:'A valid specific training observation.',severity:'approve'}).ok,false);
});
test('locally collected domains can never impersonate signed approval',()=>{
 let s=createReviewSession();
 for(const d of REVIEW_DOMAINS){
  const x=recordFinding(s,{domain:d.id,sourceId:'yt-6qOGZvKZOLQ',severity:'OBSERVATION',evidenceState:'NOT_TESTED',
   note:'Requires external qualified or paid lived-experience review before release.',repair:''});
  assert.equal(x.ok,true);s=x.session;
 }
 const r=readiness(s);assert.equal(r.state,'LOCAL_DRAFT_COLLECTED');assert.equal(r.simulationReleaseApproved,false);
 const packet=reviewExport(s);assert.equal(packet.provenance.reviewerSignatures,'NOT_CAPTURED');assert.equal(packet.readiness.canAlterClinicalTruth,false);
});
test('research/video review packet cannot mutate VIRGAL controller',()=>assert.equal(applyReviewToClinicalController(reviewExport(createReviewSession())).accepted,false));
test('review proposals have source links and do not invent video efficacy',()=>{
 for(const x of SOURCE_CROSSWALK){const r=sourceReference(x.sourceId);assert.ok(r?.url.startsWith('https://'));assert.equal(x.scope,'LEARNING_OR_ACCESS_DESIGN_ONLY');}
});
