/**
 * AURA adult febrile chest infection training branch.
 * Deliberately separate from Rohan's fictional paediatric PEA/asystole runtime.
 * Case seed is passed in from the JSON scenario; no source can author medication,
 * deterioration, diagnosis, consent, or effects without an explicit verified gate.
 */
export const ALEX_ACTIONS=Object.freeze(['AAC','OBS','CERS','SEPSIS','CHEST','MED','ANTIBIOTICS','AIRWAY']);
export function alexClock(seconds){
 return [Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
}
export function createAlexSession(seed){
 if(seed?.scenarioId!=='aura-cp-communication-respiratory-synthetic-v01'||
 !seed.clinicalOverlay?.syntheticOnly||seed.caseLinkage!=='SEPARATE_FROM_ROHAN')throw Error('Invalid or non-isolated fictional Alex seed');
 return {
  scenarioId:seed.scenarioId,revision:seed.scenarioRevision,syntheticOnly:true,phase:'ED',running:false,
  clock:14*3600+10*60,
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
   invasiveProcedurePerformed:false
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
export function alexDispatch(prior,seed,command){
 const cmd={kind:command.kind,id:command.id??null,seconds:command.seconds??null};
 let s=record(prior,cmd);
 if(cmd.kind==='RESET')return createAlexSession(seed);
 if(cmd.kind==='RUN')return event({...s,running:true,notice:'Educational clock can advance explicitly. Fever, lethargy and other physiology do not change automatically.'},'CLOCK',null,'Simulation resumed');
 if(cmd.kind==='PAUSE')return event({...s,running:false,notice:'Paused for reading, AAC and switch scanning. Clinical facts unchanged.'},'CLOCK',null,'Simulation paused');
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
  status:'FICTIONAL_ACUTE_ED',
  known:['Temperature '+s.clinical.measuredTemperatureC+'°C (synthetic)',
  'Marked new lethargy relative to baseline','Reported worsening cough and breathing concern',
  'Chest infection is the clinical working diagnosis'],
  unresolved:['Pneumonia not confirmed','Sepsis and shock not established',
   'Consciousness, SpO₂, RR, BP and other observations not yet verified',
   'No antibiotic or invasive airway action performed'],
  patientVoice:'No new reliable words; communicate directly and restore access',
  priority:'Urgent A–G and senior review/CERS consideration, parallel with communication access',
  clinicianAuthority:'Local NSW adult sepsis pathway must govern any real clinical care; simulator has no order-writing authority'
 });
}
