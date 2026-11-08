export type Role='person'|'clinician'|'coordinator'|'delegate'|'administrator';
export type Action='case:read'|'goals:write'|'assessments:write'|'transitions:write'|'demo:configure';
export type Actor={subject:string,tenant:string,role:Role};
const grants:Record<Role,readonly Action[]>={person:['case:read','goals:write'],clinician:['case:read','assessments:write'],coordinator:['case:read','transitions:write'],delegate:['case:read'],administrator:['demo:configure']};
export function actorForSubject(subject:unknown,raw:unknown,tenant='adl-training'):Actor|null{
 if(typeof subject!=='string'||!subject||typeof raw!=='string'||!raw)return null;
 try{const all=JSON.parse(raw);if(!all||typeof all!=='object'||Array.isArray(all))return null;
 const v=Object.hasOwn(all,subject)?all[subject]:null;
 if(!v||v.tenant!==tenant||typeof v.role!=='string'||!Object.hasOwn(grants,v.role))return null;
 return {subject,tenant,role:v.role as Role};}catch{return null;}
}
export function can(a:Actor|null,action:Action,tenant='adl-training'){return !!a&&a.tenant===tenant&&grants[a.role].includes(action);}
