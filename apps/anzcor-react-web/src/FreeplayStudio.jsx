import React,{useMemo,useReducer,useState} from 'react';
import {FREEPLAY_AUDIENCES,FREEPLAY_CASES,FREEPLAY_VERSION,freeplayCase,freeplayActions} from './freeplay-data.mjs';
import {createFreeplay,freeplayDispatch,freeplayGate,freeplayDebrief,freeplayExport} from './freeplay-engine.mjs';
import './freeplay.css';

const buttonText={student:'Explore clinical reasoning',patient:'Explore an explanation',creator:'Explore design idea'};
function fileDownload(filename,content,mime){
 const file=new Blob([content],{type:mime});
 const url=URL.createObjectURL(file);
 const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();
 setTimeout(()=>URL.revokeObjectURL(url),0);
}
function KnownUnknown({scene}){return <div className="fp-evidence">
 <section aria-label="Known fictional information"><h3>What we know <span>from the authored scene</span></h3><ul>{scene.known.map(t=><li key={t}>{t}</li>)}</ul></section>
 <section aria-label="Information not yet known"><h3>What is still unknown</h3><ul>{scene.unknown.map(t=><li key={t}>{t}</li>)}</ul></section>
 </div>;}
function StatusPill({kind,children}){return <span className={'fp-pill '+kind}>{children}</span>;}
export default function FreeplayStudio(){
 const [s,dispatch]=useReducer(freeplayDispatch,undefined,()=>createFreeplay());
 const [authorNote,setAuthorNote]=useState('');
 const [draft,setDraft]=useState({title:'',focus:'Communication access',description:''});
 const [large,setLarge]=useState(false);
 const [quiet,setQuiet]=useState(false);
 const [voiceNotice,setVoiceNotice]=useState('');
 const [showVisual,setShowVisual]=useState(false);
 const [showLedger,setShowLedger]=useState(true);
 const scene=freeplayCase(s.caseId);
 const mode=FREEPLAY_AUDIENCES.find(x=>x.id===s.audience);
 const available=FREEPLAY_CASES.filter(x=>x.audience===s.audience);
 const actions=freeplayActions(s.audience);
 const permitted=actions.filter(x=>!x.locked);
 const locked=actions.filter(x=>x.locked);
 const debrief=useMemo(()=>freeplayDebrief(s),[s]);
 function load(audience,caseId){
  const target=caseId||FREEPLAY_CASES.find(x=>x.audience===audience)?.id;
  dispatch({kind:'LOAD_CASE',audience,caseId:target,seed:0});
  setAuthorNote('');setVoiceNotice('');setShowVisual(false);
 }
 function action(kind,id,extra){dispatch({kind,id,...extra});}
 function saveNote(){
  if(!authorNote.trim())return;
  action('NOTE',null,{text:authorNote});setAuthorNote('');
 }
 function saveDraft(){dispatch({kind:'DRAFT',...draft});}
 function exportSession(){
  const payload=freeplayExport(s);
  fileDownload('aura-freeplay-'+s.caseId+'.json',JSON.stringify(payload,null,2),'application/json');
 }
 function exportQuestions(){
  const lines=['AURA Freeplay — my appointment or learning questions','Fictional educational notes; not clinical orders',
    '',...s.privateNotes.map((n,i)=>String(i+1)+'. '+n.text),'',
    'Questions prompted by this workshop:',...scene.questions.map(q=>'- '+q),
    '','For real health concerns, ask a qualified professional; emergency symptoms require urgent care.'];
  fileDownload('aura-learning-questions.txt',lines.join('\n'),'text/plain;charset=utf-8');
 }
 function readScene(){
  if(!('speechSynthesis' in window)){setVoiceNotice('Speech playback is unavailable in this browser. All content remains available as text.');return;}
  try{window.speechSynthesis.cancel();
   const spoken=new SpeechSynthesisUtterance(scene.opening);spoken.rate=0.86;spoken.lang='en-AU';
   window.speechSynthesis.speak(spoken);setVoiceNotice('Optional speech playback requested. Use Stop speech to end playback.');
  }catch(_){setVoiceNotice('Speech playback failed. Text remains available.');}
 }
 function stopSpeech(){if('speechSynthesis' in window)window.speechSynthesis.cancel();setVoiceNotice('Speech playback stopped.');}
 return <div id="freeplay-studio" className={'fp-root '+(large?'fp-large ':'')+(quiet?'fp-quiet':'')}>
  <a className="fp-skip" href="#fp-main">Skip to freeplay content</a>
  <header className="fp-top">
   <div className="fp-logo" aria-hidden="true">A</div>
   <div className="fp-top-copy"><p className="fp-eyebrow">Project Hope · SimuGen learning principles</p>
    <h1>AURA Freeplay Studio</h1>
    <p>Creative medical simulation for students, patients and scenario designers.</p>
   </div>
   <div className="fp-top-aside"><StatusPill kind="synthetic">Fictional · offline</StatusPill>
     <span className="fp-version">Preview {FREEPLAY_VERSION}</span></div>
  </header>
  <main id="fp-main" className="fp-main">
   <section aria-labelledby="fp-purpose" className="fp-intro">
    <h2 id="fp-purpose">Learn by exploring, not guessing a single perfect answer</h2>
    <p>Move through scenarios in your own order. Ask questions, test communication and system barriers, create alternative scenes and reflect on evidence. Choices never produce a real medical order, treatment or patient outcome.</p>
   </section>
   <nav className="fp-modes" aria-label="Choose a learning perspective">
    {FREEPLAY_AUDIENCES.map(a=><button key={a.id} type="button"
      className={'fp-mode '+(s.audience===a.id?'active':'')}
      aria-current={s.audience===a.id?'page':undefined} onClick={()=>load(a.id)}>
       <strong>{a.label}</strong><span>{a.hint}</span>
      </button>)}
   </nav>
   <div className="fp-controls">
    <div><label htmlFor="fp-scenario">Learning workshop</label>
     <select id="fp-scenario" value={s.caseId} onChange={e=>load(s.audience,e.target.value)}>
      {available.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
     </select>
     <small>Switching workshops starts a fresh local session. Export notes first.</small>
    </div>
    <div><label htmlFor="fp-text-size">Reading and sensory options</label>
     <div className="fp-toggles">
      <label><input type="checkbox" checked={large} onChange={e=>setLarge(e.target.checked)}/> Larger text</label>
      <label><input type="checkbox" checked={quiet} onChange={e=>setQuiet(e.target.checked)}/> Low stimulation</label>
     </div></div>
   </div>
   <div className="fp-layout">
    <div className="fp-primary">
     <section className="fp-card fp-scene" aria-labelledby="fp-scene-title">
      <div className="fp-eyebrow">{scene.category} · {scene.level} · Suggested {scene.minutes}</div>
      <div className="fp-heading">
       <h2 id="fp-scene-title">{scene.title}</h2>
       <StatusPill kind={s.phase==='PREFLIGHT'?'pending':'ready'}>{s.phase==='PREFLIGHT'?'Prebrief':s.phase==='DEBRIEF'?'Debrief':'Exploring'}</StatusPill>
      </div>
      <p>{scene.summary}</p>
      <div className="fp-setting"><strong>Scene:</strong> {scene.setting}</div>
      {s.phase==='PREFLIGHT'?<div className="fp-prebrief">
        <h3>Before beginning</h3>
        <p><b>Content note:</b> {scene.contentWarning}</p>
        <p>This is fictional education only, using authored prompts rather than calculated clinical physiology. No real patient information, diagnosis, prescription or professional credential is needed. You may pause or switch workshops at any time.</p>
        <p><b>Learning intentions:</b> {scene.learningObjectives.slice(0,3).join(' · ')}</p>
        <label className="fp-ack"><input type="checkbox" checked={s.warningAcknowledged} onChange={e=>e.target.checked&&action('ACK_WARNING')}/> I have read the content note and understand this is a fictional learning activity.</label>
        <button className="fp-btn primary" disabled={!s.warningAcknowledged} onClick={()=>action('START')}>Begin {mode.label.toLowerCase()} freeplay</button>
       </div>:
       <><div className="fp-story"><span className="fp-eyebrow">Current authored scene</span><p>{scene.opening}</p>
         <div className="fp-inline">
          <button className="fp-btn" onClick={readScene}>Read scene aloud</button>
          <button className="fp-btn" onClick={stopSpeech}>Stop speech</button>
         </div>
         <span className="fp-muted" role="status">{voiceNotice}</span>
        </div>
        <KnownUnknown scene={scene}/>
        <div className="fp-story-sub"><b>Patient participation:</b> {scene.access.access}. {scene.access.capacity}.</div>
       </>}
     </section>
     {s.phase!=='PREFLIGHT'&&<section className="fp-card" aria-labelledby="fp-actions-title">
       <div className="fp-heading"><h2 id="fp-actions-title">{s.audience==='student'?'Explore qualified-team choices':s.audience==='patient'?'Explore your questions and options':'Build a creative learning scene'}</h2>
        <StatusPill kind="synthetic">No clinical effects</StatusPill></div>
       <p className="fp-muted">{s.audience==='student'?'Select activities in any order. These record training discussions, not treatment performed by you.':s.audience==='patient'?'Pick any question. The response is general education, never personal medical advice.':'Ideas are editorial notes only until clinical and disability-led review.'}</p>
       <div className="fp-action-grid">{permitted.map(a=><button key={a.id} className="fp-action" type="button"
         disabled={s.phase==='DEBRIEF'} onClick={()=>action('ACTION',a.id)}>
         <strong>{a.label}</strong><span>{a.intent||a.text||a.effect}</span>
         <em>{s.completed.includes(a.id)?'Explored · revisit any time':buttonText[s.audience]}</em>
        </button>)}</div>
       {locked.length>0&&<details className="fp-locked"><summary>High-risk controls that are intentionally unavailable ({locked.length})</summary>
         <ul>{locked.map(a=><li key={a.id}><strong>{a.label}:</strong> {a.intent} <small>Held — {a.locked.replaceAll('_',' ').toLowerCase()}</small></li>)}</ul></details>}
       <div className="fp-feedback" role="status" aria-live="polite">{s.notice}</div>
     </section>}
     {s.phase==='PLAY'&&<section className="fp-card" aria-labelledby="fp-free-title">
      <h2 id="fp-free-title">Creative freeplay — change the question, not the patient facts</h2>
      <p>Reveal a bounded story complication, add your own question or use the facilitator authoring controls. Surprise cues never invent physiology, consent or patient outcomes.</p>
      <div className="fp-inline">
       <button className="fp-btn primary" onClick={()=>action('CUE')} disabled={s.revealed.length>=scene.cues.length}>
        Reveal next creative cue ({s.revealed.length}/{scene.cues.length})</button>
       <button className="fp-btn" onClick={()=>dispatch({kind:'LOAD_CASE',audience:s.audience,caseId:s.caseId,seed:s.seed+1})}>Try a new reproducible seed</button>
      </div>
      <p className="fp-muted">Seed {s.seed}. A new seed restarts the prebrief; it does not change clinical outcomes.</p>
      {s.revealed.length>0&&<ol className="fp-cues">{s.revealed.map((c,i)=><li key={c.id+'-'+i}><strong>{c.label}</strong><p>{c.text}</p><small>Known: {c.known} · Unknown: {c.unknown} · Template only</small></li>)}</ol>}
      <div className="fp-note-entry">
       <label htmlFor="fp-own-question">{s.audience==='patient'?'Draft a question to bring to a clinician':s.audience==='student'?'Write a “what if” or reflection':'Write a creative design note'}</label>
       <textarea id="fp-own-question" maxLength={500} rows={3} value={authorNote}
        onChange={e=>setAuthorNote(e.target.value)} placeholder={s.audience==='patient'?'What would I like explained in plain language?':'What should this fictional team notice, consider or repair?'} />
       <p className="fp-muted">Keep real names and identifiable health details out. Text stays in this browser session unless you explicitly export it. Notes cannot become clinical facts.</p>
       <button className="fp-btn" disabled={!authorNote.trim()} onClick={saveNote}>Add to my local learning notes</button>
      </div>
      {s.audience==='creator'&&<div className="fp-compose">
        <h3>Scenario storyboard — unreviewed</h3>
        <label htmlFor="fp-draft-title">Fictional workshop title</label><input id="fp-draft-title" maxLength={200} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="e.g. A moment to explain a choice"/>
        <label htmlFor="fp-draft-focus">Learning theme</label><select id="fp-draft-focus" value={draft.focus} onChange={e=>setDraft({...draft,focus:e.target.value})}>
         {['Communication access','Baseline versus deterioration','Supported decision-making','Clinical uncertainty','Team escalation','System error and repair','Patient education'].map(v=><option key={v} value={v}>{v}</option>)}
        </select>
        <label htmlFor="fp-draft-description">Scene idea (not a clinical observation)</label><textarea id="fp-draft-description" maxLength={500} rows={4} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder="Describe an observable teaching problem, alternative perspective and a safe way to explore it."/>
        <button className="fp-btn primary" onClick={saveDraft}>Save unreviewed teaching storyboard</button>
        {s.creativeDraft&&<div className="fp-draft-preview"><strong>{s.creativeDraft.title} · {s.creativeDraft.focus}</strong>
         <p>{s.creativeDraft.description}</p><small>Review status: NOT APPROVED · Physiology changes disabled</small></div>}
       </div>}
     </section>}
     {s.phase==='DEBRIEF'&&<section className="fp-card fp-debrief" aria-labelledby="fp-debrief-title">
       <h2 id="fp-debrief-title">Debrief without a pass/fail score</h2>
       <p>Reflect on the source of each claim, what helped the patient and what needs checking next. An adverse outcome is not a moral grade.</p>
       <div className="fp-debrief-grid">{debrief.prompts.map(p=><div key={p.domain}>
        <strong>{p.domain}</strong><small>{p.covered?'Explored in this session':'Available to reflect on'}</small>
        <p>{p.question}</p></div>)}</div>
       <p className="fp-review">Human review status: clinical, disability-led co-design, facilitator and accessibility acceptance pending.</p>
       <button className="fp-btn primary" onClick={()=>action('RESUME')}>Return to creative freeplay</button>
     </section>}
    </div>
    <aside className="fp-secondary">
      <section className="fp-card fp-recap" aria-labelledby="fp-recap-title">
       <h2 id="fp-recap-title">Your learning workspace</h2>
       <dl>
        <div><dt>Perspective</dt><dd>{mode.label}</dd></div>
        <div><dt>Learning phase</dt><dd>{s.phase==='PLAY'?'Exploring':s.phase==='PREFLIGHT'?'Prebrief':'Debrief'}</dd></div>
        <div><dt>Actions explored</dt><dd>{s.completed.length}</dd></div>
        <div><dt>Scene cues revealed</dt><dd>{s.revealed.length} / {scene.cues.length}</dd></div>
        <div><dt>Clinical time</dt><dd>Not advanced</dd></div>
        <div><dt>Patient data</dt><dd>Fictional only</dd></div>
       </dl>
       <div className="fp-inline"><button className="fp-btn" onClick={exportSession}>Export session JSON</button>
        <button className="fp-btn" onClick={exportQuestions}>Export questions TXT</button></div>
       <p className="fp-muted">Files download to your device. Nothing is uploaded to a server by this studio.</p>
       <div className="fp-inline">
        {s.phase==='PLAY'?<button className="fp-btn primary" onClick={()=>action('DEBRIEF')}>Open debrief</button>:s.phase==='DEBRIEF'?null:null}
        <button className="fp-btn" onClick={()=>action('RESET')}>Reset this workshop</button>
       </div>
      </section>
      <section className="fp-card" aria-labelledby="fp-questions">
       <h2 id="fp-questions">Questions and reflection</h2>
       <p className="fp-muted">Suggested starter questions for this scene:</p>
       <ul>{scene.questions.map(x=><li key={x}>{x}</li>)}</ul>
       {s.privateNotes.length>0&&<><h3>My local notes</h3><ol>{s.privateNotes.map(n=><li key={n.id}>{n.text}</li>)}</ol></>}
      </section>
      <section className="fp-card fp-audit" aria-labelledby="fp-audit-title">
       <div className="fp-heading"><h2 id="fp-audit-title">Evidence and event trail</h2>
       <button className="fp-btn tiny" aria-expanded={showLedger} onClick={()=>setShowLedger(!showLedger)}>{showLedger?'Hide':'Show'}</button></div>
       {showLedger&&(s.ledger.length?<ol>{[...s.ledger].reverse().slice(0,12).map(e=><li key={e.id}><b>{e.type}</b><small>{e.domain} · Step {e.step} · No patient effect</small><p>{e.text}</p></li>)}</ol>:
       <p className="fp-muted">No actions recorded. This scene starts from authored fictional information.</p>)}
      </section>
      <section className="fp-card fp-faculty" aria-labelledby="fp-faculty-title">
       <h2 id="fp-faculty-title">Faculty and source boundary</h2>
       <p>Learning design uses SimuGen-style objectives, staged information, facilitator cues and debriefs; Project Hope's clinical, communication, agency and system safeguards remain separate.</p>
       <p><b>Scene provenance:</b> <code>{scene.caseSource}</code></p>
       <p><b>Clinical and disability-led validation:</b> Pending. This is not clinical decision support or professional certification.</p>
       <details><summary>Show visual production prompt and caption notes</summary>
        <p>{scene.visualPrompt}</p>
        <p><b>Captions:</b> FICTIONAL EDUCATION · UNCONFIRMED FACTS MARKED · AAC ACCESS ENABLED · NO REAL CARE ACTION</p>
        <p><b>Alt text:</b> A fictional Australian clinical or patient-education scene where participants discuss decisions while communication needs and evidence uncertainty remain visible.</p>
       </details>
      </section>
    </aside>
   </div>
  </main>
  <footer className="fp-footer"><p>Fictional education only. No real patients, diagnoses, prescriptions, device connections, certification, or automatic treatment outcomes. For a real Australian medical emergency call 000.</p>
    <a href="./index.html">Open the advanced AURA clinical simulation cockpit</a></footer>
 </div>;
}
