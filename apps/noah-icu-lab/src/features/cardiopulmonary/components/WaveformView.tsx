import './visuals.css';

export interface WaveformSample {
  time: number;
  pressure: number;
  flow: number;
  volume: number;
  co2?: number;
}

export interface WaveformViewProps {
  samples: WaveformSample[];
  reducedMotion: boolean;
  windowSeconds?: number;
}

type Channel = 'pressure' | 'flow' | 'volume' | 'co2';
interface ChannelDefinition { key: Channel; title: string; unit: string; min: number; max: number; color: string; precision: number; }
const CHANNELS: ChannelDefinition[] = [
  { key: 'pressure', title: 'Airway pressure', unit: 'cmH₂O', min: -10, max: 60, color: '#77dfcc', precision: 1 },
  { key: 'flow', title: 'Circuit flow', unit: 'L/min', min: -120, max: 120, color: '#e8bf80', precision: 1 },
  { key: 'volume', title: 'Respiratory volume', unit: 'mL', min: 0, max: 1200, color: '#9dbdff', precision: 0 },
  { key: 'co2', title: 'Exhaled CO₂', unit: 'mmHg', min: 0, max: 80, color: '#e6b7e4', precision: 1 },
];

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function WaveformView({ samples, reducedMotion, windowSeconds = 20 }: WaveformViewProps) {
  const window = finite(windowSeconds) ? Math.max(5, Math.min(60, windowSeconds)) : 20;
  const validSamples = samples.filter(s => finite(s.time));
  const end = validSamples.length ? validSamples[validSamples.length - 1].time : 0;
  const start = Math.max(0, end - window);
  const domainEnd = Math.max(window, end);
  const visible = validSamples.filter(s => s.time >= start && s.time <= domainEnd);
  const latest = visible[visible.length - 1];
  const channels = CHANNELS.filter(c => c.key !== 'co2' || visible.some(s => finite(s.co2)));
  const viewWidth = 660;
  const viewHeight = 90;
  const left = 40;
  const right = 10;
  const top = 7;
  const bottom = 7;
  const width = viewWidth - left - right;
  const height = viewHeight - top - bottom;
  const x = (time: number) => left + (time - start) / (domainEnd - start) * width;

  return (
    <section className="wave-panel" aria-labelledby="wave-heading">
      <div className="visual-heading">
        <div><p className="visual-kicker">BREATH BY BREATH</p><h2 id="wave-heading">Ventilator waveforms</h2></div>
        <span className="wave-duration">{window} s window</span>
      </div>
      <div className="wave-channels">
        {channels.map(channel => {
          const values = visible.map(s => s[channel.key]).filter(finite);
          const observedMax = values.length ? Math.max(...values) : 0;
          const observedMin = values.length ? Math.min(...values) : 0;
          // Axes remain fixed throughout the normal drawing range and expand to prevent clipped data.
          const upper = Math.max(channel.max, Math.ceil(observedMax / 20) * 20);
          const lower = Math.min(channel.min, Math.floor(observedMin / 20) * 20);
          const y = (value: number) => top + (upper - value) / (upper - lower) * height;
          let drawing = '';
          let previousValid = false;
          for (const sample of visible) {
            const value = sample[channel.key];
            if (!finite(value)) { previousValid = false; continue; }
            drawing += `${previousValid ? 'L' : 'M'}${x(sample.time).toFixed(2)},${y(value).toFixed(2)} `;
            previousValid = true;
          }
          const lastValue = latest?.[channel.key];
          const valueText = finite(lastValue) ? lastValue.toFixed(channel.precision) : '—';
          const graphId = `wave-${channel.key}`;
          return (
            <div className="wave-channel" key={channel.key}>
              <div className="wave-label"><h3>{channel.title}</h3><span><strong style={{color:channel.color}}>{valueText}</strong> {channel.unit}</span></div>
              <svg className="wave-svg" viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-labelledby={`${graphId}-title ${graphId}-desc`}>
                <title id={`${graphId}-title`}>{channel.title} against simulation time</title>
                <desc id={`${graphId}-desc`}>Synthetic model signal. Latest value {valueText} {channel.unit}. Vertical scale {lower} to {upper} {channel.unit}. Shown interval {start.toFixed(1)} to {domainEnd.toFixed(1)} seconds. {channel.key === 'volume' ? 'Volume is relative to the model reference end-expiratory volume, not absolute lung volume.' : ''} {reducedMotion ? 'No decorative animation; the trace updates only when model data changes.' : 'The trace follows simulation data only.'}</desc>
                <defs><clipPath id={`${graphId}-clip`}><rect x={left - 1} y="0" width={width + 2} height={viewHeight}/></clipPath></defs>
                {[0, .25, .5, .75, 1].map(t => <line key={`v-${t}`} x1={left + t * width} y1={0} x2={left + t * width} y2={viewHeight} stroke="#23354b" strokeWidth="1"/>) }
                {[lower, (lower + upper) / 2, upper].map((v, i) => <g key={`h-${i}`}><line x1={left} x2={viewWidth - right} y1={y(v)} y2={y(v)} stroke="#283c51" strokeWidth="1" strokeDasharray="3 5"/><text x={left - 7} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#a2b4c8">{Math.round(v)}</text></g>)}
                {lower < 0 && <line x1={left} x2={viewWidth - right} y1={y(0)} y2={y(0)} stroke="#5d748c" strokeWidth="1.2"/>}
                <path d={drawing} fill="none" stroke={channel.color} strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" clipPath={`url(#${graphId}-clip)`}/>
                {latest && finite(lastValue) && <circle cx={x(latest.time)} cy={y(lastValue)} r="2.5" fill={channel.color}/>}
                {!visible.length && <text x={viewWidth / 2} y={viewHeight / 2 + 4} textAnchor="middle" fill="#a7b9cc" fontSize="14">Start or step the simulation to draw a breath.</text>}
              </svg>
            </div>
          );
        })}
      </div>
      <div className="wave-time-axis" aria-label={`Time axis from ${start.toFixed(1)} to ${domainEnd.toFixed(1)} seconds`}><span>{start.toFixed(0)} s</span><span>Simulation time</span><span>{domainEnd.toFixed(0)} s</span></div>
      <p className="visual-footnote">Calculated from the model. Volume is relative to its end-expiratory reference. Exhaled CO₂, when available, is an illustrative capnogram and is distinct from arterial CO₂.</p>
    </section>
  );
}
