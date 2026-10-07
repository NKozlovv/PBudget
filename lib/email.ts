import 'server-only';

/**
 * Transactional email through Resend's HTTP API (no SDK — a single fetch).
 * Needs RESEND_API_KEY and EMAIL_FROM (an address on a domain verified in
 * Resend, e.g. `Theus <invites@yourdomain.com>`). Without both, sending is
 * skipped and callers fall back to showing the link to copy.
 */

export type SendResult = { ok: true } | { ok: false; error: string };

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function sendInviteEmail(opts: {
  to: string;
  inviterEmail: string;
  budgetName: string;
  link: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { ok: false, error: 'Email sending isn’t configured (RESEND_API_KEY / EMAIL_FROM).' };

  const subject = `${opts.inviterEmail} invited you to “${opts.budgetName}” on Theus`;
  const text =
    `${opts.inviterEmail} invited you to share the budget “${opts.budgetName}” on Theus.\n\n` +
    `Open this link to create your account and join:\n${opts.link}\n\n` +
    `The link works once and expires in 14 days. If you weren’t expecting this, ignore this email.`;
  const html = `<!doctype html><html><body style="margin:0;padding:32px 16px;background:#eef0fb;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#151a2d">
  <table role="presentation" align="center" width="100%" style="max-width:480px;background:#ffffff;border-radius:20px;padding:32px">
    <tr><td>
      <div style="font-weight:800;font-size:18px;letter-spacing:-0.02em">Theus</div>
      <h1 style="font-size:22px;line-height:1.3;margin:20px 0 8px">You’re invited to “${esc(opts.budgetName)}”</h1>
      <p style="font-size:15px;line-height:1.55;margin:0 0 24px;color:#4c5368">${esc(opts.inviterEmail)} wants to share this budget with you. Create an account (or sign in) to join.</p>
      <a href="${esc(opts.link)}" style="display:inline-block;background:#4a5ce0;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 24px;border-radius:999px">Accept invitation</a>
      <p style="font-size:12.5px;line-height:1.5;margin:24px 0 0;color:#7b8296">Or paste this link into your browser:<br><span style="word-break:break-all">${esc(opts.link)}</span></p>
      <p style="font-size:12.5px;line-height:1.5;margin:16px 0 0;color:#7b8296">The link works once and expires in 14 days. If you weren’t expecting this, you can ignore this email.</p>
    </td></tr>
  </table></body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [opts.to], subject, html, text }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      return { ok: false, error: body?.message ?? `Email service returned ${res.status}.` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not reach the email service.' };
  }
}
