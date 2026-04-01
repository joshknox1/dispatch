import { inngest } from "@/inngest/client";
import { db } from "@/db";
import { installations } from "@/db/schema";
import { eq } from "drizzle-orm";

async function verifySignature(request: Request): Promise<boolean> {
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature) return false;

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    // Allow unsigned webhooks in development when no secret is configured
    return process.env.NODE_ENV === "development";
  }

  const body = await request.clone().text();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expected =
    "sha256=" +
    Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

async function handleInstallationEvent(payload: {
  action: string;
  installation: {
    id: number;
    account: { login: string; type: string };
  };
  repositories?: Array<{ name: string; full_name: string }>;
  repositories_added?: Array<{ name: string; full_name: string }>;
  repositories_removed?: Array<{ name: string; full_name: string }>;
}): Promise<void> {
  const { action, installation } = payload;

  if (action === "created") {
    const repoNames = (payload.repositories ?? []).map((r) => r.name);
    await db
      .insert(installations)
      .values({
        installationId: installation.id,
        orgName: installation.account.login,
        repoNames,
        active: true,
      })
      .onConflictDoUpdate({
        target: installations.installationId,
        set: { repoNames, active: true },
      });
  } else if (action === "deleted" || action === "suspend") {
    await db
      .update(installations)
      .set({ active: false })
      .where(eq(installations.installationId, installation.id));
  } else if (action === "unsuspend") {
    await db
      .update(installations)
      .set({ active: true })
      .where(eq(installations.installationId, installation.id));
  } else if (action === "added") {
    // repositories_added event
    const existing = await db.query.installations.findFirst({
      where: eq(installations.installationId, installation.id),
    });
    if (existing) {
      const newRepos = (payload.repositories_added ?? []).map((r) => r.name);
      const merged = Array.from(new Set([...existing.repoNames, ...newRepos]));
      await db
        .update(installations)
        .set({ repoNames: merged })
        .where(eq(installations.installationId, installation.id));
    }
  } else if (action === "removed") {
    const existing = await db.query.installations.findFirst({
      where: eq(installations.installationId, installation.id),
    });
    if (existing) {
      const removedNames = new Set(
        (payload.repositories_removed ?? []).map((r) => r.name)
      );
      const updated = existing.repoNames.filter((n) => !removedNames.has(n));
      await db
        .update(installations)
        .set({ repoNames: updated })
        .where(eq(installations.installationId, installation.id));
    }
  }
}

export async function POST(request: Request) {
  const valid = await verifySignature(request);
  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  const payload = await request.json();

  switch (event) {
    case "installation":
    case "installation_repositories":
      await handleInstallationEvent(payload);
      break;

    case "pull_request":
      if (["opened", "synchronize", "reopened"].includes(payload.action)) {
        await inngest.send({ name: "dispatch/pr-summary", data: payload });
      }
      if (payload.action === "review_requested") {
        await inngest.send({ name: "dispatch/code-review", data: payload });
      }
      break;

    case "pull_request_review_requested":
      await inngest.send({ name: "dispatch/code-review", data: payload });
      break;

    case "issues":
      await inngest.send({ name: "dispatch/ticket-triage", data: payload });
      break;

    case "ping":
      // GitHub sends a ping when a webhook is first configured — just acknowledge it
      break;
  }

  return new Response("OK", { status: 200 });
}
