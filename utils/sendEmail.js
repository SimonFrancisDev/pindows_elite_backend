import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// Make sure the API key exists
if (!process.env.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY is not set in .env!");
}

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using Resend
 * @param {string | string[]} to - Recipient email address(es)
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 */
export const sendEmail = async (to, subject, html) => {
  // Defensive check for the recipient
  if (!to) {
    console.error("❌ No recipient email provided!");
    throw new Error("Recipient email is undefined");
  }

  // Defensive check for the subject
  if (!subject) {
    console.error("❌ No email subject provided!");
    throw new Error("Email subject is undefined");
  }

  // Defensive check for the HTML content
  if (!html) {
    console.error("❌ No email content provided!");
    throw new Error("Email content is undefined");
  }

  try {
    const data = await resend.emails.send({
      from: "Pindows Elite <noreply@pindowselite.com>",
      to,
      subject,
      html,
    });

    console.log("✅ Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
