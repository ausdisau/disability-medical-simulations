import test from 'node:test';import assert from 'node:assert/strict';import {actorForSubject,can} from '../lib/authz.ts';
const b=JSON.stringify({'auth0|p':{tenant:'adl-training',role:'person'},'auth0|d':{tenant:'adl-training',role:'delegate'},'auth0|out':{tenant:'other',role:'clinician'}});
test('deny missing and foreign identity',()=>{assert.equal(actorForSubject(null,b),null);assert.equal(actorForSubject('auth0|out',b),null);});
test('delegates read only and do not write',()=>{const a=actorForSubject('auth0|d',b);assert.equal(can(a,'case:read'),true);assert.equal(can(a,'goals:write'),false);});
test('unknown roles are rejected',()=>{assert.equal(actorForSubject('auth0|p',JSON.stringify({'auth0|p':{tenant:'adl-training',role:'unverified'}})),null);});
