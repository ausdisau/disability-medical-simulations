// Shared by the web academy and the native companion. Educational content only.
// Substantive lesson text and source URLs retained from PR #23, f8979504.
export type CurriculumProfileId = 'cp' | 'dmd' | 'adult';
export const profileNames: Record<CurriculumProfileId, string> = {
  cp: 'Maya · cerebral palsy', dmd: 'Kai · Duchenne muscular dystrophy', adult: 'Alex · adult comparator',
};
export const educationalDisclaimer = 'Educational simulation only. No actual emergency call, treatment order or patient device connection. Animations and numerical traces are not clinical measurements or competence assessments.';

export type ResuscitationModule={
 id:string;
 title:string;
 principle:string;
 adaptations:Record<CurriculumProfileId,string>;
 demonstration:string;
 question:string;
 options:readonly [string,string,string];
 answer:number;
 feedback:string;
 reference:string;
 url:string;
};
export const modules:readonly ResuscitationModule[]=[
 {id:'recognition',title:'Recognise arrest versus disability baseline',
 principle:'ANZCOR CPR recognition is based on unresponsiveness and absent normal breathing. Difficulty speaking, a low oxygen reading, dependence on a ventilator, or disability alone does not establish cardiac arrest.',
 adaptations:{cp:'For Maya, establish usual dysarthria, AAC response and breathing. An eye-gaze delay is not unresponsiveness.',dmd:'For Kai, respiratory weakness may make distress less visually dramatic; examine actual breathing and equipment rather than relying on appearance.',adult:'For Alex, apply the same adult arrest-recognition principles and verify actual breathing.'},
 demonstration:'The simulator must keep spontaneous cardiac output, authored arrest state and compression-generated flow separate.',
 question:'Maya is awake but taking extra time to answer through eye gaze. What does delayed speech alone establish?',
 options:['Cardiac arrest','A need for access support and clinical assessment','Lack of decision-making capacity'],answer:1,
 feedback:'Speech and AAC delay alone cannot establish arrest or incapacity. Support communication and assess responsiveness and normal breathing.',
 reference:'ANZCOR 8 – CPR',url:'https://www.anzcor.org/home/basic-life-support/guideline-8-cardiopulmonary-resuscitation-cpr'},
 {id:'circulation',title:'Understand compressions and circulation',
 principle:'Chest compressions can temporarily maintain blood flow during arrest. Appropriate compression quality and recoil, with minimal interruptions, matter. Modelled compression flow is not return of spontaneous circulation.',
 adaptations:{cp:'If the authored case includes chest-wall restriction or atypical posture, assess safe access and appropriate support without inventing a lower CPR standard.',dmd:'Consider individual body mechanics and cardiac history. DMD alone cannot justify withholding indicated CPR.',adult:'Use the comparator manikin to observe sternum depression and recoil independently of lung inflation.'},
 demonstration:'The sternum moves with compression activity, while the display labels compression-generated flow separately from intrinsic circulation.',
 question:'The manikin sternum depresses and the CPR flow indicator rises. What is demonstrated?',
 options:['A confirmed spontaneous pulse','A definitive measure of brain perfusion','A synthetic compression action, not proof of ROSC'],answer:2,
 feedback:'Compression motion is observable but does not certify effective perfusion or a spontaneous pulse.',
 reference:'ANZCOR 11.6 – Adult ALS equipment',url:'https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-6-equipment-and-techniques-in-adult-advanced-life-support'},
 {id:'oxygenation',title:'Separate oxygenation from ventilation',
 principle:'A reassuring SpO2 does not rule out inadequate alveolar ventilation or carbon dioxide retention. An effective breath depends on airway patency, lung mechanics and delivered volume.',
 adaptations:{cp:'In Maya’s authored tracheostomy case, examine secretions, circuit integrity, measured expired volume and chest movement.',dmd:'In Kai’s case, weak respiratory muscles and cough can contribute to hypoventilation; monitor ventilation and CO2 separately from saturation.',adult:'In Alex’s face-mask case, inspect a single bag breath and whether expansion and exhalation actually occur.'},
 demonstration:'Left and right lungs expand according to modelled volume and recoil with expiration; oxygen and carbon dioxide have separate indicators.',
 question:'A fictional patient on oxygen has a normal SpO2 reading but rising CO2. What follows?',
 options:['Ventilation requires separate assessment','CO2 retention is excluded','Chest compliance must be normal'],answer:0,
 feedback:'Oxygen saturation alone does not measure carbon dioxide clearance or lung compliance.',
 reference:'DMD respiratory consensus – Thorax 2024',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11041593/'},
 {id:'airway',title:'Identify airway routes and mechanical failure',
 principle:'Natural-airway bag-mask ventilation, oral endotracheal tubes, tracheostomies and laryngectomy anatomy require distinct assessment. A connected circuit does not guarantee effective ventilation.',
 adaptations:{cp:'Verify Maya’s actual tracheostomy route, current airway plan, competent team and circuit before committing an airway intervention.',dmd:'Kai’s scenario starts with an existing oral ETT. Check actual ventilation and trained airway support rather than assuming tube replacement is required.',adult:'Alex’s mask route must remain distinct from advanced airway ventilation; mask breathing pauses the simulated compressions.'},
 demonstration:'The manikin shows the selected airway path and unequal or reduced expansion when resistance, disconnection or leakage changes.',
 question:'A tracheostomy patient has a low-volume ventilator alarm. What is the strongest starting point?',
 options:['Immediately replace the airway tube','Assess the person and circuit and verify the airway plan','Treat the tube as an oral ETT'],answer:1,
 feedback:'Assessment, plan verification and qualified escalation establish the safest response; alarms do not diagnose a tube fault by themselves.',
 reference:'NSW ACI – Adult tracheostomy care',url:'https://aci.health.nsw.gov.au/networks/icnsw/clinicians/acute-tracheostomy'},
 {id:'communication',title:'Preserve personhood, communication and teamwork',
 principle:'Direct address, access to communication, baseline-aware handover and named team responsibilities are part of safe care. Emergency intervention and reasonable communication support can proceed in parallel.',
 adaptations:{cp:'Keep Maya’s eye-gaze AAC and backup method available, allow response time and do not mistake dysarthria for cognitive impairment.',dmd:'Ask Kai about his individual emergency plan, existing equipment and goals while he can participate. A supporter informs but does not automatically decide.',adult:'Use closed-loop communication, explain interventions when possible and document each important decision.'},
 demonstration:'The accessibility hold freezes learner time; it is not a clinical instruction to suspend urgent treatment in a real arrest.',
 question:'A conscious adult uses AAC and a familiar support worker is present. What is most appropriate?',
 options:['Ask the supporter to make every decision','Treat an AAC delay as refusal','Address the person directly and facilitate their communication'],answer:2,
 feedback:'Communication partners can help with access and baseline knowledge without replacing the person’s own authority.',
 reference:'NSQHS – Communicating for Safety',url:'https://www.safetyandquality.gov.au/standards/nsqhs-standards/communicating-safety-standard'},
 {id:'reassessment',title:'Reassess, learn and recognise model limits',
 principle:'After an intervention, examine the person, respiratory support, circulation and unresolved causes. One model output cannot establish success, prognosis or a decision to end resuscitation.',
 adaptations:{cp:'Compare new findings with Maya’s baseline and airway plan. Record how her own communication was enabled.',dmd:'Consider respiratory and cardiac involvement together when clinically indicated, without reducing Kai to his diagnosis.',adult:'Revisit the generic comparator to separate learning errors from equipment or physiology assumptions.'},
 demonstration:'Inspect pre/post model trends, airway status, communication access and team read-backs. The engine never generates automatic ROSC.',
 question:'Compression-generated flow has increased. Does this alone establish recovery?',
 options:['No: it is not spontaneous circulation','Yes: it confirms a pulse','Yes: it proves adequate brain perfusion'],answer:0,
 feedback:'Compression-generated flow is distinct from return of spontaneous circulation, which requires clinical reassessment.',
 reference:'NSW ACI – Advanced life support',url:'https://aci.health.nsw.gov.au/networks/eci/clinical/tools/advanced-life-support'}
];
