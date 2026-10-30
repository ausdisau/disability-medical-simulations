import {useState} from 'react';
import type {ProfileId} from '../content/cases';
import {modules, profileNames, educationalDisclaimer} from '../../../../../../shared/noah-resuscitation/curriculum';
import './resuscitation-academy.css';

export function ResuscitationAcademy({profileId,onOpenBedside,onOpenResus,onOpenRooms}:{profileId:ProfileId;onOpenBedside:()=>void;onOpenResus:()=>void;onOpenRooms:()=>void}){
 const [index,setIndex]=useState(0);
 const [selected,setSelected]=useState<number|null>(null);
 const item=modules[index];
 return <section className="academy" aria-labelledby="academy-title">
  <div className="lab-panel academy-intro">
   <p className="lab-kicker">LEARN → ADAPT → DEMONSTRATE → PRACTISE → REFLECT</p>
   <h2 id="academy-title">Resuscitation theory and disability adaptation</h2>
   <p>Understand standard adult resuscitation science before adapting your assessment, equipment and communication to an individual. Disability never automatically defines arrest, capacity or a ceiling of care.</p>
   <p className="lab-small">Selected fictional case: <strong>{profileNames[profileId]}</strong>. This learning view is unscored. It does not alter patient physiology or set device parameters.</p>
   <div className="academy-actions">
    <button type="button" className="lab-button primary" data-scan="true" onClick={onOpenBedside}>Open interactive manikin</button>
    <button type="button" className="lab-button secondary" data-scan="true" onClick={onOpenResus}>Practise bag &amp; CPR</button>
    <button type="button" className="lab-button secondary" data-scan="true" onClick={onOpenRooms}>Choose Code Blue room</button>
   </div>
  </div>
  <div className="academy-layout">
   <nav className="lab-panel academy-menu" aria-label="Learning modules">
    <h3>Six theory modules</h3>
    {modules.map((m,i)=><button type="button" key={m.title} data-scan="true" aria-current={index===i?'step':undefined}
       className={'academy-menu-button'+(index===i?' is-current':'')} onClick={()=>{setIndex(i);setSelected(null);}}>
       <strong>{i+1}.</strong> {m.title}</button>)}
   </nav>
   <article className="lab-panel academy-lesson">
    <p className="lab-kicker">MODULE {index+1} OF {modules.length}</p>
    <h3>{item.title}</h3>
    <div className="academy-pair">
     <section className="academy-core"><h4>1 · Core science</h4><p>{item.principle}</p></section>
     <section className="academy-adapt"><h4>2 · Individual adaptation</h4><p>{item.adaptations[profileId]}</p></section>
    </div>
    <section className="academy-demo"><h4>3 · Observe on the manikin</h4><p>{item.demonstration}</p></section>
    <section className="academy-question"><p className="lab-kicker">4 · CHECK THE REASONING · NO GRADE</p>
     <h4>{item.question}</h4>
     <div className="academy-options">{item.options.map((answer,i)=><button key={answer} type="button" data-scan="true" aria-pressed={selected===i}
       className="academy-option" onClick={()=>setSelected(i)}>{String.fromCharCode(65+i)}. {answer}</button>)}</div>
     <div className="academy-feedback" role="status" aria-live="polite">{selected===null?'Choose an interpretation to reveal the explanation.':<><strong>{selected===item.answer?'Supported reasoning.':'Review this interpretation.'}</strong> {item.feedback}</>}</div>
    </section>
    <footer className="academy-footer"><a href={item.url} rel="noreferrer" target="_blank">Source: {item.reference}</a>
     <button type="button" className="lab-button secondary" data-scan="true" onClick={()=>{setIndex((index+1)%modules.length);setSelected(null);}}>Next module</button>
    </footer>
   </article>
  </div>
  <p className="lab-small lab-muted">{educationalDisclaimer}</p>
 </section>;
}
