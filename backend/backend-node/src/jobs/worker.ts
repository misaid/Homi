// src/jobs/worker.ts
import { Worker } from "bullmq";
import { getRedisConnection, RENT_REMINDERS_QUEUE } from "./queue.js";

import type { RentReminderJob } from "./producer.js";

export function startWorker() {
  const worker = new Worker<RentReminderJob>(
    RENT_REMINDERS_QUEUE,
    async (job) => {
      const payload = job.data as RentReminderJob;
      // For now, just log the job payload
      console.log("rent-reminders job", payload);
    },
    { connection: getRedisConnection() }
  );

  worker.on("failed", (job, err) => {
    console.error("rent-reminders job failed", job?.id, err);
  });

  worker.on("completed", (job) => {
    console.log("rent-reminders job completed", job.id);
  });

  return worker;
}
