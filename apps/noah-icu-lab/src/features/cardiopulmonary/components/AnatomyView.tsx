import './visuals.css';

export interface AnatomyViewProps {
  airway: 'mask' | 'ett' | 'tracheostomy';
  ventilationSource?: 'ventilator' | 'manual-bag';
  compressionsActive?: boolean;
  compressionRate?: number;
  spontaneousPulsePresent?: boolean;
  lungVolumeMl: number;
  leftVolumeMl?: number;
  rightVolumeMl?: number;
  flowLMin: number;
  heartRate: number;
  cardiacOutput: number;
  spo2: number;
  pressure: number;
  disconnected: boolean;
  reducedMotion: boolean;
  timeSeconds: number;
}

const finite = (n: number, fallback = 0) => Number.isFinite(n) ? n : fallback;
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, finite(n)));
const display = (n: number, places = 0) => Number.isFinite(n) ? n.toFixed(places) : '—';

function along(points: readonly (readonly [number, number])[], phase: number): [number, number] {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let remaining = (((phase % 1) + 1) % 1) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i]) {
      const share = lengths[i] ? remaining / lengths[i] : 0;
      return [points[i][0] + (points[i + 1][0] - points[i][0]) * share, points[i][1] + (points[i + 1][1] - points[i][1]) * share];
    }
    remaining -= lengths[i];
  }
  return [...points[points.length - 1]];
}

