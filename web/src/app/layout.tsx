import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AngRaksha — Guardian Safety & Live Telemetry Hub',
  description: 'Real-time directional hazard detection and spatial haptic telematics for visually impaired pedestrians.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 font-sans antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">{children}</main>
        <footer className="border-t border-border py-4 text-center text-xs text-slate-500">
          AngRaksha • Team Astra • NIRMAAN 2026 (Track: Smart Mobility & Aerospace) • Zero-Cloud Edge Pipeline
        </footer>
      </body>
    </html>
  );
}
