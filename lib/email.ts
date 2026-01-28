/**
 * Email service utility
 * Supports multiple email providers via environment variables
 * Falls back to logging in development
 */

import { log } from './logger'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using the configured email service.
 *
 * Supports Resend, SendGrid, or SMTP based on environment configuration.
 * In development, failures are logged but do not break the user flow.
 * In production, misconfiguration or provider failures will surface
 * as errors so they can be detected and fixed quickly.
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, text } = options

  // Default to "disabled" unless a real provider is explicitly configured.
  // This avoids accidentally thinking emails are being sent when they are not.
  const emailProvider = (process.env.EMAIL_PROVIDER || 'disabled').toLowerCase()

  try {
    switch (emailProvider) {
      case 'resend':
        await sendViaResend(options)
        log.info('📧 Email sent via Resend', { to, subject })
        return

      case 'sendgrid':
        await sendViaSendGrid(options)
        log.info('📧 Email sent via SendGrid', { to, subject })
        return

      case 'smtp':
      case 'nodemailer':
        await sendViaNodemailer(options)
        log.info('📧 Email sent via SMTP', { to, subject })
        return

      case 'ses':
      case 'aws':
        await sendViaSES(options)
        log.info('📧 Email sent via AWS SES', { to, subject })
        return

      case 'disabled':
      case 'log':
        // Fallback to logging only (for development/testing)
        log.info('📧 EMAIL (Logging Only - Email Service Disabled)', {
          to,
          subject,
          body: text || html.substring(0, 200) + '...',
        })
        return

      default:
        throw new Error(
          `Unknown email provider: ${emailProvider}. Set EMAIL_PROVIDER to 'resend', 'sendgrid', 'smtp', 'ses', or 'disabled'`,
        )
    }
  } catch (error: any) {
    log.error('Failed to send email', error, {
      to,
      subject,
      provider: emailProvider,
    })

    // In production, surface the error so the calling API can report it to Sentry
    if (process.env.NODE_ENV === 'production') {
      throw error
    }

    // In development, log but don't break the flow
    log.warn('Email sending failed in development mode, continuing anyway', {
      to,
      subject,
      provider: emailProvider,
      error: error?.message,
    })
  }
}

/**
 * Send email via Resend (https://resend.com)
 * Requires: EMAIL_API_KEY (Resend API key), EMAIL_FROM (sender email)
 */
async function sendViaResend(options: EmailOptions): Promise<void> {
  const apiKey = process.env.EMAIL_API_KEY
  if (!apiKey) {
    throw new Error('EMAIL_API_KEY is required for Resend. Get your API key from https://resend.com/api-keys')
  }

  const fromEmail = process.env.EMAIL_FROM
  if (!fromEmail) {
    throw new Error('EMAIL_FROM is required. Set it to your verified sender email (e.g., noreply@yourdomain.com)')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Resend API error (${response.status})`
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.message || errorMessage
    } catch {
      errorMessage = errorText || errorMessage
    }
    throw new Error(errorMessage)
  }
}

/**
 * Send email via SendGrid
 * Requires: EMAIL_API_KEY (SendGrid API key), EMAIL_FROM (sender email)
 */
async function sendViaSendGrid(options: EmailOptions): Promise<void> {
  const apiKey = process.env.EMAIL_API_KEY
  if (!apiKey) {
    throw new Error('EMAIL_API_KEY is required for SendGrid. Get your API key from https://app.sendgrid.com/settings/api_keys')
  }

  const fromEmail = process.env.EMAIL_FROM
  if (!fromEmail) {
    throw new Error('EMAIL_FROM is required. Set it to your verified sender email (e.g., noreply@yourdomain.com)')
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: fromEmail },
      subject: options.subject,
      content: [
        { type: 'text/html', value: options.html },
        ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `SendGrid API error (${response.status})`
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.errors?.[0]?.message || errorMessage
    } catch {
      errorMessage = errorText || errorMessage
    }
    throw new Error(errorMessage)
  }
}

/**
 * Send email via AWS SES
 * Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
 */
async function sendViaSES(options: EmailOptions): Promise<void> {
  // AWS SES requires AWS SDK
  // This is a placeholder - you'd need to install @aws-sdk/client-ses
  throw new Error(
    'AWS SES integration requires @aws-sdk/client-ses. Install it and implement sendViaSES.',
  )
}

/**
 * Send email via Nodemailer (SMTP)
 * Requires: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */
async function sendViaNodemailer(options: EmailOptions): Promise<void> {
  // Nodemailer requires the nodemailer package
  // This is a placeholder - you'd need to install nodemailer
  throw new Error(
    'Nodemailer integration requires nodemailer package. Install it and implement sendViaNodemailer.',
  )
}

/**
 * Generate email verification email content
 */
export function generateVerificationEmail(verificationLink: string, userName?: string): {
  subject: string
  html: string
  text: string
} {
  const name = userName || 'there'
  return {
    subject: 'Verify Your Email Address - Lei Indias',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Welcome to Lei Indias!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for registering with Lei Indias. Please verify your email address by clicking the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationLink}</p>
          <p>This link will expire in 7 days.</p>
          <p>If you didn't create an account with us, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">Lei Indias - Industrial Connectors & Solutions</p>
        </body>
      </html>
    `,
    text: `Welcome to Lei Indias!\n\nHi ${name},\n\nThank you for registering with Lei Indias. Please verify your email address by visiting:\n\n${verificationLink}\n\nThis link will expire in 7 days.\n\nIf you didn't create an account with us, please ignore this email.\n\n---\nLei Indias - Industrial Connectors & Solutions`,
  }
}

/**
 * Generate password reset email content
 */
export function generatePasswordResetEmail(resetLink: string, userName?: string): {
  subject: string
  html: string
  text: string
} {
  const name = userName || 'there'
  return {
    subject: 'Password Reset Request - Lei Indias',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">Lei Indias - Industrial Connectors & Solutions</p>
        </body>
      </html>
    `,
    text: `Password Reset Request\n\nHi ${name},\n\nWe received a request to reset your password. Visit the following link to reset it:\n\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email. Your password will remain unchanged.\n\n---\nLei Indias - Industrial Connectors & Solutions`,
  }
}
