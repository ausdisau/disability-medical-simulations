import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'RehabSense | Complex Care',description:'Fictional rehabilitation coordination staging'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en-AU"><body>{children}</body></html>;}
