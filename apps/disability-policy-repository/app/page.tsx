const statuses = [
  ["CANONICAL", "Primary, archival or independently corroborated evidence."],
  ["PROBABLE", "Credible record with incomplete primary attachment."],
  ["CANDIDATE", "Unresolved date, attribution or causal claim requiring verification."],
  ["RESEARCH", "Editorial, analytical or proposed material kept outside the canonical layer."]
];

const scenarios = [
  ["AF-001", "Talk to Me", "Dysarthria, AAC and communication continuity"],
  ["AF-002", "What Is Different Today?", "Baseline versus acute clinical change"],
  ["AF-003", "I Am Worried", "Patient and family escalation"],
  ["AF-004", "Distress Does Not Equal Incapacity", "Crisis communication and decision-making access"]
];

const modes = [
  ["Explore", "Browse the canonical record and inspect source provenance."],
  ["Track", "See what changed, when it changed and when it takes effect."],
  ["Compare", "Compare governments, jurisdictions, policy phases and contested positions."],
  ["Ask", "Interrogate the corpus while keeping evidence status and sources visible."],
  ["Act", "Fork verified evidence into briefs, submissions, correspondence and campaigns."]
];

export default function Home() {
  return (
    <div className="pageShell">
      <section className="hero">
        <span className="eyebrow">Disability Policy Repository · Next.js prototype</span>
        <h1>One evidence base. Many controlled forks.</h1>
        <p className="lede">
          A disability-led, versioned policy intelligence interface that keeps law, policy,
          government framing, movement positions, scholarship, lived experience and model
          inference distinct — with a connected clinical simulation sandbox.
        </p>
        <div className="heroGrid">
          <div className="heroCard">
            <strong>Policy layer</strong>
            <span>Provenance-first repository records with jurisdiction, effective date, evidence state and canonical placement.</span>
          </div>
          <div className="heroCard">
            <strong>Simulation layer</strong>
            <span>Lived experience becomes reviewed training scenarios without becoming unverified clinical truth.</span>
          </div>
        </div>
      </section>

      <section id="explore" aria-labelledby="modesTitle">
        <p className="sectionLabel">Public interface</p>
        <h2 id="modesTitle">Explore · Track · Compare · Ask · Act</h2>
        <div className="grid five">
          {modes.map(([title, text]) => (
            <article className="card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="track" className="panel" aria-labelledby="constitutionTitle">
        <p className="sectionLabel">Editorial constitution</p>
        <h2 id="constitutionTitle">Nothing enters the canonical layer without provenance.</h2>
        <div className="grid three">
          <article className="card">
            <h3>Disability-led authority</h3>
            <p>Disabled people hold substantive authority over priorities, taxonomy, accessibility and interpretation of lived experience.</p>
          </article>
          <article className="card">
            <h3>Provenance before fluency</h3>
            <p>Source text, government claims, movement positions and editorial interpretation remain distinguishable.</p>
          </article>
          <article className="card">
            <h3>Human review for high stakes</h3>
            <p>AI may organise, compare and draft. Legal, clinical and political conclusions remain contestable and reviewable.</p>
          </article>
        </div>
      </section>

      <section id="compare" aria-labelledby="evidenceTitle">
        <p className="sectionLabel">Evidence gate</p>
        <h2 id="evidenceTitle">Visible confidence, not invisible certainty</h2>
        <div className="grid four">
          {statuses.map(([status, text]) => (
            <article className="card" key={status}>
              <span className={"status " + status.toLowerCase()}>{status}</span>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="ask" className="panel" aria-labelledby="recordsTitle">
        <p className="sectionLabel">Seed repository records</p>
        <h2 id="recordsTitle">Current prototype corpus</h2>
        <div className="stack">
          <article className="record">
            <div className="recordTop"><span className="status research">RESEARCH</span><span>3 Oct 2026</span></div>
            <h3>Proposed Charter of Accessible Healthcare for People with Disabilities</h3>
            <p>Proposed disability-specific healthcare rights and implementation framework. It remains a draft policy instrument, not adopted law or NSW Health policy.</p>
            <dl>
              <div><dt>Placement</dt><dd>Healthcare / Charters / Accessible Healthcare</dd></div>
              <div><dt>Jurisdiction</dt><dd>NSW / Australia</dd></div>
            </dl>
          </article>
          <article className="record">
            <div className="recordTop"><span className="status research">RESEARCH</span><span>26 Aug 2026</span></div>
            <h3>Australian Disability Policy Compendium blueprint</h3>
            <p>Product, editorial and agent architecture for a disability-led, federated public-policy intelligence system.</p>
            <dl>
              <div><dt>Placement</dt><dd>Repository / Architecture</dd></div>
              <div><dt>Jurisdiction</dt><dd>Australia</dd></div>
            </dl>
          </article>
        </div>
      </section>

      <section id="simulation" aria-labelledby="simulationTitle">
        <p className="sectionLabel">Accessible Futures Clinical Simulation Lab</p>
        <h2 id="simulationTitle">Lived experience translated into safer clinical practice</h2>
        <p className="lede small">
          Educational scenarios keep baseline disability, new clinical problems, access barriers and system factors as separate state layers.
        </p>
        <div className="grid two">
          {scenarios.map(([id, title, focus]) => (
            <article className="scenario" key={id}>
              <div className="recordTop"><span className="status canonical">{id}</span><span>Educational sandbox</span></div>
              <h3>{title}</h3>
              <p>{focus}</p>
              <p className="muted">Requires complementary clinical and lived-experience review before publication or use.</p>
            </article>
          ))}
        </div>
      </section>

      <section id="act" className="decisionPanel" aria-labelledby="nextTitle">
        <p className="sectionLabel">Next implementation gate</p>
        <h2 id="nextTitle">Connect the shell to verified records and scenario runtime state.</h2>
        <p>
          The next increment is data-backed repository search, effective-date tracking, source snapshots,
          contested-position panels, and a deterministic branching simulation runtime with QI telemetry.
        </p>
      </section>
    </div>
  );
}
