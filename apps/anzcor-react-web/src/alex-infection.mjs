/**
 * AURA adult febrile chest infection training branch.
 * Deliberately separate from Rohan's fictional paediatric PEA/asystole runtime.
 * Case seed is passed in from the JSON scenario; no source can author medication,
 * deterioration, diagnosis, consent, or effects without an explicit verified gate.
 */
import {selectCrisisVariant} from './cascade-engine.mjs';
export const ALEX_ACTIONS=Object.freeze(['AAC','OBS','CERS','SEPSIS','CHEST','MED','ANTIBIOTICS','AIRWAY']);
export function alexClock(seconds){
 return [Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
}
export function createAlexSession(seed){
 if(seed?.scenarioId!=='aura-cp-communication-respiratory-synthetic-v01'||
 !seed.clinicalOverlay?.syntheticOnly||seed.caseLinkage!=='SEPARATE_FROM_ROHAN')throw Error('Invalid or non-isolated fictional Alex seed');
 return {
  scenarioId:seed.scenarioId,revision:seed.scenarioRevision,syntheticOnly:true,phase:'ED',running:false,
  clock:14*3600+10*60,crisis:null,system:{telemetry:'NO_VERIFIED_RHYTHM',escalation:'URGENT_CLINICAL_REVIEW_REQUIRED'},
  clinical:{
   workingDiagnosis:seed.clinicalOverlay.chestInfection.clinicalWorkingDiagnosis,
   workingDiagnosisStatus:seed.clinicalOverlay.chestInfection.status,
   measuredTemperatureC:seed.clinicalOverlay.fever.temperatureC,
   temperatureOrigin:seed.clinicalOverlay.fever.status,
   lethargy:seed.clinicalOverlay.lethargy.severity,
   consciousness:seed.clinicalOverlay.lethargy.consciousness,
   pneumonia:seed.clinicalOverlay.chestInfection.pneumonia,
   sepsis:seed.clinicalOverlay.systemic.sepsisStatus,
   shock:seed.clinicalOverlay.systemic.shock,
   respiratoryRate:seed.clinicalOverlay.respiratory.respiratoryRate,
   oxygenation:seed.clinicalOverlay.respiratory.oxygenation,
   oxygenationSignal:seed.clinicalOverlay.respiratory.pulseOximetryReliability,
   bloodPressure:seed.clinicalOverlay.systemic.bloodPressure,
   heartRate:seed.clinicalOverlay.systemic.heartRate,
   bloodGlucose:seed.clinicalOverlay.systemic.bloodGlucose,
   microbiology:'NO_RESULT',
   chestImaging:'NO_RESULT',
   antibioticAdministered:false,
   invasiveProcedurePerformed:false,
   rhythm:'UNKNOWN_NOT_ACQUIRED',rosc:'NOT_APPLICABLE_NO_ARREST_DIAGNOSIS',
   breathingEffort:'NOT_FORMALLY_ASSESSED',perfusionConcern:'UNRESOLVED'
  },
  access:{response:'SLOW_WITH_MARKED_FATIGUE',communicationSupport:'POSITIONING_NOT_YET_CONFIRMED',
    patientWords:'NO_NEW_VERIFIED_MESSAGE',capacity:'NOT_INFERRED',
    supporterAuthority:'NOT_ASSUMED'},
  selected:null,checked:{},assigned:{},completed:[],reassessed:[],ledger:[],commands:[],
  notice:'Alex has a fictional 39.4°C fever and marked new lethargy. Immediate qualified assessment, senior escalation and communication access are needed in parallel.'
 };
}
const event=(s,type,station,detail)=>({...s,ledger:[...s.ledger,{id:'ALEX-'+String(s.ledger.length+1).padStart(3,'0'),
 time:alexClock(s.clock),type,station:station??null,detail}]});
const record=(s,cmd)=>({...s,commands:[...s.commands,{...cmd}]});
export function alexGate(s,seed,id){
 const a=seed.interventionStations?.find(item=>item.id===id);
 if(!a)return Object.freeze({allow:false,status:'NOT_FOUND',reason:'Unknown intervention station.'});
 if(a.clinical_state==='context_only_locked')return Object.freeze({allow:false,status:'HOLD_PROTOCOL',
  reason:'High-risk action cannot be performed in this synthetic preview. A qualified clinical team and current local protocol are required.'});
 if(!ALEX_ACTIONS.includes(id))return Object.freeze({allow:false,status:'NOT_SUPPORTED',reason:'Station not installed.'});
 return Object.freeze({allow:true,status:'ALLOW_EDUCATIONAL_ACTION_ONLY',
 reason:'Permitted to document qualified assessment, communication assistance or review request. No clinical result, prescription or treatment effect may be inferred.'});
}
export function alexStationStatus(s,seed,id){
 const g=alexGate(s,seed,id);
 if(!g.allow)return 'LOCKED_BY_PROTOCOL';
 if(s.reassessed.includes(id))return 'REASSESSED';
 if(s.completed.includes(id))return 'DOCUMENTED';
 if(s.assigned[id])return 'ASSIGNED';
 if(s.checked[id]?.allow)return 'CHECKED';
 if(s.selected===id)return 'SELECTED';
 return 'AVAILABLE';
}

function applyAuthoredCrisisCue(s,cue,index){
  const crisis=s.crisis;
  const latestIndex=index+1,terminal=latestIndex>=crisis.total;
  const date=Math.max(s.clock,crisis.baseClock+cue.second);
  const history=[...crisis.observations,{
    id:cue.id,simTime:alexClock(date),domain:cue.domain,
    status:'KNOWN_AUTHORED_SYNTHETIC',detail:cue.text,
    known:cue.known,unknown:cue.unknown,source:cue.source,workstream:cue.workstream
  }];
  const next={
    ...s,clock:date,phase:'ED_CASCADE_CRISIS',running:!terminal,
    clinical:{...s.clinical,...(cue.clinicalPatch||{}),sepsis:s.clinical.sepsis,shock:'NOT_ESTABLISHED',
      antibioticAdministered:false,invasiveProcedurePerformed:false,
      rosc:'NOT_APPLICABLE_NO_ARREST_DIAGNOSIS'},
    access:{...s.access,...(cue.accessPatch||{}),capacity:'NOT_INFERRED',
      supporterAuthority:'NOT_ASSUMED',patientWords:'NO_NEW_VERIFIED_MESSAGE'},
    system:{...s.system,...(cue.systemPatch||{}),escalation:'IMMEDIATE_SENIOR_ED_ICU_REVIEW_REQUIRED'},
    crisis:{...crisis,index:latestIndex,observations:history,status:terminal?'DECISION_HOLD':'ACTIVE'},
    notice:cue.text+' Evidence source: '+cue.source+'. '+(terminal?
      'Cascade observations complete; freeze for scenario-director decision.':
      'Further unpredictable synthetic cue pending; you may pause and reassess.')
  };
  return event(next,'CASCADE',cue.id,JSON.stringify({
    authoredSynthetic:true,text:cue.text,source:cue.source,known:cue.known,unknown:cue.unknown,
    cause:'NOT_CONFIRMED',treatmentEffect:'NONE_ASSUMED'}));
}

export function alexDispatch(prior,seed,command){
 const cmd={kind:command.kind,id:command.id??null,seconds:command.seconds??null,
   crisisSeed:Number.isInteger(command.crisisSeed)?command.crisisSeed:null};
 let s=record(prior,cmd);
 if(cmd.kind==='RESET')return createAlexSession(seed);
 if(cmd.kind==='RUN')return event({...s,running:true,notice:'Educational clock can advance explicitly. Fever, lethargy and other physiology do not change automatically.'},'CLOCK',null,'Simulation resumed');
 if(cmd.kind==='PAUSE')return event({...s,running:false,notice:'Paused for reading, AAC and switch scanning. Clinical facts unchanged.'},'CLOCK',null,'Simulation paused');

 if(cmd.kind==='TRIGGER_CASCADE'){
  if(s.crisis)return event({...s,notice:'Crisis already triggered. Continue existing events or reset for another variant.'},'GATE',null,'Repeat trigger held');
  const chosenSeed=cmd.crisisSeed??0;
  let variant;
  try{variant=selectCrisisVariant(chosenSeed);}
  catch(_error){return event({...s,notice:'Invalid crisis seed. No change.'},'GATE',null,'Seed rejected');}
  s={...s,running:true,crisis:{seed:chosenSeed,version:'0.1.0-synthetic',
    id:variant.id,name:variant.name,baseClock:s.clock,total:variant.events.length,index:0,
    status:'ACTIVE',observations:[]}};
  return applyAuthoredCrisisCue(s,variant.events[0],0);
 }
 if(cmd.kind==='NEXT_CASCADE'){
  if(!s.crisis)return event({...s,notice:'Trigger a crisis first.'},'GATE',null,'No cascade started');
  if(!s.running)return event({...s,notice:'Cascade paused or at a decision hold; no additional event committed.'},'GATE',null,'Clock frozen');
  const variant=selectCrisisVariant(s.crisis.seed);
  if(s.crisis.index>=variant.events.length)return event({...s,notice:'Crisis cue sequence complete; choose an assessment/rescue workstream.'},'GATE',null,'Complete');
  return applyAuthoredCrisisCue(s,variant.events[s.crisis.index],s.crisis.index);
 }
 if(cmd.kind==='STEP'){
  if(!s.running)return event({...s,notice:'Clock remains paused; no synthetic time advanced.'},'GATE',null,'Step held');
  const delta=Number.isInteger(cmd.seconds)?Math.min(30,Math.max(1,cmd.seconds)):5;
  s={...s,clock:s.clock+delta,notice:'Clock advanced without inventing new observations or recovery.'};
  return event(s,'CLOCK',null,'Synthetic step '+delta+' seconds');
 }
 const a=seed.interventionStations?.find(item=>item.id===cmd.id);
 if(cmd.kind==='SELECT')return event({...s,selected:cmd.id,
  notice:a?'Selected '+a.title+'. This does not perform a clinical action.':'Unknown station.'},'SELECT',cmd.id,'Inspection only');
 if(cmd.kind==='CHECK'){
  const g=alexGate(s,seed,cmd.id);
  s={...s,checked:{...s.checked,[cmd.id]:g},notice:g.status+': '+g.reason};
  return event(s,'GATE',cmd.id,g.reason);
 }
 if(cmd.kind==='ASSIGN'){
  const g=alexGate(s,seed,cmd.id);
  if(!g.allow||!s.checked[cmd.id]?.allow)return event({...s,notice:'Check the evidence gate first; no assignment made.'},'GATE',cmd.id,g.reason);
  s={...s,assigned:{...s.assigned,[cmd.id]:a.assignedWorkstream},
   notice:'Assigned fictional workstream: '+a.assignedWorkstream+'. No clinical action performed.'};
  return event(s,'ASSIGN',cmd.id,a.assignedWorkstream);
 }
 if(cmd.kind==='COMMIT'){
  const g=alexGate(s,seed,cmd.id);
  if(!s.running||!g.allow||!s.checked[cmd.id]?.allow||!s.assigned[cmd.id])
   return event({...s,notice:'Commit blocked: resume, check evidence and assign clinical role. '+g.reason},'GATE',cmd.id,'Commit held');
  s={...s,completed:[...s.completed,cmd.id],notice:a.actionConsequence+' Reassessment remains due.'};
  if(cmd.id==='AAC')s={...s,access:{...s.access,communicationSupport:'ACCESS_ASSISTANCE_OFFERED',
   patientWords:'NO_NEW_VERIFIED_MESSAGE',capacity:'NOT_INFERRED'}};
  return event(s,'DOCUMENTED',cmd.id,a.actionConsequence);
 }
 if(cmd.kind==='REASSESS'){
  if(!s.completed.includes(cmd.id))return event({...s,notice:'No documented educational action to reassess.'},'GATE',cmd.id,'Reassessment held');
  s={...s,reassessed:[...s.reassessed,cmd.id],
    notice:'Reassessment requested/documented. No new readings, results, diagnosis or patient message were generated.'};
  return event(s,'REASSESS',cmd.id,a?.reassessment??'Current facts remain uncertain');
 }
 return event({...s,notice:'Unsupported command; clinical state unchanged.'},'GATE',cmd.id,'Unknown command');
}
export function replayAlex(seed,commands){
 return commands.reduce((s,cmd)=>alexDispatch(s,seed,cmd),createAlexSession(seed));
}
export function alexSnapshot(s){
 return Object.freeze({
  status:s.crisis?'FICTIONAL_ACUTE_CASCADE':'FICTIONAL_ACUTE_ED',
  known:['Temperature '+s.clinical.measuredTemperatureC+'°C (synthetic)',
  'Marked new lethargy relative to baseline','Reported worsening cough and breathing concern',
  'Chest infection is the clinical working diagnosis'],
  unresolved:['Pneumonia not confirmed','Sepsis and shock not established',
   s.crisis?'Consciousness, oxygenation, rhythm confirmation and serial perfusion reassessment remain unresolved':'Consciousness, SpO₂, RR, BP and other observations not yet verified',
   'No antibiotic or invasive airway action performed'],
  patientVoice:'No new reliable words; communicate directly and restore access',
  priority:'Urgent A–G and senior review/CERS consideration, parallel with communication access',
  clinicianAuthority:'Local NSW adult sepsis pathway must govern any real clinical care; simulator has no order-writing authority'
 });
}
