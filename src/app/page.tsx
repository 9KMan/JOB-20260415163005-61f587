import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          Amanda AI
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Group trip planning made simple. Replace chaotic group chats with structured SMS surveys that help your group decide the perfect destination.
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 py-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">SMS Surveys</h3>
            <p className="text-slate-600 text-sm">
              Send personalized SMS surveys to each participant. No app downloads required.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl mb-4">💳</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Simple Payment</h3>
            <p className="text-slate-600 text-sm">
              One-time Stripe checkout. No subscriptions, no hidden fees.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Insights</h3>
            <p className="text-slate-600 text-sm">
              OpenAI analyzes responses to generate trip recommendations tailored to your group.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/auth"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="#how-it-works"
            className="px-8 py-3 bg-white text-slate-900 rounded-lg font-medium border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Learn More
          </Link>
        </div>

        <section id="how-it-works" className="mt-24 text-left">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">How It Works</h2>
          <ol className="space-y-6">
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">1</span>
              <div>
                <h3 className="font-semibold text-slate-900">Create Your Trip</h3>
                <p className="text-slate-600 text-sm">Sign up, create a trip, and pay a one-time fee via Stripe.</p>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">2</span>
              <div>
                <h3 className="font-semibold text-slate-900">Share the Link</h3>
                <p className="text-slate-600 text-sm">Drop the unique link into your group chat. Each person enters their name and phone.</p>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">3</span>
              <div>
                <h3 className="font-semibold text-slate-900">Collect Responses</h3>
                <p className="text-slate-600 text-sm">Participants receive SMS questions and reply privately. You monitor progress in real-time.</p>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">4</span>
              <div>
                <h3 className="font-semibold text-slate-900">Get Results</h3>
                <p className="text-slate-600 text-sm">Click generate and our AI creates 1-3 trip summaries based on your group&apos;s preferences.</p>
              </div>
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
