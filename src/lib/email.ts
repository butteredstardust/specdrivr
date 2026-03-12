import 'server-only';
import { Resend } from 'resend';
import { env } from './env';
import { logger } from './logger';

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Sends an email using the Resend service.
 * 
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - HTML content of the email
 * @returns Object indicating success or failure
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `DAEMON <${env.RESEND_FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      logger.error({ error, to, subject }, 'Failed to send email via Resend');
      return { success: false };
    }

    logger.info({ data, to, subject }, 'Email sent successfully via Resend');
    return { success: true };
  } catch (error) {
    logger.error({ error, to, subject }, 'Unexpected error sending email via Resend');
    return { success: false };
  }
}
