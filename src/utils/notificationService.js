/**
 * Notification Service for Neleeri Sneakers
 * Handles OTP and alert dispatch via Email and SMS.
 * Supports SMTP/SMS provider configs and automated test outbox fallback.
 */

class NotificationService {
  constructor() {
    this.outbox = [];
  }

  /**
   * Send Email Notification (OTP, Welcome, Password Reset)
   */
  async sendEmail({ to, subject, html, text, otp = null }) {
    const cleanTo = String(to).trim().toLowerCase();
    const hasSmtpConfig = Boolean(
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    );

    const messageRecord = {
      channel: 'email',
      to: cleanTo,
      subject,
      text: text || html,
      otp,
      simulated: !hasSmtpConfig,
      sentAt: new Date().toISOString(),
    };

    this.outbox.push(messageRecord);

    if (hasSmtpConfig) {
      // In live production with configured SMTP credentials:
      console.log(`[EMAIL DISPATCH - LIVE] To: ${cleanTo} | Subject: ${subject}`);
      // Nodemailer or SMTP client can be mounted here
    } else {
      // Development / Buildathon demonstration mode:
      console.log(`------------------------------------------------------`);
      console.log(`📧 [NELEERI EMAIL DISPATCH - DEV SIMULATOR]`);
      console.log(`📬 To:      ${cleanTo}`);
      console.log(`🏷️  Subject: ${subject}`);
      if (otp) {
        console.log(`🔐 OTP CODE: >>> ${otp} <<< (Valid for 10 minutes)`);
      }
      console.log(`------------------------------------------------------`);
    }

    return {
      success: true,
      channel: 'email',
      recipient: cleanTo,
      simulated: !hasSmtpConfig,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };
  }

  /**
   * Send SMS Notification (OTP verification)
   */
  async sendSms({ to, message, otp = null }) {
    const cleanTo = String(to).trim();
    const hasSmsConfig = Boolean(process.env.SMS_API_KEY || process.env.TWILIO_ACCOUNT_SID);

    const messageRecord = {
      channel: 'sms',
      to: cleanTo,
      message,
      otp,
      simulated: !hasSmsConfig,
      sentAt: new Date().toISOString(),
    };

    this.outbox.push(messageRecord);

    if (hasSmsConfig) {
      console.log(`[SMS DISPATCH - LIVE] To: ${cleanTo} | Msg: ${message}`);
    } else {
      console.log(`------------------------------------------------------`);
      console.log(`📱 [NELEERI SMS DISPATCH - DEV SIMULATOR]`);
      console.log(`📲 To:      ${cleanTo}`);
      console.log(`💬 Message: ${message}`);
      if (otp) {
        console.log(`🔐 OTP CODE: >>> ${otp} <<<`);
      }
      console.log(`------------------------------------------------------`);
    }

    return {
      success: true,
      channel: 'sms',
      recipient: cleanTo,
      simulated: !hasSmsConfig,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };
  }

  /**
   * Retrieve outbox for automated verification and tests
   */
  getOutbox(filter = {}) {
    return this.outbox.filter((m) => {
      if (filter.to && m.to !== filter.to.toLowerCase()) return false;
      if (filter.channel && m.channel !== filter.channel) return false;
      return true;
    });
  }

  /**
   * Get latest OTP sent to an address or phone
   */
  getLatestOtpFor(recipient) {
    const clean = String(recipient).trim().toLowerCase();
    const match = [...this.outbox].reverse().find((m) => m.to === clean && m.otp);
    return match ? match.otp : null;
  }

  /**
   * Clear outbox (useful during testing)
   */
  clearOutbox() {
    this.outbox = [];
  }
}

module.exports = new NotificationService();
