import 'server-only';
import {Auth0Client} from '@auth0/nextjs-auth0/server';
import {actorForSubject} from './authz';
export const configured=['AUTH0_DOMAIN','AUTH0_CLIENT_ID','AUTH0_CLIENT_SECRET','AUTH0_SECRET'].every(k=>!!process.env[k]?.trim());
export const auth0=configured?new Auth0Client():null;
export async function getActor(){if(!auth0)return null;const s=await auth0.getSession();return actorForSubject(s?.user?.sub,process.env.REHABSENSE_ROLE_BINDINGS,process.env.REHABSENSE_TENANT||'adl-training');}
