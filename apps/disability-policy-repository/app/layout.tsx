import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Accessible Futures | Disability Policy Repository",
  description:
    "A provenance-first disability policy repository connected to the Accessible Futures Clinical Simulation Lab."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body>
        <a className="skipLink" href="#main">Skip to main content</a>
        <header className="siteHeader">
          <div>
            <p className="kicker">Australian Disability Ltd</p>
            <div className="brand">Accessible Futures</div>
            <p className="tagline">Policy evidence and lived experience translated into safer practice.</p>
          </div>
          <nav aria-label="Primary">
            <a href="#explore">Explore</a>
            <a href="#track">Track</a>
            <a href="#compare">Compare</a>
            <a href="#ask">Ask</a>
            <a href="#act">Act</a>
            <a href="#simulation">Simulation Lab</a>
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer>
          <strong>Australian Disability Ltd</strong>
          <span>Provenance, evidence status and human review remain visible by design.</span>
        </footer>
      </body>
    </html>
  );
}
