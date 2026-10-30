export interface ResuscitationPanelProps {
  airway: 'mask' | 'ett' | 'tracheostomy';
  manual: boolean;
  arrest: boolean;
  recognised: boolean;
  bagReady: boolean;
  held: boolean;
  breathActive: boolean;
  breathCount: number;
  manualRate: number;
  compressionsActive: boolean;
  compressionCount: number;
  compressionRate: number;
  compressionDepthMm: number;
  compressionRecoil: number;
  compressionFlow: number;
  modelMAP: number;
  onSource: (source: 'ventilator' | 'manual-bag', airway: 'mask' | 'ett' | 'tracheostomy') => void;
  onBagReady: (ready: boolean) => void;
  onBreath: () => void;
  onLoadArrest: () => void;
  onRecognise: () => void;
  onStartCompressions: () => void;
  onStopCompressions: () => void;
  onCompressionSetting: (key: 'compressionRate' | 'compressionDepthMm' | 'compressionRecoilFraction', value: number) => void;
  onReset: () => void;
}

const shown = (value: number, digits = 0) => Number.isFinite(value) ? value.toFixed(digits) : '—';
const bounded = (value: number, low: number, high: number) => Math.max(low, Math.min(high, Number.isFinite(value) ? value : low));

/** Controlled training controls. The parent owns physiological state and all action gating. */
export function ResuscitationPanel(props: ResuscitationPanelProps) {
  const {
    airway, manual, arrest, recognised, bagReady, held, breathActive, breathCount, manualRate,
    compressionsActive, compressionCount, compressionRate, compressionDepthMm, compressionRecoil,
    compressionFlow, modelMAP, onSource, onBagReady, onBreath, onLoadArrest, onRecognise,
    onStartCompressions, onStopCompressions, onCompressionSetting, onReset,
  } = props;
  const advancedAirway = airway !== 'mask';
  const maskDuringCompressions = !advancedAirway && compressionsActive;
  const breathDisabled = !manual || !bagReady || breathActive || maskDuringCompressions;
  const breathReason = !manual ? 'Choose the manual-bag source to deliver individual breaths.'
    : !bagReady ? 'Confirm responder, interface and oxygen-source readiness.'
    : breathActive ? 'A simulated breath is in progress.'
    : maskDuringCompressions ? 'Pause simulated compressions before the two mask breaths in a 30:2 cycle.'
    : held ? 'One breath may be queued while model time is frozen. End the hold and explicitly resume to deliver it.' : 'Each activation delivers one model breath. Observe delivered volume, chest movement and expiratory flow.';
  const startDisabled = !arrest || !recognised || compressionsActive || (!advancedAirway && breathActive);
  const route = airway === 'mask' ? 'Face mask over mouth and nose' : airway === 'ett' ? 'Existing endotracheal tube' : 'Existing tracheostomy tube';

  return (
    <div className="lab-two-column">
      <section className="lab-panel" aria-labelledby="manual-ventilation-heading">
        <div className="lab-panel-head">
          <div><p className="lab-kicker">VENTILATION WORKSTREAM</p><h2 id="manual-ventilation-heading">Manual bag ventilation</h2></div>
          <span className={`lab-chip ${manual ? 'good' : 'muted'}`}>{manual ? 'Manual source' : 'Ventilator source'}</span>
        </div>
        <p className="lab-small lab-muted">Connect the model to a bag through the selected airway. A mask, an ETT and a tracheostomy remain distinct interfaces.</p>
        <div className="lab-control-grid">
          <div className="lab-field">
            <label htmlFor="resus-source">Ventilation source</label>
            <select id="resus-source" className="lab-select" disabled={breathActive} value={manual ? 'manual-bag' : 'ventilator'} data-scan="true" onChange={event => onSource(event.target.value as 'ventilator' | 'manual-bag', airway)} aria-describedby="resus-configuration-note">
              <option value="ventilator" disabled={airway === 'mask'}>Mechanical ventilator</option>
              <option value="manual-bag">Manual bag</option>
            </select>
          </div>
          <div className="lab-field">
            <label htmlFor="resus-interface">Airway interface</label>
            <select id="resus-interface" className="lab-select" disabled={breathActive} value={airway} data-scan="true" onChange={event => onSource(manual ? 'manual-bag' : 'ventilator', event.target.value as 'mask' | 'ett' | 'tracheostomy')} aria-describedby="resus-configuration-note">
              <option value="mask" disabled={!manual}>Face mask · mouth + nose</option>
              <option value="ett">Existing ETT</option>
              <option value="tracheostomy">Existing tracheostomy</option>
            </select>
          </div>
        </div>
        <p id="resus-configuration-note" className="lab-small lab-muted">These selectors change model configuration instantly; they do not perform an airway procedure or equipment exchange. Mask ventilation is available with the manual bag. Select an ETT or tracheostomy explicitly before returning to the ventilator.</p>

        {held && <div className="lab-action-grid" aria-label="Switch-access route controls" style={{marginBottom:12}}>
          <button type="button" className="lab-button secondary small" data-scan="true" disabled={breathActive} onClick={()=>onSource('manual-bag','tracheostomy')}>Bag to tracheostomy</button>
          <button type="button" className="lab-button secondary small" data-scan="true" disabled={breathActive} onClick={()=>onSource('manual-bag','ett')}>Bag to ETT</button>
          <button type="button" className="lab-button secondary small" data-scan="true" disabled={breathActive} onClick={()=>onSource('manual-bag','mask')}>Bag–valve–mask</button>
        </div>}
        <div className="lab-access">
          <button id="resus-bag-ready" type="button" className="lab-button secondary" aria-pressed={bagReady} data-scan="true" onClick={() => onBagReady(!bagReady)}>{bagReady ? 'Bag readiness confirmed' : 'Confirm bag readiness'}</button>
          <p className="lab-small">Scenario attestation: trained responder, compatible interface and oxygen source are ready.</p>
          <p className="lab-small lab-muted">Selected route: <strong>{route}</strong>. Readiness does not prove airway patency or effective ventilation.</p>
        </div>

        <div className="lab-action-grid" style={{marginTop:15}}>
          <button type="button" className="lab-button primary" data-scan="true" disabled={breathDisabled} onClick={onBreath} aria-describedby="resus-breath-state">{breathActive ? 'Breath active or queued' : held ? 'Queue one simulated breath' : 'Deliver one simulated breath'}</button>
          <button type="button" className="lab-button secondary" data-scan="true" disabled={!compressionsActive} onClick={onStopCompressions}>Pause simulated compressions</button>
        </div>
        <p id="resus-breath-state" className="lab-small lab-muted" style={{marginTop:10}}>{breathReason}</p>
        <dl className="lab-facts" style={{marginTop:13}}>
          <div><dt>Manual breath activations</dt><dd>{shown(breathCount)}</dd></div>
          <div><dt>Recorded breath cadence</dt><dd>{shown(manualRate, 1)} breaths/min</dd></div>
          <div><dt>Current source</dt><dd>{manual ? advancedAirway ? `Bag to ${airway === 'ett' ? 'ETT' : 'tracheostomy'}` : 'Bag–valve–mask' : 'Mechanical ventilator'}</dd></div>
        </dl>
        <div className="lab-callout">
          <strong>{advancedAirway ? 'Advanced-airway CPR' : 'Mask ventilation during CPR'}</strong>
          <p className="lab-small">{advancedAirway
            ? 'ANZCOR describes 6–10 ventilations per minute during adult CPR with an advanced airway, without pausing compressions for those breaths. Reassess delivery and avoid excessive ventilation.'
            : 'Without an advanced airway, ANZCOR uses 30 compressions followed by two breaths. Pause simulated compressions for the mask breaths, then resume. This model does not automate that sequence.'}</p>
        </div>
        <p className="lab-small lab-muted">Reference: <a href="https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-6-equipment-and-techniques-in-adult-advanced-life-support" target="_blank" rel="noreferrer">ANZCOR 11.6 · adult airway and ventilation</a>. Adult educational scenario; local clinical practice and device training remain separate.</p>
      </section>

      <section className="lab-panel" aria-labelledby="compressions-heading">
        <div className="lab-panel-head">
          <div><p className="lab-kicker">CIRCULATION WORKSTREAM</p><h2 id="compressions-heading">Chest-compression model</h2></div>
          <span className={`lab-chip ${arrest ? 'critical' : 'muted'}`}>{arrest ? 'Fictional arrest active' : 'Arrest not loaded'}</span>
        </div>
        <p className="lab-small lab-muted">The arrest scenario represents an adult who is unresponsive and not breathing normally. Disability, ventilation dependence or a low blood-pressure reading alone do not trigger arrest in this model.</p>
        <div className="lab-action-grid">
          <button type="button" className="lab-button danger" data-scan="true" disabled={arrest} onClick={onLoadArrest}>Load fictional adult arrest</button>
          <button type="button" className="lab-button secondary" data-scan="true" disabled={!arrest || recognised} onClick={onRecognise}>{recognised ? 'Arrest recognised · help called' : 'Recognise arrest + call for help'}</button>
        </div>
        <p className="lab-small lab-muted" style={{marginTop:10}}>Recognition represents rapid assessment of responsiveness and normal breathing, with emergency escalation. It does not add a prolonged pulse-certainty check or an AAC consent requirement before rescue; communication access is supported in parallel.</p>

        <div className="lab-divider" />
        <p className="lab-kicker">SYNTHETIC EXPERIMENT CONTROLS</p>
        <p className="lab-small lab-muted">The broad input ranges allow comparison of inadequate and excessive parameters. They are not recommended treatment ranges and do not predict an individual outcome.</p>
        <div className="lab-control">
          <label htmlFor="resus-compression-rate" className="lab-control-head"><span>Compression rate</span><span className="lab-control-value">{shown(compressionRate)} <small className="lab-control-unit">/min</small></span></label>
          <input id="resus-compression-rate" type="range" min="60" max="160" step="1" value={bounded(compressionRate,60,160)} data-scan="true" onChange={event => onCompressionSetting('compressionRate',Number(event.target.value))} />
        </div>
        <div className="lab-control">
          <label htmlFor="resus-compression-depth" className="lab-control-head"><span>Compression depth</span><span className="lab-control-value">{shown(compressionDepthMm)} <small className="lab-control-unit">mm</small></span></label>
          <input id="resus-compression-depth" type="range" min="20" max="70" step="1" value={bounded(compressionDepthMm,20,70)} data-scan="true" onChange={event => onCompressionSetting('compressionDepthMm',Number(event.target.value))} />
        </div>
        <div className="lab-control">
          <label htmlFor="resus-compression-recoil" className="lab-control-head"><span>Chest recoil</span><span className="lab-control-value">{shown(compressionRecoil*100)} <small className="lab-control-unit">%</small></span></label>
          <input id="resus-compression-recoil" type="range" min="0" max="100" step="1" value={bounded(compressionRecoil*100,0,100)} data-scan="true" onChange={event => onCompressionSetting('compressionRecoilFraction',Number(event.target.value)/100)} />
        </div>
        {!advancedAirway && breathActive && <p className="lab-small">Complete the mask inspiration before resuming compressions.</p>}
        <div className="lab-action-grid">
          <button type="button" className="lab-button primary" data-scan="true" disabled={startDisabled} onClick={onStartCompressions}>{compressionsActive ? held ? 'Compressions queued · clock held' : 'Compressions active' : held ? 'Queue simulated compressions' : 'Start simulated compressions'}</button>
          <button type="button" className="lab-button danger" data-scan="true" disabled={!compressionsActive} onClick={onStopCompressions}>Stop simulated compressions</button>
        </div>
        {held && <p className="lab-small lab-muted" style={{marginTop:10}}>You can queue an action while the training clock is held. End the hold and explicitly resume to advance time. Stop remains available to cancel selected compressions.</p>}
        <dl className="lab-facts" style={{marginTop:15}}>
          <div><dt>Simulated compressions</dt><dd>{shown(compressionCount)}</dd></div>
          <div><dt>Compression-generated flow</dt><dd>{shown(compressionFlow,2)} L/min · illustrative mean flow</dd></div>
          <div><dt>Model mean arterial pressure</dt><dd>{shown(modelMAP,1)} mmHg · artificial mean estimate</dd></div>
          <div><dt>Spontaneous circulation</dt><dd>{arrest ? 'Absent in the loaded arrest scenario' : 'Use the current bedside model state'}</dd></div>
        </dl>
        <div className="lab-callout warn"><strong>Compression-generated flow is not ROSC.</strong><p className="lab-small">Neither a higher model pressure nor an electrical rhythm establishes return of spontaneous circulation. This exercise does not automatically restore a pulse, certify CPR quality or predict survival.</p></div>
        <p className="lab-small lab-muted">ANZCOR adult guidance describes 100–120 compressions/min, depth greater than 5 cm and complete chest recoil. These standards sit alongside trained assessment, escalation and minimal interruptions; the sliders are a simplified teaching model.</p>
        <p className="lab-small lab-muted">References: <a href="https://www.anzcor.org/home/basic-life-support/guideline-6-compressions" target="_blank" rel="noreferrer">ANZCOR 6 · compressions</a> and <a href="https://www.anzcor.org/home/basic-life-support/guideline-8-cardiopulmonary-resuscitation-cpr" target="_blank" rel="noreferrer">ANZCOR 8 · recognition and CPR</a>.</p>
        <button type="button" className="lab-button secondary" style={{marginTop:10}} data-scan="true" onClick={onReset}>Exit arrest exercise · reset case</button>
      </section>
    </div>
  );
}
