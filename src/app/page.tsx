import { auth } from "@/auth";
import { signIn } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <main className="w-full max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dispatch
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          AI-powered dev workflow automation for GitHub.
        </p>

        <div className="mt-10">
          {session ? (
            <a
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Go to Dashboard
            </a>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Sign in with GitHub
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
