"use client";

import { signIn } from "next-auth/react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-6 max-w-5xl mx-auto">
        <div className="text-xl font-bold tracking-tight">Shipwright</div>
        <button
          onClick={() => signIn("linear", { callbackUrl: "/dashboard" })}
          className="bg-white text-gray-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
        >
          Sign in with Linear
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-8 pt-24 pb-16">
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Your weekly update,
          <br />
          written for you.
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-xl">
          Connect your Linear workspace. Every Monday, Shipwright reads your
          issues and drafts a stakeholder update. Review, edit, send.
        </p>

        <button
          onClick={() => signIn("linear", { callbackUrl: "/dashboard" })}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-indigo-500 transition"
        >
          Get started free
        </button>
        <p className="text-sm text-gray-500 mt-3">
          2 free updates. Then $9/mo per project.
        </p>

        <div className="mt-20 grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-semibold text-lg mb-2">Connect</h3>
            <p className="text-gray-400 text-sm">
              Sign in with Linear. Shipwright reads your completed, in-progress,
              and blocked issues.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Generate</h3>
            <p className="text-gray-400 text-sm">
              AI drafts a clean, stakeholder-ready weekly update from your real
              issue data.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Send</h3>
            <p className="text-gray-400 text-sm">
              Review the draft, edit if needed, then copy and send to your
              stakeholders.
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center text-gray-600 text-sm py-8">
        Shipwright &mdash; Stop writing status updates.
      </footer>
    </div>
  );
}
