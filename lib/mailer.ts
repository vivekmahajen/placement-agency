import nodemailer from 'nodemailer'

// Shared Gmail SMTP transporter — reused across all sends
let _transporter: nodemailer.Transporter | null = null

export function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }
  return _transporter
}

export interface SendMailOptions {
  to: string
  subject: string
  text: string
  html: string
  replyTo?: string
}

export async function sendMail(opts: SendMailOptions): Promise<{ messageId: string }> {
  const transporter = getTransporter()
  const info = await transporter.sendMail({
    from: `"${process.env.GMAIL_FROM_NAME ?? 'Placement Agency'}" <${process.env.GMAIL_USER}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    replyTo: opts.replyTo,
  })
  return { messageId: info.messageId }
}
