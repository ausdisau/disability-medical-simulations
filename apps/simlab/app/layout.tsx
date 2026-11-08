import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata:Metadata={title:"Accessible Futures Clinical Simulation Lab",description:"Lived experience translated into safer clinical practice."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-AU"><body><a className="skip" href="#main">Skip to main content</a><header className="site"><p className="eyebrow">Australian Disability Ltd</p><Link href="/"><strong>Accessible Futures Clinical Simulation Lab</strong></Link><p className="muted">Lived experience translated into safer clinical practice.</p></header><main id="main">{children}</main><footer className="site-footer">Educational simulation only. Draft scenarios require clinical and lived-experience review before institutional use.</footer></body></html>}
