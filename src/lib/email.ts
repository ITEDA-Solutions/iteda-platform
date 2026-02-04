// Email notification service
// Configure with your preferred email provider (SendGrid, AWS SES, Resend, etc.)

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface AlertEmailData {
  dryerId: string;
  alertType: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  currentValue?: number;
  thresholdValue?: number;
  timestamp: Date;
}

/**
 * Send email using configured email service
 * Configure SMTP or API credentials in environment variables:
 * - EMAIL_PROVIDER (sendgrid, ses, resend, smtp)
 * - EMAIL_API_KEY or SMTP credentials
 * - EMAIL_FROM
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const emailProvider = process.env.EMAIL_PROVIDER || 'console';
    
    // For development/testing - just log to console
    if (emailProvider === 'console' || !process.env.EMAIL_API_KEY) {
      console.log('📧 Email (Console Mode):');
      console.log('To:', payload.to);
      console.log('Subject:', payload.subject);
      console.log('Body:', payload.text || payload.html);
      return true;
    }

    // SendGrid implementation
    if (emailProvider === 'sendgrid') {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.EMAIL_API_KEY);
      
      await sgMail.send({
        to: payload.to,
        from: process.env.EMAIL_FROM || 'noreply@itedasolutions.com',
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
      
      return true;
    }

    // Resend implementation
    if (emailProvider === 'resend') {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.EMAIL_API_KEY);
      
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@itedasolutions.com',
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
      });
      
      return true;
    }

    // AWS SES implementation
    if (emailProvider === 'ses') {
      // Implement AWS SES sending logic here
      console.warn('AWS SES not yet implemented');
      return false;
    }

    console.error('Unknown email provider:', emailProvider);
    return false;

  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

/**
 * Send alert notification email
 */
export async function sendAlertEmail(
  recipients: string[],
  alertData: AlertEmailData
): Promise<boolean> {
  const severityColors = {
    critical: '#DC2626',
    warning: '#F59E0B',
    info: '#3B82F6',
  };

  const severityLabels = {
    critical: '🚨 CRITICAL ALERT',
    warning: '⚠️ WARNING',
    info: 'ℹ️ INFORMATION',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${severityColors[alertData.severity]}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
        .detail { margin: 10px 0; padding: 10px; background: white; border-left: 4px solid ${severityColors[alertData.severity]}; }
        .label { font-weight: bold; color: #4b5563; }
        .value { color: #1f2937; }
        .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${severityLabels[alertData.severity]}</h1>
        </div>
        <div class="content">
          <p><strong>Dryer ID:</strong> ${alertData.dryerId}</p>
          <p><strong>Alert Type:</strong> ${alertData.alertType.replace(/_/g, ' ').toUpperCase()}</p>
          
          <div class="detail">
            <p style="margin: 0; font-size: 16px;"><strong>${alertData.message}</strong></p>
          </div>
          
          ${alertData.currentValue !== undefined ? `
            <p><span class="label">Current Value:</span> <span class="value">${alertData.currentValue}</span></p>
          ` : ''}
          
          ${alertData.thresholdValue !== undefined ? `
            <p><span class="label">Threshold:</span> <span class="value">${alertData.thresholdValue}</span></p>
          ` : ''}
          
          <p><span class="label">Time:</span> <span class="value">${alertData.timestamp.toLocaleString()}</span></p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://smartdryers.itedasolutions.com'}/dashboard/alerts" class="button">
            View in Dashboard
          </a>
        </div>
        <div class="footer">
          <p>ITEDA Smart Dryer Platform | smartdryers.itedasolutions.com</p>
          <p>This is an automated alert. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${severityLabels[alertData.severity]}

Dryer ID: ${alertData.dryerId}
Alert Type: ${alertData.alertType.replace(/_/g, ' ').toUpperCase()}

${alertData.message}

${alertData.currentValue !== undefined ? `Current Value: ${alertData.currentValue}` : ''}
${alertData.thresholdValue !== undefined ? `Threshold: ${alertData.thresholdValue}` : ''}
Time: ${alertData.timestamp.toLocaleString()}

View in dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://smartdryers.itedasolutions.com'}/dashboard/alerts
  `.trim();

  return sendEmail({
    to: recipients,
    subject: `${severityLabels[alertData.severity]} - Dryer ${alertData.dryerId}`,
    html,
    text,
  });
}

/**
 * Send daily summary email
 */
export async function sendDailySummaryEmail(
  recipients: string[],
  summaryData: {
    date: Date;
    totalDryers: number;
    activeDryers: number;
    offlineDryers: number;
    newAlerts: number;
    criticalAlerts: number;
  }
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .stat { display: inline-block; width: 45%; margin: 10px 2%; padding: 15px; background: white; border-radius: 6px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; color: #3B82F6; }
        .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">📊 Daily Summary</h1>
          <p style="margin: 5px 0 0 0;">${summaryData.date.toLocaleDateString()}</p>
        </div>
        <div class="content">
          <div class="stat">
            <div class="stat-value">${summaryData.totalDryers}</div>
            <div class="stat-label">Total Dryers</div>
          </div>
          <div class="stat">
            <div class="stat-value">${summaryData.activeDryers}</div>
            <div class="stat-label">Active</div>
          </div>
          <div class="stat">
            <div class="stat-value">${summaryData.offlineDryers}</div>
            <div class="stat-label">Offline</div>
          </div>
          <div class="stat">
            <div class="stat-value" style="color: ${summaryData.criticalAlerts > 0 ? '#DC2626' : '#10B981'};">${summaryData.newAlerts}</div>
            <div class="stat-label">New Alerts</div>
          </div>
        </div>
        <div class="footer">
          <p>ITEDA Smart Dryer Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: recipients,
    subject: `Daily Summary - ${summaryData.date.toLocaleDateString()}`,
    html,
  });
}
