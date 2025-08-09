// src/jobs/producer.ts
import { rentRemindersQueue } from "./queue.js";
import { supa } from "../core/supabase.js";

type RentReminderJob = {
  paymentId: string;
  tenantId: string;
  dueDate: string;
};

export async function enqueueRentReminders(orgId: string) {
  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const targetDate = inThreeDays.toISOString().slice(0, 10); // YYYY-MM-DD

  const { data, error } = await supa
    .from("payments")
    .select("id, tenant_id, due_date")
    .eq("org_id", orgId)
    .eq("status", "due")
    .eq("due_date", targetDate);

  if (error) throw new Error(error.message);

  const items = (data ?? []) as Array<{
    id: string;
    tenant_id: string;
    due_date: string;
  }>;

  if (items.length === 0) return { enqueued: 0 };

  const jobs: RentReminderJob[] = items.map((p) => ({
    paymentId: p.id,
    tenantId: p.tenant_id,
    dueDate: p.due_date,
  }));

  await rentRemindersQueue.addBulk(
    jobs.map((payload) => ({
      name: "rent-reminder",
      data: payload,
      opts: { removeOnComplete: true, removeOnFail: true },
    }))
  );

  return { enqueued: jobs.length };
}

export type { RentReminderJob };
