// utils/emailTemplates.js

// ---------------- WELCOME EMAIL ----------------
export const welcomeTemplate = (name) => `
  <div style="font-family: Arial, sans-serif; line-height:1.5;">
    <h2>Welcome, ${name}!</h2>
    <p>Thank you for joining <strong>GIEVA LMS</strong>. We're excited to have you on board!</p>
    <p>You can now explore courses, join sessions, and start learning.</p>
    <p>Happy Learning! 🚀</p>
  </div>
`;

// ---------------- COURSE ENROLLMENT CONFIRMATION ----------------
export const enrollmentTemplate = (name, courseTitle, startDate) => `
  <div style="font-family: Arial, sans-serif; line-height:1.5;">
    <h2>Hello, ${name}!</h2>
    <p>You have successfully enrolled in the course: <strong>${courseTitle}</strong>.</p>
    <p>The course will start on <strong>${startDate}</strong>. Make sure to check your dashboard for upcoming sessions.</p>
    <p>Good luck! 🎓</p>
  </div>
`;

// ---------------- PASSWORD RESET ----------------
export const passwordResetTemplate = (name, resetLink) => `
  <div style="font-family: Arial, sans-serif; line-height:1.5;">
    <h2>Hello, ${name}</h2>
    <p>We received a request to reset your password for <strong>GIEVA LMS</strong>.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetLink}" target="_blank">Reset Password</a></p>
    <p>If you did not request this, please ignore this email.</p>
  </div>
`;

// ---------------- CLASS SESSION REMINDER ----------------
export const sessionReminderTemplate = (name, courseTitle, sessionDate, sessionTime, meetingLink) => `
  <div style="font-family: Arial, sans-serif; line-height:1.5;">
    <h2>Hi ${name},</h2>
    <p>This is a reminder for your upcoming class session:</p>
    <ul>
      <li><strong>Course:</strong> ${courseTitle}</li>
      <li><strong>Date:</strong> ${sessionDate}</li>
      <li><strong>Time:</strong> ${sessionTime}</li>
      <li><strong>Join Link:</strong> <a href="${meetingLink}" target="_blank">${meetingLink}</a></li>
    </ul>
    <p>Make sure to join on time. See you there! 🎓</p>
  </div>
`;

// ---------------- ACCOUNT VERIFICATION ----------------
export const verificationTemplate = (name, link) => `
  <h1>Hello ${name}</h1>
  <p>Click <a href="${link}">here</a> to verify your account</p>
`;


// utils/emailTemplates.js

export const registrationSuccessTemplate = (name, campaign) => {
  return `
    <h2>🎉 Registration Successful</h2>
    <p>Hello ${name},</p>
    <p>You have successfully registered for:</p>
    <h3>${campaign}</h3>
    <p>We will contact you with further details.</p>
    <br/>
    <p>— Team Gieva</p>
  `;
};


// utils/healsEmailTemplates.js

export const submissionTemplate = (name) => `
  <h2>🎉 Application Submitted</h2>
  <p>Hello ${name},</p>
  <p>Your HEALS application has been successfully submitted.</p>
  <p>Our team will review and get back to you shortly.</p>
`;

export const statusUpdateTemplate = (status) => `
  <h3>📢 Application Update</h3>
  <p>Your application status is now: <b>${status}</b></p>
`;

export const approvalTemplate = (name) => `
  <h2>🎉 Congratulations ${name}!</h2>
  <p>Your application has been approved.</p>
  <p>Next steps will be communicated soon.</p>
`;

export const rejectionTemplate = (reason) => `
  <h2>Application Update</h2>
  <p>Unfortunately, your application was not approved.</p>
  <p>Reason: ${reason || "Not specified"}</p>
`;

export const infoRequestTemplate = (note) => `
  <h2>📄 Additional Information Required</h2>
  <p>${note}</p>
  <p>Please log in to your dashboard to update your application.</p>
`;


// utils/emailTemplates.js

