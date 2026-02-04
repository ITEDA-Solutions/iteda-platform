// Email Notification Service
// Handles sending email notifications for alerts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface AlertEmailData {
  dryerId: string;
  dryerName: string;
  alertType: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  currentValue?: number;
  threshold?: number;
  timestamp: string;
  dashboardUrl: string;
}

/**
 * Send alert notification email
 */
export async function sendAlertEmail(
  recipients: EmailRecipient[],
  alertData: AlertEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured - skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'ITEDA Alerts <alerts@itedasolutions.com>',
      to: recipients.map(r => r.email),
      subject: getEmailSubject(alertData),
      html: generateAlertEmailHTML(alertData),
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    console.log('Alert email sent:', data);
    return { success: true };
  } catch (error: any) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate email subject based on alert severity
 */
function getEmailSubject(alertData: AlertEmailData): string {
  const prefix = alertData.severity === 'critical' ? '🚨 CRITICAL' : 
                 alertData.severity === 'warning' ? '⚠️ WARNING' : 'ℹ️ INFO';
  
  return `${prefix}: ${alertData.dryerName} - ${alertData.alertType.replace(/_/g, ' ').toUpperCase()}`;
}

/**
 * Generate HTML email template
 */
function generateAlertEmailHTML(alertData: AlertEmailData): string {
  const severityColor = alertData.severity === 'critical' ? '#dc2626' :
                        alertData.severity === 'warning' ? '#f59e0b' : '#3b82f6';
  
  const severityBg = alertData.severity === 'critical' ? '#fee2e2' :
                     alertData.severity === 'warning' ? '#fef3c7' : '#dbeafe';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alert Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">
                      ITEDA Solutions
                    </h1>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">
                      Solar Dryer Management Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert Badge -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="background-color: ${severityBg}; border-left: 4px solid ${severityColor}; padding: 16px; border-radius: 4px;">
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: ${severityColor}; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${alertData.severity} Alert
                </p>
              </div>
            </td>
          </tr>

          <!-- Alert Details -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #111827;">
                ${alertData.message}
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 14px; color: #6b7280;">Dryer ID:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; font-weight: 600; color: #111827;">${alertData.dryerName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 14px; color: #6b7280;">Alert Type:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; font-weight: 600; color: #111827;">${alertData.alertType.replace(/_/g, ' ').toUpperCase()}</span>
                  </td>
                </tr>
                ${alertData.currentValue !== undefined ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 14px; color: #6b7280;">Current Value:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; font-weight: 600; color: ${severityColor};">${alertData.currentValue}</span>
                  </td>
                </tr>
                ` : ''}
                ${alertData.threshold !== undefined ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 14px; color: #6b7280;">Threshold:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; font-weight: 600; color: #111827;">${alertData.threshold}</span>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="font-size: 14px; color: #6b7280;">Time:</span>
                  </td>
                  <td style="padding: 12px 0; text-align: right;">
                    <span style="font-size: 14px; font-weight: 600; color: #111827;">${new Date(alertData.timestamp).toLocaleString()}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${alertData.dashboardUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      View in Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
                This is an automated alert from ITEDA Solutions IoT Platform.<br>
                To manage your notification preferences, visit your dashboard settings.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer Links -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td align="center">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} ITEDA Solutions. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send daily summary email
 */
export async function sendDailySummaryEmail(
  recipients: EmailRecipient[],
  summaryData: {
    date: string;
    totalDryers: number;
    activeDryers: number;
    offlineDryers: number;
    totalAlerts: number;
    criticalAlerts: number;
    dashboardUrl: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'ITEDA Reports <reports@itedasolutions.com>',
      to: recipients.map(r => r.email),
      subject: `Daily Summary - ${summaryData.date}`,
      html: generateDailySummaryHTML(summaryData),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate daily summary HTML
 */
function generateDailySummaryHTML(summaryData: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Daily Summary</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 40px 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px;">
    <h1 style="color: #111827; margin-bottom: 20px;">Daily Summary - ${summaryData.date}</h1>
    
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
      <h2 style="color: #374151; font-size: 16px; margin-bottom: 15px;">Fleet Overview</h2>
      <p style="margin: 8px 0;"><strong>Total Dryers:</strong> ${summaryData.totalDryers}</p>
      <p style="margin: 8px 0;"><strong>Active:</strong> ${summaryData.activeDryers}</p>
      <p style="margin: 8px 0;"><strong>Offline:</strong> ${summaryData.offlineDryers}</p>
    </div>

    <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
      <h2 style="color: #92400e; font-size: 16px; margin-bottom: 15px;">Alerts</h2>
      <p style="margin: 8px 0;"><strong>Total Alerts:</strong> ${summaryData.totalAlerts}</p>
      <p style="margin: 8px 0;"><strong>Critical:</strong> ${summaryData.criticalAlerts}</p>
    </div>

    <div style="text-align: center;">
      <a href="${summaryData.dashboardUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600;">
        View Dashboard
      </a>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(testEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY not configured in environment variables' };
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'ITEDA Test <test@itedasolutions.com>',
      to: [testEmail],
      subject: 'ITEDA Platform - Email Configuration Test',
      html: '<h1>Email Configuration Test</h1><p>If you received this email, your email configuration is working correctly!</p>',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
