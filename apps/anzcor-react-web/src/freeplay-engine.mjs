import {
 FREEPLAY_VERSION,FREEPLAY_AUDIENCES,FREEPLAY_CASES,freeplayCase,freeplayActions
} from './freeplay-data.mjs';
/**
 * Deterministic learning-only freeplay. Never mutates a VIRGAL patient state.
 * Safe scope: authored observations are read-only; actions may update ONLY
 * educational evidence, workflow, private questions and debrief metadata.
 */
export const FREEPLAY_CONTROL_POLICY=Object.freeze({
 version:'0.1.0',fictional:true,privacy:'LOCAL_MEMORY_AND_EXPLICIT_JSON_EXPORT_ONLY',
 noRemoteSave:true,noLiveDevice:true,noPrescription:true,noClinicalTreatmentEffect:true,
 noAutomatedPrognosis:true,noAutomaticDeathOrROSC:true,noDisabilityIncapacityInference:true,
 review:{clinical:'PENDING',disabilityLed:'PENDING',facilitator:'PENDING',accessibility:'PENDING',governance:'PENDING'}
});
const errorText='Only fictional learning scenes are available; no real patient workflow is allowed.';
const plain=(x)=>typeof x==='string'?x.trim().slice(0,500):'';
export function createFreeplay({audience='patient',caseId,seed=0}={}){
 if(!FREEPLAY_AUDIENCES.some(x=>x.id===audience))throw Error('Unsupported educational audience');
 const chosen=caseId||FREEPLAY_CASES.find(x=>x.audience===audience)?.id;
 const scene=freeplayCase(chosen);
 if(!scene||scene.audience!==audience)throw Error('Scenario must match the selected educational audience');
 if(!Number.isInteger(seed)||seed<0||seed>1000000000)throw Error('Invalid reproducibility seed');
 return {
  engineVersion:FREEPLAY_VERSION,caseId:chosen,audience,seed,phase:'PREFLIGHT',
  syntheticOnly:true,clinicalSource:scene.caseSource,
  patientSnapshot:Object.freeze({status:'READ_ONLY_FICTIONAL',known:[...scene.known],unknown:[...scene.unknown],
    existingPatientWords:'NO_NEW_AUTHORED_MESSAGE',stateChangeAuthority:'NONE'}),
  access:Object.freeze({method:scene.access.method,requirement:scene.access.access,capacity:scene.access.capacity,
    assessedForLiveScenario:false}),
  warningAcknowledged:false,revealed:[],completed:[],privateNotes:[],creativeDraft:null,ledger:[],commands:[],
  clock:{clinical:'UNCHANGED_BY_FREEPLAY',learningSteps:0,accessTimePenalty:0},
  notice:'Read the prebrief and content note. The freeplay studio will not connect to a clinical system or create a treatment effect.'
 };
}
function log(state,type,domain,text,status='EDUCATIONAL_ONLY',provenance='LEARNER_OR_TEMPLATE'){
 return {...state,ledger:[...state.ledger,{
  id:'FPL-'+String(state.ledger.length+1).padStart(4,'0'),
  step:state.clock.learningSteps,type,domain,text,status,provenance,
  clinicalEffect:'NONE',patientMessageEffect:'NONE',treatmentAuthority:false
 }]};
}
function record(state,cmd){
 return {...state,commands:[...state.commands,{...cmd}],clock:{...state.clock,learningSteps:state.clock.learningSteps+1}};
}
export function freeplayGate(state,actionId){
 const act=freeplayActions(state.audience).find(a=>a.id===actionId);
 if(!act)return Object.freeze({allow:false,status:'OUT_OF_ROLE_OR_UNKNOWN',reason:'This activity is not offered for the selected audience.'});
 if(act.locked)return Object.freeze({allow:false,status:'LOCKED_BY_EVIDENCE',reason:act.locked+' — '+act.intent});
 if(state.phase!=='PLAY')return Object.freeze({allow:false,status:'NOT_IN_PLAY',reason:'Open the educational scene first.'});
 return Object.freeze({allow:true,status:'EDUCATIONAL_ACTION_ALLOWED',reason:'Learning-only activity. No medication, device or physiological effect.'});
}
export function freeplayDispatch(prior,raw){
 const cmd={kind:String(raw?.kind||''),id:raw?.id??null,text:plain(raw?.text),value:raw?.value??null,
  title:plain(raw?.title),focus:plain(raw?.focus),description:plain(raw?.description)};
 if(cmd.kind==='RESET')return createFreeplay({audience:prior.audience,caseId:prior.caseId,seed:prior.seed});
 if(cmd.kind==='LOAD_CASE')return createFreeplay({audience:raw?.audience,caseId:raw?.caseId,seed:Number.isInteger(raw?.seed)?raw.seed:0});
 let s=record(prior,cmd);
 const scene=freeplayCase(s.caseId);
 if(cmd.kind==='ACK_WARNING'){
  return log({...s,warningAcknowledged:true,notice:'Content note acknowledged; educational scene available.'},'PREFLIGHT','safety','Scenario content note acknowledged');
 }
 if(cmd.kind==='START'){
  if(!s.warningAcknowledged)return log({...s,notice:'Review the content note and safety prebrief before entering freeplay.'},'HOLD','safety','Prebrief not acknowledged','GATE_CLOSED');
  return log({...s,phase:'PLAY',notice:scene.opening},'ENTER','scene','Scenario opened. '+scene.opening);
 }
 if(cmd.kind==='ACTION'){
  const gate=freeplayGate(s,cmd.id);
  if(!gate.allow)return log({...s,notice:gate.reason},'HOLD','safety',gate.reason,gate.status);
  const a=freeplayActions(s.audience).find(x=>x.id===cmd.id);
  return log({...s,completed:[...s.completed,cmd.id],notice:a.text||a.effect||a.intent},
    'EXPLORE',a.domain, a.text||a.effect||a.intent,'ACTION_RECORDED');
 }
 if(cmd.kind==='CUE'){
  if(s.phase!=='PLAY')return log({...s,notice:'Open the fictional scene before revealing teaching cues.'},'HOLD','safety','CUE before start','GATE_CLOSED');
  if(s.revealed.length>=scene.cues.length)return log({...s,notice:'All authored cue cards have been explored. Continue freely, reflect, or reset.'},'HOLD','scene','No further authored cues','NO_MORE_CUES');
  const idx=(s.seed+s.revealed.length)%scene.cues.length;
  const cue=scene.cues[idx];
  const next={...s,revealed:[...s.revealed,{...cue,provenance:'PREAUTHORED_EDUCATIONAL_TEMPLATE',clinicalEffect:'NONE'}],
    notice:cue.text};
  return log(next,'CUE',cue.domain,cue.text,'SCOPED_FICTIONAL_CUE','PREAUTHORED_EDUCATIONAL_TEMPLATE');
 }
 if(cmd.kind==='NOTE'){
  if(s.phase!=='PLAY'&&s.phase!=='DEBRIEF')return log({...s,notice:'Open the scene before drafting learning questions.'},'HOLD','safety','NOTE before start','GATE_CLOSED');
  if(!cmd.text)return log({...s,notice:'No text added. Draft a question or reflection first.'},'HOLD','author','Empty draft','EMPTY_NOTE');
  const note={id:'NOTE-'+String(s.privateNotes.length+1).padStart(3,'0'),text:cmd.text,
    kind:s.audience==='patient'?'APPOINTMENT_QUESTION':s.audience==='student'?'LEARNING_REFLECTION':'UNREVIEWED_CREATOR_NOTE',
    medicalAuthority:false,provenance:'USER_LOCAL_AUTHOR_NOTE_NOT_CLINICAL_FACT'};
  return log({...s,privateNotes:[...s.privateNotes,note],
    notice:'Saved inside this browser session only; use Export to keep a local copy. Notes do not become patient observations.'},
  'NOTE','author','Local note '+note.id+' recorded without clinical effect','LOCAL_ONLY');
 }
 if(cmd.kind==='DRAFT'){
  if(s.audience!=='creator'||s.phase!=='PLAY')return log({...s,notice:'Drafting is restricted to creator learning mode.'},'HOLD','safety','Role boundary for creative drafting','GATE_CLOSED');
  const title=cmd.title||'Untitled fictional workshop';
  const focus=cmd.focus||'Access and assessment';
  const description=cmd.description||'A learning idea awaiting clinical and lived-experience review.';
  const d={title,focus,description,fictional:true,dataOrigin:'UNREVIEWED_USER_AUTHOR_NOTE',
    reviewStatus:'NOT_APPROVED',allowedClinicalEffect:false,authoringWarnings:[
     'Do not include real patient identifiers','Never use unreviewed prose to modify physiology',
     'Qualified clinical and disability-led review required before teaching release']};
  return log({...s,creativeDraft:d,notice:'Draft saved as unreviewed editorial content. No clinical or patient state changed.'},
   'DRAFT','author','Creative teaching idea saved for external review','UNREVIEWED_USER_NOTE');
 }
 if(cmd.kind==='DEBRIEF'){
  return log({...s,phase:'DEBRIEF',notice:'Open reflection: review evidence, patient access, team roles and unresolved questions without a score.'},
   'DEBRIEF','education','Evidence-based reflection entered');
 }
 if(cmd.kind==='RESUME'){
  return log({...s,phase:'PLAY',notice:'Freeplay resumed. No simulated physiological time was spent.'},'RESUME','education','Learning replay resumed');
 }
 return log({...s,notice:'Unsupported command; nothing changed clinically.'},'HOLD','safety','Unknown action kind '+cmd.kind,'GATE_CLOSED');
}
export function replayFreeplay({audience,caseId,seed=0,commands=[]}){
 return commands.reduce((s,c)=>freeplayDispatch(s,c),createFreeplay({audience,caseId,seed}));
}
export function freeplayDebrief(state){
 const scene=freeplayCase(state.caseId);
 const domainSet=new Set(state.ledger.filter(e=>e.type==='EXPLORE').map(e=>e.domain));
 const prompts=[
  {domain:'Clinical reasoning',covered:domainSet.has('assessment')||domainSet.has('reasoning'),question:'Which facts were observed, which were reported, and what remained uncertain?'},
  {domain:'Communication and access',covered:domainSet.has('access'),question:'What would help the person participate on their own terms?'},
  {domain:'Agency and consent',covered:domainSet.has('agency'),question:'Which choices and preferences require a direct conversation, and what evidence is missing?'},
  {domain:'Teamwork and systems',covered:domainSet.has('teamwork')||domainSet.has('system'),question:'Where did coordination or an access barrier affect the quality of care?'},
  {domain:'Evidence and revision',covered:domainSet.has('evidence')||domainSet.has('understanding'),question:'What would you seek to verify before treating a hypothesis as fact?'},
  {domain:'Bias and dignity',covered:domainSet.has('personhood'),question:'Did anyone mistake disability or slower communication for deterioration or incapacity?'}
 ];
 return {scene:scene.title,coveredDomains:[...domainSet],prompts,
  summary:'No numerical grade. Explore actions and unreviewed questions; this is not competency assessment.',
  releaseStatus:'PENDING_CLINICAL_DISABILITY_LED_AND_ACCESSIBILITY_REVIEW'};
}
export function freeplayExport(state){
 return {
  schema:'AURA-FREEPLAY-SYNTHETIC-0.1',exportPurpose:'LOCAL_PORTABLE_LEARNING_SESSION',
  userIsHealthcareProfessional:'NOT_ASSUMED',realPatientDataSupported:false,
  policy:FREEPLAY_CONTROL_POLICY,
  scene:freeplayCase(state.caseId),
  session:state,debrief:freeplayDebrief(state),
  noClinicalEffect:true,externalApproval:'PENDING'
 };
}
export function validateFreeplayScene(scene){
 const failures=[];
 if(!scene?.id||!scene?.title||!scene?.opening)failures.push('Missing scenario identification or introduction.');
 if(!Array.isArray(scene?.known)||!Array.isArray(scene?.unknown)||!scene?.known?.length||!scene?.unknown?.length)failures.push('Required known/unknown evidence missing.');
 if(!scene?.access?.method||!scene?.access?.capacity)failures.push('Missing communication or capacity safeguards.');
 if(!Array.isArray(scene?.learningObjectives)||scene.learningObjectives.length<2)failures.push('Missing measurable learning objectives.');
 if(!Array.isArray(scene?.cues)||scene.cues.some(e=>!e.known||!e.unknown||!e.domain))failures.push('Unscoped evidence cues.');
 if(!scene?.caseSource||!scene?.contentWarning)failures.push('Missing provenance or content warning.');
 return {valid:failures.length===0,failures,requiresHumanReview:true};
}
export const SAFETY_NOTICE=errorText;
