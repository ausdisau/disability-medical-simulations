import {NextRequest,NextResponse} from 'next/server';
import {auth0} from './lib/auth';
export async function middleware(r:NextRequest){if(!auth0){if(r.nextUrl.pathname.startsWith('/auth/'))return new NextResponse('AD.iD staging login not configured.',{status:503});return NextResponse.next();}return auth0.middleware(r);}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
