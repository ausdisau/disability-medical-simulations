/**
 * AURA fictional Alex Morgan diagnostic-tension teaching overlay.
 * No source (including a synthetic positive test) can itself establish organ
 * dysfunction, consent, administer medicines, or produce treatment success.
 */
export const ETIOLOGIES=Object.freeze([
 {id:'viral-supported',label:'Viral evidence emerges',hypothesis:'Virus implicated; bacterial co-infection remains possible',
  evidence:[
   {name:'Respiratory viral PCR',finding:'Influenza A detected (fictional result)',certainty:'PATHOGEN_DETECTED'},
   {name:'Chest radiograph',finding:'Imaging not yet interpreted for specific cause',certainty:'UNKNOWN'},
   {name:'Bacterial cultures',finding:'Pending or not obtained',certainty:'UNKNOWN'}],
  ambiguity:'A positive influenza test does not exclude clinically important bacterial co-infection.',
  pathway:'Senior clinician considers pathogen-appropriate antiviral eligibility, supportive respiratory care and whether bacterial coverage is necessary given illness severity. If probable sepsis is established, immediately follow current local sepsis guidance.',
  reassess:'Repeat airway, breathing, circulation, alertness, infection status, hydration and communication access.',
  actionAuthority:'All medicine decisions and investigations require a qualified clinician under current local protocol.'},
 {id:'bacterial-supported',label:'Bacterial pneumonia becomes more likely',hypothesis:'Radiological and clinical features raise bacterial pneumonia concern, organism unconfirmed',
  evidence:[
   {name:'Chest radiograph',finding:'Focal pulmonary opacity compatible with pneumonia (fictional radiology interpretation)',certainty:'COMPATIBLE_NOT_SPECIFIC'},
   {name:'Respiratory viral PCR',finding:'No virus identified on the selected panel (fictional result)',certainty:'NOT_EXCLUSION'},
   {name:'Microbiology',finding:'Bacterial organism not yet isolated',certainty:'UNKNOWN'}],
  ambiguity:'Focal pulmonary changes and negative viral testing do not prove a bacterial aetiology.',
  pathway:'Senior clinician assesses pneumonia severity, probable sepsis, empiric antibiotic indication and antimicrobial stewardship. Cultures or other sampling may be taken when indicated, without delaying time-critical treatment.',
  reassess:'Reassess objective clinical severity, cultures when returned, treatment response and possible alternative diagnoses.',
  actionAuthority:'Prescriber verifies allergy/ADR, kidney status, local susceptibility information, route and appropriate protocol.'},
 {id:'mixed-supported',label:'Possible viral–bacterial co-infection',hypothesis:'Influenza detected with clinical/radiological concern for an additional bacterial pneumonia',
  evidence:[
   {name:'Respiratory viral PCR',finding:'Influenza A detected (fictional result)',certainty:'PATHOGEN_DETECTED'},
   {name:'Chest radiograph',finding:'Focal opacity compatible with pneumonia (fictional interpretation)',certainty:'COMPATIBLE_NOT_SPECIFIC'},
   {name:'Bacterial cultures',finding:'Not yet reported; co-infection remains possible, not proven',certainty:'UNKNOWN'}],
  ambiguity:'One identified virus plus chest consolidation is not proof of two organisms.',
  pathway:'Qualified clinician evaluates whether antiviral treatment and empiric bacterial cover are clinically indicated, especially if seriously unwell or sepsis is suspected; revise therapy when further evidence arrives.',
  reassess:'Trend clinical observations, airway clearance needs and microbiology. Do not assume either course succeeded.',
  actionAuthority:'No automated dual therapy or dose generation; all orders remain clinician and protocol controlled.'},
 {id:'aspiration-uncertain',label:'Aspiration-related inflammation or infection',hypothesis:'Aspiration pneumonitis versus aspiration pneumonia versus coincident infection',
  evidence:[
   {name:'History',finding:'A witness reports a possible coughing/choking episode preceding deterioration (fictional report, not independently confirmed)',certainty:'REPORTED'},
   {name:'Chest radiograph',finding:'No definitive cause documented',certainty:'UNKNOWN'},
   {name:'Microbiology',finding:'No causative pathogen identified',certainty:'UNKNOWN'}],
  ambiguity:'Aspiration may cause chemical inflammation, bacterial infection, or both; timing and trajectory matter.',
  pathway:'Clinical team assesses airway protection, secretion management, aspiration history and ongoing pneumonia/sepsis risk; antimicrobials require an infection indication, not aspiration exposure alone.',
  reassess:'Assess respiratory trend, repeat clinical evaluation and investigate other causes if recovery is incomplete.',
  actionAuthority:'Do not equate cerebral palsy with aspiration or prescribe from swallowing assumptions.'}
]);
export function findEtiology(id){return ETIOLOGIES.find(x=>x.id===id)||null;}
export function evidenceRevealGate(session,id){
 if(!findEtiology(id))return {allow:false,status:'INVALID_CASE_FORK',reason:'Unknown hypothesis'};
 if(!session.reassessed?.includes('OBS')||!session.reassessed?.includes('CHEST'))
  return {allow:false,status:'ASSESSMENT_REQUIRED',reason:'Record and reassess the urgent observations and chest source workup before a facilitator authors synthetic investigation results.'};
 return {allow:true,status:'SIMULATION_ONLY',reason:'Facilitator may author one clearly labelled alternative synthetic evidence set. This does not confirm patient diagnosis or alter observed physiology.'};
}
export function createDifferential(){
 return Object.freeze({selected:null,revealed:null,ledger:[],provenance:'FICTIONAL_SYNTHETIC',clinicalDiagnosis:'UNCONFIRMED',sepsis:'NOT_ESTABLISHED',medicalOrders:[],physiologyEffects:[]});
}
export function authorDifferential(state,session,branchId,role){
 const gate=evidenceRevealGate(session,branchId);
 if(role!=='FACILITATOR'||!gate.allow)return {ok:false,state,reason:role!=='FACILITATOR'?'Facilitator-only simulated fork; not a credentialled medical authority.':gate.reason};
 const branch=findEtiology(branchId);
 const next={...state,selected:branchId,revealed:{...branch,label:'FICTIONAL_POST_INVESTIGATION_FINDINGS'},
  ledger:[...state.ledger,{id:'DIFF-'+String(state.ledger.length+1).padStart(3,'0'),
   branchId,origin:'FACILITATOR_AUTHORED_SYNTHETIC',effect:'EVIDENCE_DISPLAY_ONLY',clinicalAuthority:false}],
  clinicalDiagnosis:'UNCONFIRMED',sepsis:'NOT_ESTABLISHED',medicalOrders:[],physiologyEffects:[]};
 return {ok:true,state:next,reason:'Synthetic evidence revealed. Qualify the differential; medicine ordering and physiological outcomes remain unchanged.'};
}
export function medicationGateForDifferential(_state,_session,_medicineKind){
 return Object.freeze({status:'HOLD_MEDICATION_BRANCH',canPrescribe:false,canDispense:false,canAdminister:false,
  reason:'This educational differential does not validate a local NSW antimicrobial or antiviral order. Urgent clinically indicated treatment is a qualified bedside decision under current protocols.'});
}
export function diagnosticCoaching(differential){
 return Object.freeze({mode:'JMO_READ_ONLY',question:differential.revealed?
 'What finding supports the leading cause, what alternative cause is still possible, and does severity require treatment before pathogen confirmation?':
 'Which urgent observations and investigations help distinguish viral infection, bacterial pneumonia, co-infection and aspiration while addressing possible sepsis?',
    clinicalAuthority:false,canCommit:false,medicineOrder:null,sourceClass:'NSW adult clinical guidance and comparator literature'});
}
