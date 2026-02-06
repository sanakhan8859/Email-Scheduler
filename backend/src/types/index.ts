export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  avatar: string;
  created_at: Date;
  updated_at: Date;
}

export interface EmailJob {
  id: number;
  job_id: string;
  user_id: number;
  recipient_email: string;
  subject: string;
  body: string;
  scheduled_time: Date;
  status: 'scheduled' | 'sent' | 'failed';
  sent_at?: Date;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ScheduleEmailRequest {
  recipients: string[];
  subject: string;
  body: string;
  startTime: string;
  delayBetweenEmails: number;
  hourlyLimit: number;
}

export interface EmailJobData {
  jobId: string;
  userId: number;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledTime: Date;
}

export interface RateLimitCounter {
  id: number;
  user_id: number;
  hour_window: string;
  email_count: number;
  created_at: Date;
  updated_at: Date;
}
