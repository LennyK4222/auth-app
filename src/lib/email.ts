export async function sendEmailDev(to: string, subject: string, html: string) {
  // In dev, just log. You can wire SMTP later.
  console.log('[EMAIL DEV]', { to, subject, html });
}
