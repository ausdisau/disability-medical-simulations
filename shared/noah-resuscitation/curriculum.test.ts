import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { educationalDisclaimer, modules, profileNames } from './curriculum.ts';

test('all substantive text, three case adaptations, questions, feedback and references match the original web curriculum', () => {
  // Review baseline: web ResuscitationAcademy.tsx at PR #23 f8979504.
  // Hash is the original six module objects serialized as JSON, without new IDs.
  // Intentional future curriculum changes must review and replace this baseline.
  const text = JSON.stringify(modules.map(({ id, ...lesson }) => lesson));
  assert.equal(createHash('sha256').update(text).digest('hex'), '9731eb788d659ef60924877466e7e9bccbcb0281854034a92a46d8ef8416dbe9');
});

test('six modules have complete cases, valid formative answers and HTTPS source references', () => {
  assert.deepEqual(modules.map(module => module.id), ['recognition', 'circulation', 'oxygenation', 'airway', 'communication', 'reassessment']);
  for (const module of modules) {
    assert.deepEqual(Object.keys(module.adaptations), Object.keys(profileNames));
    assert.ok(Object.values(module.adaptations).every(text => text.length > 40));
    assert.equal(new Set(module.options).size, 3);
    assert.ok(Number.isInteger(module.answer) && module.answer >= 0 && module.answer < module.options.length);
    assert.equal(new URL(module.url).protocol, 'https:');
    for (const key of ['title', 'principle', 'demonstration', 'question', 'feedback', 'reference'] as const) assert.ok(module[key].length > 10);
  }
  assert.match(educationalDisclaimer, /Educational simulation only/);
  assert.match(educationalDisclaimer, /No actual emergency call, treatment order or patient device connection/);
});

test('both shipped interfaces consume the same curriculum instead of maintaining separate lesson copies', () => {
  for (const path of [
    '../../apps/noah-icu-lab/src/features/cardiopulmonary/components/ResuscitationAcademy.tsx',
    '../../apps/noah-code-blue-mobile/src/learning/ResuscitationAcademy.tsx',
  ]) {
    const component = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(component, /from ['"](?:\.\.\/)+shared\/noah-resuscitation\/curriculum['"]/);
    assert.match(component, /item\.adaptations\[profileId\]/);
    assert.doesNotMatch(component, /const modules\s*[:=]/);
  }
});
