import test from 'node:test';import assert from 'node:assert/strict';import {EVIDENCE,PUBMED_RSS,findEvidence,validateEvidence,proposedEducationalUse,canAuthoriseClinicalIntervention,canChangeVIRGALPhysiology} from '../src/evidence.mjs';
test('evidence records carry verified identifiers and access labels',()=>assert.equal(validateEvidence(),true));
test('research never changes VIRGAL physiology',()=>EVIDENCE.forEach(e=>assert.equal(canChangeVIRGALPhysiology(e),false)));
test('research never automatically authorises treatment',()=>EVIDENCE.forEach(e=>assert.equal(canAuthoriseClinicalIntervention(e),false)));
test('JSTOR inaccessible full-text is not labelled inspected',()=>EVIDENCE.filter(e=>e.database==='JSTOR').forEach(e=>assert.equal(e.evidence_label,'METADATA_ONLY')));
test('RSS saved query not misrepresented as ingested',()=>{assert.equal(PUBMED_RSS.ingestion_status,'FETCH_UNVERIFIED');assert.equal(PUBMED_RSS.verified_results,0)});
test('evidence proposals have review gate',()=>{const r=proposedEducationalUse('pmid-41649064');assert.equal(r.status,'REVIEW_REQUIRED');assert.equal(r.clinicalEffect,false);assert.ok(r.requiredReview.length>=2)});
test('missing paper cannot be promoted',()=>assert.equal(proposedEducationalUse('missing').status,'NOT_FOUND'));
test('registry rejects duplicate IDs and wrong access labels',()=>assert.equal(validateEvidence([EVIDENCE[0],EVIDENCE[0]]),false));
