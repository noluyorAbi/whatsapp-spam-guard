import SubmissionForm from '@/components/SubmissionForm';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background glow accents */}
      <div className="glow-blob w-[600px] h-[600px] bg-primary top-[-200px] left-[-100px] absolute" />
      <div className="glow-blob w-[400px] h-[400px] bg-secondary bottom-[-150px] right-[-100px] absolute" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">security</span>
          <span className="font-headline font-bold text-on-surface text-lg">Sentinel Protocol</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/admin" className="text-on-surface-variant hover:text-on-surface text-sm transition-colors">Dashboard</a>
          <a href="/admin" className="text-on-surface-variant hover:text-on-surface text-sm transition-colors">Reports</a>
          <a href="/admin" className="text-on-surface-variant hover:text-on-surface text-sm transition-colors">Rules</a>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 pt-16 pb-12">
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            Community Safety
          </span>
        </div>

        <h1 className="font-headline text-4xl md:text-5xl font-bold text-on-surface text-center mb-3 leading-tight">
          Report Spam Patterns
        </h1>
        <p className="text-on-surface-variant text-center max-w-md mb-10 text-base">
          Seen spam in a university WhatsApp group? Submit the message and help protect the community.
        </p>

        {/* Form card */}
        <div className="w-full max-w-lg bg-surface-container-low rounded-2xl p-8">
          <SubmissionForm />
        </div>

        {/* Footer badges */}
        <div className="flex items-center gap-6 mt-10 text-on-surface-variant">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="material-symbols-outlined text-sm text-primary">lock</span>
            Encrypted
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="material-symbols-outlined text-sm text-primary">sync</span>
            Live Sync
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="material-symbols-outlined text-sm text-primary">policy</span>
            Privacy Policy
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-on-surface-variant text-xs">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className="material-symbols-outlined text-sm">security</span>
          <span className="font-headline font-semibold">Sentinel Protocol</span>
        </div>
        <p>Submissions are reviewed by an admin before any action is taken.</p>
      </footer>
    </div>
  );
}
