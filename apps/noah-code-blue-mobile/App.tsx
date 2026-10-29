import React, { type ReactNode, useCallback, useEffect, useState } from 'react';
import { AppState, FlatList, Linking, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, Card, CheckControl, colors, Metric, NumericControl, Paragraph, shared } from './src/components/Controls';
import {
  createRoomsState, definitionFor, dispatchRooms, elapsedLabel, roleLabels, roomDefinitions, sourceDescription,
  type RoomDefinition, type RoomsAction, type RoomState, type TeamRole,
} from './src/session/rooms';

type Tab = 'Bedside' | 'Support' | 'Team & AAC' | 'Debrief';
type Send = (action: RoomsAction) => void;
const tabs: Tab[] = ['Bedside', 'Support', 'Team & AAC', 'Debrief'];
const guidelineUrl = 'https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-6-equipment-and-techniques-in-adult-advanced-life-support';

function EducationBanner() {
  return <View style={s.education}><Text style={s.educationText}>SIMULATION ONLY · fictional adults · unvalidated model · no real alerts</Text></View>;
}

function RoomCard({ definition, room, enter }: { definition: RoomDefinition; room: RoomState; enter: () => void }) {
  const arrest = room.parameters.circulationState === 'arrest';
  return <Card eyebrow={definition.id} title={definition.title}>
    <View style={s.cardHeadline}><Text style={s.personName}>{definition.name}, {definition.age}</Text><Text style={[s.badge, arrest && s.badgeArrest]}>{arrest ? 'AUTHORED ARREST' : 'SPONTANEOUS CIRCULATION'}</Text></View>
    <Paragraph subtle>{definition.diagnosis}</Paragraph><Paragraph>{definition.opening}</Paragraph>
    <View style={s.roomMeta}><Text style={s.metaText}>{sourceDescription(room)}</Text><Text style={s.metaText}>Clock {elapsedLabel(room)} · parked</Text></View>
    <ActionButton label={`Enter ${definition.id}`} onPress={enter} tone="primary" hint="Open this room with its clock paused. Other rooms remain parked." />
  </Card>;
}

function Lobby({ rooms, send }: { rooms: ReturnType<typeof createRoomsState>['rooms']; send: Send }) {
  return <FlatList data={roomDefinitions} keyExtractor={item => item.id} contentContainerStyle={s.content}
    ListHeaderComponent={<View style={s.lobbyIntro}><Text style={s.eyebrow}>NOAH / MOBILE COMPANION</Text>
      <Text accessibilityRole="header" style={s.heroTitle}>Code Blue{ '\n' }rooms</Text>
      <Text style={s.heroText}>One bedside. A coordinated team. A reviewable training clock.</Text>
      <View style={s.darkNote}><Text style={s.darkNoteText}>Only the room you open can run. Switching rooms or leaving the app pauses time. Each person’s communication and baseline stay visible.</Text></View>
    </View>}
    renderItem={({ item }) => <RoomCard definition={item} room={rooms[item.id]} enter={() => send({ type: 'enter-room', id: item.id })} />}
    ItemSeparatorComponent={() => <View style={s.separator} />}
    ListFooterComponent={<View style={s.footer}><Text style={s.footerText}>Adults only. No treatment recommendations, procedures, drugs, automatic recovery or outcome prediction. This companion does not certify clinical skills.</Text></View>} />;
}

function ClockBar({ room, send }: { room: RoomState; send: Send }) {
  return <View style={s.clockBar}>
    <View style={s.clockHeading}><Text style={s.clockValue}>{elapsedLabel(room)}</Text><Text style={s.clockState}>{room.accessHold ? 'ACCESS HOLD' : room.running ? 'RUNNING' : 'PAUSED'}</Text></View>
    <View style={shared.row}>
      <ActionButton label={room.running ? 'Pause' : 'Run'} tone="primary" disabled={room.accessHold} onPress={() => send({ type: room.running ? 'pause' : 'run' })} />
      <ActionButton label="Step 5 s" disabled={room.accessHold} onPress={() => send({ type: 'step' })} hint="Advance this room by exactly five model seconds, then remain paused." />
      <ActionButton label={room.accessHold ? 'Release access hold' : 'AAC / reading pause'} selected={room.accessHold} onPress={() => send({ type: 'toggle-access-hold' })} />
    </View>
    {room.accessHold ? <Text style={s.helper}>Time is frozen. Requested support is queued; Run and Step are blocked until this hold is released. Release keeps the clock paused.</Text> : null}
  </View>;
}

