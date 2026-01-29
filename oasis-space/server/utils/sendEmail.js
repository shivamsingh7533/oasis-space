import brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (to, subject, htmlContent) => {
  try {
    // 1. Setup Brevo Instance
    let apiInstance = new brevo.TransactionalEmailsApi();
    let apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_KEY; // .env se Key lega

    // 2. Prepare Email
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    
    // SENDER (Jo Brevo me verified hai)
    sendSmtpEmail.sender = { "name": "OasisSpace Team", "email": process.env.SENDER_EMAIL };
    
    // RECEIVER
    sendSmtpEmail.to = [{ "email": to }];

    // 3. Send Email
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent to ${to}. Message ID: ${data.messageId}`);
    return true;

  } catch (error) {
    console.error("❌ Brevo API Error:", error.body ? error.body : error.message);
    return false;
  }
};

export default sendEmail;