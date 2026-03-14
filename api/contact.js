import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const CONTACT_RECEIVER = process.env.CONTACT_RECEIVER || EMAIL_USER;

const createGmailTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!EMAIL_USER || !EMAIL_PASS) {
    return res.status(500).json({ error: "Email service not configured." });
  }

  try {
    const { name, email, subject, message, category } = req.body || {};

    const safeName = String(name || "").trim();
    const safeEmail = String(email || "").trim();
    const safeMessage = String(message || "").trim();
    const safeSubject = String(subject || "No subject").trim().slice(0, 120);
    const safeCategory = String(category || "general").trim().slice(0, 60);

    if (!safeName || !safeEmail || !safeMessage) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Helper function to format category with proper styling
    const getCategoryBadge = (category) => {
      const categories = {
        general: { color: '#6b7280', bg: '#f3f4f6', label: 'General' },
        support: { color: '#2563eb', bg: '#dbeafe', label: 'Support' },
        feedback: { color: '#7e22ce', bg: '#f3e8ff', label: 'Feedback' },
        bug: { color: '#dc2626', bg: '#fee2e2', label: 'Bug Report' },
        feature: { color: '#16a34a', bg: '#dcfce7', label: 'Feature Request' },
        business: { color: '#b45309', bg: '#ffedd5', label: 'Business' }
      };
      const cat = categories[category] || categories.general;
      return `<span style="background-color: ${cat.bg}; color: ${cat.color}; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block;">${cat.label}</span>`;
    };

    const htmlEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; line-height: 1.5;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.02em;">📬 New Contact Message</h1>
            <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">You've received a new message from your website</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px 24px;">
            
            <!-- Category Badge -->
            <div style="margin-bottom: 24px; text-align: center;">
              ${getCategoryBadge(safeCategory)}
            </div>
            
            <!-- Sender Info Card -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
              <h3 style="margin: 0 0 16px; color: #1e293b; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">👤 Sender Information</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; width: 80px; color: #64748b; font-weight: 500;">Name:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Email:</td>
                  <td style="padding: 8px 0;">
                    <a href="mailto:${safeEmail}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${safeEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Subject:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">${safeSubject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Received:</td>
                  <td style="padding: 8px 0; color: #64748b;">${new Date().toLocaleString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                </tr>
              </table>
            </div>
            
            <!-- Message Card -->
            <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <h3 style="margin: 0 0 16px; color: #1e293b; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">💬</span> Message Content
              </h3>
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border-left: 4px solid #667eea;">
                <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${safeMessage.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
            
            <!-- Quick Actions -->
            <div style="background-color: #f0f9ff; border-radius: 12px; padding: 20px; border: 1px solid #bae6fd;">
              <h3 style="margin: 0 0 16px; color: #0369a1; font-size: 16px; font-weight: 600;">⚡ Quick Actions</h3>
              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <a href="mailto:${safeEmail}?subject=Re: ${encodeURIComponent(safeSubject)}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; display: inline-block;">📧 Reply to Sender</a>
              </div>
            </div>
            
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 13px;">This message was sent from the contact form on your Recipe Finder website.</p>
            <p style="margin: 8px 0 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} Recipe Finder. All rights reserved.</p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    const textEmail = `
══════════════════════════════════════════════
NEW CONTACT MESSAGE
══════════════════════════════════════════════

CATEGORY: ${safeCategory.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SENDER INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${safeName}
Email: ${safeEmail}
Subject: ${safeSubject}
Received: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${safeMessage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To reply to this message, simply reply to this email or contact ${safeEmail} directly.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    const transporter = createGmailTransporter();
    await transporter.sendMail({
      from: `"Recipe Finder Contact" <${EMAIL_USER}>`,
      to: CONTACT_RECEIVER,
      replyTo: safeEmail,
      subject: `[Contact] ${safeCategory} - ${safeSubject}`,
      text: textEmail,
      html: htmlEmail,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Contact form email failed:", error);
    return res.status(500).json({ error: "Failed to send message." });
  }
}