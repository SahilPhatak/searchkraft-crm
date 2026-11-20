const nodemailer = require('nodemailer');
const supabase = require('../config/supabase');

// ── Transporter ────────────────────────────────────────────────
function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL, SMTP_FROM_NAME } = process.env;
  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) {
    throw new Error('SMTP credentials not configured. Set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD env vars.');
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: parseInt(SMTP_PORT || '587') === 465,
    auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD },
  });
}

const FROM = () => `"${process.env.SMTP_FROM_NAME || 'SearchKraft CRM'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USERNAME}>`;

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
      <td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#374151;width:40%;border-bottom:1px solid #e5e7eb;">${label}</td>
      <td style="padding:8px 12px;color:#111827;border-bottom:1px solid #e5e7eb;">${esc(value)}</td>
    </tr>`;
  const section = (title) => `
    <tr><td colspan="2" style="padding:12px;background:#1e3a5f;color:#fff;font-weight:700;font-size:14px;letter-spacing:0.5px;">${title}</td></tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:#1e3a5f;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">SearchKraft CRM</h1>
      <p style="color:#93c5fd;margin:6px 0 0;">New Deal Created</p>
    </div>
    <div style="padding:20px;">
      <p style="color:#374151;font-size:15px;">Hi Accounts Team,</p>
      <p style="color:#6b7280;">A new deal has been created in SearchKraft CRM. Please find the details below.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-top:16px;">
        ${section('DEAL INFORMATION')}
        ${row('Deal Name', deal.name || deal.title)}
        ${row('Company / Account', deal.company || deal.company_name)}
        ${row('Deal Owner', deal.owner || deal.deal_owner)}
        ${row('Amount', fmt(deal.amount || deal.value))}
        ${row('Closing Date', deal.close_date)}
        ${row('Stage', deal.stage)}
        ${row('Type', deal.deal_type || deal.type)}
        ${row('Probability (%)', deal.probability != null ? deal.probability + '%' : null)}
        ${row('Expected Revenue', fmt(deal.expected_revenue))}
        ${row('Next Step', deal.next_step)}
        ${row('Source', deal.source || deal.lead_source)}
        ${row('Campaign', deal.campaign || deal.campaign_source)}
        ${row('Contact Name', deal.contact_name)}
        ${row('Candidate Name', deal.candidate_name)}
        ${section('RECRUITMENT DETAILS')}
        ${row('Recruiter Name', deal.recruiter_name)}
        ${row('Client SPOC', deal.client_spoc)}
        ${row('Sourcer', deal.sourcer)}
        ${row('Credit Sharing (%)', deal.credit_sharing != null ? deal.credit_sharing + '%' : null)}
        ${row('Candidate Management', deal.candidate_mgmt || deal.candidate_management)}
        ${section('DESCRIPTION INFORMATION')}
        ${row('Description', deal.description || deal.notes)}
      </table>
    </div>
    <div style="padding:16px;background:#f9fafb;text-align:center;color:#9ca3af;font-size:12px;">
      SearchKraft CRM · This is an automated notification
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
  const ACCOUNTS_EMAIL = 'vikram@searchkraft.in';
  const subject = `New Deal Created – ${deal.company || deal.company_name || deal.name || deal.title} | SearchKraft CRM`;

  // Log pending first
  const { data: log } = await supabase.from('email_notifications').insert({
    deal_id: deal.id,
    notification_type: 'deal_created',
    recipient_email: ACCOUNTS_EMAIL,
    subject,
    status: 'pending',
  }).select().single();

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM(), to: ACCOUNTS_EMAIL, subject,
      html: dealCreatedHtml(deal),
    });
    if (log) await updateNotificationStatus(log.id, 'sent');
    console.log(`[Email] deal_created sent to ${ACCOUNTS_EMAIL} for deal ${deal.id}`);
  } catch (err) {
    console.error(`[Email] deal_created failed for deal ${deal.id}:`, err.message);
    if (log) await updateNotificationStatus(log.id, 'failed', err.message);
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
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM(), to: recipientEmail, subject,
      html: dealWonHtml(deal, deliveryName),
    });
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

