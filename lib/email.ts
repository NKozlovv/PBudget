import 'server-only';
import tls from 'node:tls';

/**
 * Transactional email for invitations. Two providers, first configured wins:
 *
 *  1. Gmail SMTP — GMAIL_USER + GMAIL_APP_PASSWORD (a Google "App password",
 *     needs 2-step verification on the account). No domain required; sends
 *     from that Gmail address, ~500/day. Speaks SMTP over TLS directly (a
 *     small client below) so there is no new npm dependency.
 *  2. Resend — RESEND_API_KEY + EMAIL_FROM (needs a domain you own, verified
 *     in Resend; a *.vercel.app address can't be).
 *
 * With neither set, sending is skipped and callers fall back to showing the
 * link to copy.
 */

export type SendResult = { ok: true } | { ok: false; error: string };

const gmailConfigured = () => !!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD;
const resendConfigured = () => !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;

export function emailConfigured(): boolean {
  return gmailConfigured() || resendConfigured();
}

const SAFE_RECIPIENT = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ─── Gmail SMTP (implicit TLS, port 465) ───────────────────────────────

type Reply = { code: number; text: string };

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');
/** Base64 wrapped at 76 chars — also guarantees no body line starts with "." (SMTP dot-stuffing). */
const b64Lines = (s: string) => (b64(s).match(/.{1,76}/g) ?? []).join('\r\n');
const encodeHeader = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);

async function smtpSend(msg: { user: string; pass: string; from: string; to: string; subject: string; text: string; html: string }) {
  const socket = tls.connect({ host: 'smtp.gmail.com', port: 465, servername: 'smtp.gmail.com' });
  socket.setEncoding('utf8');

  const queue: Reply[] = [];
  let waiter: ((r: Reply) => void) | null = null;
  let buffer = '';
  let lines: string[] = [];
  socket.on('data', (chunk: string) => {
    buffer += chunk;
    let idx: number;
    while ((idx = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      lines.push(line);
      // A multi-line reply ends on the line with a space after the code ("250 OK"; "250-..." continues).
      if (/^\d{3} /.test(line)) {
        const reply = { code: Number(line.slice(0, 3)), text: lines.join(' | ') };
        lines = [];
        if (waiter) {
          const w = waiter;
          waiter = null;
          w(reply);
        } else queue.push(reply);
      }
    }
  });

  const failure = new Promise<never>((_, reject) => {
    socket.on('error', reject);
    socket.on('close', () => reject(new Error('SMTP connection closed unexpectedly.')));
    socket.setTimeout(20000, () => reject(new Error('SMTP timed out.')));
  });
  failure.catch(() => {}); // after a clean QUIT the socket closes; that's not an error

  const next = () =>
    Promise.race([
      new Promise<Reply>((resolve) => {
        const r = queue.shift();
        if (r) resolve(r);
        else waiter = resolve;
      }),
      failure,
    ]);
  const cmd = async (line: string, expect: number) => {
    socket.write(line + '\r\n');
    const r = await next();
    if (r.code !== expect) throw new Error(`SMTP ${r.code}: ${r.text}`);
  };

  try {
    const greeting = await next();
    if (greeting.code !== 220) throw new Error(`SMTP ${greeting.code}: ${greeting.text}`);
    await cmd('EHLO theus', 250);
    await cmd('AUTH PLAIN ' + b64(`\0${msg.user}\0${msg.pass}`), 235);
    await cmd(`MAIL FROM:<${msg.user}>`, 250);
    await cmd(`RCPT TO:<${msg.to}>`, 250);
    await cmd('DATA', 354);

    const boundary = '=_theus_' + Math.random().toString(36).slice(2);
    const body = [
      `From: ${msg.from}`,
      `To: ${msg.to}`,
      `Subject: ${encodeHeader(msg.subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@theus>`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64Lines(msg.text),
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64Lines(msg.html),
      `--${boundary}--`,
      '',
    ].join('\r\n');
    await cmd(body + '\r\n.', 250);
    socket.write('QUIT\r\n');
  } finally {
    socket.end();
  }
}

// ─── Resend ────────────────────────────────────────────────────────────

async function resendSend(msg: { from: string; to: string; subject: string; text: string; html: string }): Promise<SendResult> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: msg.from, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    return { ok: false, error: body?.message ?? `Email service returned ${res.status}.` };
  }
  return { ok: true };
}

// ─── Invite email ──────────────────────────────────────────────────────

export async function sendInviteEmail(opts: {
  to: string;
  inviterEmail: string;
  budgetName: string;
  link: string;
}): Promise<SendResult> {
  // `to` is interpolated straight into SMTP commands (RCPT TO) and headers. The invite action validates it,
  // but a budget owner can also write budget_invites rows directly through Supabase, so re-check at the sink:
  // no whitespace/CR/LF, angle brackets, quotes or commas.
  if (opts.to.length > 254 || !SAFE_RECIPIENT.test(opts.to)) return { ok: false, error: 'That email address isn’t valid.' };
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
    if (gmailConfigured()) {
      const user = process.env.GMAIL_USER!;
      await smtpSend({
        user,
        pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s+/g, ''), // Google shows app passwords in 4-letter groups
        from: `${encodeHeader('Theus')} <${user}>`,
        to: opts.to,
        subject,
        text,
        html,
      });
      return { ok: true };
    }
    if (resendConfigured()) {
      return await resendSend({ from: process.env.EMAIL_FROM!, to: opts.to, subject, text, html });
    }
    return {
      ok: false,
      error: 'Email sending isn’t configured (set GMAIL_USER + GMAIL_APP_PASSWORD, or RESEND_API_KEY + EMAIL_FROM).',
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not send the email.' };
  }
}