function Bedside({ room, send }: { room: RoomState; send: Send }) {
  const def = definitionFor(room.id), m = room.model.metrics;
  const arrest = room.parameters.circulationState === 'arrest';
  return <View style={shared.sectionGap}>
    <Card title={arrest ? 'Explicit arrest scenario' : 'Person and respiratory change'} tone={arrest ? 'arrest' : 'normal'}>
      <Paragraph>{def.opening}</Paragraph>
      {arrest ? <>
        <Paragraph>Spontaneous circulation remains absent. Electrical activity, generated compression flow and gas numbers cannot establish recovery in this model.</Paragraph>
        <ActionButton label={room.arrestRecognised ? 'Arrest recognition recorded' : 'Recognise unresponsiveness + absent normal breathing'} tone="danger" disabled={room.arrestRecognised} onPress={() => send({ type: 'recognise-arrest' })} />
      </> : <Paragraph>{def.baseline}</Paragraph>}
      <ActionButton label={room.codeBlueActive ? 'Simulated Code Blue active · request logged' : 'Activate simulated Code Blue / request help'} tone={room.codeBlueActive ? 'secondary' : 'danger'} onPress={() => send({ type: 'activate-code-blue' })} hint="Records a fictional team request only. No real service or person is contacted." />
      <Paragraph subtle>{room.helpRequested ? 'Help requested in this exercise. Responder readiness is recorded separately in Team & AAC.' : 'Team roles are available in Team & AAC. The assigned bedside nurse can begin indicated simulated rescue without waiting for the entire team.'}</Paragraph>
    </Card>
    <Text accessibilityRole="header" style={s.sectionTitle}>Observed support & model state</Text>
    <Paragraph subtle>{sourceDescription(room)}. Values below are synthetic. {room.model.completedBreaths === 0 ? 'Delivery is settling until a complete breath has returned.' : 'Expired volume reflects the latest completed model breath.'}</Paragraph>
    <View style={shared.grid}>
      <Metric label="Pulse oximeter" value={m.pulseOximeterAvailable ? m.spo2.toFixed(1) : '—'} unit={m.pulseOximeterAvailable ? '%' : ''} note={m.pulseOximeterAvailable ? 'Synthetic estimate, not a patient reading' : 'Unavailable in no spontaneous pulsatile perfusion'} />
      <Metric label="Spontaneous heart rate" value={arrest ? '—' : m.heartRate.toFixed(0)} unit={arrest ? '' : '/min'} note={arrest ? 'No spontaneous circulation; electrical rhythm is not a pulse' : 'Simplified cardiovascular state'} />
      <Metric label="Blood-pressure display" value={arrest ? '—' : `${m.systolicBP.toFixed(0)}/${m.diastolicBP.toFixed(0)}`} unit={arrest ? '' : 'mmHg'} note={arrest ? 'Clinical sensor unavailable; model MAP shown separately' : 'Synthetic systolic / diastolic estimate'} />
      <Metric label="Expired tidal volume" value={m.tidalVolumeMl.toFixed(0)} unit="mL" note={room.model.completedBreaths === 0 ? 'Initial delivery / settling' : 'Simulated returned-volume sensor'} />
      <Metric label="Minute ventilation" value={m.minuteVentilation.toFixed(1)} unit="L/min" note={room.settings.ventilationSource === 'manual-bag' ? 'From actual manual breath history' : 'Delivered model volume × mandatory rate'} />
      <Metric label="Estimated ETCO₂" value={m.etCO2 === null ? '—' : m.etCO2.toFixed(1)} unit={m.etCO2 === null ? '' : 'mmHg'} note="Synthetic capnography estimate; distinct from model blood gas" />
    </View>
    <Card title="Heart–lung model detail" tone={arrest ? 'warm' : 'normal'}>
      <View style={shared.grid}>
        <Metric label={arrest ? 'Synthetic CO₂ state' : 'Modeled PaCO₂'} value={m.paCO2.toFixed(1)} unit="mmHg" note={arrest ? 'Outside arterial-gas validity during arrest' : 'Illustrative CO₂ kinetics; no renal compensation'} />
        <Metric label={arrest ? 'Synthetic O₂ state' : 'Modeled PaO₂'} value={m.paO2.toFixed(0)} unit="mmHg" note={arrest ? 'Not an interpretable arterial gas in no/low flow' : 'Fixed shunt / oxygen-content mixing approximation'} />
        <Metric label="Compression-generated flow" value={m.compressionFlow.toFixed(2)} unit="L/min" note="Illustrative forward flow; never evidence of ROSC" />
        <Metric label="Intrinsic cardiac output" value={m.intrinsicCardiacOutput.toFixed(2)} unit="L/min" note={arrest ? 'Zero in explicit arrest' : 'Reserve is separate from diagnosis'} />
        <Metric label="Model MAP" value={m.map.toFixed(1)} unit="mmHg" note="Synthetic estimate, not a valid arrest sensor reading" />
        <Metric label="Current pressure / flow" value={`${m.pressure.toFixed(1)} / ${m.flow.toFixed(0)}`} note="cmH₂O / L·min⁻¹; same R–C mechanics for bag or ventilator" />
      </View>
      <Paragraph subtle>{arrest ? 'Arrest gas values do not model tissue reservoirs, perfusion-limited exchange or reperfusion. They remain illustrative state variables and must not be interpreted as arterial measurements or used to infer prognosis.' : 'The preload-dominant heart–lung approximation omits beneficial LV afterload effects. Modeled elastic pressure is not a measured plateau pressure.'}</Paragraph>
    </Card>
    <ActionButton label="Record four-domain reassessment" onPress={() => send({ type: 'reassess' })} />
  </View>;
}

