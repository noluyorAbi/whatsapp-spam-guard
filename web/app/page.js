import SubmissionForm from '@/components/SubmissionForm';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🛡️ WhatsApp Spam Guard
          </h1>
          <p className="text-gray-400">
            Seen spam in a university WhatsApp group? Report it here and help keep groups clean.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <SubmissionForm />
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Submissions are reviewed by an admin before any action is taken.
        </p>
      </div>
    </main>
  );
}
