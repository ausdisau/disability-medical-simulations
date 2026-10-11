import {NextResponse} from 'next/server';import {auth0,getActor} from '../../../lib/auth';import {can} from '../../../lib/authz';import {demo} from '../../../lib/demo';
export const dynamic='force-dynamic';
export async function GET(){
 if(!auth0)return NextResponse.json({error:'AD.iD not configured'},{status:503});
 const actor=await getActor();if(!actor)return NextResponse.json({error:'Verified session and server role binding required'},{status:401});
 if(!can(actor,'case:read'))return NextResponse.json({error:'Access denied'},{status:403});
 return NextResponse.json({synthetic:true,role:actor.role,case:demo},{headers:{'Cache-Control':'no-store','X-Synthetic-Only':'true'}});
}
