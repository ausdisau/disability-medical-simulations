/**
 * AURA adult ICU telemetry planning — educational, fictional, synthetic only.
 *
 * This separate module is a decision/display controller. It cannot invent an
 * ECG, pulse, temperature trend, patient response, verified core-probe
 * placement, sepsis diagnosis or cooling-induced treatment effect.
 */
export const ICU_STATIONS = Object.freeze([
 {id:'MONITOR',title:'Continuous rhythm telemetry assessment',group:'Cardiac',kind:'assessment',
  owner:'Qualified ICU/ED monitoring nurse',indication:'Consider for critical illness, haemodynamic concern or other monitored indication.',
  purpose:'Document monitor selection, skin/electrode tolerance, lead signal quality and escalation plan; telemetry is not a diagnostic 12-lead ECG.',
  observableResult:'SIGNAL_NOT_ACQUIRED',reassess:'Review actual rhythm only after signal quality and clinical context are verified.',
  failure:'Artefact or detachment requires repair; a missing waveform is not asystole.',status:'AVAILABLE'},
 {id:'ECG12',title:'Clinician-reviewed 12-lead ECG',group:'Cardiac',kind:'assessment',
  owner:'Clinician qualified to request, record and interpret a 12-lead ECG',indication:'Clinical concern for cardiac involvement, arrhythmia, ischaemia, electrolyte effects or other appropriate indication.',
  purpose:'Request and arrange a diagnostic 12-lead, distinct from the continuous bedside rhythm monitor.',
  observableResult:'NO_12_LEAD_ACQUIRED',reassess:'A qualified clinician interprets an actually recorded ECG and its artefacts.',
  failure:'Failure to acquire or poor tracing triggers senior review; do not manufacture a result.',status:'AVAILABLE'},
 {id:'TEMP_REPEAT',title:'Serial accurate temperature assessment',group:'Temperature',kind:'assessment',
  owner:'Qualified bedside ICU/ED nurse',indication:'High fever and new marked lethargy warrant serial temperature assessment and trend review.',
  purpose:'Check repeat temperature with validated appropriate measurement method and compare with prior synthetic triage 39.4°C.',
  observableResult:'NO_NEW_MEASUREMENT',reassess:'Look for documented source, time, trend and accompanying clinical state.',
  failure:'Unreliable measurement method → repeat measurement; the initial triage value is not a core trend.',status:'AVAILABLE'},
 {id:'CORE_REVIEW',title:'Assess need for continuous core-temperature monitoring',group:'Temperature',kind:'governance',
  owner:'Qualified ICU consultant and monitoring nurse',indication:'Accurate ongoing temperature measurements materially affect diagnosis or management, or validated suitable device already exists.',
  purpose:'Review whether an appropriate central probe is already in situ or clinically justified; confirm source, correct positioning, reliability and patient comfort.',
  observableResult:'NO_VALIDATED_CORE_FEED',reassess:'If clinically initiated elsewhere, monitor sensor reliability and temperature changes; no automatic feedback-loop dosing.',
  failure:'No valid device or erroneous readings → stop reliance on that sensor and use appropriate alternative.',status:'AVAILABLE'},
 {id:'HEMODYNAMIC',title:'Haemodynamic and respiratory trend review',group:'Critical care',kind:'assessment',
  owner:'ICU resuscitation team',indication:'High fever, marked new lethargy and breathing concern with possible sepsis.',
  purpose:'Review BP, SpO₂ quality, RR, work of breathing, alertness, capillary refill, fluid balance, urine output and clinician-indicated lactate.',
  observableResult:'NO_NEW_VITAL_SIGNS',reassess:'Interpret actual perfusion and organ dysfunction findings, not fever alone.',
  failure:'Concern for deterioration → initiate current local NSW CERS/sepsis response without waiting for a pathogen.',status:'AVAILABLE'},
 {id:'FLUID_REVIEW',title:'Review indication for IV crystalloid resuscitation',group:'Critical care',kind:'assessment',
  owner:'Authorised medical prescriber and qualified ICU nurse',indication:'Consider if actual haemodynamic assessment demonstrates hypoperfusion or shock, not just fever.',
  purpose:'Assess fluid responsiveness, cardiac/renal risk, respiratory status and overload; consult current local NSW sepsis protocol.',
  observableResult:'NO_FLUID_ADMINISTERED',reassess:'Review clinical response and fluid balance only after independently authorised administration.',
  failure:'Signs of overload or persistent poor perfusion → senior ICU review and other approved interventions.',status:'AVAILABLE'},
 {id:'COMFORT',title:'Review fever-related discomfort and non-cooling supportive care',group:'Temperature',kind:'assessment',
  owner:'Qualified nurse and prescribing clinician',indication:'Patient discomfort, delirium evaluation or other patient-centred need.',
  purpose:'Assess symptoms, hydration needs, bedding, skin integrity and whether medication or nonpharmacological comfort measures are appropriate.',
  observableResult:'COMFORT_ASSESSMENT_ONLY',reassess:'Check actual comfort, access preferences and unexpected clinical change.',
  failure:'Treatment not tolerated or patient reports distress → stop and reassess within clinical authority.',status:'AVAILABLE'},
 {id:'CHILLED_IV',title:'Chilled saline infusion for fever suppression',group:'High-risk hold',kind:'intervention',
  owner:'Qualified ICU clinician only',indication:'Not routine sepsis-associated fever treatment.',
  purpose:'Visible for critical appraisal; do not equate resuscitation fluids with temperature-control fluids.',
  observableResult:'NOT_PERFORMED',reassess:'Not applicable; no treatment permitted in this educational branch.',
  failure:'Risks include avoidable fluid loading, rapid temperature shifts and masking trends; seek senior review.',status:'HOLD_UNSUPPORTED'},
 {id:'ICE_PACKS',title:'Ice packs / aggressive surface cooling',group:'High-risk hold',kind:'intervention',
  owner:'Qualified ICU clinician and bedside nurse',indication:'Requires a separate patient-specific indication, comfort/skin/shivering evaluation and approved local protocol; not routine for 39.4°C infection fever.',
  purpose:'Visible contextual option with risks and limits for teaching, not an implied treatment.',
  observableResult:'NOT_PERFORMED',reassess:'Not applicable without an authorised separate cooling indication.',
  failure:'Potential discomfort, skin damage, shivering, hypotension or overshoot hypothermia; evaluate before considering external cooling.',status:'HOLD_FOR_INDICATION'},
 {id:'CORE_PROBE',title:'Insert invasive core-temperature probe',group:'High-risk hold',kind:'intervention',
  owner:'Qualified clinician with relevant device competence',indication:'Only with a separate appropriate patient-specific indication and local device protocol.',
  purpose:'Clinical procedure not installed; merely requesting a trend is not indication to insert a probe.',
  observableResult:'NOT_INSERTED',reassess:'No device output to interpret.',failure:'Review validated non-invasive options and clinical need.',status:'HOLD_FOR_PROTOCOL'},
 {id:'AUTO_TITRATE',title:'Automatic cooling titration using ECG / core temperature',group:'High-risk hold',kind:'intervention',
  owner:'No delegated algorithmic authority',indication:'No valid automatically controlled temperature treatment indication.',
  purpose:'Block closed-loop saline/cooling adjustment from learner clicks, illustrative ECG or historical fever.',
  observableResult:'NO_CONTROL_OUTPUT',reassess:'No treatment effect.',failure:'Human-authorised clinical plan required.',status:'BLOCKED_AUTOMATION'}
]);
export const ECG_12_LEADS=Object.freeze(['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6']);
export const ICU_EVIDENCE_SOURCES=Object.freeze([
 {id:'SSC2026',title:'Surviving Sepsis Campaign adult sepsis and septic shock 2026',url:'https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026',
  supports:'Suggest against routine pharmacologic or surface antipyretics solely for improving outcomes; resuscitation fluids require indication and repeated reassessment.',scope:'Adult international, not an NSW local prescribing pack'},
 {id:'NSW2026',title:'NSW ACI Adult ECAT: Sepsis (suspected), Oct 2026',url:'https://aci.health.nsw.gov.au/ecat/adult/sepsis',
  supports:'Adult sepsis escalation, investigations, clinician-led resuscitation and repeated observations.',scope:'Statewide, local CERS and scope of practice control'},
 {id:'ICUFEVER',title:'SCCM/IDSA Guidelines for evaluating new fever in ICU adults, 2023',url:'https://www.idsociety.org/practice-guideline/new-fever-in-critically-ill-patients/',
  supports:'Central temperature measurement when clinically important and suitable device in situ; against routine antipyretics only to lower fever.',scope:'General ICU best-practice comparator'}
]);
export function createTelemetry(caseId='aura-cp-communication-respiratory-synthetic-v01'){
 if(caseId!=='aura-cp-communication-respiratory-synthetic-v01')throw Error('Telemetry case must be separate from Rohan');
 return {
  caseId,fictional:true,phase:'ED_TO_ICU_REVIEW_NOT_ADMISSION',running:false,selected:null,
  checks:{},assignments:{},documented:[],reassessed:[],ledger:[],commands:[],notice:'ICU monitoring plan: verify real patient-specific clinical indication and equipment; no signal acquired.',
  knownTemperature:{valueC:39.4,kind:'ED_TRIAGE_SPOT_READING',source:'AUTHORED_FICTIONAL',time:'INITIAL_TRIAGE',coreSensor:false},
  tempReadings:[],ecg12:{status:'NOT_ACQUIRED',leads:ECG_12_LEADS},
  rhythm:{status:'NOT_ACQUIRED',trace:[],artefactStatus:'UNKNOWN'},
  coreTemp:{status:'NOT_CONNECTED',method:'UNKNOWN',reliability:'UNKNOWN'},
  observations:{heartRate:'UNKNOWN',bp:'UNKNOWN',rr:'UNKNOWN',spo2:'UNKNOWN',lactate:'UNKNOWN',perfusion:'UNKNOWN'},
  cooling:{chilledSalineInfusing:false,icePacksApplied:false,automaticTitration:false,rate:null,temperatureTarget:null},
  sepsisStatus:'SUSPECTED_RISK_NOT_CONFIRMED',invasiveMonitoringPerformed:false,
  person:{aac:'SLOWED_BY_FATIGUE',capacity:'NOT_INFERRED',newConsent:'NOT_OBTAINED',supporterAuthority:'NOT_ASSUMED'}
 };
}
function record(s,type,id,text){return {...s,ledger:[...s.ledger,{id:'TELEM-'+String(s.ledger.length+1).padStart(3,'0'),type,station:id,time:'PATIENT_CLOCK_SEPARATE',text}]};}
export function telemetryGate(s,id){
 const a=ICU_STATIONS.find(x=>x.id===id);
 if(!a)return Object.freeze({allow:false,status:'UNKNOWN_STATION',reason:'Unrecognized station'});
 if(a.status==='HOLD_UNSUPPORTED')return Object.freeze({allow:false,status:'BLOCK_UNSUPPORTED',
  reason:'Routine chilled saline infusion to reduce sepsis fever is unsupported; no local protocol, haemodynamic indication or temperature-control treatment authority supplied.'});
 if(a.status==='HOLD_FOR_INDICATION')return Object.freeze({allow:false,status:'HOLD_FOR_INDICATION',
  reason:'Surface cooling or ice packs are not automatically indicated for infection-related fever. Establish a separate symptom/neurological/hyperthermia indication, assess risks and obtain clinical authorization.'});
 if(a.status==='HOLD_FOR_PROTOCOL')return Object.freeze({allow:false,status:'HOLD_FOR_PROTOCOL',
  reason:'Invasive core probe insertion requires a patient-specific indication, source-validated method and clinical authority; a monitoring preference alone is insufficient.'});
 if(a.status==='BLOCKED_AUTOMATION')return Object.freeze({allow:false,status:'BLOCK_AUTOMATED_TITRATION',
  reason:'No autonomous cooling control from ECG, fever or monitor placeholders; authorised clinician titration only where relevant.'});
 return Object.freeze({allow:true,status:'ALLOW_PRINCIPLE_LEVEL',reason:'Only monitoring and review workflow documentation; no signal acquisition, invasive action, infusion or measured effect.'});
}
export function telemetryStatus(s,id){
 const g=telemetryGate(s,id);if(!g.allow)return 'LOCKED_BY_EVIDENCE';
 if(s.reassessed.includes(id))return 'REASSESSED';
 if(s.documented.includes(id))return 'DOCUMENTED';
 if(s.assignments[id])return 'ASSIGNED';
 if(s.checks[id]?.allow)return 'CHECKED';
 if(s.selected===id)return 'SELECTED';return 'AVAILABLE';
}
export function telemetryDispatch(previous,action){
 const cmd={type:action.type,id:action.id??null};
 let s={...previous,commands:[...previous.commands,cmd]};
 if(cmd.type==='RESET')return createTelemetry(s.caseId);
 if(cmd.type==='SELECT')return record({...s,selected:cmd.id,notice:'Selected monitoring station; selection does not imply device connection or treatment.'},'SELECT',cmd.id,'No treatment committed');
 if(cmd.type==='CHECK'){
   const g=telemetryGate(s,cmd.id);
   return record({...s,checks:{...s.checks,[cmd.id]:g},notice:g.status+': '+g.reason},'GATE',cmd.id,g.reason);
 }
 if(cmd.type==='ASSIGN'){
   const g=telemetryGate(s,cmd.id),a=ICU_STATIONS.find(x=>x.id===cmd.id);
   if(!g.allow||!s.checks[cmd.id]?.allow)return record({...s,notice:'Assignment held until a passing evidence gate.'},'HOLD',cmd.id,g.reason);
   return record({...s,assignments:{...s.assignments,[cmd.id]:a.owner},notice:'Assigned fictional assessment role; no device or procedure committed.'},'ASSIGN',cmd.id,a.owner);
 }
 if(cmd.type==='DOCUMENT'){
  const g=telemetryGate(s,cmd.id),a=ICU_STATIONS.find(x=>x.id===cmd.id);
  if(!g.allow||!s.checks[cmd.id]?.allow||!s.assignments[cmd.id])
   return record({...s,notice:'Document held. Review source, indication and qualified assignment; high-risk cooling remains locked.'},'HOLD',cmd.id,g.reason);
  return record({...s,documented:[...s.documented,cmd.id],
    notice:'Educational assessment documented. '+a.observableResult+'. No new observation, diagnosis, treatment or device connection.'},'DOCUMENT',cmd.id,a.observableResult);
 }
 if(cmd.type==='REASSESS'){
  if(!s.documented.includes(cmd.id))return record({...s,notice:'Reassessment requires a documented assessment first.'},'HOLD',cmd.id,'Not documented');
  const a=ICU_STATIONS.find(x=>x.id===cmd.id);
  return record({...s,reassessed:[...s.reassessed,cmd.id],
   notice:'Reassessment requested. No new measured ECG, core temperature or treatment effect without an authored reliable observation.'},'REASSESS',cmd.id,a?.reassess??'UNKNOWN');
 }
 return record({...s,notice:'Unsupported telemetry command. Patient state unchanged.'},'HOLD',cmd.id,'Unknown');
}
export function telemetrySupervisor(s){
 return Object.freeze({mode:'JMO_READ_ONLY',question:'What clinical indication and reliable measurement would justify continuous core temperature monitoring, and why would an unverified ECG or 39.4°C fever not authorise rapid cooling?',
  identifiedRisk:'Possible sepsis with fever and marked new lethargy requires prompt assessment and senior escalation.',
  noCoolingOrder:true,patientEffect:'UNASSESSED',
  knownTemperature:s.knownTemperature.valueC,coreTempAvailable:false,ecgTraceAvailable:false,
  reviewedSourceIds:ICU_EVIDENCE_SOURCES.map(x=>x.id),
  noAutonomousTitration:true});
}
export function replayTelemetry(commands){
 return commands.reduce((s,c)=>telemetryDispatch(s,c),createTelemetry());
}
