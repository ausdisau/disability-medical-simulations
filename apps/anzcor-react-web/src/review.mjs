import {EVIDENCE,findEvidence} from './evidence.mjs';
import {VIDEO_REFERENCES,findVideo} from './video-evidence.mjs';

export const REVIEW_CASES=Object.freeze([
  {id:'rohan-malik-pea-asystole-alternate',title:'Rohan Malik · Paediatric PEA to asystole (non-canonical)',population:'12-year-old with Duchenne muscular dystrophy',setting:'NSW PICU',clinicalSources:'ANZCOR paediatric ALS reference; current local NSW paediatric protocol not supplied',protectedFacts:['Verified asystole','CPR ongoing','ROSC not established','AAC WAIT','Family-support nurse assigned']},
  {id:'aura-cp-communication-respiratory-synthetic-v01',title:'Alex Morgan · Cerebral palsy respiratory and AAC access',population:'Fictional adult with cerebral palsy',setting:'NSW ED',clinicalSources:'Cerebral palsy respiratory literature; local NSW respiratory escalation protocol not supplied',protectedFacts:['No cognitive incapacity assumption','Baseline-versus-acute-change separation','Patient-controlled AAC','No medicine order or invented vital sign']}
]);

export const REVIEW_DOMAINS=Object.freeze([
 {id:'clinical',label:'Clinical accuracy and paediatric/respiratory safety',owner:'Qualified NSW clinical reviewer',
  checks:['Baseline and acute illness differentiated','Case-specific emergency pathway and clinician roles verified','Investigations, causes and outcome statements avoid invented data','Any medication or invasive action remains locally protocol-gated','Defibrillation and ROSC decisions remain physiologically and causally grounded']},
 {id:'disability',label:'Disability-led co-design and patient agency',owner:'Paid relevant disabled co-designer or lived-experience reviewer',
  checks:['Patient preferences and communication retained','No empathy-suit equivalence to lived disability','No disability-to-futility or capacity shortcut','AAC repair and supporter authority distinguished','Co-designer can reject stereotyped framing and recommend changes']},
 {id:'facilitator',label:'Facilitator evaluation',owner:'Qualified simulation facilitator',
  checks:['Objectives and debrief prompts observable','Meaningful alternative actions and recovery paths','No forced deterioration to create drama','Transparent clock and non-punitive pause','Appropriate learner scope, feedback and emotional safety']},
 {id:'accessibility',label:'Accessibility and AAC validation',owner:'Accessibility tester with lived AAC/AT experience',
  checks:['Keyboard and switch routes including focus order','Screen reader names, announcements and live regions','Large text and 200–400% zoom','Reduced motion and non-colour-only status cues','Patient communication time preserved under emergencies']},
 {id:'governance',label:'Source provenance, privacy and release controls',owner:'Independent clinical governance and data/privacy reviewer',
  checks:['Source access labels and dates verified','Legal/clinical authority and local protocol explicitly scoped','No real patient identifiers, device connectors or live orders','Video licences and third-party image rights checked','No approval asserted without authenticated external human evidence']}
]);

export const DESIGN_ONLY='LEARNING_OR_ACCESS_DESIGN_ONLY';
export const SOURCE_CROSSWALK=Object.freeze([
 {caseId:'rohan-malik-pea-asystole-alternate',sourceId:'yt-6qOGZvKZOLQ',element:'Non-caricatured training design and caregiver role briefing',scope:DESIGN_ONLY,
  risk:'Empathy-suit demonstration is not clinical evidence nor authentic disability experience.'},
 {caseId:'rohan-malik-pea-asystole-alternate',sourceId:'pmid-41814483',element:'Paediatric family support and reasonable-adjustment debrief',scope:DESIGN_ONLY,
  risk:'Study concerns paediatric IDD and self-reported clinician confidence; cannot define DMD resuscitation.'},
 {caseId:'rohan-malik-pea-asystole-alternate',sourceId:'yt-TGIUp5C9xT0',element:'Interprofessional training facility inspiration',scope:DESIGN_ONLY,
  risk:'Metadata-only promotional description; no technical or clinical fidelity verified.'},
 {caseId:'aura-cp-communication-respiratory-synthetic-v01',sourceId:'pmid-41649064',element:'AAC access reliability and communication-partner setup checkpoint',scope:DESIGN_ONLY,
  risk:'AAC scoping evidence not an acute respiratory care algorithm.'},
 {caseId:'aura-cp-communication-respiratory-synthetic-v01',sourceId:'pmid-32803795',element:'Individual baseline and respiratory-risk discussion',scope:DESIGN_ONLY,
  risk:'Consensus overview is not patient-specific clinical authority.'},
 {caseId:'aura-cp-communication-respiratory-synthetic-v01',sourceId:'yt-934vEj2yl_8',element:'Optional rehabilitation movement feedback design',scope:DESIGN_ONLY,
  risk:'Producer claims and score do not establish efficacy, life quality or PICU outcomes.'},
 {caseId:'aura-cp-communication-respiratory-synthetic-v01',sourceId:'yt-1B14IeOFZ8c',element:'Co-designed clinical examination communication prompt',scope:DESIGN_ONLY,
  risk:'Metadata-only video and one CP phenotype; no procedural teaching imported.'},
 {caseId:'aura-cp-communication-respiratory-synthetic-v01',sourceId:'yt-72aj-f4Emj8',element:'Optional biomechanics reading and modelling research question',scope:DESIGN_ONLY,
  risk:'Do not import mechanics, settings or muscle parameters from a description.'}
]);

