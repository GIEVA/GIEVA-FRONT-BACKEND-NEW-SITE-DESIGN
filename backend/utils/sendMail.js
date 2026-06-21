

import nodemailer from "nodemailer";



// ======================================================
// NODEMAILER TRANSPORTER
// ======================================================

const transporter =
  nodemailer.createTransport({

    service: "gmail",

    auth: {

      user:
        "comfortenock73@gmail.com",

      pass:
        "cfgdgtfbdoctvfvo",
    },
  });



// ======================================================
// SEND EMAIL
// ======================================================

const sendEmail = async (
  to,
  subject,
  htmlContent,
  attachments = []
) => {

  try {

    const response =
      await transporter.sendMail({

        from:
          "gieva.org<comfortenock73@gmail.com>",

        to,

        subject,

        html: htmlContent,

        attachments,
      });



    console.log(
      "✅ Email sent:",
      response.messageId
    );

    return response;

  } catch (error) {

    console.error(
      "❌ Email error:",
      error
    );

    throw error;
  }
};



export default sendEmail;








// import { Resend } from "resend";

// const resend = new Resend('re_Ro5Mkjig_J9L9aLSHgmKHMPKqvc8v6exC');

// const sendEmail = async (to, subject, htmlContent, attachments = []) => {
//   try {
//     const response = await resend.emails.send({
//       from: "Domify <onboarding@resend.dev>",
//       to,
//       subject,
//       html: htmlContent,
//       attachments,
//     });

//     console.log("✅ Email sent:", response);
//     return response;

//   } catch (error) {
//     console.error("❌ Email error:", error);
//     throw error;
//   }
// };

// export default sendEmail;



// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// dotenv.config();

// const sendEmail = async (to, subject, htmlContent, attachments = []) => {
//   try {

//      if (!to) {
//       throw new Error("Recipient email address is missing!");
//     }
//     // Create transporter
//     const transporter = nodemailer.createTransport({
//       service: "gmail", // or "smtp.mailtrap.io" for testing
      
//       auth: {
//         user: process.env.SMTP_USER, // your email
//         pass: process.env.SMTP_PASS, // your app password
//       },
//     });

//     // Email options
//     const mailOptions = {
//       from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
//       to,
//       subject,
//       html: htmlContent,
//       attachments
//     };

//     // Send email
//     const info = await transporter.sendMail(mailOptions);
//     console.log("✅ Email sent: %s", info.messageId);
//     return info;
//   } catch (error) {
//     console.error("❌ Error sending email:", error);
//     throw new Error("Email could not be sent");
//   }
// };

// export default sendEmail;
