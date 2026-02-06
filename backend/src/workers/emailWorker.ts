import { Worker, Job } from "bullmq";
import redisConfig from "../config/redis";
import { sendEmail } from "../services/emailService";
import rateLimiter from "../services/rateLimiter";
import { query } from "../config/database";
import { EmailJobData } from "../types";
import dotenv from "dotenv";

dotenv.config();

const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "5");
const MIN_DELAY_BETWEEN_EMAILS = parseInt(
  process.env.MIN_DELAY_BETWEEN_EMAILS || "2000"
);

// simple email validation (IMPORTANT)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailWorker = new Worker<EmailJobData>(
  "email-queue",
  async (job: Job<EmailJobData>) => {
    const { jobId, userId, recipientEmail, subject, body } = job.data;

    console.log(`🔄 Processing job ${jobId} for ${recipientEmail}`);

    try {
      // ✅ validate email again (worker must never trust input)
      if (!emailRegex.test(recipientEmail)) {
        throw new Error(`Invalid email address: ${recipientEmail}`);
      }

      // ✅ rate limit check
      const rateLimitCheck = await rateLimiter.canSendEmail(userId);

      if (!rateLimitCheck.allowed) {
        console.log(
          `⏸️ Rate limit exceeded for user ${userId} (${rateLimitCheck.currentCount}/${rateLimitCheck.limit})`
        );

        const nextSlot = await rateLimiter.getNextAvailableSlot(userId);

        await query(
          "UPDATE email_jobs SET scheduled_time = ? WHERE job_id = ?",
          [nextSlot, jobId]
        );

        throw new Error("RATE_LIMIT_EXCEEDED");
      }

      // ✅ minimum spacing between emails
      if (MIN_DELAY_BETWEEN_EMAILS > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_DELAY_BETWEEN_EMAILS)
        );
      }

      // ✅ send REAL email (Gmail SMTP)
      const result = await sendEmail({
        to: recipientEmail,
        subject,
        text: body,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                 ${body.replace(/\n/g, "<br>")}
               </div>`,
      });

      await query(
        "UPDATE email_jobs SET status = ?, sent_at = NOW() WHERE job_id = ?",
        ["sent", jobId]
      );

      await rateLimiter.recordEmailSend(userId);

      console.log(`✅ Email sent successfully: ${jobId}`);
      console.log(`📧 Message ID: ${result.messageId}`);

      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      console.error(`❌ Error processing job ${jobId}:`, error.message);

      await query(
        "UPDATE email_jobs SET status = ?, error_message = ? WHERE job_id = ?",
        ["failed", error.message, jobId]
      );

      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: WORKER_CONCURRENCY,
  }
);

// ---- Worker lifecycle logs ----

emailWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

emailWorker.on("error", (err) => {
  console.error("❌ Worker error:", err);
});

console.log(`🚀 Email worker started with concurrency: ${WORKER_CONCURRENCY}`);
console.log(
  `⏱️ Minimum delay between emails: ${MIN_DELAY_BETWEEN_EMAILS}ms`
);


process.on("SIGTERM", async () => {
  console.log("📴 SIGTERM received, closing worker...");
  await emailWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("📴 SIGINT received, closing worker...");
  await emailWorker.close();
  process.exit(0);
});

export default emailWorker;
