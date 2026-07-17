/**
 * Vercel Serverless Function — Gloryn Custom booking form handler
 * Route: POST /api/booking
 *
 * Emails booking requests to gloryncustom@gmail.com via Resend.
 * Set these environment variables in your Vercel project:
 *   RESEND_API_KEY   – your Resend API key (https://resend.com)
 *   BOOKING_TO       – (optional) destination email, defaults to gloryncustom@gmail.com
 *   BOOKING_FROM     – (optional) verified sender, defaults to onboarding@resend.dev
 *
 * If RESEND_API_KEY is not set, the function still returns 200 and logs the
 * submission, so the form never breaks in front of a customer while you finish setup.
 */

function esc(s = '') {
  return String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Vercel parses JSON bodies automatically; guard just in case.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const { service, name, phone, email, car, location, date, message } = body;

  // Basic validation
  if (!name || !email || !phone || !service || !location) {
    return res.status(400).json({ ok: false, error: 'Missing required fields.' });
  }
  // Honeypot / sanity on email
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email.' });
  }

  const TO = process.env.BOOKING_TO || 'gloryncustom@gmail.com';
  const FROM = process.env.BOOKING_FROM || 'Gloryn Custom <onboarding@resend.dev>';
  const KEY = process.env.RESEND_API_KEY;

  const summary =
    `New booking request\n\n` +
    `Service:   ${service}\n` +
    `Name:      ${name}\n` +
    `Phone:     ${phone}\n` +
    `Email:     ${email}\n` +
    `Car:       ${car || '—'}\n` +
    `Location:  ${location}\n` +
    `Date:      ${date || '—'}\n` +
    `Message:   ${message || '—'}\n`;

  // If no email provider configured yet, don't fail the customer.
  if (!KEY) {
    console.log('[booking] (no RESEND_API_KEY set) ' + summary.replace(/\n/g, ' | '));
    return res.status(200).json({ ok: true, delivered: false });
  }

  try {
    const html =
      `<h2 style="font-family:sans-serif">New booking request — Gloryn Custom</h2>` +
      `<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">` +
      [['Service', service], ['Name', name], ['Phone', phone], ['Email', email],
       ['Car', car], ['Location', location], ['Preferred date', date], ['Message', message]]
        .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#888">${k}</td><td style="padding:4px 0">${esc(v || '—')}</td></tr>`)
        .join('') +
      `</table>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `New booking: ${service} — ${name}`,
        text: summary,
        html
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('[booking] Resend error', r.status, detail);
      return res.status(502).json({ ok: false, error: 'Email provider error.' });
    }

    return res.status(200).json({ ok: true, delivered: true });
  } catch (err) {
    console.error('[booking] exception', err);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
}
