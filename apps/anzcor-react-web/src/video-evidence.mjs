/**
 * Public video observations are educational references, not clinical evidence.
 * Video notes were prepared from the supplied YouTube link and an independent
 * topic search, with inspected transcript/visual status recorded per item.
 */
export const USER_VIDEO_QUERY = Object.freeze({
  url: 'https://www.youtube.com/results?search_query=cerebral+palsy+medical+simulations',
  query: 'cerebral palsy medical simulations',
  observed: '2026-11-09',
  nature: 'DYNAMIC_SEARCH_RESULTS_NOT_AN_EXHAUSTIVE_CATALOGUE'
});

export const VIDEO_REFERENCES = Object.freeze([
  {
    id:'yt-6qOGZvKZOLQ',
    title:"What's it like to live with a disability? An introduction to the Empathy Simulation Training Suit",
    channel:'Sydney Health', published:'2020-04-30', duration:'3:26',
    url:'https://www.youtube.com/watch?v=6qOGZvKZOLQ',
    source:'USER_SUPPLIED_VIDEO',
    inspection:'VIDEO_AND_TRANSCRIPT_INSPECTED',
    relation:'DIRECT_USER_REFERENCE',
    whatWasInspected:'Transcript and timecoded audiovisual walkthrough of the 3:26 video.',
    observations:[
      {time:'00:24-00:50',detail:'Classroom demonstration, rollator and adjustable webbing attached to an orange training suit.'},
      {time:'00:59-01:33',detail:'Fitting sequence shows mobility restrictions, collars, weights, gloves, earplugs and modified eyewear.'},
      {time:'01:33-01:51',detail:'Paired students negotiate walkways, entrances and public settings with aids.'},
      {time:'01:52-02:57',detail:'Student reflections and daily-activity food preparation are shown.'}
    ],
    claimsPresented:'Presenters say the short exercise simulates aspects of disability or ageing and could improve empathy.',
    notEstablished:'Temporary simulated impairment does not reproduce lived disability, cerebral palsy, long-term adaptation or clinical outcome improvements.',
    designTransfer:'Coordinated learner and supporter roles, observed environment barriers, reflect-and-debrief structure.',
    reviewWarning:'Do not present an impairment suit, VR restriction or artificial distress as an authentic experience of cerebral palsy. Prioritise paid disabled co-design and real accessibility repair.',
    contentRights:'Link to source only. No copied frames, audio, video or transcript in the app.'
  },
  {
    id:'yt-934vEj2yl_8',
    title:'Cerebral Palsy | VR Therapy Simulator | The-Parallel Solution',
    channel:'the-parallel',published:'2019-08-19',duration:'2:36',
    url:'https://www.youtube.com/watch?v=934vEj2yl_8',
    source:'QUERY_DISCOVERED_VIDEO',inspection:'TRANSCRIPT_INSPECTED_VISUALS_NOT_INSPECTED',
    relation:'SEARCH_QUERY_REFERENCE',
    whatWasInspected:'YouTube metadata and spoken transcript only, not a visual walkthrough.',
    observations:[{time:'01:09-01:43',detail:'Presenter describes a VR wrist pronation/supination exercise with a hand avatar and movement-feedback score.'},
      {time:'02:00-02:15',detail:'Presenter claims preliminary study activity; independent clinical study verification not completed.'}],
    claimsPresented:'Presenter describes VR movement coaching, measured accuracy and preliminary therapy study.',
    notEstablished:'Effectiveness, applicability to clinical emergencies, and physiology are not independently verified. The spoken cure framing is not adopted.',
    designTransfer:'Optional feedback-rich rehabilitation tasks, separated from acute-care clinical intervention scoring.',
    reviewWarning:'Do not import producer efficacy claims, cure language or movement scoring as a measure of human worth or competence.',
    contentRights:'Link to source; do not copy footage or audio.'
  },
  {
    id:'yt-TGIUp5C9xT0',
    title:"Advanced Pediatric Simulation Training | Children's Hospital Los Angeles",
    channel:"Children's Hospital Los Angeles",published:'2025-12-01',duration:'0:47',
    url:'https://www.youtube.com/watch?v=TGIUp5C9xT0',
    source:'QUERY_DISCOVERED_VIDEO',inspection:'METADATA_ONLY',
    relation:'SEARCH_QUERY_REFERENCE',
    whatWasInspected:'Public video title and description; captions unavailable, video frames not inspected.',
    observations:[],
    claimsPresented:'Description advertises paediatric clinical simulation training, including manikins, AI and VR.',
    notEstablished:'Specific scenes, technical architecture, learner outcomes or clinical certification.',
    designTransfer:'Interprofessional simulation team role concept only; requires direct inspection before detailed adoption.',
    reviewWarning:'No extrapolation from promotional descriptions to actual clinical effectiveness.',
    contentRights:'Link to source only.'
  },
  {
    id:'yt-1B14IeOFZ8c',
    title:'Cerebral Palsy Physical Exam',
    channel:'Ninja Nerd',published:'2021-06-21',duration:'12:19',
    url:'https://www.youtube.com/watch?v=1B14IeOFZ8c',
    source:'QUERY_DISCOVERED_VIDEO',inspection:'METADATA_ONLY',
    relation:'SEARCH_QUERY_REFERENCE',
    whatWasInspected:'Public listing title and description only.',
    observations:[],
    claimsPresented:'The description presents a neurological physical examination featuring a person with spastic quadriplegic cerebral palsy.',
    notEstablished:'Exam technique, consent, clinical accuracy, visual details or transferability to all presentations of cerebral palsy.',
    designTransfer:'A candidate reference for clinically reviewed examination communication; no technical steps imported.',
    reviewWarning:'Avoid presenting a single cerebral palsy phenotype as the default or assuming cognitive impairment.',
    contentRights:'Link to source only.'
  },
  {
    id:'yt-72aj-f4Emj8',
    title:'Simulating the Effect of Contracture and Weakness on Walking Capacity in Cerebral Palsy',
    channel:'OpenSimVideos',published:'2015-01-30',duration:'55:25',
    url:'https://www.youtube.com/watch?v=72aj-f4Emj8',
    source:'QUERY_DISCOVERED_VIDEO',inspection:'METADATA_ONLY',
    relation:'SEARCH_QUERY_REFERENCE',
    whatWasInspected:'Public title, description and publishing metadata.',
    observations:[],
    claimsPresented:'Description discusses muscle modelling of weakness and contracture in cerebral palsy.',
    notEstablished:'Exact equations, results, validated patient models or parameter applicability.',
    designTransfer:'A future biomechanics research candidate, separate from the respiratory resuscitation engine.',
    reviewWarning:'Do not convert conference talk descriptions into clinical mechanics or deterministic patient-specific thresholds.',
    contentRights:'Link to source only.'
  }
]);
export const VIDEO_STATES=Object.freeze(['VIDEO_AND_TRANSCRIPT_INSPECTED','TRANSCRIPT_INSPECTED_VISUALS_NOT_INSPECTED','METADATA_ONLY']);
export function findVideo(id){return VIDEO_REFERENCES.find(v=>v.id===id)||null;}
export function validateVideos(items=VIDEO_REFERENCES){
 const ids=new Set();
 return items.every(v=>{
  if(ids.has(v.id)||!VIDEO_STATES.includes(v.inspection)||!v.url.startsWith('https://www.youtube.com/watch?v=')||!v.notEstablished)return false;
  ids.add(v.id);return true;
 });
}
export function videoProposal(id){
 const v=findVideo(id);
 if(!v)return Object.freeze({status:'UNKNOWN_SOURCE',clinicalEffect:false,authorisesTreatment:false});
 return Object.freeze({status:'REVIEW_REQUIRED',sourceId:id,possibleDesignTransfer:v.designTransfer,
    requiredChecks:['source validity','clinical reviewer','disabled lived-experience co-designer','facilitator','rights and accessibility'],
    clinicalEffect:false,authorisesTreatment:false});
}
