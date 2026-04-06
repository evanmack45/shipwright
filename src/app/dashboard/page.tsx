"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  linearTeamName: string;
  status: string;
}

interface Team {
  id: string;
  name: string;
  key: string;
}

interface UserInfo {
  authenticated: boolean;
  name?: string;
  email?: string;
  subscriptionStatus?: string;
  updatesGenerated?: number;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeams, setShowTeams] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push("/");
        } else {
          setUser(data);
        }
      });
  }, [router]);

  useEffect(() => {
    if (user?.authenticated) {
      fetch("/api/projects")
        .then((r) => r.json())
        .then(setProjects);
    }
  }, [user]);

  async function loadTeams() {
    setShowTeams(true);
    const res = await fetch("/api/teams");
    if (res.ok) {
      setTeams(await res.json());
    } else {
      setError("Could not load Linear teams.");
    }
  }

  async function addProject(team: Team) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        linearTeamId: team.id,
        linearTeamName: team.name,
        name: team.name,
      }),
    });
    if (res.ok) {
      const project = await res.json();
      setProjects((prev) => [...prev, project]);
      setShowTeams(false);
    }
  }

  async function generateUpdate(projectId: string) {
    setGenerating(projectId);
    setError(null);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });

    if (res.ok) {
      const { updateId } = await res.json();
      router.push(`/updates/${updateId}`);
    } else {
      const data = await res.json();
      setError(data.error || "Generation failed");
    }
    setGenerating(null);
  }

  function logout() {
    document.cookie =
      "sw_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    router.push("/");
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-6 max-w-5xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Shipwright
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {user.name || user.email}
          </span>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Your Projects</h1>
          <div className="flex gap-3">
            <button
              onClick={loadTeams}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition"
            >
              + Add Linear Team
            </button>
            {user.subscriptionStatus !== "active" && (
              <a
                href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm hover:border-gray-500 transition"
              >
                Upgrade ($9/mo)
              </a>
            )}
          </div>
        </div>

        {searchParams.get("billing") === "success" && (
          <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-6 text-sm">
            Subscription activated! Unlimited updates unlocked.
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="text-sm text-gray-500 mb-6">
          {user.subscriptionStatus === "active"
            ? "Pro plan — unlimited updates"
            : `Free tier — ${user.updatesGenerated ?? 0}/2 updates used`}
        </div>

        {showTeams && teams.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              Select a Linear team:
            </h3>
            <div className="space-y-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => addProject(team)}
                  className="w-full text-left px-4 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                >
                  <span className="font-medium">{team.name}</span>
                  <span className="text-gray-500 ml-2">{team.key}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">No projects yet</p>
            <p className="text-sm">
              Add a Linear team to generate your first weekly update.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-5 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="text-sm text-gray-500">
                    Linear team: {project.linearTeamName}
                  </p>
                </div>
                <button
                  onClick={() => generateUpdate(project.id)}
                  disabled={generating === project.id}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition disabled:opacity-50"
                >
                  {generating === project.id
                    ? "Generating..."
                    : "Generate Update"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
