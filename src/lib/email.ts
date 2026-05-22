import { Resend } from "resend";

let resendInstance: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendInstance) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY environment variable is required to dispatch transactional emails.");
    }
    resendInstance = new Resend(key);
  }
  return resendInstance;
}

// Check if email notification system can run (graceful validation check)
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Common Premium HTML wrapper to guarantee mobile responsiveness and matching aesthetic
 */
function wrapEmailTemplate(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      background-color: #050505;
      color: #eaeaea;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: none;
      -ms-text-size-adjust: none;
    }
    .wrapper {
      width: 100%;
      background-color: #050505;
      padding: 40px 10px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0c0c0c;
      border: 1px solid #1d1d1d;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.8);
    }
    .header {
      padding: 40px 30px;
      text-align: center;
      border-bottom: 1px solid #161616;
      background-color: #090909;
    }
    .brand {
      font-family: Georgia, Garamond, serif;
      font-size: 26px;
      letter-spacing: 0.25em;
      color: #d4af37;
      text-transform: uppercase;
      text-decoration: none;
      font-weight: bold;
    }
    .brand-sub {
      font-size: 9px;
      letter-spacing: 0.4em;
      color: #666;
      text-transform: uppercase;
      margin-top: 8px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 22px;
      font-family: Georgia, Garamond, serif;
      color: #ffffff;
      margin-bottom: 15px;
      text-align: center;
      font-style: italic;
    }
    .text {
      font-size: 14px;
      color: #a0a0a0;
      line-height: 1.6;
      margin-bottom: 25px;
    }
    .card {
      background-color: #111111;
      border: 1px solid #1f1f1f;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 25px;
    }
    .card-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #d4af37;
      margin-bottom: 16px;
      font-weight: bold;
      border-bottom: 1px solid #1f1f1f;
      padding-bottom: 8px;
    }
    .metadata-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #181818;
      padding: 10px 0;
      font-size: 13px;
    }
    .metadata-row:last-child {
      border-bottom: none;
    }
    .metadata-label {
      color: #777;
    }
    .metadata-value {
      color: #eee;
      font-weight: 500;
      font-family: monospace;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      background-color: #d4af37;
      color: #000000 !important;
      padding: 14px 32px;
      text-decoration: none;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.18em;
      border-radius: 4px;
      display: inline-block;
      box-shadow: 0 4px 12px rgba(212,175,55,0.15);
    }
    .button:hover {
      background-color: #e5be49;
    }
    .footer {
      padding: 30px;
      text-align: center;
      background-color: #090909;
      border-top: 1px solid #161616;
      font-size: 10px;
      color: #444;
      line-height: 1.6;
      letter-spacing: 0.05em;
    }
    .footer-links {
      margin-bottom: 12px;
    }
    .footer-links a {
      color: #d4af37;
      text-decoration: none;
      margin: 0 10px;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand">JAY PICTURES</div>
        <div class="brand-sub">Elite Fine-Art Curation</div>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <div class="footer-links">
          <a href="{{APP_URL}}/portfolio">Exhibits</a> | 
          <a href="{{APP_URL}}/dashboard">Patron Portal</a> |
          <a href="{{APP_URL}}/book">Sessions</a>
        </div>
        &copy; ${new Date().getFullYear()} Jay Pictures Co. All Rights Reserved.<br>
        281-505-PIX &bull; studio@jaypictures.co &bull; Houston &bull; Venice &bull; London
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Replace dynamic placeholder urls to prevent template leakage
function renderTemplate(html: string): string {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  return html.replace(/{{APP_URL}}/g, appUrl);
}

/**
 * 1. Booking Confirmation Email
 */
export function buildBookingConfirmationEmail(params: {
  clientName: string;
  serviceTitle: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  bookingId: string;
}): string {
  const title = "Your Shoot is Locked";
  const content = `
    <h1 class="title">${title}</h1>
    <p class="text">
      Esteemed ${params.clientName},<br><br>
      Your reservations have been logged and officially secured in our scheduling vault. Our creative team has already begun designing layouts, backgrounds, and spotlight presets specific to your session style.
    </p>
    <div class="card">
      <div class="card-title">Reservation Details</div>
      <div class="metadata-row">
        <span class="metadata-label">Services Included</span>
        <span class="metadata-value" style="color:#d4af37">${params.serviceTitle}</span>
      </div>
      <div class="metadata-row">
        <span class="metadata-label">Shoot Date</span>
        <span class="metadata-value">${params.bookingDate}</span>
      </div>
      <div class="metadata-row">
        <span class="metadata-label">Time Allocation</span>
        <span class="metadata-value">${params.bookingTime}</span>
      </div>
      <div class="metadata-row">
        <span class="metadata-label">Reference Code</span>
        <span class="metadata-value">${params.bookingId.slice(0, 10).toUpperCase()}</span>
      </div>
    </div>
    <p class="text">
      To align styling inspiration, please navigate to your client workspace and pin concept references to your collaborative moodboard.
    </p>
    <div class="button-container">
      <a href="{{APP_URL}}/dashboard" class="button">Access Client Portal</a>
    </div>
  `;
  return renderTemplate(wrapEmailTemplate(title, content));
}

/**
 * 2. Payment Confirmation Email
 */
export function buildPaymentConfirmationEmail(params: {
  clientName: string;
  serviceTitle: string;
  amount: number;
  currency: string;
  paymentRef: string;
  bookingId: string;
}): string {
  const title = "Receipt of Fine-Art Curation";
  const content = `
    <h1 class="title">${title}</h1>
    <p class="text">
      Esteemed ${params.clientName},<br><br>
      We have received and securely logged your transaction. Below is your detailed ledger invoice confirmation:
    </p>
    <div class="card">
      <div class="card-title">Billing Ledger Summary</div>
      <div class="metadata-row">
        <span class="metadata-label">Curated Shoot</span>
        <span class="metadata-value">${params.serviceTitle}</span>
      </div>
      <div class="metadata-row">
        <span class="metadata-label">Amount Transferred</span>
        <span class="metadata-value" style="color:#d4af37; font-weight:bold">${params.currency} ${params.amount.toLocaleString()}</span>
      </div>
      <div class="metadata-row">
        <span class="metadata-label">Transaction Reference</span>
        <span class="metadata-value">${params.paymentRef}</span>
      </div>
      <div class="metadata-row">
        <span class="metadata-label">Booking Reference</span>
        <span class="metadata-value">${params.bookingId.slice(0, 10).toUpperCase()}</span>
      </div>
    </div>
    <div class="button-container">
      <a href="{{APP_URL}}/dashboard" class="button">View Account Receipts</a>
    </div>
  `;
  return renderTemplate(wrapEmailTemplate(title, content));
}

/**
 * 3. Booking Reminder Email
 */
export function buildBookingReminderEmail(params: {
  clientName: string;
  serviceTitle: string;
  bookingDate: string;
  bookingTime: string;
  reminderScope: string; // e.g., "Tomorrow", "In 3 days"
}): string {
  const title = "Polishing the Glass — Session Reminder";
  const content = `
    <h1 class="title">${title}</h1>
    <p class="text">
      Esteemed ${params.clientName},<br><br>
      Our cameras are polished, and the studio backdrops are set. This is a reminder that your fine-art visual curation is scheduled for <strong>${params.reminderScope}</strong>.
    </p>
    <div class="card">
      <div class="card-title">Awaiting Session Specifics</div>
      <div class="metadata-row">
        <span class="metadata-label">Shoot Concept</span>
        <span class="metadata-value" style="color:#d4af37">${params.serviceTitle}</span>
      </div>
      <div class="metadata-row">
        <span class="metadata-label">Scheduled Date</span>
        <span class="metadata-value">${params.bookingDate}</span>
      </div>
      <div class="metadata-row">
        <span class="metadata-label">Scheduled Time Slot</span>
        <span class="metadata-value">${params.bookingTime}</span>
      </div>
    </div>
    <p class="text">
      <strong>Preparatory Guidelines:</strong> We recommend arriving 15 minutes prior to secure wardrobe selections. Make sure your styling parameters match your synced workspace notes.
    </p>
    <div class="button-container">
      <a href="{{APP_URL}}/dashboard" class="button">Review My Moodboard</a>
    </div>
  `;
  return renderTemplate(wrapEmailTemplate(title, content));
}

/**
 * 4. Gallery Delivery Email
 */
export function buildGalleryDeliveryEmail(params: {
  clientName: string;
  galleryTitle: string;
  photosCount: number;
}): string {
  const title = "Your Curated Heirlooms are Published";
  const content = `
    <h1 class="title">${title}</h1>
    <p class="text">
      Esteemed ${params.clientName},<br><br>
      The darkroom rendering has wrapped! Our master artist has curated and applied deep custom color grading and light optimization to your pictures. Your high-resolution digital heirlooms are now live.
    </p>
    <div class="card">
      <div class="card-title">Digital Exhibition Inventory</div>
      <div class="metadata-row">
        <span class="metadata-label">Exhibition Title</span>
        <span class="metadata-value" style="color:#d4af37">${params.galleryTitle}</span>
      </div>
      <div class="metadata-row">
        <span class="metadata-label">Total Selected Files</span>
        <span class="metadata-value">${params.photosCount} Premium Retouched Images</span>
      </div>
    </div>
    <p class="text">
      Navigate to your secured Client Dashboard to stream online slide-shows, toggle full-screen zoom inspects, or request zip download packages.
    </p>
    <div class="button-container">
      <a href="{{APP_URL}}/dashboard" class="button">Explore Digital Portfolio</a>
    </div>
  `;
  return renderTemplate(wrapEmailTemplate(title, content));
}

/**
 * 5. Password Reset Email
 */
export function buildPasswordResetEmail(params: {
  clientName: string;
  resetLink: string;
}): string {
  const title = "Securing Your Accounts Path";
  const content = `
    <h1 class="title">${title}</h1>
    <p class="text">
      Hello ${params.clientName},<br><br>
      We received a password adjustment proposal for your Jay Pictures master login account. Request a security override easily by accessing the secure portal link below:
    </p>
    <div class="button-container">
      <a href="${params.resetLink}" class="button">Secure Reset Link</a>
    </div>
    <p class="text" style="font-size: 11px; color: #555; text-align: center">
      If you did not issue this adjustment, please ignore this email. This link is single-use only.
    </p>
  `;
  return renderTemplate(wrapEmailTemplate(title, content));
}

/**
 * Core Sender function that bridges with Resend API
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!isEmailConfigured()) {
      console.warn("Resend email dispatch bypassed: RESEND_API_KEY environment variable is blank.");
      return { success: false, error: "RESEND_API_KEY is not configured in environment settings." };
    }

    const resend = getResendClient();
    const result = await resend.emails.send({
      from: "Jay Pictures <studio@jaypictures.co>", // On trial API keys, Resend enforces sending to verified account owner email
      to: [params.to],
      subject: params.subject,
      html: params.html,
    });

    if (result.error) {
      console.error("Resend API error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, data: result.data };
  } catch (err: any) {
    console.error("Email dispatch failure:", err);
    return { success: false, error: err.message };
  }
}
