export const AURA_VERSION = '0.1.0-github-preview';
export const CASE = Object.freeze({
  id:'rohan-malik-pea-asystole-alternate', fictional:true, origin:'fictional_synthetic',
  age:12, diagnosis:'Duchenne muscular dystrophy', setting:'NSW paediatric ICU',
  baseline:'Full controlled ventilation; communication through speech when possible, eye-gaze, cheek switch and AAC',
  branch:'Separate from the canonical Rohan Malik case',
  warnings:['Cardiac arrest','Invasive airway crisis','Possible death'],
  sources:['ANZCOR paediatric ALS 2026 — check current version','NSW clinical local protocols — NOT SUPPLIED','CBCP draft v0.1 — NOT NSW policy']
});
export const ACTIONS = Object.freeze([
  {id:'rhythm',title:'Verify rhythm and monitoring',group:'Resuscitation',owner:'Paediatric resuscitation leader',phases:['ARREST'],duration:3},
  {id:'cpr',title:'Review CPR quality and coordinated rotation',group:'Resuscitation',owner:'Qualified paediatric resuscitation clinician',phases:['ARREST'],duration:5},
  {id:'perfusion',title:'Reassess effective circulation',group:'Resuscitation',owner:'Senior resuscitation clinician',phases:['ARREST'],duration:4},
  {id:'causes',title:'Review reversible arrest contributors',group:'Resuscitation',owner:'Paediatric registrar with consultant',phases:['ARREST'],duration:5},
  {id:'airway',title:'Reassess supraglottic rescue ventilation',group:'Airway',owner:'Paediatric anaesthetist',phases:['ARREST','POST_ROSC'],duration:5},
  {id:'oxygenation',title:'Check oxygenation signal reliability',group:'Airway',owner:'Qualified airway clinician',phases:['ARREST','POST_ROSC'],duration:4},
  {id:'definitive',title:'Discuss definitive airway and contingencies',group:'Airway',owner:'Paediatric anaesthesia consultant',phases:['ARREST','POST_ROSC'],duration:0},
  {id:'med-review',title:'Request paediatric medication safety review',group:'Medication',owner:'Authorised paediatric prescriber',phases:['ARREST','POST_ROSC'],duration:0},
  {id:'family',title:'Continue dedicated family nursing update',group:'People and rights',owner:'Assigned family-support RN',phases:['ARREST','POST_ROSC','PICU'],duration:0},
  {id:'aac',title:'Protect WAIT and plan communication restoration',group:'People and rights',owner:'Bedside RN and AAC clinician when feasible',phases:['ARREST','POST_ROSC','PICU'],duration:0},
  {id:'postrosc',title:'Complete structured post-arrest review',group:'Beyond',owner:'PICU consultant',phases:['POST_ROSC','PICU'],duration:5},
  {id:'neuro',title:'Plan neurological reassessment without premature prognosis',group:'Beyond',owner:'PICU clinician',phases:['POST_ROSC','PICU'],duration:0},
  {id:'braided',title:'Assign seven braided-care strands and backups',group:'Beyond',owner:'PICU coordinating nurse',phases:['POST_ROSC','PICU'],duration:0},
  {id:'handover',title:'Review transfer and access continuity',group:'Beyond',owner:'Sending and receiving clinicians',phases:['PICU'],duration:0},
  {id:'shock',title:'Deliver defibrillation',group:'Evidence locked',owner:'Qualified paediatric ALS clinician',phases:['ARREST'],highRisk:true,duration:0},
  {id:'drug',title:'Administer resuscitation medication',group:'Evidence locked',owner:'Authorised paediatric prescriber / RN',phases:['ARREST','POST_ROSC'],highRisk:true,duration:0},
  {id:'fona',title:'Emergency front-of-neck airway procedure',group:'Evidence locked',owner:'Qualified paediatric airway specialist',phases:['ARREST'],highRisk:true,duration:0},
  {id:'declare-rosc',title:'Declare ROSC from ECG or CO2 alone',group:'Evidence locked',owner:'Resuscitation leader',phases:['ARREST'],highRisk:true,duration:0},
  {id:'declare-death',title:'Declare death from flatline alone',group:'Evidence locked',owner:'Qualified clinician',phases:['ARREST'],highRisk:true,duration:0}
]);
export const CBCP = Object.freeze([
  ['A','Acute clinical / nursing','PICU clinician and RN'],
  ['B','Everyday physical supports','RN and nurse unit manager'],
  ['C','Function and rehabilitation','OT/PT/speech pathology'],
  ['D','Voice, consent, communication','Patient with supported decision-making and treating clinician'],
  ['E','Wellbeing, relationships, safeguarding','Family-support RN and psychosocial team'],
  ['F','External support interface','Disability liaison and hospital team'],
  ['G','Transfer and continuity','Sending and receiving clinicians']
]);
const log = (state,type,text,detail) => ({
  ...state, ledger:[...state.ledger,{id:'AURA-'+String(state.ledger.length+1).padStart(4,'0'),
  time:clockText(state.clock),type,text,detail:detail||null}]
});
export function clockText(seconds) {
  return [Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
}
export function createAURA(){
  return {
    version:AURA_VERSION,caseId:CASE.id,phase:'ARREST',running:false,
    clock:10*3600+16*60+50,evaluationSeconds:0,role:'SCENARIO_DIRECTOR',
    clinical:{rhythm:'ASYSTOLE',verifiedRhythm:true,spontaneousCirculation:false,rosc:false,
      cpr:'ONGOING',airway:'Provisional supraglottic rescue',chestMovement:'Observed with support',
      exhaledCO2:'Waveform present',oxygenation:'Unverified; pulse oximeter unreliable',
      organOutcome:'UNKNOWN',neurologicalOutcome:'UNKNOWN'},
    person:{aac:'WAIT',messageSource:'Latest reliable patient-authored instruction',
      familyNurse:'Assigned',supporters:['Samira','Arvind'],communicationReliability:'No new response'},
    selected:null,checked:{},assigned:{},completed:[],reassessed:[],ledger:[],commands:[],
    notice:'Pause at 10:16:50: qualified team continues CPR and rescue ventilation. Select a station; no action happens on selection.'
  };
}
export function gate(s,id){
  const a=ACTIONS.find(x=>x.id===id);
  if(!a)return {allow:false,decision:'BLOCK_UNSUPPORTED',why:'Unknown station.'};
  if(!a.phases.includes(s.phase))return {allow:false,decision:'HOLD_BRANCH',why:'Not relevant in this clinical phase.'};
  if(id==='shock')return {allow:false,decision:'BLOCK_UNSUPPORTED',why:'Verified asystole is non-shockable; an available defibrillator is not an indication.'};
  if(id==='drug')return {allow:false,decision:'HOLD_FOR_PROTOCOL',why:'No reviewed local paediatric protocol, current weight, allergies, medicine details or prescribing checks supplied. Review is available separately.'};
  if(id==='fona')return {allow:false,decision:'HOLD_FOR_PROTOCOL',why:'Provisional ventilation is present; no current specialist indication, anatomical assessment or local paediatric procedure pack committed.'};
  if(id==='declare-rosc')return {allow:false,decision:'BLOCK_UNSUPPORTED',why:'ROSC requires independently established dependable circulation; ECG and exhaled CO2 do not suffice.'};
  if(id==='declare-death')return {allow:false,decision:'BLOCK_UNSUPPORTED',why:'Asystole alone never determines death; qualified clinical determination requires separate verified criteria.'};
  return {allow:true,decision:'ALLOW_PRINCIPLE_LEVEL',why:'Qualified-team educational action; no drug dose, device setting or invasive technique.'};
}
function recorded(s,kind,id,role){
  return {...s,commands:[...s.commands,{kind,id:id||null,role:role||s.role,time:clockText(s.clock)}]};
}
export function dispatchAURA(state,command){
  const kind=command.kind, id=command.id||null, role=command.role||state.role;
  let s=recorded(state,kind,id,role);
  const a=ACTIONS.find(x=>x.id===id);
  if(kind==='ROLE')return log({...s,role},'ACCESS','Learner role changed (no clinical effect).');
  if(kind==='RUN')return log({...s,running:true,notice:'Clock running only when explicitly stepped or actions committed.'},'CLOCK','Simulation resumed; no physiology inferred.');
  if(kind==='PAUSE')return log({...s,running:false,notice:'Facilitator pause freezes simulation and evaluation clocks.'},'CLOCK','Both clocks paused.');
  if(kind==='STEP'){
    if(!s.running)return log({...s,notice:'Resume first; no time advanced.'},'GATE','Time step held.');
    const delta=Number.isInteger(command.seconds)?Math.min(30,Math.max(1,command.seconds)):5;
    return log({...s,clock:s.clock+delta,evaluationSeconds:s.evaluationSeconds+delta,notice:'Simulation time advanced without authoring clinical recovery or deterioration.'},'CLOCK','Manual synthetic time step '+delta+'s; physiology unchanged.');
  }
  if(kind==='SELECT')return log({...s,selected:id,notice:a?'Selected '+a.title+'. Inspect the evidence gate.':'Unknown station.'},'SELECT','Selection does not perform treatment.');
  if(kind==='CHECK'){
    const g=gate(s,id);
    s={...s,checked:{...s.checked,[id]:g},notice:g.decision+': '+g.why};
    return log(s,'GUARDIAN',a?a.title:'Unknown',g);
  }
  if(kind==='ASSIGN'){
    if(!a)return log({...s,notice:'Unknown station.'},'GATE','Assignment held.');
    const g=gate(s,id);
    if(!g.allow||!s.checked[id]?.allow)return log({...s,notice:'First obtain a passing evidence check.'},'GATE',g.why);
    s={...s,assigned:{...s.assigned,[id]:a.owner},notice:'Assigned to '+a.owner+'. No treatment performed.'};
    return log(s,'ASSIGN',a.title,'Qualified role: '+a.owner);
  }
  if(kind==='COMMIT'){
    if(!a)return log({...s,notice:'Unknown station.'},'GATE','Commit blocked.');
    const g=gate(s,id);
    if(!s.running||!g.allow||!s.checked[id]?.allow||!s.assigned[id])return log({...s,notice:'Commit held: resume, check evidence and assign a qualified role. '+g.why},'GUARDIAN','Branch held.');
    s={...s,clock:s.clock+a.duration,evaluationSeconds:s.evaluationSeconds+a.duration,
      completed:[...s.completed,id],notice:a.title+' documented. Reassessment still required.'};
    if(id==='med-review')s={...s,notice:'Medication review requested; no prescription, dispensing or administration.'};
    if(id==='aac'&&s.person.aac!=='WAIT')throw new Error('AAC protected');
    return log(s,'COMMITTED',a.title,'Authorised educational assessment/action only; no unverified physiological effect.');
  }
  if(kind==='REASSESS'){
    if(!s.completed.includes(id))return log({...s,notice:'No committed assessment to reassess.'},'GATE','Reassessment held.');
    s={...s,reassessed:[...s.reassessed,id],notice:'Reassessment recorded. No new physiology without an authored observation.'};
    return log(s,'REASSESS',a?.title||id,'Current evidence unchanged.');
  }
  if(kind==='FACILITATOR_ROSC'){
    if(role!=='FACILITATOR'||s.phase!=='ARREST'||!s.reassessed.includes('perfusion')||!s.reassessed.includes('airway'))
      return log({...s,notice:'Facilitator-only alternate outcome; airway and perfusion reassessments required.'},'GATE','ROSC outcome not authored.');
    s={...s,phase:'POST_ROSC',clinical:{...s.clinical,rosc:true,spontaneousCirculation:true,cpr:'STOPPED AFTER CONFIRMED ROSC',rhythm:'Perfusing rhythm — facilitator-authored'},notice:'Separate synthetic ROSC branch: independent clinician-confirmed circulation. This is not a prediction.'};
    return log(s,'FACILITATOR','Explicit independently verified synthetic ROSC finding for alternate teaching branch.');
  }
  if(kind==='FACILITATOR_PICU'){
    if(role!=='FACILITATOR'||s.phase!=='POST_ROSC'||!s.reassessed.includes('postrosc')||!s.reassessed.includes('aac'))
      return log({...s,notice:'PICU transition held until post-ROSC and AAC reassessment.'},'GATE','Continuity gate not met.');
    return log({...s,phase:'PICU',notice:'PICU continuity begins; all disability baseline and communication needs remain.'},'FACILITATOR','Synthetic PICU continuation.');
  }
  if(kind==='RESET')return createAURA();
  return log({...s,notice:'Unknown action; no event applied.'},'GATE','Unknown command');
}
export function stationStatus(s,id){
  const g=gate(s,id);
  if(!g.allow)return 'locked_by_evidence';
  if(s.reassessed.includes(id))return 'reassessed';
  if(s.completed.includes(id))return 'committed';
  if(s.assigned[id])return 'assigned';
  if(s.checked[id]?.allow)return 'checked';
  if(s.selected===id)return 'selected';
  return 'available';
}
export function MAIRA_readonly(s){
  return Object.freeze({type:'READ_ONLY_PROPOSAL',canCommit:false,
    known:['Rhythm: '+s.clinical.rhythm,'Circulation: '+(s.clinical.spontaneousCirculation?'present':'not established'),'Airway: '+s.clinical.airway,'AAC: '+s.person.aac],
    unknown:s.phase==='ARREST'?['Adequate oxygenation','Reversible cause attribution','Organ-specific injuries','Any return of circulation']:['Neurological outcome','Sustained airway plan','Discharge or transfer readiness'],
    question:s.phase==='ARREST'?'Which independently reliable assessment would distinguish electrical activity from effective circulation?':'What must be reassessed before moving beyond critical care?',
    suggestion:'Coordinate qualified teams; use evidence gates, reassess, and preserve WAIT.',
    sourceState:'AURA is an educational demonstration; current local NSW paediatric protocol is not installed.'});
}
export function mediation(s,id){
  const clinical=gate(s,id);
  return Object.freeze({status:clinical.allow?'CONTINUE_WITH_REPAIR':'HOLD_BRANCH',
    clinical:clinical.decision,rights:'AAC WAIT protected; substitute authority unassumed',
    personhood:'Disability never sets treatment ceiling',relational:'Family-support nurse remains assigned',
    pharmacology:'NO ORDER. Medication administration remains gated until verified local protocol and patient data',
    careContinues:['Current clinician-led CPR where arrest persists','Provisional rescue ventilation','Direct communication and family nursing'],
    branchFrozen:clinical.allow?[]:[id]});
}
export function replay(commands){
  return commands.reduce((s,c)=>dispatchAURA(s,c),createAURA());
}