function Support({ room, send }: { room: RoomState; send: Send }) {
  const s0 = room.settings, p = room.parameters, m = room.model.metrics;
  const manual = s0.ventilationSource === 'manual-bag', mask = s0.airway === 'mask', arrest = p.circulationState === 'arrest';
  const activeBreath = room.model.manualBreathActive;
  const changeSource = (source: 'ventilator' | 'manual-bag') => send({ type: 'source', source, airway: s0.airway });
  return <View style={shared.sectionGap}>
    <Card eyebrow="SUPPORT CONFIGURATION" title="Ventilation source & interface">
      <Paragraph>{sourceDescription(room)}</Paragraph>
      <View style={shared.row}>
        <ActionButton label="Ventilator" selected={!manual} disabled={activeBreath || mask} onPress={() => changeSource('ventilator')} />
        <ActionButton label="Manual bag" selected={manual} disabled={activeBreath} onPress={() => changeSource('manual-bag')} />
      </View>
      <View style={shared.row}>
        <ActionButton label="Existing tracheostomy" selected={s0.airway === 'tracheostomy'} disabled={activeBreath} onPress={() => send({ type: 'source', source: manual ? 'manual-bag' : 'ventilator', airway: 'tracheostomy' })} />
        <ActionButton label="Existing ETT" selected={s0.airway === 'ett'} disabled={activeBreath} onPress={() => send({ type: 'source', source: manual ? 'manual-bag' : 'ventilator', airway: 'ett' })} />
        <ActionButton label="Natural-airway mask" selected={mask} disabled={activeBreath} onPress={() => send({ type: 'source', source: 'manual-bag', airway: 'mask' })} />
      </View>
      <Paragraph subtle>Interface changes select a fictional configuration and pause time. They do not perform an airway exchange. A mask is available with the manual bag only. Existing secretion resistance, lung stiffness and gas-exchange impairment remain.</Paragraph>
      {manual ? <>
        <CheckControl label="Compatible bag, interface and oxygen source ready" checked={room.bagReady} onPress={() => send({ type: 'bag-ready', ready: !room.bagReady })} detail="A trained bedside or airway responder must also be available. Readiness does not establish airway patency." />
        <ActionButton label={activeBreath ? (room.accessHold ? 'One inspiration queued' : 'Manual inspiration active') : room.accessHold ? 'Queue one bag breath' : 'Deliver one timed bag breath'} tone="primary" disabled={activeBreath || !room.bagReady || (mask && !!p.compressionsActive) || (!room.roles.bedside && !room.roles.airway)} onPress={() => send({ type: 'bag-breath' })} />
        <Paragraph subtle>{room.accessHold ? 'Queued support consumes no time until the hold is released and you choose Run or Step.' : room.running ? 'Each activation adds one inspiration to the running clock.' : 'While paused, one activation explicitly advances through one inspiration and 0.6 seconds of expiration, then remains paused.'}</Paragraph>
        <View style={shared.grid}>
          <Metric label="Manual breath activations" value={String(room.model.manualBreathCount)} note="Count includes a queued activation; completed delivery takes time" />
          <Metric label="Actual recent manual rate" value={m.manualRespiratoryRate.toFixed(1)} unit="/min" note="From actual timing; no automatic mandatory breaths" />
        </View>
      </> : <View style={shared.row}>
        <ActionButton label="Pressure control" selected={s0.mode === 'PC'} onPress={() => send({ type: 'mode', mode: 'PC' })} />
        <ActionButton label="Volume control" selected={s0.mode === 'VC'} onPress={() => send({ type: 'mode', mode: 'VC' })} />
      </View>}
      <View style={shared.grid}>
        <NumericControl label="Inspired oxygen fraction" value={s0.fio2} unit="FiO₂" min={0.21} max={1} step={0.05} decimals={2} disabled={activeBreath} onChange={value => send({ type: 'setting', key: 'fio2', value })} />
        <NumericControl label={manual ? 'Illustrative bag pressure above PEEP' : 'Inspiratory pressure above PEEP'} value={s0.pressureControl} unit="cmH₂O" min={2} max={35} step={1} disabled={activeBreath || (!manual && s0.mode === 'VC')} onChange={value => send({ type: 'setting', key: 'pressureControl', value })} />
        <NumericControl label="PEEP assumption" value={s0.peep} unit="cmH₂O" min={0} max={20} step={1} disabled={activeBreath} onChange={value => send({ type: 'setting', key: 'peep', value })} />
        <NumericControl label="Inspiratory duration" value={s0.inspiratoryTime} unit="s" min={0.3} max={manual ? 2.5 : Math.min(2.5, 60 / s0.rate - 0.25)} step={0.1} decimals={1} disabled={activeBreath} onChange={value => send({ type: 'setting', key: 'inspiratoryTime', value })} />
        {!manual ? <NumericControl label="Mandatory ventilator rate" value={s0.rate} unit="/min" min={4} max={40} step={1} onChange={value => send({ type: 'setting', key: 'rate', value })} /> : null}
        {!manual && s0.mode === 'VC' ? <NumericControl label="Set target volume" value={s0.tidalVolumeMl} unit="mL" min={100} max={900} step={20} onChange={value => send({ type: 'setting', key: 'tidalVolumeMl', value })} /> : null}
        <NumericControl label="Simulator pressure cap" value={s0.pressureLimit} unit="cmH₂O" min={Math.max(10, s0.peep + 2)} max={60} step={1} disabled={activeBreath} onChange={value => send({ type: 'setting', key: 'pressureLimit', value })} />
      </View>
      <Paragraph subtle>These are bounded software experiment controls, not prescribed settings or auto-titration. Oxygen changes oxygenation; it does not directly lower CO₂. A bag configuration bypasses a disconnected ventilator circuit but cannot remove airway resistance.</Paragraph>
    </Card>
    <Card eyebrow="EXPLICIT ARREST ONLY" title="Compression coordination" tone={arrest ? 'arrest' : 'normal'}>
      <Paragraph>{arrest ? `Recognition ${room.arrestRecognised ? 'recorded' : 'not yet recorded'}. ${p.compressionsActive ? (room.accessHold || !room.running ? 'Compression control configured; clock frozen.' : 'Compression control active.') : 'Compressions paused.'}` : 'This room has spontaneous circulation. Low pressure, a disability diagnosis or ventilator dependence alone does not enable compressions.'}</Paragraph>
      {arrest && !room.arrestRecognised ? <ActionButton label="Recognise authored arrest" tone="danger" onPress={() => send({ type: 'recognise-arrest' })} /> : null}
      <View style={shared.row}>
        <ActionButton label={p.compressionsActive ? 'Compressions configured' : room.accessHold ? 'Queue compressions' : 'Start simulated compressions'} tone="danger" disabled={!arrest || !room.arrestRecognised || !!p.compressionsActive || (mask && activeBreath) || (!room.roles.bedside && !room.roles.compressions)} onPress={() => send({ type: 'start-compressions' })} />
        <ActionButton label="Pause compressions" disabled={!p.compressionsActive} onPress={() => send({ type: 'stop-compressions' })} />
      </View>
      <View style={shared.grid}>
        <Metric label="Completed compression cycles" value={String(room.model.compressionCount)} note="Actual simulation cycles; none accrue during access holds" />
        <Metric label="Generated flow" value={m.compressionFlow.toFixed(2)} unit="L/min" note="Illustrative; not a validated CPR quality score" />
      </View>
      <View style={shared.grid}>
        <NumericControl label="Compression rate assumption" value={p.compressionRate ?? 110} unit="/min" min={60} max={160} step={5} onChange={value => send({ type: 'compression-setting', key: 'compressionRate', value })} />
        <NumericControl label="Compression depth assumption" value={p.compressionDepthMm ?? 55} unit="mm" min={20} max={70} step={5} onChange={value => send({ type: 'compression-setting', key: 'compressionDepthMm', value })} />
        <NumericControl label="Recoil fraction assumption" value={p.compressionRecoilFraction ?? 1} unit="fraction" min={0} max={1} step={0.1} decimals={1} onChange={value => send({ type: 'compression-setting', key: 'compressionRecoilFraction', value })} />
      </View>
      <Paragraph>{mask ? 'Natural-airway mask drill: coordinate 30 compressions and two breaths. Pause compressions for each pair of breaths; the application prevents overlapping mask inspiration and active compressions.' : 'Existing ETT / tracheostomy drill: the current ANZCOR advanced-airway reference describes 6–10 ventilations per minute during continuous compressions. Manual breaths depend on your actual activations.'}</Paragraph>
      <Paragraph subtle>ANZCOR adult compression reference: 100–120/min, depth greater than 5 cm, and full recoil. The wider controls are synthetic sensitivity experiments. The engine cannot assess technique, generate automatic ROSC or predict survival.</Paragraph>
      <ActionButton label="Open ANZCOR reference" onPress={() => { void Linking.openURL(guidelineUrl); }} hint="Opens the public ANZCOR advanced-airway guideline in your browser." />
    </Card>
  </View>;
}

