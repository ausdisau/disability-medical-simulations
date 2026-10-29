import type { LungParameters } from './pulmonary';
export type StationId = '04'|'17'|'20'|'14'|'07'|'23'|'09'|'01';
export type StationStage = 'available'|'selected'|'checked'|'assigned'|'committed';
export interface CareState {
  aacAvailable:boolean; callAccess:boolean; planVerified:boolean; assessmentDone:boolean;
  signalsVerified:boolean; circuitAssessed:boolean; seniorRequested:boolean;
  responderReady:boolean; reassessmentDue:boolean; reassessmentCount:number;
  comfortChecked:boolean; humidificationChecked:boolean; skinChecked:boolean;
  patientMessage:string; patientResponse:'known'|'unknown'|'wait';
  /** Explicit fictional-patient agreement for one planned station; never inferred from a response or plan. */
  patientAgreement:StationId|null;
  selected:StationId|null; stage:StationStage; assignedRole:string;
}
export interface Station {
  id:StationId; title:string; workstream:string; purpose:string; trigger:string;
  readiness:string; reassess:string; rescue:string; access:string; contextOnly?:boolean;
}
export const stations:Station[]=[
 {id:'04',title:'Individual airway plan',workstream:'Bedside nurse',purpose:'Confirm route, current plan, patient preferences and escalation responsibilities.',trigger:'Before interpreting airway problems or committing a planned intervention.',readiness:'Scenario identity and current plan checked.',reassess:'Compare subsequent decisions with the individual plan.',rescue:'Request senior review if the plan is missing or uncertain.',access:'Address the patient directly; the supporter contributes with permission.'},
 {id:'17',title:'Person, chest & circuit',workstream:'Bedside nurse',purpose:'Observe chest movement, airway/circuit connection, comfort and new change.',trigger:'An alarm or a change from the person’s baseline.',readiness:'Bedside observation and patient communication considered together.',reassess:'Compare chest movement and delivery with the next breath.',rescue:'Escalate deterioration in parallel with assessment.',access:'Keep head support and AAC within the person’s usable range.'},
 {id:'20',title:'Monitoring & signal check',workstream:'Bedside nurse',purpose:'Verify attachment and signal integrity before interpreting monitor values.',trigger:'New observations or an unexpected change in a signal.',readiness:'Sensor attachment and sampling context checked.',reassess:'Distinguish missing signal from a normal result.',rescue:'Use direct assessment and obtain senior support if monitoring is uncertain.',access:'Explain what the displayed numbers can and cannot establish.'},
 {id:'14',title:'Circuit correction',workstream:'Trained airway responder + bedside nurse',purpose:'Simulate correction of an observed circuit fault; reassessment remains necessary.',trigger:'Observed circuit leak or disconnection.',readiness:'Fault assessed; competent responder and compatible equipment confirmed ready.',reassess:'Confirm effective ventilation after correction, not just a connection.',rescue:'Continue the local emergency airway pathway if ventilation is not restored.',access:'Support circuit weight without moving the communication device out of reach.'},
 {id:'07',title:'Planned secretion-management pathway',workstream:'Trained airway responder + bedside nurse',purpose:'Model a partial response to an individually reviewed and agreed clearance plan.',trigger:'Assessment supports a significant secretion burden.',readiness:'Current plan, assessment, patient agreement, competent responder and equipment readiness confirmed.',reassess:'Review volume, pressure, comfort and remaining secretion burden before considering repeat clearance.',rescue:'Persistent obstruction requires specialist reassessment; urgent assessment and escalation remain available in parallel.',access:'Explain the plan and preserve the agreed stop/communication signal.'},
 {id:'23',title:'Position & comfort review',workstream:'Bedside nurse + appropriate assistance',purpose:'Ask how to restore individually effective head, trunk and communication support.',trigger:'Comfort, positioning or access needs require review.',readiness:'Communication route and current plan available; appropriate physical assistance considered.',reassess:'Ask again about comfort and check ventilation and skin.',rescue:'Escalate new pain or unresolved positioning difficulty.',access:'Do not interpret tone or dysarthria as consent or refusal.'},
 {id:'09',title:'Humidification & skin review',workstream:'Bedside nurse',purpose:'Record humidification, securement, oral/skin care and pressure-area review.',trigger:'Routine direct bedside patient–ventilator assessment.',readiness:'Individual plan and device compatibility reviewed.',reassess:'Document outstanding care and equipment needs at handover.',rescue:'Seek the appropriate clinician for an unresolved device or tissue concern.',access:'Narrate care and invite the person’s priorities.'},
 {id:'01',title:'Airway replacement context',workstream:'Specialist airway team',purpose:'Keep rescue-route planning visible without teaching a procedure.',trigger:'Airway failure requires qualified team assessment and the individual emergency plan.',readiness:'Not executable in this prototype; no airway insertion or exchange is modelled.',reassess:'A route change alone does not establish successful ventilation.',rescue:'Activate the local specialist airway response.',access:'Continue narration and communication access during emergency care.',contextOnly:true},
];
export function initialCare(aacAvailable=true):CareState{return {
 aacAvailable,callAccess:true,planVerified:false,assessmentDone:false,signalsVerified:false,circuitAssessed:false,
 seniorRequested:false,responderReady:false,reassessmentDue:false,reassessmentCount:0,
 comfortChecked:false,humidificationChecked:false,skinChecked:false,
 patientMessage:aacAvailable?'Please explain what is happening and keep my communication within reach.':'Response unknown — restore a reliable communication route.',
 patientResponse:aacAvailable?'known':'unknown',patientAgreement:null,selected:null,stage:'available',assignedRole:'',
};}
export function stationGate(id:StationId,care:CareState,p:LungParameters):string|null{
 if(id==='01')return 'Context only: specialist airway assessment and a reviewed local protocol are required. Airway exchange is not implemented.';
 if(id==='07'&&care.reassessmentDue)return 'Reassess the previous intervention before considering further planned secretion clearance. Emergency assessment and escalation remain available.';
 if(id==='07'||id==='23'||id==='09'){
  if(!care.aacAvailable||care.patientResponse==='unknown')return 'Restore a reliable communication route before this planned care. Emergency assessment and escalation remain available.';
  if(care.patientResponse==='wait')return 'WAIT remains active. This planned care can wait; emergency assessment and escalation remain available.';
  if(care.patientAgreement!==id)return 'Discuss this specific planned care and record the fictional patient’s agreement. A known response or a reviewed plan does not establish agreement.';
 }
 if(id==='14'){
  if(!care.circuitAssessed)return 'First assess the person and circuit (station 17).';
  if(!p.disconnected&&p.leakFraction<0.05)return 'No circuit leak or disconnection is established in this model. Do not replace equipment without a supported cause.';
  if(!care.responderReady)return 'Confirm a competent responder and compatible equipment are ready.';
 }
 if(id==='07'){
  if(!care.assessmentDone)return 'First assess the person and circuit (station 17).';
  if(!care.planVerified)return 'Review the current individual airway plan (station 04).';
  if(p.secretionBurden<0.25)return 'A significant secretion burden is not established; clearance is not a universal fix.';
  if(!care.responderReady)return 'Confirm a competent responder and compatible equipment are ready.';
 }
 if(id==='23'){
  if(!care.planVerified)return 'Review the individual positioning and airway plan first (station 04).';
 }
 if(id==='09'&&!care.planVerified)return 'Review the current individual plan (station 04).';
 return null;
}
export function commitStation(id:StationId,care:CareState,p:LungParameters):{care:CareState;parameters:LungParameters;message:string}{
 const gate=stationGate(id,care,p);
 if(gate)return {care,parameters:p,message:gate};
 if(care.selected!==id||care.stage!=='assigned')return {care,parameters:p,message:'Select, check and assign the workstream before committing.'};
 const next={...care,stage:'committed' as const};const parameters={...p};let message='';
 if(id==='07'||id==='23'||id==='09')next.patientAgreement=null;
 switch(id){
 case '04':next.planVerified=true;message='Individual scenario plan reviewed. A reviewed plan does not by itself indicate an intervention.';break;
 case '17':next.assessmentDone=true;next.circuitAssessed=true;message=p.disconnected?'Bedside assessment: circuit disconnection is present. Escalate in parallel and verify effective ventilation after correction.':p.leakFraction>0.1?'Bedside assessment: circuit leak is present. Examine delivery and exhaled volume.':p.secretionBurden>0.3?'Bedside assessment: elevated secretion-related resistance. Consider the individual clearance plan and other causes.':'Bedside assessment: circuit remains connected. Review lung mechanics, gas exchange, circulation and the person’s account.';break;
 case '20':next.signalsVerified=true;message='Signal checks recorded. The displayed arterial gases remain model truth, not a sampled blood gas.';break;
 case '14':parameters.disconnected=false;parameters.leakFraction=0;next.reassessmentDue=true;message='Simulated trained-team circuit correction completed. Reassess ventilation and circulation; recovery is not instantaneous.';break;
 case '07':parameters.secretionBurden=Math.max(0.12,p.secretionBurden*0.6);next.reassessmentDue=true;message='A partial secretion-clearance response is simulated. Remaining impairment must be reassessed; no procedure is taught.';break;
 case '23':next.comfortChecked=true;next.reassessmentDue=true;message='Patient-directed positioning and comfort review recorded. Physiology has not been automatically normalised.';break;
 case '09':next.humidificationChecked=true;next.skinChecked=true;message='Humidification, securement, oral/skin-care needs and equipment compatibility reviewed in the scenario.';break;
 }
 return {care:next,parameters,message};
}
