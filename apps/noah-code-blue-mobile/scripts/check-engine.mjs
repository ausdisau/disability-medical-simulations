import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const metadata = JSON.parse(readFileSync(new URL('src/model/provenance.json', root), 'utf8'));
const actual = createHash('sha256').update(readFileSync(new URL('src/model/pulmonary.ts', root))).digest('hex');
if (actual !== metadata.sha256) throw new Error('Engine checksum differs from the documented source. Review and synchronize before building.');
console.log('Engine copy matches documented SHA-256:', actual);
