'use client';

import BusinessCard from './BusinessCard';

export default function Footer() {
  return (
    <footer className="relative z-10 bg-surface-container-low border-t border-surface-container-high">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Column 1: 3D Business Card */}
          <div className="lg:col-span-2 flex items-center justify-center lg:justify-start">
            <BusinessCard />
          </div>

          {/* Column 2: Links */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <div>
              <h4 className="sentinel-label mb-3">Product</h4>
              <ul className="flex flex-col gap-2">
                <li>
                  <a href="/admin" className="text-on-surface-variant hover:text-on-surface text-sm transition-colors">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="/" className="text-on-surface-variant hover:text-on-surface text-sm transition-colors">
                    Report Spam
                  </a>
                </li>
                <li>
                  <a href="/admin" className="text-on-surface-variant hover:text-on-surface text-sm transition-colors">
                    Rules
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="sentinel-label mb-3">Resources</h4>
              <ul className="flex flex-col gap-2">
                <li>
                  <a
                    href="https://github.com/noluyorAbi/whatsapp-spam-guard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/noluyorAbi/whatsapp-spam-guard#readme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-on-surface-variant hover:text-on-surface text-sm transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Branding + Tech */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-xl">security</span>
                <span className="font-headline font-bold text-on-surface">Sentinel Protocol</span>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Autonomous spam detection for university WhatsApp groups.
              </p>
            </div>

            <div>
              <h4 className="sentinel-label mb-3">Built with</h4>
              <div className="flex flex-wrap gap-2">
                {['Node.js', 'Next.js', 'Supabase', 'Gemini AI', 'Baileys'].map((tech) => (
                  <span
                    key={tech}
                    className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-surface-container-high text-on-surface-variant"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-surface-container-high">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-on-surface-variant text-xs">
          <p>&copy; 2024 Sentinel Protocol. All metrics are encrypted.</p>
          <p>Not affiliated with any corporation.</p>
        </div>
      </div>
    </footer>
  );
}
