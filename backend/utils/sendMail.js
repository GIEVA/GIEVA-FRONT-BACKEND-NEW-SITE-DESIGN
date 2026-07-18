import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];

apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
console.log({
  apiKeyExists: !!process.env.BREVO_API_KEY,
  keyPrefix: process.env.BREVO_API_KEY?.substring(0, 8),
});

const sendEmail = async (
  to,
  subject,
  htmlContent,
  attachments = []
) => {
  try {
    if (!to) {
      throw new Error("Recipient email is required");
    }

    const emailData = {
      sender: {
        name: process.env.SMTP_FROM || "Domify",
        email: process.env.SMTP_FROM_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    };

    // Optional attachments support
    if (attachments.length > 0) {
      emailData.attachment = attachments;
    }

    const response = await apiInstance.sendTransacEmail(emailData);

    console.log("✅ Email sent:", response);

    return response;
  } catch (error) {
    console.error(
      "❌ Brevo Email Error:",
      error.response?.body || error.message || error
    );
    throw error;
  }
};

export default sendEmail;


// import nodemailer from "nodemailer";



// // ======================================================
// // NODEMAILER TRANSPORTER
// // ======================================================

// const transporter =
//   nodemailer.createTransport({

//     service: "gmail",

//     auth: {

//       user:
//         "comfortenock73@gmail.com",

//       pass:
//         "cfgdgtfbdoctvfvo",
//     },
//   });



// // ======================================================
// // SEND EMAIL
// // ======================================================

// const sendEmail = async (
//   to,
//   subject,
//   htmlContent,
//   attachments = []
// ) => {

//   try {

//     const response =
//       await transporter.sendMail({

//         from:
//           "gieva.org<comfortenock73@gmail.com>",

//         to,

//         subject,

//         html: htmlContent,

//         attachments,
//       });



//     console.log(
//       "✅ Email sent:",
//       response.messageId
//     );

//     return response;

//   } catch (error) {

//     console.error(
//       "❌ Email error:",
//       error
//     );

//     throw error;
//   }
// };



// export default sendEmail;
