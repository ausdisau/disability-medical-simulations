/**
 * AURA Project Hope — deterministic, fictional cascade envelopes.
 * "Unpredictable" means bounded surprise selected by a recorded seed. It NEVER
 * means a language model or random number generator can invent treatment,
 * prognosis, patient speech or death without an authored, reviewed event.
 */
export const CASCADE_ENGINE_VERSION='0.1.0-synthetic';
export const CRISIS_VARIANTS=Object.freeze([
 {id:'airway-perfusion-artifact',name:'Airway–perfusion–telemetry conflict',
  events:[
   {second:18,domain:'clinical',id:'COUGH',text:'Sudden coughing episode, visibly increased breathing effort and difficulty sustaining speech.',source:'AUTHORED_FICTIONAL_BEDSIDE_OBSERVATION',known:'Increased work of breathing; chest infection already suspected.',unknown:'Secretion burden, aspiration and evolving infection are possible; no airway obstruction or aspiration established.',workstream:'OBS',clinicalPatch:{breathingEffort:'INCREASED_OBSERVED_SYNTHETIC'}},
   {second:29,domain:'system',id:'ECG_ARTIFACT',text:'Monitor sounds a possible dangerous-rhythm alarm while electrode movement causes poor signal quality.',source:'FICTIONAL_MONITOR_ALARM_UNVERIFIED',known:'An alarm occurred during movement; monitor signal quality degraded.',unknown:'Actual ECG rhythm and any arrhythmia are not established.',workstream:'OBS',systemPatch:{telemetry:'POOR_SIGNAL_DANGEROUS_RHYTHM_UNVERIFIED'}},
   {second:39,domain:'clinical',id:'LOW_BP',text:'Qualified clinician obtains a new fictional blood pressure of 88/54 mmHg; hands appear cool.',source:'AUTHORED_FICTIONAL_CLINICIAN_MEASUREMENT',known:'One concerning low BP reading plus cool extremities.',unknown:'Shock physiology, cause, repeat pressure, lactate and perfusion trend remain unknown.',workstream:'CERS',clinicalPatch:{bloodPressure:'88/54 mmHg (FICTIONAL)',bloodPressureSource:'CLINICIAN_FICTIONAL_14_10_39',perfusionConcern:'NEW_LOW_BP_COOL_HANDS'}},
   {second:50,domain:'access',id:'AAC_DISPLACED',text:'During repositioning, Alex’s AAC device shifts out of usable reach. No new response is reliably communicated.',source:'AUTHORED_FICTIONAL_ACCESS_OBSERVATION',known:'AAC device out of usable reach.',unknown:'Patient opinion or consent while access is lost is unknown.',workstream:'AAC',accessPatch:{communicationSupport:'DEVICE_OUT_OF_REACH',patientWords:'NO_NEW_VERIFIED_MESSAGE',capacity:'NOT_INFERRED'}}
  ]},
 {id:'respiratory-sensor-circulation',name:'Respiratory change with misleading oxygen alarm',
  events:[
   {second:18,domain:'system',id:'SPO2_UNRELIABLE',text:'Pulse-oximeter alarm sounds during movement; the waveform and signal quality are poor.',source:'FICTIONAL_MONITOR_ALARM_UNVERIFIED',known:'Pulse-oximetry signal is unreliable.',unknown:'Actual oxygenation cannot be deduced from the alarm.',workstream:'OBS',clinicalPatch:{oxygenation:'UNVERIFIED',oxygenationSignal:'POOR_SIGNAL'}},
   {second:29,domain:'clinical',id:'BREATHING_WORSE',text:'Nurse observes increased work of breathing and repeated coughing.',source:'AUTHORED_FICTIONAL_BEDSIDE_OBSERVATION',known:'Visible respiratory deterioration.',unknown:'Cause and oxygenation remain uncertain.',workstream:'OBS',clinicalPatch:{breathingEffort:'INCREASED_OBSERVED_SYNTHETIC'}},
   {second:39,domain:'clinical',id:'LOW_BP',text:'Clinician measures a fictional BP of 88/54 mmHg; cause is uncertain.',source:'AUTHORED_FICTIONAL_CLINICIAN_MEASUREMENT',known:'One low BP reading.',unknown:'Shock and infection-related organ dysfunction are not established.',workstream:'CERS',clinicalPatch:{bloodPressure:'88/54 mmHg (FICTIONAL)',bloodPressureSource:'CLINICIAN_FICTIONAL',perfusionConcern:'NEW_LOW_BP'}},
   {second:50,domain:'access',id:'AAC_SIGNAL_LOSS',text:'Alex’s fatigue and repositioning make the AAC selection method unreliable. No communication is interpreted.',source:'AUTHORED_FICTIONAL_ACCESS_OBSERVATION',known:'Communication method needs access repair.',unknown:'No decision-specific capacity assessment or new message.',workstream:'AAC',accessPatch:{communicationSupport:'ACCESS_METHOD_UNRELIABLE',patientWords:'NO_NEW_VERIFIED_MESSAGE',capacity:'NOT_INFERRED'}}
  ]},
 {id:'aspiration-uncertainty-workflow',name:'Aspiration question and emergency workflow conflict',
  events:[
   {second:18,domain:'clinical',id:'COUGH_RETCH',text:'Alex suddenly coughs and retches; whether aspiration occurred is not established.',source:'AUTHORED_FICTIONAL_BEDSIDE_OBSERVATION',known:'Cough/retching with increased respiratory effort.',unknown:'Aspiration, microbiology and current airway status remain undiagnosed.',workstream:'OBS',clinicalPatch:{breathingEffort:'INCREASED_OBSERVED_SYNTHETIC',aspiration:'POSSIBLE_NOT_CONFIRMED'}},
   {second:29,domain:'system',id:'ECG_ALARM',text:'Continuous ECG alarm is obscured by movement artefact during the assessment.',source:'FICTIONAL_MONITOR_ALARM_UNVERIFIED',known:'Artefact prevents reliable rhythm interpretation.',unknown:'No malignant rhythm or loss of circulation is proven.',workstream:'OBS',systemPatch:{telemetry:'MOTION_ARTEFACT_RHYTHM_UNKNOWN'}},
   {second:39,domain:'clinical',id:'LOW_BP',text:'New fictional manual BP is 88/54 mmHg; poor perfusion must be evaluated.',source:'AUTHORED_FICTIONAL_CLINICIAN_MEASUREMENT',known:'Concerning low BP reading.',unknown:'Septic shock, fluid responsiveness and organ failure are not established.',workstream:'CERS',clinicalPatch:{bloodPressure:'88/54 mmHg (FICTIONAL)',bloodPressureSource:'CLINICIAN_FICTIONAL',perfusionConcern:'NEW_LOW_BP'}},
   {second:50,domain:'access',id:'AAC_OUT_OF_POSITION',text:'The AAC mount shifts during repositioning. Alex has no verified new message.',source:'AUTHORED_FICTIONAL_ACCESS_OBSERVATION',known:'Access device no longer positioned for use.',unknown:'Alex’s preferences and ability to respond cannot be inferred from silence.',workstream:'AAC',accessPatch:{communicationSupport:'DEVICE_OUT_OF_POSITION',patientWords:'NO_NEW_VERIFIED_MESSAGE',capacity:'NOT_INFERRED'}}
  ]}
]);
export const CASCADE_WORKSTREAMS=Object.freeze([
 {id:'CERS',name:'Senior emergency / critical-care escalation',owner:'Qualified ED/ICU clinical lead',critical:true},
 {id:'OBS',name:'Airway, breathing, circulation and signal verification',owner:'Qualified bedside RN and doctor',critical:true},
 {id:'SEPSIS',name:'Possible sepsis and reversible-cause assessment',owner:'Qualified senior doctor',critical:true},
 {id:'AAC',name:'Restore patient communication access in parallel',owner:'Bedside access-support team',critical:true}
]);
export function selectCrisisVariant(seed=0){
 if(!Number.isInteger(seed)||seed<0||seed>1000000000)throw new Error('Seed must be a nonnegative integer up to 1 billion');
 if(seed===0)return CRISIS_VARIANTS[0];
 let x=2166136261;for(const ch of String(seed)){x^=ch.charCodeAt(0);x=Math.imul(x,16777619);}
 return CRISIS_VARIANTS[(x>>>0)%CRISIS_VARIANTS.length];
}
export function expectedCrisisEvent(variant,index){
 const v=CRISIS_VARIANTS.find(x=>x.id===variant);
 return v?.events[index]||null;
}
export function crisisEvidence(variant,index){
 const e=expectedCrisisEvent(variant,index);
 return e?Object.freeze({eventId:e.id,known:e.known,unknown:e.unknown,source:e.source,
   scope:'AUTHORED_FICTIONAL_CASE_OBSERVATION',treatmentAuthority:false}):null;
}
