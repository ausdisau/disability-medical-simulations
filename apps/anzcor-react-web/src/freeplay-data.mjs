/**
 * Fictional authored learning cases. Content is not a validated treatment pack.
 * Source notes are educational descriptions, not clinical orders or measurements.
 */
export const FREEPLAY_VERSION = '0.1.0-learning-preview';
export const FREEPLAY_AUDIENCES = Object.freeze([
 {id:'student',label:'Clinical student',hint:'Practise reasoning, teamwork and patient-centred decisions without simulated prescribing privileges.'},
 {id:'patient',label:'Patient and supporter',hint:'Understand options and prepare questions in plain language. No medical background needed.'},
 {id:'creator',label:'Creative studio',hint:'Remix scenes and write teaching ideas; all authored content remains unreviewed.'}
]);
const baseAccess={method:'AAC or supported speech; individual technique not verified',access:'Ask directly, allow processing time, protect positioning',capacity:'Not inferred from speech, disability or fatigue'};
const commonObjectives=[
 'Identify what is observed, what is reported and what remains unknown.',
 'Preserve communication access and address the patient directly.',
 'Distinguish a decision to investigate from a treatment actually applied.',
 'Explain clinical escalation and the limits of the available evidence.',
 'Debrief what the team and the environment made easier or harder.'
];
export const FREEPLAY_CASES = Object.freeze([
 {
  id:'alex-respiratory-freeplay',audience:'student',level:'Introductory–intermediate',minutes:'10–20 min',category:'Respiratory / sepsis recognition',
  title:'Alex: Fever, breathing and clinical uncertainty',setting:'Fictional NSW emergency department',
  summary:'Alex, an adult with cerebral palsy and dysarthric speech, has a new febrile respiratory illness and increased fatigue. Explore an initial assessment, communication repair and possible sepsis without treating disability as a diagnosis.',
  opening:'Alex reports worsening cough and more difficulty breathing than usual. A fictional triage temperature is recorded as 39.4°C. Alex is markedly more lethargic than usual; complete vital signs, microbiology and imaging are not yet available.',
  caseSource:'AUTHORED_FICTIONAL_SCENE_INDEPENDENT_LEARNING_SNAPSHOT',
  known:['Initial synthetic temperature 39.4°C','Worsening cough and breathing concern','New lethargy relative to usual presentation','Cerebral palsy and dysarthric speech are baseline, not explanation for acute illness'],
  unknown:['Full A–G observations, BP, RR and SpO₂ reliability','Viral, bacterial, mixed or aspiration-related cause','Whether sepsis-related organ dysfunction is present','Alex’s reliable communication selections and individual respiratory plan'],
  questions:['What is new, and what is Alex’s established baseline?','How would you verify oxygenation and ventilation separately?','Which decisions require qualified escalation?'],
  access:{...baseAccess},learningObjectives:commonObjectives,contentWarning:'Acute illness and possible serious deterioration.',
  visualPrompt:'Documentary-realistic Australian emergency bay, fictional adult Alex with cerebral palsy, clinician assessment and AAC available; no invented monitor waveforms or hospital logos.',
  cues:[
   {id:'C-ACCESS',label:'AAC alignment problem',text:'The AAC screen is visible but is positioned outside Alex’s comfortable reach. The team needs to check access.',domain:'access',known:'A visible access barrier is present',unknown:'No message or consent can be inferred.'},
   {id:'C-LAB',label:'Laboratory delay',text:'The laboratory reports that requested results are still pending. Clinical escalation must use the evidence already available.',domain:'system',known:'Investigations were requested in the fictional scene',unknown:'No laboratory result is established.'},
   {id:'C-SOURCE',label:'Competing explanations',text:'Two members of the team discuss a viral respiratory illness and possible bacterial pneumonia. These are hypotheses, not results.',domain:'clinical',known:'Competing clinical hypotheses exist',unknown:'The causal organism and diagnosis are unresolved.'},
   {id:'C-BASE',label:'Baseline check',text:'A team member asks whether Alex’s dysarthric speech is new. A baseline comparison is needed before interpreting communication difficulty.',domain:'personhood',known:'Speech difference is established baseline',unknown:'No cognitive conclusion can be inferred.'}
  ]
 },
 {
  id:'alex-codeblue-review',audience:'student',level:'Advanced supervised simulation',minutes:'15–25 min',category:'ALS / ethics and teamwork',
  title:'Alex: Code Blue communication and evidence',setting:'Fictional NSW ED resuscitation bay',
  summary:'An optional fictional teaching snapshot from Alex’s in-chat Code Blue branch. The goal is to coordinate evidence, roles and personhood during adult non-shockable arrest, not to practise unsupervised procedures.',
  opening:'A qualified team has established pulseless electrical activity (PEA). CPR and assisted ventilation are ongoing. No ROSC is established. Respiratory causes remain under investigation and Alex’s AAC is protected for future communication.',
  caseSource:'NONCANONICAL_FICTIONAL_CODEBLUE_EDUCATIONAL_RECAP',
  known:['Confirmed pulseless arrest and PEA (fictional)','Qualified team continuing CPR and assisted ventilation','No confirmed ROSC or death','Pre-arrest infection and respiratory deterioration relevant to reversible-cause search'],
  unknown:['Adequate ventilation and perfusion trend','Definitive reversible cause','Drug or device treatment records','Neurological and survival outcomes'],
  questions:['What separates PEA from a shockable rhythm?','How can communication and dignity be maintained when Alex is unconscious?','How do we avoid treating device selection as successful ventilation?'],
  access:{...baseAccess,access:'Current speech/AAC unavailable during arrest; preserve prior preferences and devices'},learningObjectives:commonObjectives,
  contentWarning:'Contains fictional cardiac arrest, chest compressions and uncertainty about survival.',
  visualPrompt:'Australian resuscitation bay; adult fictional Alex receives coordinated qualified care with AAC protected nearby, verified PEA named in a text label, no invented ECG trace.',
  cues:[
   {id:'A-SIGNAL',label:'Device verification',text:'An ECG lead needs its signal quality checked. A monitor alarm is not automatically a new diagnosis.',domain:'system',known:'An equipment-quality question arose',unknown:'No new rhythm or clinical outcome is authored.'},
   {id:'A-AIRWAY',label:'Ventilation question',text:'The airway clinician reports that visible chest movement alone is insufficient to establish adequate gas exchange.',domain:'clinical',known:'The limitation of a bedside observation is acknowledged',unknown:'Actual gas exchange and circulation are unresolved.'},
   {id:'A-VOICE',label:'Protect patient history',text:'A bedside nurse checks where Alex’s AAC and known communication preferences are documented for a possible future recovery.',domain:'access',known:'An access-continuity task is recognised',unknown:'No new message or consent exists.'}
  ]
 },
 {
  id:'patient-chest-education',audience:'patient',level:'Plain language',minutes:'5–15 min',category:'Understanding a chest infection',
  title:'Understanding chest infections and hospital checks',setting:'Fictional hospital conversation room',
  summary:'Learn why a clinical team may ask about fever, breathing, tests and communication needs. Practise questions and preferences in an ordinary conversation.',
  opening:'In this fictional conversation, Alex has felt feverish and more tired than usual. A nurse explains that several causes of a chest infection may be possible and asks what Alex wants to understand first.',
  caseSource:'PLAIN_LANGUAGE_AUTHOR_EDUCATION_NO_INDIVIDUAL_ADVICE',
  known:['Chest infections can have different causes','A team may check breathing, circulation and other symptoms','Asking for accessible explanations is appropriate'],
  unknown:['A specific person’s diagnosis or treatment','Which tests or treatments a real clinician would recommend','Whether any particular therapy would help an individual'],
  questions:['What might the team be checking?','How can I ask about choices and side effects?','What helps me communicate when I’m tired?'],
  access:{...baseAccess},learningObjectives:[
   'Ask for a plain-language explanation of a proposed test or option.',
   'Express an access requirement or a preference.',
   'Distinguish a possible diagnosis from a confirmed diagnosis.',
   'Prepare questions to bring to an appointment.'
  ],
  contentWarning:'Discussion of illness and hospital care; no crisis scene by default.',
  visualPrompt:'Quiet Australian hospital consultation room, adult fictional patient with AAC near clinician at eye level, calm unhurried conversation, accessible lighting and captions.',
  cues:[
   {id:'P-JARGON',label:'Medical jargon',text:'A clinician uses the term “organ dysfunction”. The person is invited to request a simpler explanation.',domain:'access',known:'Jargon made understanding harder',unknown:'No diagnosis was established by the phrase.'},
   {id:'P-CONSENT',label:'A choice is being discussed',text:'The clinician mentions that more information is needed before recommending a treatment. You can ask about purpose, risks, benefits and alternatives.',domain:'agency',known:'Options are being discussed, not prescribed',unknown:'No treatment decision has been made.'},
   {id:'P-WAIT',label:'More response time',text:'The conversation is paused for communication and processing time; clinical urgency is not being simulated in this patient-education scenario.',domain:'access',known:'Additional time has been offered',unknown:'No response or preference is assumed.'}
  ]
 },
 {
  id:'patient-respiratory-choices',audience:'patient',level:'Plain language',minutes:'5–15 min',category:'Understanding breathing support',
  title:'Talking through breathing-support options',setting:'Fictional patient–clinician education session',
  summary:'Explore questions to ask about oxygen, non-invasive breathing support and invasive ventilation, without modelling them as treatments for your own condition.',
  opening:'A clinician uses a simple diagram and asks which part of breathing support you would like explained. The discussion is hypothetical. No devices are attached to the fictional patient.',
  caseSource:'PLAIN_LANGUAGE_AUTHOR_EDUCATION_NO_INDIVIDUAL_ADVICE',
  known:['Oxygenation and ventilation are different functions','Different devices have different purposes and trade-offs','Patient preferences, comfort and access deserve discussion'],
  unknown:['Which option is medically indicated for a particular person','Appropriate oxygen targets, device settings or duration','Actual benefits or adverse effects for an individual'],
  questions:['What problem is each option meant to solve?','How would I communicate with the clinical team?','What happens if the first option does not work?'],
  access:{...baseAccess},learningObjectives:commonObjectives,
  contentWarning:'Contains discussion of breathing support and intensive care, without a resuscitation scene.',
  visualPrompt:'Fictional Australian hospital patient education session; clinician and disabled adult reviewing non-operational breathing support illustrations and an AAC device. No attached equipment.',
  cues:[
   {id:'R-QUESTION',label:'Clarify the purpose',text:'A learner asks whether giving oxygen and supporting breathing are the same. The clinician can explain the distinction in accessible language.',domain:'understanding',known:'An educational clarification is needed',unknown:'There is no patient-specific treatment indication.'},
   {id:'R-ACCESS',label:'Communication plan',text:'The conversation turns to how someone might communicate if a breathing interface or fatigue makes speech difficult.',domain:'access',known:'Communication needs should form part of any plan',unknown:'No equipment or treatment is selected.'}
  ]
 },
 {
  id:'creator-blank',audience:'creator',level:'Facilitator / writer / co-designer',minutes:'Flexible',category:'Creative learning design',
  title:'Creative case workshop',setting:'Fictional editable learning environment',
  summary:'Design a dialogue, system pressure or ethical dilemma as a teaching idea without silently changing clinical truth. Everything you write is unreviewed.',
  opening:'Choose a teaching theme. Add a scene note, a question and a bounded surprise. The authoring panel keeps ideas distinct from validated patient observations.',
  caseSource:'CREATOR_TEMPLATE_NO_CLINICAL_AUTHORITY',
  known:['Only authored educational metadata exists','No laboratory values or physiological effects are calculated','Consent, review and accessibility remain required for release'],
  unknown:['All patient-specific clinical findings','Clinical validity of user-authored ideas','Readiness for public patient education or professional teaching'],
  questions:['What should a student observe and be able to do?','Whose perspective is missing?','How could learners repair an accessibility or system problem?'],
  access:{...baseAccess},learningObjectives:commonObjectives,contentWarning:'Content warnings must be authored and reviewed for any new scenario.',
  visualPrompt:'Accessible clinical simulation workshop with patient advisors and students reviewing a fictional scenario storyboard.',
  cues:[
   {id:'CR-ACCESS',label:'Access test',text:'The scenario designer is asked to show how the patient can communicate when tired, without making lack of speech a cognitive verdict.',domain:'access',known:'An access design requirement exists',unknown:'A user-authored scene has not been clinically reviewed.'},
   {id:'CR-EVIDENCE',label:'Evidence gap',text:'The facilitator asks which assertions in the scene are observations, which are hypotheses and which require outside validation.',domain:'evidence',known:'A provenance review is requested',unknown:'Clinical truth cannot be created by narrative.'},
   {id:'CR-REPAIR',label:'Systems repair',text:'A fictional handover omits an AAC plan. Learners can design a repair, not assign blame to the patient.',domain:'system',known:'A process-design fault is presented',unknown:'No clinical harm or outcome is invented.'}
  ]
 }
]);
export const FREEPLAY_STUDENT_ACTIONS=Object.freeze([
 {id:'baseline',label:'Review baseline and new symptoms',domain:'assessment',intent:'Separate established disability and communication from acute deterioration.',effect:'A baseline-to-change comparison has been documented for review.'},
 {id:'respiratory',label:'Explore airway and breathing assessment',domain:'assessment',intent:'Ask qualified clinicians how to establish oxygenation and ventilation reliability.',effect:'Assessment questions have been recorded; no device value has been generated.'},
 {id:'circulation',label:'Discuss circulation and perfusion',domain:'assessment',intent:'Request appropriate reassessment of circulation and perfusion with clinician oversight.',effect:'Circulation workstream prioritised educationally; no new measurements or diagnosis.'},
 {id:'escalation',label:'Escalate to qualified senior team',domain:'teamwork',intent:'Practise CERS/Code Blue team communication within fictional roles.',effect:'A fictional escalation request is logged; no external responders are called.'},
 {id:'aac',label:'Restore and verify communication access',domain:'access',intent:'Check positioning, response method, reliability and patient preferences.',effect:'Communication access has been discussed; no patient message or consent inferred.'},
 {id:'differential',label:'Compare competing explanations',domain:'reasoning',intent:'Make known, unknown and conflicting hypotheses explicit.',effect:'The differential is opened as a discussion, not a confirmed diagnosis.'},
 {id:'reassess',label:'Plan reassessment after actions',domain:'assessment',intent:'Describe what evidence would demonstrate effect, harm or lack of improvement.',effect:'A reassessment plan is logged; no improvement or deterioration authored.'},
 {id:'handover',label:'Prepare inclusive handover',domain:'teamwork',intent:'Include acute findings, baseline, AAC, preferences and unknowns.',effect:'An educational handover task is recorded, not sent to a real service.'},
 {id:'bias',label:'Challenge diagnostic overshadowing',domain:'personhood',intent:'Notice and repair an assumption based on disability or speech.',effect:'A bias-repair reflection is recorded.'},
 {id:'medication',label:'Commit antibiotic or antiviral medication',domain:'treatment',locked:'REQUIRES_AUTHORISED_LOCAL_PROTOCOL',intent:'No independent prescribing or medication administration in freeplay.'},
 {id:'cooling',label:'Infuse chilled saline or apply ice packs',domain:'treatment',locked:'NOT_A_ROUTINE_SEPSIS_PATHWAY',intent:'No automatic cooling as a response to fever.'},
 {id:'defib-pea',label:'Defibrillate the PEA scenario',domain:'treatment',locked:'PEA_IS_NON_SHOCKABLE',intent:'The fictional PEA scenario does not supply a shock indication.'},
 {id:'invent-outcome',label:'Declare ROSC or death for the story',domain:'treatment',locked:'NO_EVIDENCE_FOR_OUTCOME',intent:'Patient outcomes require independent authored and reviewed clinical evidence.'}
]);
export const FREEPLAY_PATIENT_ACTIONS=Object.freeze([
 {id:'why-tests',label:'Why might tests be requested?',domain:'understanding',text:'Tests can help clinicians understand what might be causing symptoms and how serious the illness is. You can ask which result matters most and when to expect it.'},
 {id:'viral-bacterial',label:'Does a fever show what caused it?',domain:'understanding',text:'Fever alone cannot tell whether a respiratory illness is viral, bacterial or something else. A clinician combines symptoms, examination and tests.'},
 {id:'breathing-support',label:'What is breathing support?',domain:'understanding',text:'Oxygen is used to address low oxygen levels; some breathing support also helps move air in and out. Which approach is suitable depends on a clinical assessment.'},
 {id:'sepsis',label:'What does “possible sepsis” mean?',domain:'understanding',text:'Sepsis is a serious response to infection that can affect organs. Suspected sepsis needs urgent medical assessment, even before the exact germ is known.'},
 {id:'ask-options',label:'Ask about benefits, risks and alternatives',domain:'agency',text:'You can ask: “What is the purpose of this option, what could go wrong, what alternatives are available, and what happens if I wait?”'},
 {id:'access',label:'Request communication support',domain:'access',text:'You can ask for your communication device, a preferred supporter, extra response time, plain language or another accessible method. Communication difficulty does not remove your rights.'},
 {id:'questions',label:'Prepare questions for my care team',domain:'agency',text:'Collect questions about symptoms, tests, choices, comfort, escalation and how your preferences will be recorded.'},
 {id:'urgent',label:'When should I seek urgent help?',domain:'safety',text:'Rapidly worsening breathing, collapse, severe confusion or other serious deterioration needs urgent professional assessment. For a real Australian emergency, call 000.'},
 {id:'teachback',label:'Practise explaining what I understood',domain:'understanding',text:'Try saying in your own words what the option is for, what you are unsure about and which question you want answered next.'}
]);
export const FREEPLAY_CREATOR_ACTIONS=Object.freeze([
 {id:'objective',label:'Write a learning objective',domain:'design',effect:'A teaching objective is drafted for review; no competency validation is claimed.'},
 {id:'perspective',label:'Switch perspective in the story',domain:'design',effect:'Consider patient, student, nurse and family viewpoints without changing clinical authority.'},
 {id:'uncertainty',label:'Introduce an evidence gap',domain:'evidence',effect:'An uncertainty prompt is added as a teaching idea, not as a patient observation.'},
 {id:'access',label:'Test an AAC or accessibility barrier',domain:'access',effect:'An access-risk design prompt has been introduced with a repair obligation.'},
 {id:'co-design',label:'Mark lived-experience review needed',domain:'governance',effect:'Independent relevant lived-experience review remains pending.'},
 {id:'clinical-review',label:'Mark qualified clinical review needed',domain:'governance',effect:'Independent clinical review remains pending; the interface cannot approve itself.'},
 {id:'auto-physiology',label:'Generate automatic patient death or recovery',domain:'safety',locked:'UNREVIEWED_CLINICAL_OUTCOME',intent:'Unbounded outcome generation is blocked.'}
]);
export function freeplayCase(id){return FREEPLAY_CASES.find(s=>s.id===id)||null;}
export function freeplayActions(audience){
 return audience==='student'?FREEPLAY_STUDENT_ACTIONS:audience==='patient'?FREEPLAY_PATIENT_ACTIONS:audience==='creator'?FREEPLAY_CREATOR_ACTIONS:[];
}
