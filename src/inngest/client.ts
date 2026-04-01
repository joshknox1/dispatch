import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "dispatch",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
