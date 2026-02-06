import express, { Request, Response } from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import emailQueue from '../queues/emailQueue';
import { query } from '../config/database';
import { isAuthenticated } from '../middleware/auth';
import { EmailJob, ScheduleEmailRequest } from '../types';


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Parse CSV file and extract email addresses
 */
const parseEmailsFromFile = (file: Express.Multer.File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const emails: string[] = [];
    const content = file.buffer.toString('utf-8');

    // CSV files
    if (file.originalname.endsWith('.csv')) {
      Readable.from(content)
        .pipe(csvParser())
        .on('data', (row) => {
          const email = Object.values(row).find(
  (v): v is string =>
    typeof v === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
);

if (email) {
  emails.push(email.trim());
}
        })
        .on('end', () => resolve(emails))
        .on('error', reject);
    }
    // TXT files
    else {
      content
        .split(/\r?\n/)
        .forEach((line) => {
          const trimmed = line.trim();
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            emails.push(trimmed);
          }
        });
      resolve(emails);
    }
  });
};




/**
 * POST /api/emails/schedule
 * Schedule bulk emails with rate limiting and delays
 */
router.post(
  '/schedule',
  upload.single('recipientFile'),
  async (req: Request, res: Response) => {
    try {
      const user = { id: 1 };
      const { subject, body, startTime, delayBetweenEmails, hourlyLimit } = req.body;

      let recipients: string[] = [];
      

    
      if (req.file) {
  recipients = await parseEmailsFromFile(req.file);
} else if (req.body.recipients) {
  recipients = JSON.parse(req.body.recipients);
}

recipients = recipients.filter(email =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
);


      if (!recipients || recipients.length === 0) {
        return res.status(400).json({ error: 'No recipients provided' });
      }

      if (!subject || !body) {
        return res.status(400).json({ error: 'Subject and body are required' });
      }

      const startDate = new Date(startTime);
      const delay = parseInt(delayBetweenEmails) || 0;
      const jobIds: string[] = [];



// In the /schedule endpoint, replace the email sending logic with:
for (let i = 0; i < recipients.length; i++) {
  const recipient = recipients[i].trim();
  const jobId = uuidv4();
  
  const scheduledTime = new Date(startDate.getTime() + i * delay);

  await query(
    `INSERT INTO email_jobs (job_id, user_id, recipient_email, subject, body, scheduled_time, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [jobId, user.id, recipient, subject, body, scheduledTime, 'scheduled']
  );

  const delayMs = scheduledTime.getTime() - Date.now();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(recipient)) {
  return res.status(400).json({
    error: "Invalid email address"
  });
}

  
  await emailQueue.add(
    'send-email',
    {
      jobId,
      userId: user.id,
      recipientEmail: recipient,
      subject,
      body,
      scheduledTime,
    },
    {
      delay: Math.max(0, delayMs),
      jobId: jobId,
    }
  );

  jobIds.push(jobId);
}
      res.json({
        message: `Successfully scheduled ${recipients.length} emails`,
        jobIds,
        recipientCount: recipients.length,
        startTime: startDate,
      });
    } catch (error: any) {
      console.error('Error scheduling emails:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/emails/scheduled
 * Get all scheduled emails for current user
 */
router.get('/scheduled', async (req: Request, res: Response) => {
  try {
    const user = { id: 1 };
    
    const jobs = await query(
      `SELECT * FROM email_jobs 
       WHERE user_id = ? AND status = 'scheduled' 
       ORDER BY scheduled_time ASC`,
      [user.id]
    ) as EmailJob[];

    res.json({ jobs });
  } catch (error: any) {
    console.error('Error fetching scheduled emails:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/emails/sent
 * Get all sent emails for current user
 */
router.get('/sent', async (req: Request, res: Response) => {
  try {
     const user = { id: 1 };
    
    const jobs = await query(
      `SELECT * FROM email_jobs 
       WHERE user_id = ? AND status IN ('sent', 'failed') 
       ORDER BY sent_at DESC`,
      [user.id]
    ) as EmailJob[];

    res.json({ jobs });
  } catch (error: any) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/emails/stats
 * Get email statistics for current user
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = { id: 1 };
    
    const stats = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
       FROM email_jobs 
       WHERE user_id = ?`,
      [user.id]
    ) as any[];

    res.json({ stats: stats[0] });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