export function sourceReference(id){
 const paper=findEvidence(id);
 if(paper)return Object.freeze({id:paper.id,type:'publication',title:paper.title,url:paper.url,inspection:paper.evidence_label,
   limitations:paper.limitations,sourceScope:paper.domain});
 const video=findVideo(id);
 if(video)return Object.freeze({id:video.id,type:'video',title:video.title,url:video.url,inspection:video.inspection,
   limitations:video.notEstablished,sourceScope:'education_design'});
 return null;
}
export function crosswalk(caseId,sourceId){
 return SOURCE_CROSSWALK.find(x=>x.caseId===caseId&&x.sourceId===sourceId)||null;
}
export function createReviewSession(caseId=REVIEW_CASES[0].id){
 if(!REVIEW_CASES.some(c=>c.id===caseId))throw new Error('Unknown fictional scenario');
 return {version:'1.0',caseId,reviewType:'LOCAL_SYNTHETIC_DRAFT',authenticated:false,findings:[],externalSignoffs:[],
   createdFor:'Project Hope AURA scenario review',clinicalAuthority:false,patientData:false};
}
const SEVERITIES=Object.freeze(['OBSERVATION','MINOR','MAJOR','CRITICAL']);
const EVIDENCE_STATES=Object.freeze(['NOT_TESTED','OBSERVED_IN_SIMULATION','SOURCE_DOCUMENTED','UNVERIFIED']);
export function recordFinding(s,item){
 if(!s||!REVIEW_CASES.some(c=>c.id===s.caseId))return {ok:false,error:'Unknown case'};
 if(!REVIEW_DOMAINS.some(d=>d.id===item.domain))return {ok:false,error:'Unknown review domain'};
 if(!SEVERITIES.includes(item.severity))return {ok:false,error:'Invalid severity'};
 if(!EVIDENCE_STATES.includes(item.evidenceState))return {ok:false,error:'Invalid evidence status'};
 if(typeof item.note!=='string'||item.note.trim().length<10||item.note.length>1400)return {ok:false,error:'Provide a specific observation (10-1400 characters)'};
 if(typeof item.repair!=='string'||item.repair.length>1400)return {ok:false,error:'Repair field too long'};
 if(!crosswalk(s.caseId,item.sourceId))return {ok:false,error:'Source not crosswalked to this case'};
 const source=sourceReference(item.sourceId);
 if(!source)return {ok:false,error:'Unknown research or media source'};
 const finding=Object.freeze({findingId:'LOCAL-'+String(s.findings.length+1).padStart(3,'0'),caseId:s.caseId,
  domain:item.domain,sourceId:source.id,sourceInspection:source.inspection,severity:item.severity,evidenceState:item.evidenceState,
  note:item.note.trim(),repair:item.repair.trim(),reviewerIdentity:'NOT_AUTHENTICATED',releaseApproval:false});
 return {ok:true,finding,session:{...s,findings:[...s.findings,finding]}};
}
export function readiness(s){
 const covered=new Set(s.findings.map(f=>f.domain));
 const pendingDomains=REVIEW_DOMAINS.filter(d=>!covered.has(d.id)).map(d=>d.id);
 const blockers=s.findings.filter(f=>['CRITICAL','MAJOR'].includes(f.severity));
 return Object.freeze({
  state:blockers.length?'CHANGES_REQUIRED':pendingDomains.length?'REVIEW_INPUTS_PENDING':'LOCAL_DRAFT_COLLECTED',
  pendingDomains,blockingFindings:blockers.map(x=>x.findingId),
  externalReviewVerified:false,clinicalProtocolVerified:false,disabilityCoDesignVerified:false,
  authenticatedHumanSignoff:false,simulationReleaseApproved:false,canAlterClinicalTruth:false,
  next:'Qualified external human reviews in GitHub or recorded institutional governance evidence are needed; local notes cannot approve release.'
 });
}
export function reviewExport(s){
 return Object.freeze({schemaVersion:'AURA-REVIEW-1',case:REVIEW_CASES.find(c=>c.id===s.caseId),
  mappings:SOURCE_CROSSWALK.filter(x=>x.caseId===s.caseId).map(x=>({...x,source:sourceReference(x.sourceId)})),
  checks:REVIEW_DOMAINS,findings:s.findings,readiness:readiness(s),
  provenance:{session:'LOCAL_UNAUTHENTICATED',statedSourceKinds:['PubMed','JSTOR','YouTube'],
  thirdPartyContent:'links and original summaries only',patientData:false,
  reviewerSignatures:'NOT_CAPTURED',signedReviewSystem:'EXTERNAL_ONLY'}});
}
export function applyReviewToClinicalController(_packet){return {accepted:false,reason:'AURA review drafts are educational and never authorise VIRGAL clinical events or outcomes.'};}
