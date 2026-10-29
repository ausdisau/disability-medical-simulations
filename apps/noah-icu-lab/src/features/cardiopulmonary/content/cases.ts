import type { LungParameters, VentSettings } from '../runtime/pulmonary';

export type ProfileId = 'cp' | 'dmd' | 'adult';
export type ScenarioId = 'baseline' | 'secretions' | 'leak' | 'disconnect' | 'restriction' | 'cardiac' | 'oxygen-trap' | 'aac' | 'arrest';
export interface Profile {
  id: ProfileId; name: string; age: number; diagnosis: string; short: string;
  baseline: string; now: string; voice: string; communication: string; goal: string;
  pbwKg: number; settings: VentSettings; parameters: LungParameters;
}
const common: LungParameters = {
  complianceMlPerCmH2O: 40, resistanceCmH2OPerLPerSec: 8,
  leftComplianceFraction: 0.45, deadSpaceMl: 150, shuntFraction: 0.08,
  muscleEffortCmH2O: 1, co2ProductionMlMin: 200, cardiacReserve: 1,
  secretionBurden: 0.08, leakFraction: 0, disconnected: false, hemoglobinGdl: 13,
};
const settings: VentSettings = {
  mode: 'PC', airway: 'tracheostomy', fio2: 0.35, peep: 5, rate: 16,
  inspiratoryTime: 1, pressureControl: 14, tidalVolumeMl: 420, pressureLimit: 35,
};
export const profiles: Record<ProfileId, Profile> = {
  cp: {
    id:'cp', name:'Maya Chen', age:26, diagnosis:'Cerebral palsy', short:'CP · chest-wall restriction',
    baseline:'Maya directs her own care. Her dysarthria and variable muscle tone are established baseline. She normally uses eye-gaze AAC and individually fitted head and trunk supports.',
    now:'Fictional adult ICU episode after a prolonged respiratory illness. Invasive ventilation and reduced respiratory-system compliance belong to this case; they are not assumed features of cerebral palsy.',
    voice:'Please keep my screen in view. Ask me what has changed before you move me.',
    communication:'Eye-gaze AAC; backup partner-assisted scanning. Confirm a reliable yes/no signal and allow response time.',
    goal:'Comfortable breathing, dependable communication, and a return to her ordinary life.',
    pbwKg:60, settings:{...settings}, parameters:{...common,complianceMlPerCmH2O:34,muscleEffortCmH2O:2,shuntFraction:0.12},
  },
  adult: {
    id:'adult', name:'Alex Taylor', age:35, diagnosis:'Generic adult skills scenario', short:'Adult · natural-airway skills',
    baseline:'Alex is a fictional adult used for a separate natural-airway demonstration. No neurological or neuromuscular diagnosis is inferred. Baseline preferences and support needs should be established directly whenever the person can respond.',
    now:'A separate adult skills-room scenario. The mask route represents an adult without an advanced airway; it is not a workaround for an obstructed tracheostomy and does not perform an airway exchange.',
    voice:'Tell me what you are checking and keep a way for me to respond.',
    communication:'Use direct speech when available, with an agreed yes/no or accessible backup route. During the authored arrest state, response remains unknown.',
    goal:'Respectful, coordinated care and a clear explanation of each action.',
    pbwKg:60, settings:{...settings}, parameters:{...common,muscleEffortCmH2O:0},
  },
  dmd: {
    id:'dmd', name:'Kai Morgan', age:19, diagnosis:'Duchenne muscular dystrophy', short:'DMD · respiratory muscle weakness',
    baseline:'Kai usually directs his care, uses overnight non-invasive ventilation, and has an individual cough-support plan. This profile includes reduced cardiac reserve as a separate, editable assumption.',
    now:'Fictional adult ICU episode requiring invasive ventilation. The selected airway is a scenario condition; tracheostomy is not an inevitable outcome of DMD.',
    voice:'I know my usual breathing. Keep a way for me to call you, even when I cannot speak.',
    communication:'Eye-gaze or accessible switch while the invasive airway prevents ordinary speech; a low-tech yes/no route remains available.',
    goal:'Recover from the acute illness while keeping control over decisions and contact with the people he chooses.',
    pbwKg:60, settings:{...settings,pressureControl:13}, parameters:{...common,complianceMlPerCmH2O:40,muscleEffortCmH2O:0.5,co2ProductionMlMin:180,cardiacReserve:0.82},
  },
};
export const scenarios: {id:ScenarioId;title:string;summary:string;cue:string}[] = [
  {id:'arrest',title:'Adult arrest drill',summary:'An explicit fictional arrest state; not inferred from diagnosis or low blood pressure.',cue:'The authored scenario states that the person is unresponsive and not breathing normally. Recognise the emergency and coordinate the resuscitation team.'},
  {id:'baseline',title:'Supported baseline',summary:'Establish the person, airway, signals and care plan.',cue:'The ventilator is cycling. Is that enough to establish effective ventilation and comfort?'},
  {id:'secretions',title:'Secretion obstruction',summary:'Airway resistance rises while the circuit remains connected.',cue:'Chest excursion becomes smaller. The patient indicates that breathing feels different.'},
  {id:'leak',title:'Circuit leak',summary:'Gas delivery and measured exhaled volume diverge.',cue:'A circuit alarm appears after repositioning. A leak is possible; tube failure is not established.'},
  {id:'disconnect',title:'Circuit disconnection',summary:'Machine cycling no longer produces effective circuit ventilation.',cue:'Chest movement and the capnogram need immediate review with parallel clinical support.'},
  {id:'restriction',title:'Acute lung impairment',summary:'Compliance falls and gas-exchange impairment increases.',cue:'This new change exceeds the person’s baseline. Aspiration or another acute process requires assessment.'},
  {id:'cardiac',title:'Reduced cardiac reserve',summary:'Circulatory compromise can persist despite satisfactory oxygen saturation.',cue:'Look at perfusion and cardiac output as well as the lung traces. The cause is not established by the diagnosis.'},
  {id:'oxygen-trap',title:'Reassuring SpO₂, rising CO₂',summary:'Explore why extra oxygen does not restore alveolar ventilation.',cue:'Oxygenation can look better while ventilatory failure continues. Compare saturation with modelled arterial CO₂.'},
  {id:'aac',title:'Communication interrupted',summary:'Physiology is unchanged, but the patient cannot reliably answer.',cue:'The eye-gaze screen has slipped out of view. No answer means the response is unknown.'},
];
export function configureCase(profileId:ProfileId, scenarioId:ScenarioId) {
  const profile=profiles[profileId]; const vent={...profile.settings}; const parameters={...profile.parameters};
  if(scenarioId==='arrest'){parameters.circulationState='arrest';parameters.compressionsActive=false;parameters.muscleEffortCmH2O=0;}
  if(scenarioId==='secretions') parameters.secretionBurden=0.8;
  if(scenarioId==='leak') parameters.leakFraction=0.55;
  if(scenarioId==='disconnect') parameters.disconnected=true;
  if(scenarioId==='restriction'){ parameters.complianceMlPerCmH2O=21; parameters.shuntFraction=0.25; }
  if(scenarioId==='cardiac') parameters.cardiacReserve=0.5;
  if(scenarioId==='oxygen-trap'){vent.pressureControl=8;vent.rate=12;parameters.secretionBurden=0.55;}
  return {profile,vent,parameters};
}

