type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: EmailPayload) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "CyberCanvas Services <onboarding@resend.dev>";
  const fromMatch = from.match(/^(.*)<(.+)>$/);
  const senderName = fromMatch?.[1]?.trim() || "CyberCanvas Services";
  const senderEmail = fromMatch?.[2]?.trim() || from;

  if (brevoApiKey) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      return { sent: false, reason: await response.text() };
    }

    return { sent: true };
  }

  if (!resendApiKey) {
    return { sent: false, reason: "BREVO_API_KEY ou RESEND_API_KEY manquante" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    return { sent: false, reason: await response.text() };
  }

  return { sent: true };
}
