import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Create reusable transporter — lazily initialized
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
    auth: {
      user: env.email.user,
      pass: env.email.password,
    },
  });

  return _transporter;
}

/**
 * Sends an admin notification email when a new contact enquiry is received.
 * This is non-blocking — failures are logged but do NOT remove the saved enquiry.
 */
export async function sendEnquiryNotification(contact) {
  const { adminEmail, from } = env.email;

  if (!adminEmail || !env.email.user) {
    console.warn('[Email] Email not configured — skipping notification.');
    return;
  }

  const receivedAt = new Date(contact.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
      <div style="background:#050b1a;padding:28px 32px;border-bottom:3px solid #4f7bff">
        <h1 style="color:#ffffff;font-size:18px;margin:0;letter-spacing:4px;text-transform:uppercase">PIXLENOVA</h1>
        <p style="color:#8fb0ff;margin:6px 0 0;font-size:13px">New Contact Enquiry</p>
      </div>
      <div style="background:#f8f9fc;padding:32px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:10px 0;font-size:13px;color:#6b7280;width:90px;vertical-align:top">Name</td>
            <td style="padding:10px 0;font-size:15px;font-weight:600;color:#111827">${escapeHtml(contact.name)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:13px;color:#6b7280;vertical-align:top">Email</td>
            <td style="padding:10px 0;font-size:15px;color:#111827">
              <a href="mailto:${escapeHtml(contact.email)}" style="color:#4f7bff">${escapeHtml(contact.email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:13px;color:#6b7280;vertical-align:top">Received</td>
            <td style="padding:10px 0;font-size:14px;color:#6b7280">${receivedAt} IST</td>
          </tr>
        </table>
        <div style="margin-top:24px;padding:20px;background:#fff;border:1px solid #e5e7eb;border-radius:6px">
          <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Message</p>
          <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap">${escapeHtml(contact.message)}</p>
        </div>
        <div style="margin-top:24px;text-align:center">
          <a href="mailto:${escapeHtml(contact.email)}?subject=Re: Your enquiry to PixleNova"
             style="display:inline-block;background:#050b1a;color:#fff;padding:12px 28px;border-radius:24px;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:1px">
            Reply to ${escapeHtml(contact.name)}
          </a>
        </div>
      </div>
      <div style="background:#f1f3f8;padding:16px 32px;text-align:center">
        <p style="margin:0;font-size:12px;color:#9ca3af">
          Enquiry ID: ${contact.id} — PixleNova Backend
        </p>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from,
      to: adminEmail,
      subject: `[PixleNova] New enquiry from ${contact.name}`,
      text: `New enquiry from ${contact.name} (${contact.email})\n\n${contact.message}\n\nReceived: ${receivedAt}`,
      html,
    });

    console.log(`[Email] Admin notification sent for enquiry ${contact.id}`);
  } catch (err) {
    // Non-fatal — enquiry is already safely stored in the database
    console.error(`[Email] Failed to send notification for enquiry ${contact.id}:`, err.message);
  }
}

/**
 * Sends an acknowledgement to the visitor.
 * Non-blocking — failures are logged only.
 */
export async function sendAcknowledgement(contact) {
  const { from } = env.email;

  if (!env.email.user) {
    return;
  }

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#050b1a;padding:28px 32px;border-bottom:3px solid #4f7bff">
        <h1 style="color:#ffffff;font-size:18px;margin:0;letter-spacing:4px;text-transform:uppercase">PIXLENOVA</h1>
      </div>
      <div style="background:#f8f9fc;padding:40px 32px">
        <p style="margin:0 0 16px;font-size:16px;color:#111827">Hi ${escapeHtml(contact.name)},</p>
        <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7">
          Thank you for reaching out to PixleNova.
          We've received your enquiry and will review it shortly.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7">
          We'll be in touch soon.
        </p>
        <p style="margin:24px 0 0;font-size:14px;color:#6b7280">The PixleNova Team</p>
      </div>
      <div style="background:#f1f3f8;padding:16px 32px;text-align:center">
        <p style="margin:0;font-size:12px;color:#9ca3af">PixleNova — Digital Creativity</p>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from,
      to: contact.email,
      subject: 'We received your enquiry — PixleNova',
      text: `Hi ${contact.name},\n\nThank you for reaching out to PixleNova. We've received your enquiry and will review it shortly.\n\nThe PixleNova Team`,
      html,
    });
  } catch (err) {
    console.error(`[Email] Failed to send acknowledgement to ${contact.email}:`, err.message);
  }
}

// Basic HTML escaping to prevent XSS in email body
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
