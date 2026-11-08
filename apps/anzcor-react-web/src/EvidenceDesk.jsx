import React,{useState} from 'react';
import {EVIDENCE,PUBMED_RSS,proposedEducationalUse} from './evidence.mjs';
import './evidence.css';

export default function EvidenceDesk(){
  const [domain,setDomain]=useState('all');
  const [selected,setSelected]=useState('pmid-41649064');
  const domains=['all',...new Set(EVIDENCE.map(e=>e.domain))];
  const records=EVIDENCE.filter(e=>domain==='all'||e.domain===domain);
  const record=EVIDENCE.find(e=>e.id===selected)||records[0];
  const proposal=record?proposedEducationalUse(record.id):null;
  return <section className="card evidence-desk" aria-label="AURA research and provenance desk">
    <div className="section-heading"><div><small className="eyebrow">READ-ONLY RESEARCH · PUBMED + JSTOR</small><h2>Research &amp; scenario evidence</h2></div><span className="tag outline">Human review required</span></div>
    <p className="muted">Bibliography and inspected abstracts may shape educational questions. They cannot alter VIRGAL physiology, generate patient speech, unlock clinical interventions, or supply medication doses.</p>
    <div className="evidence-feed-info" role="status"><strong>Saved PubMed RSS:</strong> {PUBMED_RSS.ingestion_status.replaceAll('_',' ')}. The feed is registered but its exact results have not been retrieved. The references below came from independent topic searches and public JSTOR listings.</div>
    <div className="chip-row" role="group" aria-label="Research evidence filter">{domains.map(d=><button className={'chip '+(domain===d?'active':'')} type="button" aria-pressed={domain===d} key={d} onClick={()=>{setDomain(d);const first=EVIDENCE.find(e=>d==='all'||e.domain===d);if(first)setSelected(first.id);}}>{d.replaceAll('_',' ')}</button>)}</div>
    <div className="evidence-layout">
      <div className="evidence-sources" role="group" aria-label="Research source selection">{records.map(e=><button key={e.id} type="button" aria-pressed={selected===e.id} className={'evidence-source '+(selected===e.id?'chosen':'')} onClick={()=>setSelected(e.id)}>
        <strong>{e.title}</strong><span>{e.database} · {e.year} · {e.evidence_label.replaceAll('_',' ')}</span>
      </button>)}</div>
      {record&&<article className="evidence-inspector" aria-live="polite">
        <small className="eyebrow">{record.database} · {record.genre}</small>
        <h3>{record.title}</h3>
        <p><b>Evidence inspected:</b> {record.evidence_label.replaceAll('_',' ')}. <b>Domain:</b> {record.domain.replaceAll('_',' ')}.</p>
        <p><b>Supported from available source:</b> {record.supported_finding}</p>
        <p><b>Possible teaching use:</b> {record.simulation_implication}</p>
        <p><b>Limitations:</b> {record.limitations}</p>
        <p className="evidence-gate"><b>Promotion gate:</b> {proposal?.status} · {proposal?.requiredReview.join(' + ')}. No automatic changes to the clinical controller.</p>
        <a href={record.url} target="_blank" rel="noopener noreferrer">View publication record (opens new tab)</a>
      </article>}
    </div>
  </section>;
}