// src/jobs/queue.ts
import { Queue } from "bullmq";

export const RENT_REMINDERS_QUEUE = "rent-reminders" as const;

function requireRedisUrl(): string {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("Missing REDIS_URL");
  return url;
}

export function getRedisConnection() {
  return { url: requireRedisUrl() };
}

export const rentRemindersQueue = new Queue(RENT_REMINDERS_QUEUE, {
  connection: getRedisConnection(),
});