/** A labeled functional schematic. Geometry is not a reconstruction of the person. */
export function AnatomyView({
  airway, lungVolumeMl, leftVolumeMl, rightVolumeMl, flowLMin, heartRate,
  cardiacOutput, spo2, pressure, disconnected, reducedMotion, timeSeconds,
  ventilationSource = 'ventilator', compressionsActive = false,
  compressionRate = 110, spontaneousPulsePresent = true,
}: AnatomyViewProps) {
  const time = finite(timeSeconds);
  const inspiration = flowLMin > 0.2;
  const expiration = flowLMin < -0.2;
  const rightScale = reducedMotion ? 1 : 0.96 + clamp(rightVolumeMl ?? lungVolumeMl / 2, 0, 700) / 700 * 0.09;
  const leftScale = reducedMotion ? 1 : 0.96 + clamp(leftVolumeMl ?? lungVolumeMl / 2, 0, 700) / 700 * 0.09;
  const beat = reducedMotion || !spontaneousPulsePresent ? 1 : 1 + Math.max(0, Math.sin(time * Math.PI * 2 * clamp(heartRate, 0, 240) / 60)) * 0.035;
  const manual = ventilationSource === 'manual-bag';
  const compressionOffset = compressionsActive && !reducedMotion ? Math.max(0, Math.sin(time * Math.PI * 2 * clamp(compressionRate, 0, 180) / 60)) * 9 : 0;
  const bagScale = reducedMotion || disconnected ? 1 : 1 - clamp(flowLMin, 0, 80) / 80 * 0.22;
  const airwayName = airway === 'mask' ? 'Face mask over mouth and nose' : airway === 'ett' ? 'Oral endotracheal tube' : 'Tracheostomy tube through a neck stoma';
  const sourceLabel = manual ? airway === 'mask' ? 'Bag–valve–mask' : airway === 'ett' ? 'Bag to ETT' : 'Bag to tracheostomy' : 'Ventilator';
  const entry: readonly [number, number] = airway === 'mask' ? [441, 66] : airway === 'ett' ? [452, 66] : [443, 122];
  const inspiratoryPoints: readonly (readonly [number, number])[] = [[182, 153], [218, 153], [218, 63], [411, 63], [411, entry[1]], entry];
  const expiratoryPoints: readonly (readonly [number, number])[] = manual
    ? [entry, [396, entry[1]], [396, entry[1] + 27], [373, entry[1] + 27]]
    : [entry, [396, entry[1]], [396, 83], [244, 83], [244, 205], [182, 205]];
  const path = (points: readonly (readonly [number, number])[]) => points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const inDot = along(inspiratoryPoints, time * 0.26);
  const outDot = along(expiratoryPoints, time * 0.26);
  const flowText = disconnected ? 'Circuit disconnected' : inspiration ? 'Inspiratory flow' : expiration ? 'Expiratory flow' : 'Near-zero flow';
  const summary = `${sourceLabel} connected through ${airwayName.toLowerCase()}. ${flowText}. Synthetic respiratory volume above the reference end-expiratory volume is ${display(lungVolumeMl)} millilitres; pressure ${display(pressure, 1)} centimetres of water; modeled blood flow ${display(cardiacOutput, 1)} litres per minute. ${spontaneousPulsePresent ? 'Spontaneous circulation is present in this model.' : 'Spontaneous pulse is absent. The pulse-oximetry value is unavailable or unreliable and is not displayed.'} ${compressionsActive ? 'Simulated chest compressions are active; compression-generated flow does not establish return of spontaneous circulation.' : ''} Patient right lung appears on the viewer's left. Pulmonary circulation carries blood from right heart to lungs and back to left heart; systemic circulation connects the left heart to the body and back to the right heart.`;

  return (
    <section className="anatomy-panel" aria-labelledby="anatomy-heading">
      <div className="visual-heading">
        <div><p className="visual-kicker">CONNECTED PHYSIOLOGY</p><h2 id="anatomy-heading">Heart · lungs · {manual ? 'manual ventilation' : 'ventilator'}</h2></div>
        <span className={`visual-state ${disconnected ? 'visual-state-alert' : ''}`}>
          <span aria-hidden="true">{disconnected ? '!' : '↔'}</span> {disconnected ? 'Disconnected' : 'Circuit connected'}
        </span>
      </div>
      <svg className="anatomy-svg" viewBox="0 0 680 390" role="img" aria-labelledby="anatomy-title anatomy-desc">
        <title id="anatomy-title">Functional heart and lung schematic with {airwayName.toLowerCase()}</title>
        <desc id="anatomy-desc">{summary} Teal solid arrows identify inspired gas. Amber dashed arrows identify expired gas. Blue venous and rose arterial paths identify the simplified circulation. Motion follows the simulation clock and stops when simulation time stops.</desc>
        <defs>
          <linearGradient id="cp-lung-right" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#3b9ba5" stopOpacity="0.50"/><stop offset="1" stopColor="#163b50" stopOpacity="0.60"/></linearGradient>
          <linearGradient id="cp-lung-left" x1="1" x2="0" y1="0" y2="1"><stop stopColor="#4baab1" stopOpacity="0.45"/><stop offset="1" stopColor="#173b50" stopOpacity="0.60"/></linearGradient>
          <linearGradient id="cp-heart" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#e6a0aa"/><stop offset="1" stopColor="#a54c66"/></linearGradient>
          <marker id="cp-air-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#6ae0cc"/></marker>
          <marker id="cp-exp-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#e8ba72"/></marker>
          <marker id="cp-venous-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#7ca9e6"/></marker>
          <marker id="cp-arterial-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#ee9fba"/></marker>
        </defs>

        <path d="M358 106 C306 119 287 181 285 265 C286 329 327 347 376 350 L554 350 C605 348 629 316 629 257 C625 170 605 122 556 106" fill="#101f32" stroke="#2a3b50" strokeWidth="1.5"/>

        {manual ? <g aria-hidden="true">
          <rect x="18" y="118" width="164" height="164" rx="14" fill="#192b3b" stroke="#5a7088" strokeWidth="1.4"/>
          <text x="33" y="144" fill="#dfe8f2" fontSize="17" fontWeight="650">MANUAL BAG</text>
          <path d="M165 183 H177 V153 H182" fill="none" stroke="#b5ddd4" strokeWidth="7" strokeLinecap="round"/>
          <path d="M47 190 Q22 182 29 217 Q32 242 47 234 Q61 225 51 204 Z" fill="#5a93aa" fillOpacity=".25" stroke="#9dc5d1" strokeWidth="1.7"/>
          <path d="M48 189 H65" stroke="#b1ccd1" strokeWidth="6"/>
          <g transform={`translate(113 188) scale(1 ${bagScale}) translate(-113 -188)`}>
            <path d="M67 170 C82 153 133 152 152 166 Q165 177 157 196 C143 215 88 217 69 201 Q58 190 67 170 Z" fill="#315f60" stroke="#a9e2d2" strokeWidth="2.4"/>
            <path d="M79 168 Q69 185 80 202 M93 162 Q84 186 93 208 M140 164 Q151 185 142 204" fill="none" stroke="#82b8aa" strokeWidth="1.3"/>
          </g>
          <circle cx="164" cy="181" r="7" fill="#b5ddd4"/>
          <text x="100" y="255" textAnchor="middle" fill="#d9e8e8" fontSize="14">{sourceLabel}</text>
          <text x="22" y="307" fill="#9fb8c9" fontSize="13">Reservoir + patient valve</text>
          <text x="22" y="331" fill="#6ae0cc" fontSize="16">→ Inspiration</text>
          <text x="22" y="354" fill="#e8ba72" fontSize="15">⇠ Exhalation to room</text>
        </g> : <g aria-hidden="true">
          <rect x="18" y="118" width="164" height="148" rx="14" fill="#1c2c40" stroke="#5a7088" strokeWidth="1.4"/>
          <text x="36" y="145" fill="#dfe8f2" fontSize="17" fontWeight="650">VENTILATOR</text>
          <rect x="34" y="159" width="130" height="65" rx="6" fill="#0b1725" stroke="#35495e"/>
          <text x="46" y="184" fontSize="13" fill="#aebfd1">AIRWAY PRESSURE</text>
          <text x="46" y="209" fontSize="24" fill="#6ae0cc" fontWeight="650">{display(pressure, 1)}<tspan fontSize="12" dx="6">cmH₂O</tspan></text>
          <circle cx="41" cy="244" r="4" fill={disconnected ? '#ffad99' : '#6ae0cc'}/>
          <text x="53" y="249" fill="#c3d0dd" fontSize="13">Synthetic circuit</text>
          <path d="M61 266 V294 M138 266 V294 M43 295 H156" stroke="#5a7088" strokeWidth="5" strokeLinecap="round"/>
          <circle cx="54" cy="302" r="5" fill="#7d8da1"/><circle cx="145" cy="302" r="5" fill="#7d8da1"/>
          <text x="22" y="331" fill="#6ae0cc" fontSize="16">→ Inspiration</text>
          <text x="22" y="354" fill="#e8ba72" fontSize="16">⇠ Expiration</text>
        </g>}

        <path d={path(inspiratoryPoints)} fill="none" stroke={disconnected ? '#6d7c8e' : '#6ae0cc'} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>
        <path d={path(expiratoryPoints)} fill="none" stroke={disconnected ? '#6d7c8e' : '#e8ba72'} strokeWidth="4" strokeDasharray="8 5" strokeLinejoin="round" strokeLinecap="round"/>
        <path d="M278 63 H316" stroke="#6ae0cc" strokeWidth="2" markerEnd="url(#cp-air-arrow)"/>
        <path d={manual ? `M395 ${entry[1] + 27} H373` : 'M333 83 H295'} stroke="#e8ba72" strokeWidth="2" markerEnd="url(#cp-exp-arrow)"/>
        {!reducedMotion && !disconnected && inspiration && <circle cx={inDot[0]} cy={inDot[1]} r="5.5" fill="#b5fff0" stroke="#122333" strokeWidth="2"/>}
        {!reducedMotion && !disconnected && expiration && <circle cx={outDot[0]} cy={outDot[1]} r="5.5" fill="#ffdf9f" stroke="#122333" strokeWidth="2"/>}

        <g transform={`translate(388 236) scale(${rightScale}) translate(-388 -236)`}>
          <path d="M420 127 C400 119 376 133 356 155 C330 184 310 218 310 265 C310 302 336 322 376 321 C397 320 421 316 430 299 C436 284 431 260 436 236 C442 207 443 157 420 127 Z" fill="url(#cp-lung-right)" stroke="#63b5bd" strokeWidth="1.6"/>
          <path d="M324 236 Q368 220 430 221 M326 268 Q370 253 430 264" stroke="#47858e" fill="none" strokeWidth="1.3"/>
          <path d="M431 183 L390 221 L369 270 M390 221 L354 223 M409 203 L403 271 M369 270 L344 291 M403 271 L416 297" stroke="#8ac9cd" fill="none" strokeWidth="5" strokeLinecap="round" opacity=".70"/>
        </g>
        <g transform={`translate(553 236) scale(${leftScale}) translate(-553 -236)`}>
          <path d="M506 128 C528 115 556 134 578 160 C604 191 620 223 619 266 C618 303 589 324 554 321 C538 320 524 316 517 306 C509 294 525 276 521 260 C515 244 498 236 498 217 C498 188 488 151 506 128 Z" fill="url(#cp-lung-left)" stroke="#63b5bd" strokeWidth="1.6"/>
          <path d="M510 236 Q564 244 610 264" stroke="#47858e" fill="none" strokeWidth="1.3"/>
          <path d="M499 183 L544 219 L570 272 M544 219 L579 222 M526 201 L531 246 M570 272 L595 294 M547 239 L552 295" stroke="#8ac9cd" fill="none" strokeWidth="5" strokeLinecap="round" opacity=".70"/>
        </g>

        <path d="M465 92 V160 Q464 175 431 192 M465 159 Q468 175 499 192" stroke="#93b9c6" strokeWidth="17" fill="none" strokeLinecap="round"/>
        <path d="M465 92 V160 Q464 175 431 192 M465 159 Q468 175 499 192" stroke="#173044" strokeWidth="10" fill="none" strokeLinecap="round"/>
        {[101, 112, 123, 134, 145].map(y => <path key={y} d={`M457 ${y} H473`} stroke="#c1d5da" strokeWidth="1.3" opacity=".7"/>)}

        {airway === 'ett' ? (
          <g>
            <path d="M451 56 Q468 50 479 61" fill="none" stroke="#c8b4aa" strokeWidth="3"/>
            <path d="M452 66 Q465 67 465 85 V144" stroke="#e9eee4" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <rect x="459" y="132" width="12" height="12" rx="4" fill="#b4dbd6" fillOpacity=".7"/>
            <text x="471" y="34" fill="#e8eff5" fontSize="17" textAnchor="middle">Oral ETT</text>
          </g>
        ) : airway === 'tracheostomy' ? (
          <g>
            <ellipse cx="446" cy="122" rx="9" ry="15" fill="#2f4151" stroke="#d3e1e6" strokeWidth="2"/>
            <path d="M443 122 H457 Q465 122 465 134 V146" stroke="#e9eee4" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <rect x="459" y="137" width="12" height="11" rx="4" fill="#b4dbd6" fillOpacity=".7"/>
            <text x="474" y="34" fill="#e8eff5" fontSize="17" textAnchor="middle">Tracheostomy</text>
            <text x="544" y="83" fill="#c4d2df" fontSize="15">Neck stoma</text>
            <path d="M537 88 L477 120" stroke="#748da5" strokeWidth="1" fill="none"/>
          </g>
        ) : <g>
          <ellipse cx="465" cy="63" rx="26" ry="31" fill="#223747" stroke="#bdc8ca" strokeWidth="1.5"/>
          <path d="M468 46 L460 58 L469 60 M456 73 Q465 78 474 72" fill="none" stroke="#d1c2b5" strokeWidth="2"/>
          <path d="M451 43 Q468 36 479 52 L485 75 Q469 91 449 79 Q438 60 451 43 Z" fill="#6ab4bd" fillOpacity=".27" stroke="#d1ece7" strokeWidth="2.3"/>
          <path d="M441 66 H452" stroke="#e9eee4" strokeWidth="6" strokeLinecap="round"/>
          <path d="M466 82 V94" stroke="#9bbec7" strokeWidth="8"/>
          <text x="475" y="20" fill="#e8eff5" fontSize="17" textAnchor="middle">Face mask</text>
          <text x="540" y="55" fill="#c4d2df" fontSize="14">Mouth + nose</text>
        </g>}
        {disconnected && <g><rect x={entry[0] - 8} y={entry[1] - 9} width="17" height="18" fill="#102033"/><path d={`M${entry[0] - 5} ${entry[1] - 7} l10 14 m0 -14 l-10 14`} stroke="#ffad99" strokeWidth="3"/></g>}

        <g transform={`translate(479 266) scale(${beat}) translate(-479 -266)`}>
          <path d="M464 231 C446 209 427 233 435 259 C442 280 464 302 493 314 C505 294 523 264 514 245 C505 228 483 224 464 231 Z" fill="url(#cp-heart)" stroke="#f2bdc8" strokeWidth="1.3"/>
          <path d="M466 235 Q477 269 492 305" fill="none" stroke="#8e455d" strokeWidth="2"/>
          <text x="452" y="258" fill="#17273b" fontSize="17" fontWeight="750">R</text>
          <text x="486" y="276" fill="#17273b" fontSize="17" fontWeight="750">L</text>
        </g>

        <path d="M449 239 Q430 211 389 207" stroke="#7ca9e6" strokeWidth="4" fill="none" markerEnd="url(#cp-venous-arrow)"/>
        <path d="M450 236 Q470 192 547 207" stroke="#7ca9e6" strokeWidth="4" fill="none" markerEnd="url(#cp-venous-arrow)"/>
        <path d="M389 250 Q429 259 487 254" stroke="#ee9fba" strokeWidth="3" fill="none" strokeDasharray="4 3" markerEnd="url(#cp-arterial-arrow)"/>
        <path d="M553 247 Q523 233 493 254" stroke="#ee9fba" strokeWidth="3" fill="none" strokeDasharray="4 3" markerEnd="url(#cp-arterial-arrow)"/>
        <path d="M500 285 Q526 307 520 350" stroke="#ee9fba" strokeWidth="4" fill="none" markerEnd="url(#cp-arterial-arrow)"/>
        <path d="M427 348 Q410 306 443 263" stroke="#7ca9e6" strokeWidth="4" fill="none" markerEnd="url(#cp-venous-arrow)"/>
        {compressionsActive && <g aria-hidden="true" transform={`translate(0 ${compressionOffset})`}>
          <path d="M476 203 V222 M468 215 L476 224 L484 215" fill="none" stroke="#ffd898" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="449" y="229" width="57" height="16" rx="5" fill="#533f28" stroke="#ffd898" strokeWidth="2"/>
          <path d="M457 236 H499" stroke="#ffe7b9" strokeWidth="2"/>
        </g>}
        <rect x="403" y="354" width="143" height="27" rx="13" fill="#1e3045" stroke="#536a81"/>
        <text x="474" y="373" fill="#d5e0ed" textAnchor="middle" fontSize="15">Systemic circulation</text>
        <text x="349" y="341" fill="#d1e1e9" fontSize="15" textAnchor="middle">Patient right</text>
        <text x="585" y="341" fill="#d1e1e9" fontSize="15" textAnchor="middle">Patient left</text>
      </svg>
      <div className="anatomy-readout" aria-label="Schematic summary">
        <div><span>Gas flow</span><strong>{display(Math.abs(flowLMin), 1)} <small>L/min</small></strong><span>{flowText}</span></div>
        <div><span>{spontaneousPulsePresent ? 'Cardiac output' : 'Model blood flow'}</span><strong>{display(cardiacOutput, 1)} <small>L/min</small></strong><span>{spontaneousPulsePresent ? 'Illustrative haemodynamics' : 'Flow does not establish ROSC'}</span></div>
        <div><span>Pulse oximetry</span><strong>{spontaneousPulsePresent ? <>{display(spo2, 1)}<small>%</small></> : '—'}</strong><span>{spontaneousPulsePresent ? 'Separate from CO₂ clearance' : 'Unavailable / unreliable without a pulse'}</span></div>
      </div>
      {compressionsActive && <p className="anatomy-compression-note">Simulated compressions · flow is not ROSC</p>}
      <p className="visual-footnote">Functional schematic · R → lungs → L → body → R. Lung size indicates volume change only; the drawing is not a patient-specific anatomical model.</p>
    </section>
  );
}
