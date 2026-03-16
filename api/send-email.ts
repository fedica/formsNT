import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { response } = req.body;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL, APP_URL } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !ADMIN_EMAIL) {
      console.warn("SMTP settings not configured. Email not sent.");
      return res.status(200).json({ success: true, message: "Email skipped (not configured)" });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || "587"),
      secure: parseInt(SMTP_PORT || "587") === 465,
      requireTLS: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"Umfrage System" <${SMTP_USER}>`,
      to: ADMIN_EMAIL.split(',').map((email: string) => email.trim()).join(', '),
      subject: "Neue anonyme Mitarbeiterumfrage",
      html: `
        <h2>Neue anonyme Mitarbeiterumfrage eingegangen</h2>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <tr><th style="text-align: left; width: 30%;">Depot</th><td>${response.depot || '-'}</td></tr>
          <tr><th style="text-align: left;">Zufriedenheit</th><td>${response.satisfaction || '-'}</td></tr>
          <tr><th style="text-align: left;">Unterstützung</th><td>${response.support || '-'}</td></tr>
          <tr><th style="text-align: left;">Kommunikation</th><td>${response.communication || '-'}</td></tr>
          <tr><th style="text-align: left;">Arbeitsbelastung</th><td>${response.workload || '-'}</td></tr>
          <tr><th style="text-align: left;">Tourenplanung</th><td>${response.tourPlanning || '-'}</td></tr>
          <tr><th style="text-align: left;">Arbeitsmittel</th><td>${response.equipment || '-'}</td></tr>
          <tr><th style="text-align: left;">Was läuft gut?</th><td>${response.goodThings || '-'}</td></tr>
          <tr><th style="text-align: left;">Verbesserungsvorschläge</th><td>${response.suggestions || '-'}</td></tr>
          <tr><th style="text-align: left;">Sonstiges</th><td>${response.other || '-'}</td></tr>
        </table>
        <p>Sie können alle Antworten im <a href="${APP_URL || 'https://your-app.vercel.app'}/admin">Admin Dashboard</a> einsehen.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
}