// ── Account Assigned Email Template ───────────────────────────
function accountAssignedHtml(company, deliveryName) {
  const row = (label, value) => `
    <tr>
      <td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#374151;width:40%;border-bottom:1px solid #e5e7eb;">${label}</td>
      <td style="padding:8px 12px;color:#111827;border-bottom:1px solid #e5e7eb;">${esc(value)}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:#1e3a5f;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">SearchKraft CRM</h1>
      <p style="color:#93c5fd;margin:6px 0 0;">New Account Assigned to You 🏢</p>
    </div>
    <div style="padding:24px;">
      <p style="color:#374151;font-size:15px;">Hi ${esc(deliveryName)},</p>
      <p style="color:#6b7280;">A new account has been created in SearchKraft CRM and assigned to you as the Delivery Pillar. Please review the client details below and begin onboarding.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-top:16px;">
        <tr><td colspan="2" style="padding:12px;background:#1e3a5f;color:#fff;font-weight:700;font-size:14px;letter-spacing:0.5px;">ACCOUNT DETAILS</td></tr>
        ${row('Company Name', company.name)}
        ${row('Industry', company.industry)}
        ${row('Website', company.website)}
        ${row('Phone', company.phone)}
        ${row('Email', company.email)}
        ${row('City', company.city)}
        ${row('State', company.state)}
        ${row('Country', company.country)}
        ${row('Account Type', company.type)}
        ${row('Description', company.description)}
      </table>
      <p style="color:#1e3a5f;font-weight:600;margin-top:20px;">You have been assigned as the Delivery Pillar for this account. Please initiate the client onboarding process.</p>
    </div>
    <div style="padding:16px;background:#f9fafb;text-align:center;color:#9ca3af;font-size:12px;">
      SearchKraft CRM · This is an automated notification
    </div>
  </div>
</body></html>`;
}

/**
 * Send "new account assigned" email to delivery pillar.
 * Fire-and-forget — never throws, always logs.
 * Uses company_id as the reference in email_notifications (stored in deal_id column).
 */
async function sendAccountAssignedEmail(company) {
  if (!company.delivery_pillar_id && !company.delivery_pillar) return;

  // Fetch delivery pillar user's email from profiles
  let recipientEmail = null;
  let deliveryName = company.delivery_pillar || 'Delivery Team';

  if (company.delivery_pillar_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', company.delivery_pillar_id)
      .maybeSingle();
    if (profile) {
      recipientEmail = profile.email;
      deliveryName = profile.full_name || deliveryName;
    }
  }

  // Fallback: try to find by name string
  if (!recipientEmail && company.delivery_pillar) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .ilike('full_name', company.delivery_pillar)
      .maybeSingle();
    if (profile) recipientEmail = profile.email;
  }

  if (!recipientEmail) {
    console.warn(`[Email] account_assigned: no email found for delivery pillar on company ${company.id}`);
    return;
  }

  const subject = `New Account Assigned – ${company.name} | SearchKraft CRM`;

  // Log pending
  const { data: log } = await supabase.from('email_notifications').insert({
    deal_id: company.id,           // reuse deal_id column to store company id as reference
    notification_type: 'account_assigned',
    recipient_email: recipientEmail,
    subject,
    status: 'pending',
  }).select().single();

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM(), to: recipientEmail, subject,
      html: accountAssignedHtml(company, deliveryName),
    });
    if (log) await updateNotificationStatus(log.id, 'sent');
    console.log(`[Email] account_assigned sent to ${recipientEmail} for company ${company.id}`);
  } catch (err) {
    console.error(`[Email] account_assigned failed for company ${company.id}:`, err.message);
    if (log) await updateNotificationStatus(log.id, 'failed', err.message);
  }
}

module.exports = { sendDealCreatedEmail, sendDealWonEmail, sendAccountAssignedEmail, retryNotification };
