import nodemailer, { type Transporter } from "nodemailer";

import { serverEnv } from "@/lib/env";

/**
 * Outgoing email, over plain SMTP.
 *
 * SMTP keeps the app free of any provider's SDK: locally SMTP_URL points at the
 * Mailpit that `supabase start` already runs, and in production at the
 * provider's SMTP relay (Resend, Postmark, SES all offer one). Only the
 * environment changes.
 *
 * No server-only guard of its own: it is reached through lib/auth/auth.ts, whose
 * app entry is guarded, and nodemailer cannot run in a browser regardless.
 */
let transport: Transporter | undefined;

export type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(email: Email): Promise<void> {
  const { SMTP_URL, EMAIL_FROM } = serverEnv();
  transport ??= nodemailer.createTransport(SMTP_URL);
  await transport.sendMail({ from: EMAIL_FROM, ...email });
}
