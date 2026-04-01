import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { installations, prSummaries, codeReviews, triageResults } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const user = session.user as typeof session.user & {
    githubId?: string;
    username?: string;
  };

  const [allInstallations, recentPRSummaries, recentCodeReviews, recentTriage] =
    await Promise.all([
      db.query.installations.findMany({
        where: (i, { eq }) => eq(i.active, true),
        orderBy: [desc(installations.createdAt)],
      }),
      db.query.prSummaries.findMany({
        orderBy: [desc(prSummaries.createdAt)],
        limit: 5,
      }),
      db.query.codeReviews.findMany({
        orderBy: [desc(codeReviews.createdAt)],
        limit: 5,
      }),
      db.query.triageResults.findMany({
        orderBy: [desc(triageResults.createdAt)],
        limit: 5,
      }),
    ]);

  const totalRepos = allInstallations.reduce(
    (sum, inst) => sum + inst.repoNames.length,
    0
  );

  const hasActivity =
    recentPRSummaries.length > 0 ||
    recentCodeReviews.length > 0 ||
    recentTriage.length > 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Nav */}
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Dispatch
            </Link>
            <Link
              href="/settings"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Settings
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {user.name ?? user.username}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              AI-powered automation status for your repositories.
            </p>
          </div>
          <Link
            href="/install"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Install GitHub App
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Connected Orgs" value={allInstallations.length} />
          <StatCard label="Repos Monitored" value={totalRepos} />
          <StatCard label="PR Summaries" value={recentPRSummaries.length} />
          <StatCard label="Issues Triaged" value={recentTriage.length} />
        </div>

        {/* Setup prompt when no installations */}
        {allInstallations.length === 0 && (
          <div className="mb-8 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              No repositories connected yet
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Install the Dispatch GitHub App to start automating your workflow.
            </p>
            <Link
              href="/install"
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Install GitHub App
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Connected Repos */}
          {allInstallations.length > 0 && (
            <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Connected Repositories
                </h2>
                <Link
                  href="/settings"
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Manage
                </Link>
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {allInstallations.flatMap((inst) =>
                  inst.repoNames.length === 0
                    ? [
                        <li key={inst.id} className="px-5 py-3">
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {inst.orgName}
                          </span>
                          <span className="ml-2 text-xs text-zinc-400">
                            (no repos selected)
                          </span>
                        </li>,
                      ]
                    : inst.repoNames.map((repo) => (
                        <li
                          key={`${inst.id}-${repo}`}
                          className="flex items-center justify-between px-5 py-3"
                        >
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {inst.orgName}/{repo}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Active
                          </span>
                        </li>
                      ))
                )}
              </ul>
            </section>
          )}

          {/* Recent PR Summaries */}
          <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Recent PR Summaries
              </h2>
            </div>
            {recentPRSummaries.length === 0 ? (
              <EmptyState message="No PR summaries yet. Open a pull request in a connected repo." />
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentPRSummaries.map((summary) => (
                  <li key={summary.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {summary.repoFullName}{" "}
                          <span className="text-zinc-400">#{summary.prNumber}</span>
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {summary.summaryText}
                        </p>
                      </div>
                      <time className="shrink-0 text-xs text-zinc-400">
                        {formatRelativeTime(summary.createdAt)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent Code Reviews */}
          <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Recent Code Reviews
              </h2>
            </div>
            {recentCodeReviews.length === 0 ? (
              <EmptyState message="No code reviews yet. Request a review on a PR in a connected repo." />
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentCodeReviews.map((review) => (
                  <li
                    key={review.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {review.repoFullName}{" "}
                        <span className="text-zinc-400">#{review.prNumber}</span>
                      </p>
                      <p className="text-xs text-zinc-400">Review {review.reviewId}</p>
                    </div>
                    <time className="text-xs text-zinc-400">
                      {formatRelativeTime(review.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent Issue Triage */}
          <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Recent Issue Triage
              </h2>
            </div>
            {recentTriage.length === 0 ? (
              <EmptyState message="No issues triaged yet. Open an issue in a connected repo." />
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentTriage.map((triage) => (
                  <li key={triage.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {triage.repoFullName}{" "}
                          <span className="text-zinc-400">#{triage.issueNumber}</span>
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <PriorityBadge priority={triage.priority} />
                          {triage.labels.slice(0, 3).map((label) => (
                            <span
                              key={label}
                              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <time className="shrink-0 text-xs text-zinc-400">
                        {formatRelativeTime(triage.createdAt)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {!hasActivity && allInstallations.length > 0 && (
          <p className="mt-6 text-center text-sm text-zinc-400">
            Waiting for GitHub events. Open a PR or issue in a connected repo to see
            Dispatch in action.
          </p>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-5 py-8 text-center">
      <p className="text-sm text-zinc-400">{message}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[priority] ??
        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      {priority}
    </span>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
