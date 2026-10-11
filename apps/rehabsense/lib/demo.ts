export type Item={id:string,label:string,owner?:string,done:boolean};
export type Choice='unknown'|'agreed'|'declined'|'deferred';
export type Case={id:string,synthetic:true,person:{name:string,diagnosis:string,baseline:string,communication:string},goals:Item[],actions:Item[],barriers:Item[],decisions:{id:string,topic:string,state:Choice}[],notes:string};
export const demo:Case={id:'RS-DEMO-001',synthetic:true,person:{name:'Alex Morgan (fictional)',diagnosis:'Dystonic-spastic cerebral palsy',baseline:'Directs personal care and decisions; receives physical assistance with transfers and meals.',communication:'Dysarthric speech; confirm meaning, allow response time and support AAC.'},
goals:[{id:'g1',label:'Direct care using preferred communication',owner:'Person',done:false},{id:'g2',label:'Find suitable accessible independent living',owner:'Person and OT',done:false}],
actions:[{id:'a1',label:'Record established baseline',owner:'Nursing',done:false},{id:'a2',label:'Assess support and accommodation fit',owner:'OT',done:false},{id:'a3',label:'Coordinate funding and transition',owner:'Social work',done:false}],
barriers:[{id:'b1',label:'Housing suitability unconfirmed',done:false},{id:'b2',label:'Continuity of support unconfirmed',done:false}],
decisions:[{id:'d1',topic:'Preferred discharge destination',state:'unknown'},{id:'d2',topic:'Discuss simulated MapAble transition preview',state:'unknown'}],
notes:'Educational scenario only. Discharge is not authorised.'};
