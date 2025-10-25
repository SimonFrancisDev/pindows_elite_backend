import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY is not set in .env!");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, html) => {
  if (!to) throw new Error("Recipient email is undefined");
  if (!subject) throw new Error("Email subject is undefined");
  if (!html) throw new Error("Email content is undefined");

  try {
    const data = await resend.emails.send({
      from: "Pindows Elite <noreply@pindowselite.com>",
      to,
      subject,
      html,
      text: "This is an automated message from Pindows Elite.",
      reply_to: "support@pindowselite.com",
      headers: {
        "List-Unsubscribe": "<mailto:unsubscribe@pindowselite.com>",
      },
    });

    console.log("✅ Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
