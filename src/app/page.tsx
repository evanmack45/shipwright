"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSetup() {
    if (!apiKey.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: apiKey.trim() }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Setup failed");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-6 max-w-5xl mx-auto">
        <div className="text-xl font-bold tracking-tight">Shipwright</div>
      </nav>

      <main className="max-w-3xl mx-auto px-8 pt-24 pb-16">
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Your weekly update,
          <br />
          written for you.
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-xl">
          Paste your Linear API key. Every Monday, Shipwright reads your issues
          and drafts a stakeholder update. Review, edit, send.
        </p>

        <div className="max-w-md">
          <label
            htmlFor="apiKey"
            className="block text-sm font-medium text-gray-400 mb-2"
          >
            Linear API Key
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSetup()}
            placeholder="lin_api_..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
          <p className="text-xs text-gray-600 mt-2">
            Create one at{" "}
            <a
              href="https://linear.app/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300"
            >
              linear.app/settings/api
            </a>
            . We use it to read your issues.
          </p>

          {error && (
            <div className="mt-3 text-sm text-red-400">{error}</div>
          )}

          <button
            onClick={handleSetup}
            disabled={loading || !apiKey.trim()}
            className="mt-4 w-full bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Get started free"}
          </button>
          <p className="text-sm text-gray-500 mt-3">
            2 free updates. Then $9/mo per project.
          </p>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-semibold text-lg mb-2">Connect</h3>
            <p className="text-gray-400 text-sm">
              Paste your Linear API key. Shipwright reads your completed,
              in-progress, and blocked issues.
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
