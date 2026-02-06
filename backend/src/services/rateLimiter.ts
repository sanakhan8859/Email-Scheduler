import { redisConnection } from '../config/redis';
import { query } from '../config/database';

export class RateLimiter {
  private maxEmailsPerHour: number;

  constructor(maxEmailsPerHour?: number) {
    this.maxEmailsPerHour = maxEmailsPerHour || parseInt(process.env.MAX_EMAILS_PER_HOUR || '200');
  }

  private getCurrentHourWindow(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
  }

  async canSendEmail(userId: number): Promise<{ allowed: boolean; currentCount: number; limit: number }> {
    const hourWindow = this.getCurrentHourWindow();
    const redisKey = `rate_limit:${userId}:${hourWindow}`;

    try {
      const currentCount = await redisConnection.incr(redisKey);
      
      if (currentCount === 1) {
        await redisConnection.expire(redisKey, 3900);
      }

      const allowed = currentCount <= this.maxEmailsPerHour;

      return {
        allowed,
        currentCount,
        limit: this.maxEmailsPerHour,
      };
    } catch (error) {
      console.error('❌ Rate limiter error:', error);
      return { allowed: true, currentCount: 0, limit: this.maxEmailsPerHour };
    }
  }

  async recordEmailSend(userId: number): Promise<void> {
    const hourWindow = this.getCurrentHourWindow();

    try {
      await query(
        `INSERT INTO rate_limit_counters (user_id, hour_window, email_count) 
         VALUES (?, ?, 1) 
         ON DUPLICATE KEY UPDATE email_count = email_count + 1`,
        [userId, hourWindow]
      );
    } catch (error) {
      console.error('❌ Error recording email send:', error);
    }
  }

  async getNextAvailableSlot(userId: number): Promise<Date> {
    const now = new Date();
    const hourWindow = this.getCurrentHourWindow();
    const redisKey = `rate_limit:${userId}:${hourWindow}`;

    const currentCount = parseInt((await redisConnection.get(redisKey)) || '0');

    if (currentCount < this.maxEmailsPerHour) {
      return now;
    }

    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    
    return nextHour;
  }
}

export default new RateLimiter();