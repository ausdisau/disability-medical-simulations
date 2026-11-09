import test from 'node:test';
import assert from 'node:assert/strict';
import {ICU_STATIONS,ECG_12_LEADS,createTelemetry,telemetryGate,telemetryDispatch,telemetryStatus,telemetrySupervisor,replayTelemetry} from '../src/icu-telemetry.mjs';
import {createAURA} from '../src/runtime.mjs';
const d=(s,type,id)=>telemetryDispatch(s,{type,id});
function complete(s,id){return d(d(d(d(d(s,'SELECT',id),'CHECK',id),'ASSIGN',id),'DOCUMENT',id),'REASSESS',id)}
test('12 leads are recognised but no ECG is invented',()=>{
 const s=createTelemetry();assert.equal(ECG_12_LEADS.length,12);assert.equal(s.ecg12.status,'NOT_ACQUIRED');assert.equal(s.rhythm.status,'NOT_ACQUIRED');assert.deepEqual(s.rhythm.trace,[]);
});
test('known 39.4 reading is triage spot observation, not continuous core',()=>{
 const s=createTelemetry();assert.equal(s.knownTemperature.valueC,39.4);
 assert.equal(s.knownTemperature.coreSensor,false);assert.equal(s.tempReadings.length,0);assert.equal(s.coreTemp.status,'NOT_CONNECTED');
});
test('all aggressive cooling and probe insertion are held',()=>{
 for(const id of ['CHILLED_IV','ICE_PACKS','CORE_PROBE','AUTO_TITRATE'])assert.equal(telemetryGate(createTelemetry(),id).allow,false);
});
test('blocked treatments never start even after attempted evidence and commitment',()=>{
 let s=createTelemetry();
 for(const id of ['CHILLED_IV','ICE_PACKS','AUTO_TITRATE'])s=complete(s,id);
 assert.equal(s.cooling.chilledSalineInfusing,false);
 assert.equal(s.cooling.icePacksApplied,false);
 assert.equal(s.cooling.automaticTitration,false);
 assert.equal(s.cooling.rate,null);
 assert.equal(s.cooling.temperatureTarget,null);
});
test('12 lead and monitoring workflows document requests but do not fabricate signals',()=>{
 let s=complete(createTelemetry(),'MONITOR');s=complete(s,'ECG12');s=complete(s,'TEMP_REPEAT');s=complete(s,'CORE_REVIEW');
 for(const id of ['MONITOR','ECG12','TEMP_REPEAT','CORE_REVIEW'])assert.equal(telemetryStatus(s,id),'REASSESSED');
 assert.equal(s.ecg12.status,'NOT_ACQUIRED');
 assert.equal(s.coreTemp.status,'NOT_CONNECTED');
 assert.equal(s.tempReadings.length,0);
});
test('fluid review is not a volume order or a fluid infusion',()=>{
 let s=complete(createTelemetry(),'FLUID_REVIEW');assert.equal(s.cooling.chilledSalineInfusing,false);
 assert.equal(s.observations.bp,'UNKNOWN');
 assert.equal(s.sepsisStatus,'SUSPECTED_RISK_NOT_CONFIRMED');
});
test('telemetry output cannot overwrite Rohan or infer incapacity from AAC',()=>{
 const rohan=createAURA();let s=complete(createTelemetry(),'CORE_REVIEW');
 assert.equal(rohan.clinical.rhythm,'ASYSTOLE');
 assert.equal(rohan.person.aac,'WAIT');
 assert.equal(s.person.capacity,'NOT_INFERRED');
 assert.equal(s.person.newConsent,'NOT_OBTAINED');
});
test('selection does not connect a device or apply a treatment',()=>{
 let s=d(createTelemetry(),'SELECT','MONITOR');
 assert.equal(s.rhythm.status,'NOT_ACQUIRED');
 assert.equal(s.documented.length,0);
 assert.equal(s.invasiveMonitoringPerformed,false);
});
test('unsupported user actions do not change physiological data',()=>{
 const s=d(createTelemetry(),'APPLY','ICE_PACKS');
 assert.equal(s.knownTemperature.valueC,39.4);
 assert.equal(s.tempReadings.length,0);
 assert.equal(s.cooling.icePacksApplied,false);
});
test('JMO coaching cannot control temperature titration',()=>{
 const p=telemetrySupervisor(createTelemetry());
 assert.equal(p.noCoolingOrder,true);assert.equal(p.noAutonomousTitration,true);
});
test('telemetry event ledger reconstructs deterministically',()=>{
 let s=complete(createTelemetry(),'HEMODYNAMIC');s=complete(s,'MONITOR');
 const replayed=replayTelemetry(s.commands);
 assert.deepEqual(replayed.ledger,s.ledger);assert.deepEqual(replayed.cooling,s.cooling);
});
