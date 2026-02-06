import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ✅ Gmail SMTP transporter (REAL emails)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async (
  options: SendEmailOptions
): Promise<any> => {
  try {
    const info = await transporter.sendMail({
      from: `"ReachInbox Scheduler" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });

    console.log("📧 Email sent:", info.messageId);

    return {
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

export default transporter;