function TeamAndAAC({ room, send }: { room: RoomState; send: Send }) {
  const def = definitionFor(room.id), arrest = room.parameters.circulationState === 'arrest';
  return <View style={shared.sectionGap}>
    <Card eyebrow="1:1 BEDSIDE RESPONSIBILITY" title="A team around the person">
      <Paragraph>Readiness is a simulation record. No colleague or service receives a real notification. A trained bedside nurse may start indicated simulated rescue while help is coming.</Paragraph>
      {(Object.keys(roleLabels) as TeamRole[]).map(role => <CheckControl key={role} label={roleLabels[role]} checked={room.roles[role]} onPress={() => send({ type: 'role', role, ready: !room.roles[role] })} detail={role === 'bedside' ? 'Dedicated one-to-one responsibility in the active room.' : 'Assigned and ready in this fictional exercise.'} />)}
      <ActionButton label="Record team / person reassessment" onPress={() => send({ type: 'reassess' })} />
    </Card>
    <Card eyebrow="COMMUNICATION & AGENCY" title={`${def.name.split(' ')[0]}’s access stays visible`}>
      <Paragraph>{def.communication}</Paragraph><Paragraph>{def.priorities}</Paragraph>
      <CheckControl label="AAC equipment or reliable backup available" checked={room.aacAvailable} onPress={() => send({ type: 'aac-available', ready: !room.aacAvailable })} detail="Equipment availability does not manufacture a response during arrest." />
      <View style={s.messageBox}><Text style={s.messageLabel}>Fictional communication state</Text><Text style={s.patientMessage}>{room.patientMessage}</Text></View>
      {arrest ? <Paragraph>Response remains unknown in the authored unresponsive state. Emergency assessment does not wait for AAC agreement. Preserve access and narrate care in parallel with urgent work.</Paragraph> : <>
        <Paragraph subtle>These are authored rehearsal messages from the fictional person, not interpretations of a real patient.</Paragraph>
        <View style={shared.row}>
          <ActionButton label="Rehearse: WAIT" disabled={!room.aacAvailable} onPress={() => send({ type: 'patient-message', message: 'WAIT. Please pause and give me time to answer.' })} />
          <ActionButton label="Rehearse: explain first" disabled={!room.aacAvailable} onPress={() => send({ type: 'patient-message', message: 'Please explain the next step and check my answer before proceeding.' })} />
        </View>
      </>}
      <ActionButton label={room.accessHold ? 'Release access hold · remain paused' : 'Pause for AAC, reading or assistive input'} selected={room.accessHold} onPress={() => send({ type: 'toggle-access-hold' })} />
    </Card>
    <Card title="Facilitator controls">
      <Paragraph>Case changes are authored. A monitor threshold never creates arrest or determines recovery. Resetting returns this room to its starting state and clears its local debrief.</Paragraph>
      {!arrest ? <ActionButton label="Load explicit arrest change · pause clock" tone="danger" onPress={() => send({ type: 'load-arrest' })} /> : null}
      <ActionButton label="Reset this room and its event log" onPress={() => send({ type: 'reset-room' })} />
    </Card>
  </View>;
}

