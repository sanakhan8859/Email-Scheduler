export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  avatar: string;
}

export interface EmailJob {
  id: number;
  job_id: string;
  user_id: number;
  recipient_email: string;
  subject: string;
  body: string;
  scheduled_time: string;
  status: 'scheduled' | 'sent' | 'failed';
  sent_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailStats {
  total: number;
  scheduled: number;
  sent: number;
  failed: number;
}

export interface ScheduleEmailFormData {
  recipients: string[];
  subject: string;
  body: string;
  startTime: string;
  delayBetweenEmails: number;
  hourlyLimit: number;
}
