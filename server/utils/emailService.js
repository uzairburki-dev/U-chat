import nodemailer from 'nodemailer';

export const sendOtpEmail = async (email, otp, fullName = 'User') => {
  const isProd = process.env.NODE_ENV === 'production';
  const hasSmtpConfig =
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    (process.env.EMAIL_USER && process.env.EMAIL_PASS);

  // In non-production only, log notification safely without exposing sensitive info in production
  if (!isProd) {
    console.log(`[Email Service (Dev)] Sending OTP to recipient: ${email} (simulated: ${!hasSmtpConfig})`);
  }

  if (!hasSmtpConfig) {
    // Environments without SMTP credentials operate in simulation mode
    return { success: true, simulated: true };
  }

  try {
    let transporterConfig;

    if (process.env.SMTP_HOST) {
      transporterConfig = {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
      };
    } else {
      transporterConfig = {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
      };
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    const fromAddress =
      process.env.EMAIL_FROM ||
      `"ChatBoat" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`;

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: `Your ChatBoat Verification Code: ${otp}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, #4f46e5, #06b6d4); color: #ffffff; border-radius: 12px; font-weight: bold; font-size: 20px;">
              💬 ChatBoat
            </div>
          </div>
          <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 8px;">Verify Your Email Address</h2>
          <p style="color: #64748b; font-size: 14px; line-height: 1.5;">
            Hi <strong>${fullName}</strong>, thank you for signing up for ChatBoat! Use the following 6-digit verification code to complete your registration.
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <div style="display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #4f46e5; background: #f1f5f9; padding: 14px 28px; border-radius: 12px; border: 1px dashed #cbd5e1;">
              ${otp}
            </div>
          </div>
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.4;">
            This verification code is valid for <strong>10 minutes</strong>. If you did not request this email, please ignore it.
          </p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="color: #cbd5e1; font-size: 11px; text-align: center;">
            &copy; 2026 ChatBoat Live Chat. All rights reserved.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true, simulated: false };
  } catch (error) {
    console.error('Email send failed (falling back):', error.message);
    return { success: true, simulated: true, error: error.message };
  }
};
