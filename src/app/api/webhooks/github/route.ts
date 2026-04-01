import { inngest } from "@/inngest/client";

async function verifySignature(request: Request): Promise<boolean> {
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature) return false;

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return false;

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

export async function POST(request: Request) {
  const valid = await verifySignature(request);
  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  const payload = await request.json();

  switch (event) {
    case "pull_request":
      await inngest.send({
        name: "dispatch/pr-summary",
        data: payload,
      });
      break;

    case "pull_request_review_requested":
      await inngest.send({
        name: "dispatch/code-review",
        data: payload,
      });
      break;

    case "issues":
    case "issue_comment":
      await inngest.send({
        name: "dispatch/ticket-triage",
        data: payload,
      });
      break;
  }

  return new Response("OK", { status: 200 });
}