export const sources = [
  {title:'Lampe et al. · Adult CP lung volume and oxygen saturation',year:'2014 · PubMed verified 29 October 2026',type:'Small observational study',url:'https://pubmed.ncbi.nlm.nih.gov/25525345/',supports:'Reduced vital capacity can coexist with apparently reassuring saturation. Cohort and reporting limitations prevent universal CP claims; measured vital capacity is not converted into the model’s compliance constant. PMID 25525345.'},
  {title:'CHEST · Respiratory management of neuromuscular weakness',year:'2023 · PubMed verified 29 October 2026',type:'Clinical guideline and expert panel report',url:'https://pubmed.ncbi.nlm.nih.gov/36921894/',supports:'Heterogeneous neuromuscular conditions need individual respiratory assessment and shared decisions. The evidence is limited and substantially observational; it does not validate this app’s numerical response. PMID 36921894.'},
  {title:'ANZCOR · Guideline 6: Compressions',year:'Current online guidance · accessed 29 October 2026',type:'Resuscitation guideline',url:'https://www.anzcor.org/home/basic-life-support/guideline-6-compressions',supports:'Adult arrest recognition uses unresponsiveness and absent normal breathing, without requiring pulse certainty. Rate 100–120/min and adult depth more than 5 cm are guidance; the model’s flow coefficients are unvalidated.'},
  {title:'ANZCOR · Guideline 11.6: Equipment and techniques in adult ALS',year:'Approved April 2025',type:'Resuscitation guideline',url:'https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-6-equipment-and-techniques-in-adult-advanced-life-support',supports:'Distinguishes bag-mask from advanced-airway ventilation. No advanced airway: 30:2; advanced airway: 6–10 breaths/min while compressions continue. Appropriate training, equipment and reassessment remain essential.'},
  {title:'NSW ACI · Adult acute tracheostomy care',year:'2021',type:'Clinical practice guide',url:'https://aci.health.nsw.gov.au/__data/assets/pdf_file/0004/685300/ACI-CPG-Care-adult-patients-acute-tracheostomy.pdf',supports:'Individual care planning, airway and equipment checks, communication access and multidisciplinary roles. Adult acute care; no local protocol or treatment settings are imported.'},
  {title:'AARC · Patient–ventilator assessment',year:'2024',type:'Clinical practice guideline',url:'https://www.aarc.org/wp-content/uploads/2024/10/patient-ventilator-assessment-aarc-cpg.pdf',supports:'Separate assessment of tidal volume, pressure, PEEP, humidification, artificial-airway securement and skin. Supports the observation domains, not validation of these equations.'},
  {title:'Childs et al. · Respiratory care in Duchenne MD',year:'2024',type:'Published consensus guideline',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11041593/',supports:'Neuromuscular respiratory weakness, secretion clearance, CO₂ assessment and individualised respiratory support. UK DMD guidance; not a model of every muscular dystrophy.'},
  {title:'NICE NG119 · Cerebral palsy in adults',year:'2019 · current online guidance',type:'Clinical guideline',url:'https://www.nice.org.uk/guidance/ng119/chapter/Recommendations',supports:'Individual communication and respiratory assessment; distinction between personal baseline and changing needs. No fixed CP physiology is prescribed.'},
  {title:'AARC · Artificial airway suctioning',year:'2022',type:'Clinical practice guideline',url:'https://www.aarc.org/wp-content/uploads/2022/10/cpg-artificial-airway-suctioning.pdf',supports:'Evidence-led secretion assessment and reassessment. Procedural technique and suction settings are intentionally outside the model.'},
  {title:'AARC · Capnography during mechanical ventilation',year:'2011',type:'Clinical practice guideline',url:'https://www.aarc.org/wp-content/uploads/2014/08/04.11.0503.pdf',supports:'ETCO₂ interpretation depends on ventilation, perfusion and measurement conditions; it is not interchangeable with arterial CO₂.'},
  {title:'CICM · Minimum standards for intensive care units',year:'2016 version · accessed 29 October 2026',type:'Published professional standard located',url:'https://www.cicm.org.au/common/Uploaded%20files/Assets/Professional%20Documents/IC-1-Minimum-Standards-for-Intensive-Care-Units.pdf',supports:'The located 2016 text places one-to-one bedside nursing within a multidisciplinary team and allows more personnel for complex care. A revised IC-1 draft underwent 2026 consultation; this citation is not a claim that the 2016 text is the latest adopted standard or a staffing calculator.'},
  {title:'CICM · Revised IC-1 consultation',year:'2026 · checked 29 October 2026',type:'Draft consultation status',url:'https://www.cicm.org.au/Web/Web/Policy-Advocacy/Member-Consultations.aspx?hkey=ddefa3d3-4a50-490a-85ac-805aceb0a84d',supports:'The official page describes an updated draft IC-1 and a feedback deadline of 12 October 2026. Adoption of a final replacement is not established by this consultation page; draft rules are not imported into the simulator.'},
  {title:'Naughton et al. · Positive pressure and LV afterload',year:'1995',type:'Original physiological clinical research',url:'https://pubmed.ncbi.nlm.nih.gov/7882480/',supports:'Positive pressure has context-dependent cardiac effects. This educational model uses simplified haemodynamics and does not reproduce individual LV/RV physiology.'},
];
