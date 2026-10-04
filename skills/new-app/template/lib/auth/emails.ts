import type { Email } from "@/lib/mailer";

const APP_NAME = "__APP_NAME__";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * The one email BetterAuth sends: a link to set a password.
 *
 * For someone who has never had a password it is their invitation; for someone
 * who has, it is a password reset. Same link, same endpoint — only the words
 * differ.
 */
export function passwordLinkEmail({
  to,
  name,
  url,
  firstTime,
}: {
  to: string;
  name: string;
  url: string;
  firstTime: boolean;
}): Email {
  const subject = firstTime ? `Tu invitación a ${APP_NAME}` : `Cambia tu contraseña de ${APP_NAME}`;
  const lead = firstTime
    ? `Te dieron acceso a ${APP_NAME}. Abre este enlace para crear tu contraseña:`
    : "Abre este enlace para elegir una contraseña nueva:";
  const footer = firstTime
    ? "El enlace sirve una sola vez y caduca en tres días. Si no esperabas este correo, ignóralo."
    : "El enlace sirve una sola vez y caduca en tres días. Si no lo pediste, ignóralo: tu contraseña sigue igual.";
  const action = firstTime ? "Crear mi contraseña" : "Elegir contraseña nueva";

  return {
    to,
    subject,
    text: `Hola, ${name}:\n\n${lead}\n\n${url}\n\n${footer}\n`,
    html: `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f6f6f4;font-family:system-ui,-apple-system,sans-serif;color:#1c1c1a">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
      <p style="margin:0 0 12px;font-size:16px">Hola, ${escapeHtml(name)}:</p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.5">${escapeHtml(lead)}</p>
      <p style="margin:0 0 24px">
        <a href="${escapeHtml(url)}" style="display:inline-block;background:#1c1c1a;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">${action}</a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:#6b6b66">${escapeHtml(footer)}</p>
    </div>
  </body>
</html>`,
  };
}
