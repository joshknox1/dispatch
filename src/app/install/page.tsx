import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function InstallPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/install");
  }

  const appName = process.env.GITHUB_APP_NAME ?? "dispatch-app";
  const isConfigured = Boolean(process.env.GITHUB_APP_ID);
  const installUrl = `https://github.com/apps/${appName}/installations/new`;

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
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-50">
            <svg
              className="h-6 w-6 text-white dark:text-zinc-900"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Install Dispatch
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Connect Dispatch to your GitHub repositories to enable AI-powered automation.
          </p>

          {/* Features */}
          <ul className="mt-6 space-y-3">
            {[
              {
                title: "PR Summaries",
                description:
                  "Automatically generate a clear summary for every pull request when it's opened.",
              },
              {
                title: "AI Code Review",
                description:
                  "Get thorough code review feedback when a review is requested on a PR.",
              },
              {
                title: "Issue Triage",
                description:
                  "New issues are automatically labeled, prioritized, and assigned a category.",
              },
            ].map((feature) => (
              <li key={feature.title} className="flex gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <svg
                    className="h-3 w-3 text-emerald-600 dark:text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {feature.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {isConfigured ? (
              <a
                href={installUrl}
                className="inline-flex w-full h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Install on GitHub
              </a>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  GitHub App not yet configured
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Set{" "}
                  <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">
                    GITHUB_APP_ID
                  </code>
                  ,{" "}
                  <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">
                    GITHUB_APP_PRIVATE_KEY
                  </code>
                  , and{" "}
                  <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">
                    GITHUB_APP_NAME
                  </code>{" "}
                  in your environment variables, then deploy to enable GitHub App
                  installation.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        {/* Setup instructions */}
        {!isConfigured && (
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Setup Instructions
            </h2>
            <ol className="mt-4 space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                  1
                </span>
                <span>
                  Go to{" "}
                  <a
                    href="https://github.com/settings/apps/new"
                    className="font-medium text-zinc-900 underline dark:text-zinc-50"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub &rarr; Settings &rarr; Developer settings &rarr; GitHub Apps
                  </a>{" "}
                  and create a new GitHub App.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                  2
                </span>
                <span>
                  Set the webhook URL to{" "}
                  <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">
                    https://your-domain.com/api/webhooks/github
                  </code>
                  , and subscribe to: <em>Pull requests</em>, <em>Issues</em>,{" "}
                  <em>Installation</em>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                  3
                </span>
                <span>
                  Grant permissions: <em>Pull requests</em> (Read &amp; Write),{" "}
                  <em>Issues</em> (Read &amp; Write), <em>Contents</em> (Read).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                  4
                </span>
                <span>
                  Copy the <strong>App ID</strong>, generate a <strong>private key</strong>, and
                  set a <strong>webhook secret</strong>. Add them to your{" "}
                  <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">
                    .env.local
                  </code>
                  .
                </span>
              </li>
            </ol>
          </div>
        )}
      </main>
    </div>
  );
}
