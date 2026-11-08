import {NextResponse} from 'next/server';import {configured} from '../../../lib/auth';
export const dynamic='force-dynamic';
export function GET(){return NextResponse.json({app:'RehabSense',version:'0.5.0',synthetic:true,adIdConfigured:configured,clinicalDataEnabled:false},{headers:{'Cache-Control':'no-store','X-Synthetic-Only':'true'}});}
