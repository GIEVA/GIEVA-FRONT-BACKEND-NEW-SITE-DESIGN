import { Box, Container, Typography, Stack, Divider, Breadcrumbs, Link as MuiLink } from "@mui/material";
import { Link } from "react-router-dom";
import { Home, ChevronRight } from "@mui/icons-material";

const NAVY = "#0B1F3A";
const GREEN = "#16A34A";
const BG = "#F8FAFC";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

const Section = ({ title, children }) => (
  <Box sx={{ mb: 5 }}>
    <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 800, color: NAVY, mb: 2 }}>
      {title}
    </Typography>
    <Stack spacing={2}>{children}</Stack>
  </Box>
);

const P = ({ children }) => (
  <Typography sx={{ fontSize: 15, color: MUTED, lineHeight: 1.85 }}>{children}</Typography>
);

const List = ({ items }) => (
  <Box component="ul" sx={{ pl: 3, m: 0 }}>
    {items.map((item, i) => (
      <Typography key={i} component="li" sx={{ fontSize: 15, color: MUTED, lineHeight: 1.85, mb: 0.75 }}>
        {item}
      </Typography>
    ))}
  </Box>
);

export default function PrivacyPolicy() {
  const lastUpdated = "August 12, 2026";

  return (
    <Box sx={{ bgcolor: BG, minHeight: "100vh" }}>
      <Box sx={{ background: `linear-gradient(160deg, ${NAVY} 0%, #123059 100%)`, color: "#fff", px: { xs: 3, md: 8 }, pt: { xs: 8, md: 10 }, pb: { xs: 6, md: 8 } }}>
        <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }} />} sx={{ mb: 3 }}>
          <MuiLink component={Link} to="/" sx={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 0.5 }}>
            <Home sx={{ fontSize: 14 }} /> Home
          </MuiLink>
          <Typography sx={{ color: "#fff", fontSize: 13 }}>Privacy Policy</Typography>
        </Breadcrumbs>
        <Typography sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 800 }}>Privacy Policy</Typography>
        <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,0.7)", fontSize: 14 }}>Last updated: {lastUpdated}</Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 6, md: 9 } }}>
        <P>
          Global Integrated Education Volunteers Association ("GIEVA," "we," "us," or "our") operates gieva.org
          and related platforms (collectively, the "Platform"), providing educational consultancy, exam
          registration, course delivery, live classes, and related services. This Privacy Policy explains how
          we collect, use, disclose, and safeguard information when you use the Platform, and describes your
          rights regarding that information. By using the Platform, you agree to the practices described here.
        </P>

        <Divider sx={{ my: 5, borderColor: BORDER }} />

        <Section title="1. Information We Collect">
          <P><strong>a. Information you provide directly:</strong></P>
          <List
            items={[
              "Account information: full name, email address, password (stored as a hash, never in plain text), role (student, tutor, applicant, etc.).",
              "Profile information: phone number, date of birth, gender, nationality, and other details required for exam registration, HEALS applications, or consultancy bookings.",
              "Payment-related information: transaction references, billing details, and amounts, processed through our third-party payment gateway (see Section 4). We do not store full card numbers or bank credentials on our own servers.",
              "Documents you upload: passports, transcripts, statements of purpose, recommendation letters, bank statements, and other files submitted for HEALS applications, exam registration, or consultancy services.",
              "Communications: messages sent via contact forms, consultation bookings, campaign registrations, or support requests.",
              "Content you submit: course progress, quiz responses, live class attendance, and any material you upload as a tutor or student.",
            ]}
          />
          <P><strong>b. Information collected automatically:</strong></P>
          <List
            items={[
              "Log data: IP address, browser type, device information, pages visited, and timestamps.",
              "Cookies and similar technologies used to keep you logged in, remember preferences, and understand how the Platform is used (see Section 6).",
            ]}
          />
        </Section>

        <Section title="2. How We Use Your Information">
          <List
            items={[
              "To create and manage your account and provide access to courses, live classes, and services.",
              "To process exam registrations, consultancy bookings, and HEALS applications, and to communicate with relevant third parties (e.g., testing bodies, universities, visa-processing partners) on your behalf where you have authorized us to do so.",
              "To process payments through our payment gateway and to send confirmations, receipts, and related communications.",
              "To send administrative communications, service updates, reminders (e.g., session reminders, consultation reminders), and, where you have opted in, marketing or campaign communications.",
              "To monitor, maintain, and improve the security, performance, and functionality of the Platform.",
              "To detect, investigate, and prevent fraud, abuse, or violations of our Terms and Conditions.",
              "To comply with legal obligations, including tax, financial reporting, and regulatory requirements.",
            ]}
          />
        </Section>

        <Section title="3. Legal Basis for Processing">
          <P>
            Where applicable data protection law requires a legal basis for processing (including under the
            Nigeria Data Protection Act), we rely on one or more of the following: your consent, the necessity
            of processing to perform a contract with you (e.g., to deliver a service you registered for), our
            legitimate interests in operating and securing the Platform, and compliance with legal obligations.
          </P>
        </Section>

        <Section title="4. Third-Party Service Providers">
          <P>
            We share information with third-party service providers who perform services on our behalf, under
            contractual obligations to protect your data. These include:
          </P>
          <List
            items={[
              "Payment processors, to securely process exam fees, consultancy fees, and other payments. We do not control and are not responsible for the privacy practices of payment processors beyond our contractual arrangements with them.",
              "Cloud storage and media providers (e.g., Cloudinary), to host uploaded images and documents.",
              "Email and notification service providers, to send transactional and administrative communications.",
              "Video conferencing / live-session providers, to deliver live classes and consultations.",
              "Analytics providers, to help us understand Platform usage and improve our services.",
            ]}
          />
          <P>
            We do not sell your personal information to third parties. We may disclose information to
            educational institutions, testing bodies, or visa/consular authorities strictly where necessary to
            fulfil a service you have requested (e.g., forwarding your exam registration or HEALS application),
            and only with your knowledge that such forwarding is part of the service.
          </P>
        </Section>

        <Section title="5. Data Retention">
          <P>
            We retain personal information for as long as necessary to provide the Platform's services, comply
            with legal obligations, resolve disputes, and enforce our agreements. Exam registration records,
            payment records, and application documents may be retained for longer periods where required by
            regulatory, tax, or record-keeping obligations. You may request deletion of your account and
            associated data, subject to the retention exceptions described above.
          </P>
        </Section>

        <Section title="6. Cookies and Tracking Technologies">
          <P>
            We use cookies and similar technologies to authenticate users, maintain session state, remember
            preferences, and analyze Platform usage. You can control cookies through your browser settings;
            disabling cookies may limit your ability to use certain features of the Platform (such as staying
            logged in).
          </P>
        </Section>

        <Section title="7. Data Security">
          <P>
            We implement reasonable administrative, technical, and physical safeguards designed to protect your
            information, including password hashing, access controls, and encrypted transmission (HTTPS) where
            supported. However, no method of transmission or storage over the internet is 100% secure. You
            acknowledge and accept this inherent risk when using the Platform, and you are responsible for
            keeping your account credentials confidential.
          </P>
        </Section>

        <Section title="8. International Data Transfers">
          <P>
            As GIEVA works with students, institutions, and partners across multiple countries, your
            information may be transferred to, stored, and processed in countries other than your country of
            residence, including countries that may not have data protection laws equivalent to those in your
            jurisdiction. By using the Platform, you consent to such transfers, which we undertake with
            appropriate safeguards where required by applicable law.
          </P>
        </Section>

        <Section title="9. Children's Privacy">
          <P>
            Some of our services (e.g., secondary school exam registration such as SAT/ACT) may involve users
            under the age of 18. Where a user is a minor, we require that a parent, guardian, or authorized
            agent provides consent and supervises the registration process. We do not knowingly collect
            personal information directly from children without appropriate consent, and we encourage parents
            and guardians to be actively involved in their child's use of the Platform.
          </P>
        </Section>

        <Section title="10. Your Rights">
          <P>Subject to applicable law, you may have the right to:</P>
          <List
            items={[
              "Access the personal information we hold about you.",
              "Request correction of inaccurate or incomplete information.",
              "Request deletion of your personal information, subject to legal retention requirements.",
              "Object to or restrict certain processing of your information.",
              "Withdraw consent where processing is based on consent, without affecting the lawfulness of processing before withdrawal.",
              "Lodge a complaint with the applicable data protection authority.",
            ]}
          />
          <P>
            To exercise these rights, contact us using the details in Section 13. We may need to verify your
            identity before fulfilling certain requests.
          </P>
        </Section>

        <Section title="11. Third-Party Links">
          <P>
            The Platform may contain links to third-party websites (e.g., College Board, testing centers,
            university portals). We are not responsible for the privacy practices or content of third-party
            websites. We encourage you to review the privacy policies of any third-party site you visit.
          </P>
        </Section>

        <Section title="12. Changes to This Policy">
          <P>
            We may update this Privacy Policy from time to time. Material changes will be indicated by updating
            the "Last updated" date above, and, where appropriate, communicated through the Platform or by
            email. Continued use of the Platform after changes take effect constitutes acceptance of the
            revised policy.
          </P>
        </Section>

        <Section title="13. Contact Us">
          <P>
            If you have questions, concerns, or requests regarding this Privacy Policy or your personal
            information, please contact us at:
          </P>
          <List
            items={[
              "Email: contact@gieva.org",
              "Abuja Office: Lagos State House, Plot 78 Ralph Shodeinde Street, 3rd Floor, Suite 329, Central Business District, Abuja",
              "Phone: +234 703-525-0399",
            ]}
          />
        </Section>
      </Container>
    </Box>
  );
}