function Debrief({ room, send, header }: { room: RoomState; send: Send; header: ReactNode }) {
  return <FlatList data={[...room.events].reverse()} keyExtractor={event => String(event.id)} contentContainerStyle={s.content}
    ListHeaderComponent={<View style={s.debriefHeader}>{header}<Card eyebrow="LOCAL SESSION RECORD" title="Debrief the sequence">
      <Paragraph>Review support, circulation, communication and team coordination. Records stay in memory during this app session; they are not a clinical chart or automatically transmitted.</Paragraph>
      <Text style={s.inputLabel}>Reflection / next rehearsal</Text>
      <TextInput accessibilityLabel="Debrief reflection" placeholder="What changed? What remained uncertain? Was the person’s access preserved?" placeholderTextColor={colors.muted}
        multiline maxLength={5000} value={room.reflection} onChangeText={text => send({ type: 'reflection', text })} style={s.textInput} textAlignVertical="top" />
      <ActionButton label="Add four-domain reassessment" onPress={() => send({ type: 'reassess' })} />
    </Card><Text style={s.sectionTitle}>{room.events.length} recent events · newest first</Text></View>}
    renderItem={({ item }) => <View style={s.event}><Text style={s.eventTime}>T + {item.time.toFixed(1)} s</Text><Text style={s.eventTitle}>{item.title}</Text><Paragraph subtle>{item.detail}</Paragraph></View>}
    ItemSeparatorComponent={() => <View style={s.eventGap} />}
    ListFooterComponent={<Text style={s.footerText}>The event log retains up to 150 entries. Reset affects this room only. Close or reload the application to clear all session state.</Text>} />;
}

