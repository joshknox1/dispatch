import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { installations } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/settings");
  }

  const user = session.user as typeof session.user & {
    githubId?: string;
    username?: string;
  };

  const allInstallations = await db.query.installations.findMany({
    orderBy: [desc(installations.createdAt)],
  });

  async function toggleInstallation(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const active = formData.get("active") === "true";
    await db
      .update(installations)
      .set({ active: !active })
      .where(eq(installations.id, id));
    revalidatePath("/settings");
  }

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
              className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
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

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Settings
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your connected repositories and automation preferences.
          </p>
        </div>

        {/* GitHub App section */}
        <section className="mb-8 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              GitHub App
            </h2>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                Install Dispatch on your repositories to enable automation.
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                The GitHub App handles PR summaries, code reviews, and issue triage.
              </p>
            </div>
            <Link
              href="/install"
              className="ml-4 shrink-0 inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Install
            </Link>
          </div>
        </section>

        {/* Connected installations */}
        <section className="mb-8 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Connected Repositories
            </h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {allInstallations.length} installation
              {allInstallations.length !== 1 ? "s" : ""}
            </span>
          </div>

          {allInstallations.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No installations yet.{" "}
                <Link
                  href="/install"
                  className="font-medium text-zinc-900 underline dark:text-zinc-50"
                >
                  Install the GitHub App
                </Link>{" "}
                to get started.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {allInstallations.map((inst) => (
                <li key={inst.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {inst.orgName}
                        </p>
                        {inst.active ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        Installation ID: {inst.installationId}
                      </p>
                      {inst.repoNames.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {inst.repoNames.map((repo) => (
                            <span
                              key={repo}
                              className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            >
                              {repo}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-zinc-400">
                          All repositories
                        </p>
                      )}
                    </div>
                    <form action={toggleInstallation}>
                      <input type="hidden" name="id" value={inst.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={String(inst.active)}
                      />
                      <button
                        type="submit"
                        className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        {inst.active ? "Disable" : "Enable"}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Automation toggles */}
        <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Automations
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              These automations run on all active connected repositories.
            </p>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <AutomationRow
              title="PR Summary"
              description="Automatically summarizes every pull request when opened or updated."
              enabled
            />
            <AutomationRow
              title="Code Review"
              description="AI-powered code review posted when a review is requested on a PR."
              enabled
            />
            <AutomationRow
              title="Issue Triage"
              description="Automatically labels and prioritizes new issues using AI."
              enabled
            />
          </ul>
        </section>

        {/* Account info */}
        <section className="mt-8 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Account
            </h2>
          </div>
          <dl className="grid grid-cols-1 gap-0 divide-y divide-zinc-100 dark:divide-zinc-800 sm:grid-cols-2 sm:divide-y-0">
            <div className="px-6 py-4">
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Name
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                {user.name ?? "—"}
              </dd>
            </div>
            <div className="px-6 py-4">
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                GitHub Username
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                {user.username ? `@${user.username}` : "—"}
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}

function AutomationRow({
  title,
  description,
  enabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-4 px-6 py-4">
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{title}</p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
          enabled
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
        }`}
      >
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </li>
  );
}
