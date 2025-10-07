const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // For development: Use Gmail or any SMTP service
  // For production: Use SendGrid, AWS SES, or other professional email service
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com', // Set in .env
      pass: process.env.EMAIL_PASSWORD || 'your-app-password' // Gmail App Password
    }
  });
};

// Send OTP Email
const sendOTPEmail = async (email, otp, userName = 'User') => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"OUR Vehicle System" <${process.env.EMAIL_USER || 'noreply@ourvehicle.com'}>`,
      to: email,
      subject: '🔐 Password Reset OTP - OUR Vehicle System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .otp-box {
              background: #f8fafc;
              border: 2px solid #667eea;
              border-radius: 10px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 8px;
              margin: 10px 0;
            }
            .footer {
              background: #f8fafc;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>We received a request to reset your password for your OUR Vehicle System account.</p>
              
              <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your OTP Code:</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Valid for 5 minutes</p>
              </div>
              
              <p><strong>Important:</strong></p>
              <ul style="color: #666;">
                <li>This OTP will expire in 5 minutes</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
              
              <p>Best regards,<br><strong>OUR Vehicle System Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2025 OUR Vehicle System. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail
};




























