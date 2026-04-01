import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const user = session.user as typeof session.user & {
    githubId?: string;
    username?: string;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Welcome back, {user.name ?? user.username ?? "there"}.
          </p>

          <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">Name</dt>
              <dd className="mt-1 text-zinc-900 dark:text-zinc-50">{user.name ?? "—"}</dd>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">Email</dt>
              <dd className="mt-1 text-zinc-900 dark:text-zinc-50">{user.email ?? "—"}</dd>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">GitHub Username</dt>
              <dd className="mt-1 text-zinc-900 dark:text-zinc-50">
                {user.username ? `@${user.username}` : "—"}
              </dd>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">GitHub ID</dt>
              <dd className="mt-1 text-zinc-900 dark:text-zinc-50">{user.githubId ?? "—"}</dd>
            </div>
          </dl>

          <div className="mt-8">
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