export const paymentReceiptTemplate = ({
  fullName,
  email,
  courseTitle,
  amount,
  currency,
  reference,
  paymentMethod,
  date,
  duration,
}) => `
  <div style="font-family: Arial; padding: 20px;">
    <h2>🧾 Payment Receipt</h2>

    <p>Hello <b>${fullName}</b>,</p>
    <p>Your payment was successful. Below are your transaction details:</p>

    <hr/>

    <p><b>Course:</b> ${courseTitle}</p>
    <p><b>Duration:</b> ${duration || "N/A"}</p>
    <p><b>Amount Paid:</b> ${currency} ${amount}</p>
    <p><b>Payment Method:</b> ${paymentMethod}</p>
    <p><b>Transaction Ref:</b> ${reference}</p>
    <p><b>Date:</b> ${date}</p>

    <hr/>

    <p><b>Status:</b> <span style="color:green;">SUCCESS</span></p>

    <p>Thank you for your purchase 🎉</p>
  </div>
`;

export const campaignBroadcastTemplate = (content, campaignTitle) => `
  <div style="font-family: Arial; padding: 20px;">
    <h2>📢 ${campaignTitle}</h2>

    <div>${content}</div>

    <hr/>
    <p style="font-size:12px; color:gray;">
      You received this because you registered for this campaign.
    </p>
  </div>
`;

// ======================================================
// PAYMENT REQUEST TEMPLATE
// ======================================================

export const paymentRequestTemplate =
({
  fullName,
  amount,
  paymentLink,
}) => {

  return `
  
  <div style="
    font-family: Arial;
    max-width: 650px;
    margin: auto;
    padding: 20px;
  ">

    <h2 style="color:#6C2BD9;">
      GIEVA HEALS Programme
    </h2>

    <p>
      Dear ${fullName},
    </p>

    <p>
      Congratulations.
    </p>

    <p>
      Your submitted HEALS application documents have been reviewed and found satisfactory.
    </p>

    <p>
      You may now proceed with your application processing payment.
    </p>

    <div style="
      background:#f5f5f5;
      padding:20px;
      border-radius:10px;
      margin:20px 0;
    ">

      <h3>
        Payment Details
      </h3>

      <p>
        <strong>Amount:</strong>
        ₦${Number(amount).toLocaleString()}
      </p>

    </div>

    <a
      href="${paymentLink}"

      style="
        display:inline-block;
        padding:14px 24px;
        background:#6C2BD9;
        color:white;
        text-decoration:none;
        border-radius:8px;
        font-weight:bold;
      "
    >
      Proceed To Payment
    </a>

    <p style="margin-top:30px;">
      Regards,<br/>
      GIEVA HEALS Team
    </p>

  </div>
  `;
};

// ======================================================
// PAYMENT RECEIPT TEMPLATE
// ======================================================

export const healsPaymentReceiptTemplate =
({
  fullName,
  amount,
  paymentCode,
  transactionRef,
  paidAt,
}) => {

  return `
  
  <div style="
    font-family: Arial;
    max-width: 650px;
    margin:auto;
    padding:20px;
  ">

    <h2 style="color:#6C2BD9;">
      Payment Receipt
    </h2>

    <p>
      Dear ${fullName},
    </p>

    <p>
      Your payment was successful.
    </p>

    <div style="
      background:#f8f8f8;
      padding:20px;
      border-radius:10px;
      margin-top:20px;
    ">

      <h3>
        Receipt Details
      </h3>

      <p>
        <strong>Payment Code:</strong>
        ${paymentCode}
      </p>

      <p>
        <strong>Reference:</strong>
        ${transactionRef}
      </p>

      <p>
        <strong>Amount Paid:</strong>
        ₦${Number(amount).toLocaleString()}
      </p>

      <p>
        <strong>Date:</strong>
        ${new Date(paidAt).toLocaleString()}
      </p>

      <p>
        <strong>Status:</strong>
        SUCCESS
      </p>

    </div>

    <p style="margin-top:30px;">
      Your HEALS application is now being processed.
    </p>

    <p>
      Regards,<br/>
      GIEVA HEALS Team
    </p>

  </div>
  `;
};

