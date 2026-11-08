import {NextResponse} from 'next/server';import {demo} from '../../../lib/demo';
export function GET(){return NextResponse.json(demo,{headers:{'Cache-Control':'no-store','X-Synthetic-Only':'true'}});}
