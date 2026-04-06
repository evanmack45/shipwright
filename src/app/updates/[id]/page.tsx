"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Update {
  id: string;
  projectName: string;
  weekStart: string;
  weekEnd: string;
  draftMarkdown: string;
  editedMarkdown: string | null;
  status: string;
}

export default function UpdatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [update, setUpdate] = useState<Update | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/updates/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push("/");
          return;
        }
        setUpdate(data);
        setMarkdown(data.editedMarkdown || data.draftMarkdown);
      });
  }, [id, router]);

  async function save() {
    setSaving(true);
    await fetch(`/api/updates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editedMarkdown: markdown }),
    });
    setSaving(false);
  }

  async function markSent() {
    await fetch(`/api/updates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editedMarkdown: markdown, status: "sent" }),
    });
    router.push("/dashboard");
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!update) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-6 max-w-5xl mx-auto">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          Shipwright
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="border border-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm hover:border-gray-500 transition"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
          <button
            onClick={copyToClipboard}
            className="border border-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm hover:border-gray-500 transition"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={markSent}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition"
          >
            Mark as sent
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold">
            {update.projectName} &mdash; Week of {update.weekStart}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {update.weekStart} to {update.weekEnd} &middot;{" "}
            {update.status === "sent" ? "Sent" : "Draft"}
          </p>
        </div>

        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          className="w-full h-[500px] bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm font-mono text-gray-200 resize-y focus:outline-none focus:border-indigo-600"
        />
      </main>
    </div>
  );
}