function RoomView({ room, send }: { room: RoomState; send: Send }) {
  const [tab, setTab] = useState<Tab>('Bedside');
  useEffect(() => { setTab('Bedside'); }, [room.id]);
  const def = definitionFor(room.id);
  // The full toolbar scrolls with content so large accessibility fonts cannot
  // consume a fixed header and leave the native content viewport inaccessible.
  const header = <View style={s.headerStack}>
    <View style={s.roomHeader}>
      <ActionButton label="Rooms" tone="quiet" onPress={() => send({ type: 'lobby' })} hint="Return to the lobby and park this room with the clock paused." />
      <View style={s.roomHeaderCopy}><Text style={s.roomEyebrow}>{room.id.toUpperCase()} · FICTIONAL ADULT</Text><Text accessibilityRole="header" style={s.roomTitle}>{def.name}, {def.age}</Text></View>
    </View>
    <ClockBar room={room} send={send} />
    <View style={s.tabs}>{tabs.map(item => <ActionButton key={item} label={item} selected={tab === item} tone="quiet" onPress={() => { if (item !== tab) { send({ type: 'pause' }); setTab(item); } }} style={s.tabButton} hint="Switch section and pause the training clock for review." />)}</View>
    <View style={s.liveMessage} accessibilityLiveRegion="polite"><Text style={s.liveMessageText}>{room.lastMessage}</Text></View>
  </View>;
  return <View style={s.roomShell}>
    {tab === 'Debrief' ? <Debrief room={room} send={send} header={header} /> : <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {header}
      {tab === 'Bedside' ? <Bedside room={room} send={send} /> : tab === 'Support' ? <Support room={room} send={send} /> : <TeamAndAAC room={room} send={send} />}
    </ScrollView>}
  </View>;
}

