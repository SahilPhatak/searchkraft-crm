const { Resend } = require('resend');
const supabase = require('../config/supabase');

// ── Startup check ──────────────────────────────────────────────
(function checkEmailEnv() {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email] ⚠️  RESEND_API_KEY missing — emails will fail');
  } else {
    console.log('[Email] ✅ Resend configured');
  }
})();

// ── Resend client ──────────────────────────────────────────────
function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
  return new Resend(process.env.RESEND_API_KEY);
}

// From address: use verified domain if available, else resend's shared domain
const FROM_ADDR = () => {
  const name = process.env.SMTP_FROM_NAME || 'SearchKraft CRM';
  const email = process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev';
  return `${name} <${email}>`;
};

// ── Helpers ────────────────────────────────────────────────────
function esc(v) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(v) { return v ? `₹${parseFloat(v).toLocaleString('en-IN')}` : '—'; }

// ── Log helpers ────────────────────────────────────────────────
async function logNotification({ deal_id, notification_type, recipient_email, subject, status, error_message }) {
  const { error } = await supabase.from('email_notifications').insert({
    deal_id, notification_type, recipient_email, subject, status,
    error_message: error_message || null,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
  });
  if (error) console.error('Failed to log email notification:', error.message);
}

async function updateNotificationStatus(id, status, error_message) {
  await supabase.from('email_notifications').update({
    status, error_message: error_message || null,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
}

// ── Idempotency check ──────────────────────────────────────────
async function alreadySent(deal_id, notification_type) {
  const { data } = await supabase
    .from('email_notifications')
    .select('id')
    .eq('deal_id', deal_id)
    .eq('notification_type', notification_type)
    .eq('status', 'sent')
    .maybeSingle();
  return !!data;
}

// ── Email Templates ────────────────────────────────────────────
function dealCreatedHtml(deal) {
  const row = (label, value) => `
    <tr>
      <td style="font-family:Arial,sans-serif;padding:9px 14px;background:#f9fafb;font-weight:700;font-size:13px;color:#1e3a5f;width:38%;border-bottom:1px solid #e5e7eb;">${label}</td>
      <td style="font-family:Arial,sans-serif;padding:9px 14px;font-size:13px;color:#111827;border-bottom:1px solid #e5e7eb;">${esc(value)}</td>
    </tr>`;

  const amountRow = (label, value) => `
    <tr>
      <td style="font-family:Arial,sans-serif;padding:9px 14px;background:#dbeafe;font-weight:700;font-size:13px;color:#1e3a5f;width:38%;border-bottom:1px solid #bfdbfe;">${label}</td>
      <td style="font-family:Arial,sans-serif;padding:9px 14px;font-size:13px;font-weight:700;color:#1d4ed8;background:#dbeafe;border-bottom:1px solid #bfdbfe;">${esc(value)}</td>
    </tr>`;

  const section = (title) => `
    <tr><td colspan="2" style="font-family:Arial,sans-serif;padding:10px 14px;background:#1e3a5f;color:#fff;font-weight:700;font-size:13px;letter-spacing:0.8px;">${title}</td></tr>`;

  const stage      = deal.stage || '—';
  const candidate  = deal.candidate_name || deal.candidateName || '—';
  const dealName   = deal.name || deal.title || '—';
  const company    = deal.company_name || deal.company || deal.companyName || '—';
  const owner      = deal.owner || deal.deal_owner || '—';
  const amount     = fmt(deal.amount);
  const expRev     = fmt(deal.expected_revenue);
  const closeDate  = deal.close_date || deal.closeDate || '—';
  const prob       = deal.probability != null ? deal.probability + '%' : '—';
  const source     = deal.campaign || deal.source || '—';
  const clientPoc  = deal.client_poc || deal.clientPoc || '—';
  const clientPocEmail = deal.client_poc_email || deal.clientPocEmail || '—';
  const clientPocDesig = deal.client_poc_designation || deal.clientPocDesignation || '—';
  const recruiter  = deal.recruiter_name || deal.recruiterName || '—';
  const clientSpoc = deal.client_spoc || deal.clientSpoc || '—';
  const sourcer    = deal.sourcer || '—';
  const creditSharing = deal.credit_sharing != null ? deal.credit_sharing + '%' : '—';
  const candMgmt   = deal.candidate_mgmt || deal.candidateMgmt || deal.candidate_management || '—';

  const sectionHeader = (icon, title) => `
    <tr><td colspan="2" style="padding:0">
      <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:10px 16px;margin-top:16px;">
        <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#1e40af;">${icon} ${title}</span>
      </div>
    </td></tr>`;

  const detailRow = (label, value) => `
    <tr>
      <td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #f3f4f6;">${label}</td>
      <td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;color:#111827;font-weight:500;border-bottom:1px solid #f3f4f6;">${esc(value)}</td>
    </tr>`;

  const amountDetailRow = (label, value) => `
    <tr>
      <td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #f3f4f6;">${label}</td>
      <td style="font-family:Arial,sans-serif;padding:9px 16px;font-size:13px;color:#2563eb;font-weight:700;border-bottom:1px solid #f3f4f6;">${esc(value)}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">

    <!-- Header -->
    <div style="background:#1e3a8a;padding:28px 24px;text-align:center;">
      <h1 style="font-family:Arial,sans-serif;color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:1px;">SearchKraft CRM</h1>
      <p style="font-family:Arial,sans-serif;color:#93c5fd;margin:6px 0 0;font-size:13px;">Recruitment Management System</p>
    </div>

    <!-- Badge -->
    <div style="text-align:center;padding:20px 24px 0;">
      <span style="display:inline-block;background:#fef3c7;color:#92400e;font-family:Arial,sans-serif;font-size:12px;font-weight:700;padding:6px 18px;border-radius:20px;letter-spacing:0.8px;">&#128204; NEW DEAL CREATED</span>
    </div>

    <div style="padding:20px 24px 24px;">
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#374151;margin:16px 0 4px;">Hi Team,</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#6b7280;margin:0 0 20px;">A new deal has been created in SearchKraft CRM. Please find the details below.</p>

      <!-- Details Table -->
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">

        ${sectionHeader('👤', 'Candidate Details')}
        ${detailRow('Candidate Name', candidate)}
        ${detailRow('Deal Name', dealName)}
        ${detailRow('Company / Account', company)}
        ${detailRow('Stage', stage)}

        ${sectionHeader('💼', 'Deal Details')}
        ${amountDetailRow('Amount', amount)}
        ${detailRow('Expected Revenue', expRev)}
        ${detailRow('Probability', prob)}
        ${detailRow('Close Date', closeDate)}
        ${detailRow('Source', source)}

        ${sectionHeader('🏢', 'Client Contact Details')}
        ${detailRow('Client POC', clientPoc)}
        ${detailRow('Email ID', clientPocEmail)}
        ${detailRow('Designation', clientPocDesig)}

        ${sectionHeader('🔍', 'Internal Details')}
        ${detailRow('Deal Owner', owner)}
        ${detailRow('Recruiter Name', recruiter)}
        ${detailRow('Client SPOC', clientSpoc)}
        ${detailRow('Sourcer', sourcer)}
        ${detailRow('Credit Sharing (%)', creditSharing)}
        ${detailRow('Candidate Management', candMgmt)}

      </table>

      <!-- CTA Button -->
      <div style="text-align:center;margin-top:24px;">
        <a href="https://searchkraft-crm.vercel.app/#/deals" style="display:inline-block;background:#2563eb;color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">View Deal in CRM →</a>
      </div>

    </div>

    <!-- Footer -->
    <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="font-family:Arial,sans-serif;font-size:11px;color:#9ca3af;margin:0;">This is an auto-generated notification from SearchKraft CRM.</p>
      <p style="font-family:Arial,sans-serif;font-size:11px;color:#9ca3af;margin:4px 0 0;">© ${new Date().getFullYear()} SearchKraft. All rights reserved.</p>
    </div>

  </div>
</body></html>`;
}

function dealWonHtml(deal, deliveryName) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:#166534;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">SearchKraft CRM</h1>
      <p style="color:#bbf7d0;margin:6px 0 0;">New Client Onboarded 🎉</p>
    </div>
    <div style="padding:24px;">
      <p style="color:#374151;font-size:15px;">Hi ${esc(deliveryName)},</p>
      <p style="color:#6b7280;">A new client has been successfully onboarded in SearchKraft CRM. Please take the necessary steps to initiate the delivery process.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-top:16px;">
        <tr><td colspan="2" style="padding:12px;background:#166534;color:#fff;font-weight:700;font-size:14px;">CLIENT DETAILS</td></tr>
        <tr><td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#374151;width:45%;border-bottom:1px solid #e5e7eb;">Client Name</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(deal.company_name)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Deal Name</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(deal.title)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Deal Owner</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(deal.deal_owner)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Client SPOC</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(deal.client_spoc)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Recruiter Name</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(deal.recruiter_name)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Assigned Delivery Pillar</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(deliveryName)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Deal Amount</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${fmt(deal.amount)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#374151;">Closing Date</td><td style="padding:8px 12px;">${esc(deal.close_date)}</td></tr>
      </table>
      <p style="color:#166534;font-weight:600;margin-top:20px;">The deal has been marked as Won. Please initiate the delivery process.</p>
    </div>
    <div style="padding:16px;background:#f9fafb;text-align:center;color:#9ca3af;font-size:12px;">
      SearchKraft CRM · This is an automated notification
    </div>
  </div>
</body></html>`;
}

// ── Public functions ───────────────────────────────────────────

/**
 * Send "new deal created" email to accounts team.
 * Fire-and-forget — never throws, always logs.
 */
async function sendDealCreatedEmail(deal) {
  const RECIPIENTS = ['vikram@searchkraft.in', 'finance@searchkraft.in'];
  const stage     = deal.stage || '';
  const candidate = deal.candidate_name || deal.candidateName || '';
  const dealName  = deal.name || deal.title || '';
  const company   = deal.company_name || deal.company || deal.companyName || '';
  const subjectParts = [stage, candidate, dealName, company].filter(Boolean);
  const subject = subjectParts.join(' | ');
  const html = dealCreatedHtml(deal);

  // Log + send for each recipient
  for (const recipient of RECIPIENTS) {
    const { data: log } = await supabase.from('email_notifications').insert({
      deal_id: deal.id,
      notification_type: 'deal_created',
      recipient_email: recipient,
      subject,
      status: 'pending',
    }).select().single();

    try {
      const resend = getResend();
      const { error: sendErr } = await resend.emails.send({ from: FROM_ADDR(), to: recipient, subject, html });
      if (sendErr) throw new Error(sendErr.message || JSON.stringify(sendErr));
      if (log) await updateNotificationStatus(log.id, 'sent');
      console.log(`[Email] deal_created sent to ${recipient} for deal ${deal.id}`);
    } catch (err) {
      console.error(`[Email] deal_created failed for ${recipient} deal ${deal.id}:`, err.message);
      if (log) await updateNotificationStatus(log.id, 'failed', err.message);
    }
  }
}

/**
 * Send "deal won + delivery pillar assigned" email to delivery person.
 * Checks idempotency — only sends once per deal.
 */
async function sendDealWonEmail(deal) {
  if (deal.stage !== 'Won') return;
  if (!deal.delivery_pillar_id && !deal.delivery_pillar) return;

  // Idempotency — don't double-send
  if (await alreadySent(deal.id, 'deal_won_delivery')) return;

  // Fetch delivery pillar user's email
  let recipientEmail = null;
  let deliveryName = deal.delivery_pillar || 'Delivery Team';

  if (deal.delivery_pillar_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', deal.delivery_pillar_id)
      .maybeSingle();
    if (profile) {
      recipientEmail = profile.email;
      deliveryName = profile.full_name || deliveryName;
    }
  }

  // Fallback: try to find by name
  if (!recipientEmail && deal.delivery_pillar) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .ilike('full_name', deal.delivery_pillar)
      .maybeSingle();
    if (profile) recipientEmail = profile.email;
  }

  if (!recipientEmail) {
    console.warn(`[Email] deal_won_delivery: no email found for delivery pillar on deal ${deal.id}`);
    await logNotification({
      deal_id: deal.id, notification_type: 'deal_won_delivery',
      recipient_email: 'unknown', subject: 'N/A',
      status: 'failed', error_message: 'Delivery pillar email not found in profiles',
    });
    return;
  }

  const subject = `New Client Added – ${deal.company_name || deal.title} | SearchKraft CRM`;
  const { data: log } = await supabase.from('email_notifications').insert({
    deal_id: deal.id, notification_type: 'deal_won_delivery',
    recipient_email: recipientEmail, subject, status: 'pending',
  }).select().single();

  try {
    const resend = getResend();
    const { error: sendErr } = await resend.emails.send({
      from: FROM_ADDR(), to: recipientEmail, subject,
      html: dealWonHtml(deal, deliveryName),
    });
    if (sendErr) throw new Error(sendErr.message || JSON.stringify(sendErr));
    if (log) await updateNotificationStatus(log.id, 'sent');
    console.log(`[Email] deal_won_delivery sent to ${recipientEmail} for deal ${deal.id}`);
  } catch (err) {
    console.error(`[Email] deal_won_delivery failed for deal ${deal.id}:`, err.message);
    if (log) await updateNotificationStatus(log.id, 'failed', err.message);
  }
}

/**
 * Retry a failed notification by ID (admin use).
 */
async function retryNotification(notificationId) {
  const { data: notif } = await supabase
    .from('email_notifications')
    .select('*')
    .eq('id', notificationId)
    .single();
  if (!notif) throw new Error('Notification not found');

  const { data: deal } = await supabase
    .from('deals').select('*').eq('id', notif.deal_id).single();
  if (!deal) throw new Error('Deal not found');

  if (notif.notification_type === 'deal_created') {
    await supabase.from('email_notifications').update({ status: 'pending' }).eq('id', notificationId);
    await sendDealCreatedEmail(deal);
  } else if (notif.notification_type === 'deal_won_delivery') {
    // Reset idempotency by deleting old sent record if exists
    await supabase.from('email_notifications').update({ status: 'pending' }).eq('id', notificationId);
    await sendDealWonEmail(deal);
  }
}

module.exports = { sendDealCreatedEmail, sendDealWonEmail, retryNotification };