export const webinarCampaignTemplate =
({
  name,
  campaignTitle,
  description,
  startDate,
  joinLink,
  imageUrl,
}) => {

  return `

  <div style="
    font-family: Arial;
    max-width: 700px;
    margin:auto;
    padding:20px;
    background:#ffffff;
  ">

    <img
      src="${imageUrl}"
      style="
        width:100%;
        border-radius:12px;
        margin-bottom:20px;
      "
    />

    <h1 style="
      color:#1E7F4F;
      margin-bottom:10px;
    ">
      🎥 ${campaignTitle}
    </h1>

    <p>
      Hello ${name},
    </p>

    <p>
      You are invited to join our upcoming webinar session.
    </p>

    <div style="
      background:#f5f5f5;
      padding:20px;
      border-radius:10px;
      margin:20px 0;
    ">

      <p>
        ${description}
      </p>

      <p>
        <strong>Date:</strong>
        ${new Date(startDate)
          .toLocaleString()}
      </p>

    </div>

    <a
      href="${joinLink}"

      style="
        display:inline-block;
        background:#1E7F4F;
        color:white;
        text-decoration:none;
        padding:14px 22px;
        border-radius:8px;
        font-weight:bold;
      "
    >
      Join Webinar
    </a>

    <p style="
      margin-top:30px;
      color:#777;
      font-size:13px;
    ">
      GIEVA LMS Team
    </p>

  </div>
  `;
};

export const satCampaignTemplate =
({
  name,
  campaignTitle,
  startDate,
  registrationLink,
}) => {

  return `

  <div style="
    font-family:Arial;
    max-width:700px;
    margin:auto;
    padding:20px;
  ">

    <h1 style="
      color:#6C2BD9;
    ">
      🎓 SAT Preparation Program
    </h1>

    <p>
      Dear ${name},
    </p>

    <p>
      We are excited to invite you to our
      <strong>
        ${campaignTitle}
      </strong>.
    </p>

    <div style="
      background:#f8f8f8;
      padding:20px;
      border-radius:10px;
      margin:20px 0;
    ">

      <p>
        <strong>Start Date:</strong>
        ${new Date(startDate)
          .toLocaleDateString()}
      </p>

      <p>
        Improve your SAT score with expert tutors,
        guided practice, and live sessions.
      </p>

    </div>

    <a
      href="${registrationLink}"

      style="
        display:inline-block;
        background:#6C2BD9;
        color:white;
        padding:14px 22px;
        text-decoration:none;
        border-radius:8px;
        font-weight:bold;
      "
    >
      Register Now
    </a>

  </div>
  `;
};

export const campaignReminderTemplate =
({
  name,
  campaignTitle,
  startDate,
}) => {

  return `

  <div style="
    font-family:Arial;
    padding:20px;
  ">

    <h2>
      ⏰ Campaign Reminder
    </h2>

    <p>
      Hello ${name},
    </p>

    <p>
      This is a reminder that:
    </p>

    <h3>
      ${campaignTitle}
    </h3>

    <p>
      starts on:
      <strong>
        ${new Date(startDate)
          .toLocaleString()}
      </strong>
    </p>

    <p>
      We look forward to seeing you there.
    </p>

  </div>
  `;
};

export const thankYouCampaignTemplate =
({
  name,
  campaignTitle,
}) => {

  return `

  <div style="
    font-family:Arial;
    padding:20px;
  ">

    <h2>
      🎉 Thank You
    </h2>

    <p>
      Dear ${name},
    </p>

    <p>
      Thank you for participating in:
    </p>

    <h3>
      ${campaignTitle}
    </h3>

    <p>
      We appreciate your engagement and
      hope to see you again soon.
    </p>

    <p>
      — GIEVA LMS Team
    </p>

  </div>
  `;
};

export const examReceiptTemplate = (
  fullName,
  examType,
  amount,
  registrationCode
) => `
<h2>Exam Registration Successful</h2>

<p>Hello ${fullName},</p>

<p>Your ${examType} registration payment has been received successfully.</p>

<ul>
  <li><b>Registration Code:</b> ${registrationCode}</li>
  <li><b>Exam Type:</b> ${examType}</li>
  <li><b>Amount:</b> ₦${amount}</li>
</ul>

<p>Our team will begin processing your registration shortly.</p>

<p>Thank you,<br/>GIEVA</p>
`;

