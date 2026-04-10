const logger = require('./logger');
const { sendTwilioMessage } = require('./twilio');

const truthy = (value) => {
  if (value === true) return true;
  const v = String(value || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
};

const normalizePhone = (raw, defaultCountryCode) => {
  const input = String(raw || '').trim();
  if (!input) return null;

  // Already E.164-ish
  if (input.startsWith('+')) {
    const cleaned = `+${input.slice(1).replace(/[^\d]/g, '')}`;
    if (cleaned.length >= 8 && cleaned.length <= 16) return cleaned;
    return null;
  }

  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return null;

  // If it looks like a full number without +, try adding it
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;

  // Local 10-digit number; add default country code if provided
  if (digits.length === 10 && defaultCountryCode && String(defaultCountryCode).trim().startsWith('+')) {
    return `${String(defaultCountryCode).trim()}${digits}`;
  }

  return null;
};

const mapWithConcurrency = async (items, concurrency, fn) => {
  const results = new Array(items.length);
  let index = 0;

  const workers = new Array(Math.min(concurrency, items.length)).fill(null).map(async () => {
    while (index < items.length) {
      const current = index++;
      try {
        results[current] = await fn(items[current], current);
      } catch (e) {
        results[current] = e;
      }
    }
  });

  await Promise.all(workers);
  return results;
};

const sendSmsAndWhatsappToRecipients = async ({ recipients, title, message, senderName, className }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const smsFrom = process.env.TWILIO_SMS_FROM;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
  const defaultCountryCode = process.env.PHONE_DEFAULT_COUNTRY_CODE;

  const smsEnabled = truthy(process.env.PARENTS_SMS_ENABLED) || Boolean(smsFrom);
  const whatsappEnabled = truthy(process.env.PARENTS_WHATSAPP_ENABLED) || Boolean(whatsappFrom);

  if (!accountSid || !authToken) {
    logger.warn('Parent messaging skipped: Twilio not configured');
    return { skipped: true, reason: 'Twilio not configured' };
  }
  if (!smsEnabled && !whatsappEnabled) {
    logger.info('Parent messaging skipped: Messaging disabled');
    return { skipped: true, reason: 'Messaging disabled' };
  }

  const recipientList = Array.isArray(recipients) ? recipients : [];
  if (!recipientList.length) {
    logger.info('Parent messaging skipped: No recipients');
    return { skipped: true, reason: 'No recipients' };
  }

  const body = [
    String(title || '').trim(),
    String(message || '').trim(),
    senderName ? `- ${String(senderName).trim()}` : null,
    className ? `Class: ${String(className).trim()}` : null
  ].filter(Boolean).join('\n');

  const sendToRecipient = async (recipient) => {
    const normalized = normalizePhone(recipient?.parentPhone, defaultCountryCode);
    if (!normalized) return { recipientId: recipient?.id, skipped: true, reason: 'Invalid phone' };

    const tasks = [];

    if (smsEnabled && smsFrom) {
      tasks.push(
        sendTwilioMessage({
          accountSid,
          authToken,
          to: normalized,
          from: smsFrom,
          body
        }).then(() => ({ channel: 'sms', ok: true }))
      );
    }

    if (whatsappEnabled && whatsappFrom) {
      tasks.push(
        sendTwilioMessage({
          accountSid,
          authToken,
          to: `whatsapp:${normalized}`,
          from: whatsappFrom.startsWith('whatsapp:') ? whatsappFrom : `whatsapp:${whatsappFrom}`,
          body
        }).then(() => ({ channel: 'whatsapp', ok: true }))
      );
    }

    if (!tasks.length) return { recipientId: recipient?.id, skipped: true, reason: 'From not configured' };

    const settled = await Promise.allSettled(tasks);
    const failures = settled.filter((s) => s.status === 'rejected');
    if (failures.length) {
      return { recipientId: recipient?.id, ok: false, errors: failures.map((f) => String(f.reason?.message || f.reason || 'failed')) };
    }
    return { recipientId: recipient?.id, ok: true };
  };

  const results = await mapWithConcurrency(recipientList, 5, sendToRecipient);
  const sentOk = results.filter((r) => r && r.ok === true).length;
  const skipped = results.filter((r) => r && r.skipped === true).length;
  const failed = results.filter((r) => r && r.ok === false).length;

  logger.info(`Parent messaging results: ok=${sentOk} skipped=${skipped} failed=${failed}`);
  if (failed) {
    logger.warn('Parent messaging failures', { failed: results.filter((r) => r && r.ok === false).slice(0, 20) });
  }

  return { ok: true, sentOk, skipped, failed };
};

const sendParentSmsAndWhatsapp = async ({ parents, title, message, senderName, className }) => {
  return sendSmsAndWhatsappToRecipients({
    recipients: parents,
    title,
    message,
    senderName,
    className
  });
};

module.exports = { sendParentSmsAndWhatsapp, sendSmsAndWhatsappToRecipients, normalizePhone };