export default function App() {
  const [state, setState] = useState(createRoomsState);
  const send = useCallback<Send>(action => setState(previous => dispatchRooms(previous, action)), []);
  const room = state.activeRoomId ? state.rooms[state.activeRoomId] : null;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => { if (next !== 'active') send({ type: 'background', reason: next }); });
    return () => subscription.remove();
  }, [send]);
  useEffect(() => {
    if (!room?.running || room.accessHold) return;
    // Fixed advances only: never catch up from wall time after a background/JS pause.
    const timer = setInterval(() => send({ type: 'tick', seconds: 0.25 }), 250);
    return () => clearInterval(timer);
  }, [room?.id, room?.running, room?.accessHold, send]);
  return <SafeAreaProvider><SafeAreaView style={s.safeArea} edges={['top', 'left', 'right', 'bottom']}>
    <StatusBar barStyle="dark-content" />
    <EducationBanner />
    <View style={s.appWidth}>{room ? <RoomView room={room} send={send} /> : <Lobby rooms={state.rooms} send={send} />}</View>
  </SafeAreaView></SafeAreaProvider>;
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas }, appWidth: { flex: 1, width: '100%', maxWidth: 1040, alignSelf: 'center' },
  education: { backgroundColor: colors.navy, paddingVertical: 9, paddingHorizontal: 14 }, educationText: { color: '#E5F3F4', fontSize: 11, lineHeight: 17, textAlign: 'center', fontWeight: '700', letterSpacing: 0.5 },
  content: { padding: 16, paddingBottom: 36, gap: 12 }, lobbyIntro: { paddingTop: 12, paddingBottom: 20, gap: 14 },
  eyebrow: { color: colors.teal, fontSize: 12, fontWeight: '800', letterSpacing: 1.8 }, heroTitle: { color: colors.navy, fontSize: 46, lineHeight: 49, fontWeight: '800', letterSpacing: -1.4 },
  heroText: { fontSize: 19, lineHeight: 28, color: colors.muted, maxWidth: 680 }, darkNote: { backgroundColor: colors.navy, borderRadius: 14, padding: 18 }, darkNoteText: { color: '#E8F4F5', fontSize: 15, lineHeight: 23 },
  cardHeadline: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }, personName: { fontSize: 20, fontWeight: '700', color: colors.ink },
  badge: { color: colors.teal, fontSize: 10, lineHeight: 16, fontWeight: '800', backgroundColor: colors.tealLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }, badgeArrest: { color: colors.red, backgroundColor: colors.redLight },
  roomMeta: { gap: 5 }, metaText: { color: colors.muted, fontSize: 13, lineHeight: 20 }, separator: { height: 14 }, footer: { paddingVertical: 20 }, footerText: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 14 },
  roomShell: { flex: 1 }, headerStack: { gap: 0, marginHorizontal: -16, marginTop: -16, marginBottom: 8 }, roomHeader: { padding: 14, flexDirection: 'row', gap: 14, alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1 }, roomHeaderCopy: { flex: 1, gap: 4 }, roomEyebrow: { fontSize: 10, color: colors.muted, letterSpacing: 1, fontWeight: '800' }, roomTitle: { fontSize: 22, lineHeight: 28, color: colors.navy, fontWeight: '700' },
  clockBar: { paddingHorizontal: 14, paddingVertical: 10, gap: 8, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border }, clockHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }, clockValue: { fontSize: 24, fontVariant: ['tabular-nums'], color: colors.ink, fontWeight: '700' }, clockState: { fontSize: 11, color: colors.teal, fontWeight: '800', letterSpacing: 1 }, helper: { fontSize: 13, lineHeight: 20, color: colors.muted },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingVertical: 10 }, tabButton: { flexGrow: 1, paddingHorizontal: 8 },
  liveMessage: { paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: '#E6F1F2' }, liveMessageText: { fontSize: 12, lineHeight: 18, color: colors.ink },
  sectionTitle: { fontSize: 21, lineHeight: 28, color: colors.navy, fontWeight: '700', marginTop: 6 },
  messageBox: { padding: 16, borderLeftWidth: 4, borderLeftColor: colors.teal, backgroundColor: colors.tealLight, gap: 7 }, messageLabel: { color: colors.teal, fontSize: 12, fontWeight: '700' }, patientMessage: { color: colors.ink, fontSize: 18, lineHeight: 27 },
  debriefHeader: { gap: 16, paddingBottom: 10 }, inputLabel: { color: colors.ink, fontSize: 15, fontWeight: '600' }, textInput: { color: colors.ink, backgroundColor: colors.white, minHeight: 140, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, fontSize: 16, lineHeight: 24 },
  event: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, gap: 6 }, eventTime: { color: colors.teal, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }, eventTitle: { color: colors.ink, fontWeight: '700', fontSize: 17 }, eventGap: { height: 8 },
});
