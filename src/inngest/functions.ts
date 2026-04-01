import { inngest } from "./client";

export const prSummary = inngest.createFunction(
  { id: "pr-summary", name: "PR Summary" },
  { event: "dispatch/pr-summary" },
  async ({ event, step }) => {
    await step.run("log-payload", () => {
      console.log("[pr-summary] received event:", JSON.stringify(event.data, null, 2));
    });
    return { success: true };
  }
);

export const codeReview = inngest.createFunction(
  { id: "code-review", name: "Code Review" },
  { event: "dispatch/code-review" },
  async ({ event, step }) => {
    await step.run("log-payload", () => {
      console.log("[code-review] received event:", JSON.stringify(event.data, null, 2));
    });
    return { success: true };
  }
);

export const ticketTriage = inngest.createFunction(
  { id: "ticket-triage", name: "Ticket Triage" },
  { event: "dispatch/ticket-triage" },
  async ({ event, step }) => {
    await step.run("log-payload", () => {
      console.log("[ticket-triage] received event:", JSON.stringify(event.data, null, 2));
    });
    return { success: true };
  }
);