export const failedExamPaymentTemplate = (
  fullName,
  examType
) => `
<h2>Payment Failed</h2>

<p>Hello ${fullName},</p>

<p>Unfortunately we could not verify your payment for the ${examType} registration.</p>

<p>Please try again or contact support.</p>

<p>Thank you,<br/>GIEVA</p>
`;

export const internalExamRegistrationTemplate = (
  registration,
  user
) => `
<h2>New Exam Registration</h2>

<p><b>Name:</b> ${user.fullName}</p>
<p><b>Email:</b> ${user.email}</p>

<p><b>Registration Code:</b> ${registration.registrationCode}</p>
<p><b>Exam Type:</b> ${registration.examType}</p>

<p><b>Amount Paid:</b> ₦${registration.amount}</p>

<pre>
${JSON.stringify(
  registration.data,
  null,
  2
)}
</pre>
`;

export const examStatusUpdateTemplate = (
  registration,
  status
) => {

  const statusMessages = {
    submitted: {
      title:
        "Registration Submitted Successfully",

      message:
        "We have received your registration and payment successfully. Our admissions team will review your application shortly.",
    },

    under_review: {
      title:
        "Application Under Review",

      message:
        "Your application is currently being reviewed by our admissions team. We will notify you once the review process is completed.",
    },

    processing: {
      title:
        "Application Being Processed",

      message:
        "Your registration has passed review and is now being processed by our team. We are currently working on your application.",
    },

    completed: {
      title:
        "Application Completed",

      message:
        "Congratulations. Your registration has been successfully completed by our team.",
    },

    rejected: {
      title:
        "Application Rejected",

      message:
        registration.rejectionReason ||
        "Unfortunately, your application could not be approved at this time.",
    },

    cancelled: {
      title:
        "Application Cancelled",

      message:
        "Your registration has been cancelled. Please contact support if you believe this was done in error.",
    },
  };

  const current =
    statusMessages[status] ||
    {
      title: "Application Update",
      message:
        "There is an update regarding your application.",
    };

  return `
  <div style="
    font-family: Arial, sans-serif;
    max-width: 700px;
    margin: auto;
    padding: 20px;
    border: 1px solid #eee;
    border-radius: 10px;
  ">

    <h2 style="color:#0d6efd;">
      GIEVA Exam Registration Update
    </h2>

    <p>
      Dear Applicant,
    </p>

    <p>
      Your
      <strong>${registration.examType}</strong>
      registration has been updated.
    </p>

    <div style="
      background:#f8f9fa;
      padding:15px;
      border-radius:8px;
      margin:20px 0;
    ">
      <h3 style="margin-top:0;">
        ${current.title}
      </h3>

      <p>
        ${current.message}
      </p>
    </div>

    <table
      style="
        width:100%;
        border-collapse:collapse;
      "
    >
      <tr>
        <td><strong>Registration Code</strong></td>
        <td>${registration.registrationCode}</td>
      </tr>

      <tr>
        <td><strong>Exam Type</strong></td>
        <td>${registration.examType}</td>
      </tr>

      <tr>
        <td><strong>Current Status</strong></td>
        <td>${registration.status}</td>
      </tr>

      <tr>
        <td><strong>Payment Status</strong></td>
        <td>${registration.paymentStatus}</td>
      </tr>
    </table>

    ${
      registration.adminNotes
        ? `
        <div style="
          margin-top:20px;
          padding:15px;
          background:#fff8e1;
          border-left:4px solid #ffc107;
        ">
          <strong>Admin Notes</strong>
          <p>${registration.adminNotes}</p>
        </div>
      `
        : ""
    }

    ${
      registration.rejectionReason
        ? `
        <div style="
          margin-top:20px;
          padding:15px;
          background:#ffebee;
          border-left:4px solid #dc3545;
        ">
          <strong>Reason</strong>
          <p>${registration.rejectionReason}</p>
        </div>
      `
        : ""
    }

    <p style="margin-top:30px;">
      If you have any questions, please contact the GIEVA support team.
    </p>

    <p>
      Regards,<br/>
      <strong>GIEVA Admissions Team</strong>
    </p>

  </div>
  `;
};