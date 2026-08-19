import { Box, Container, Typography, Stack, Divider, Breadcrumbs, Link as MuiLink } from "@mui/material";
import { Link } from "react-router-dom";
import { Home, ChevronRight } from "@mui/icons-material";

const NAVY = "#0B1F3A";
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

export default function TermsOfService() {
  const lastUpdated = "August 12, 2026";

  return (
    <Box sx={{ bgcolor: BG, minHeight: "100vh" }}>
      <Box sx={{ background: `linear-gradient(160deg, ${NAVY} 0%, #123059 100%)`, color: "#fff", px: { xs: 3, md: 8 }, pt: { xs: 8, md: 10 }, pb: { xs: 6, md: 8 } }}>
        <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }} />} sx={{ mb: 3 }}>
          <MuiLink component={Link} to="/" sx={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 0.5 }}>
            <Home sx={{ fontSize: 14 }} /> Home
          </MuiLink>
          <Typography sx={{ color: "#fff", fontSize: 13 }}>Terms of Service</Typography>
        </Breadcrumbs>
        <Typography sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 800 }}>Terms and Conditions</Typography>
        <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,0.7)", fontSize: 14 }}>Last updated: {lastUpdated}</Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 6, md: 9 } }}>
        <P>
          These Terms and Conditions ("Terms") govern your access to and use of gieva.org and all related
          services (collectively, the "Platform"), operated by Global Integrated Education Volunteers
          Association ("GIEVA," "we," "us," "our"). By creating an account, registering for an exam, booking a
          consultation, enrolling in a course, or otherwise using the Platform, you agree to be bound by these
          Terms. If you do not agree, you must not use the Platform.
        </P>

        <Divider sx={{ my: 5, borderColor: BORDER }} />

        <Section title="1. Eligibility">
          <P>
            You must be at least 18 years old to create an account and enter into these Terms independently.
            Users under 18 may use certain services (such as exam registration) only with the involvement,
            consent, and supervision of a parent, guardian, or authorized agent, who accepts these Terms on the
            minor's behalf and assumes responsibility for the minor's use of the Platform.
          </P>
        </Section>

        <Section title="2. Nature of Our Services">
          <P>
            GIEVA provides educational consultancy, exam registration facilitation, course delivery, live
            classes, HEALS applications, and related services. You acknowledge and agree that:
          </P>
          <List
            items={[
              "GIEVA acts as a facilitator and intermediary for services such as exam registration (e.g., SAT, ACT, TOEFL, IELTS, GRE) and does not control the policies, test dates, availability, scoring, or admissions decisions of third-party bodies such as College Board, ETS, universities, or visa/consular authorities.",
              "GIEVA does not guarantee admission to any institution, a particular exam score, visa approval, scholarship award, or any other outcome dependent on a third party's independent decision.",
              "Course content, live classes, and consultancy advice are provided for educational and informational purposes and do not constitute legal, immigration, or financial advice unless explicitly stated.",
              "Availability of specific programs, exam types, or consultancy slots is subject to change without notice.",
            ]}
          />
        </Section>

        <Section title="3. Account Registration and Security">
          <List
            items={[
              "You must provide accurate, current, and complete information when creating an account and registering for services.",
              "You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
              "You must notify us immediately of any unauthorized use of your account or any other breach of security.",
              "GIEVA is not liable for any loss or damage arising from your failure to comply with this section.",
            ]}
          />
        </Section>

        <Section title="4. Payments, Fees, and Refunds">
          <List
            items={[
              "Fees for exam registration, consultancy services, courses, and other paid services are as displayed on the Platform at the time of purchase and are subject to change without prior notice for future transactions.",
              "All payments are processed through our third-party payment gateway. By making a payment, you agree to that provider's applicable terms in addition to these Terms.",
              "Except where required by applicable consumer protection law, all fees are non-refundable once a service has been rendered, once an exam registration has been submitted to the relevant testing body, or once a document has been forwarded to a third party on your behalf, because such actions are typically irreversible on the third party's end.",
              "Where a refund is requested prior to any service being rendered or third-party submission occurring, refunds (if approved) may be subject to an administrative processing fee.",
              "You are responsible for verifying all details (test dates, center codes, personal information) before submitting payment, as errors caused by incorrect information you provided are not grounds for refund.",
              "GIEVA reserves the right, at its sole discretion, to decline, cancel, or reverse any transaction suspected of being fraudulent or in violation of these Terms.",
            ]}
          />
        </Section>

        <Section title="5. User Conduct">
          <P>You agree not to:</P>
          <List
            items={[
              "Use the Platform for any unlawful purpose or in violation of any applicable law or regulation.",
              "Submit false, misleading, or fraudulent information in any application, registration, or profile.",
              "Attempt to gain unauthorized access to any part of the Platform, other users' accounts, or our systems.",
              "Upload or transmit viruses, malware, or any code intended to disrupt or damage the Platform.",
              "Copy, reproduce, distribute, or create derivative works from course content, materials, or Platform content without our express written permission.",
              "Impersonate any person or entity, or misrepresent your affiliation with any person or entity.",
              "Use automated means (bots, scrapers) to access or extract data from the Platform without authorization.",
              "Harass, abuse, or harm other users, tutors, or staff.",
            ]}
          />
          <P>
            We reserve the right to suspend or terminate any account, without refund, that we determine, in our
            sole discretion, to have violated this section.
          </P>
        </Section>

        <Section title="6. Intellectual Property">
          <P>
            All content on the Platform, including but not limited to text, graphics, logos, course materials,
            videos, and software, is the property of GIEVA or its licensors and is protected by applicable
            intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to
            access and use the Platform's content for your personal, non-commercial educational use only. Any
            other use requires our prior written consent.
          </P>
        </Section>

        <Section title="7. User-Submitted Content">
          <P>
            By uploading content to the Platform (documents, profile information, forum posts, tutor-submitted
            course materials, etc.), you grant GIEVA a non-exclusive, royalty-free, worldwide license to store,
            process, and use that content solely for the purpose of providing and improving the Platform's
            services. You represent that you have the right to submit such content and that it does not
            infringe any third party's rights.
          </P>
        </Section>

        <Section title="8. Disclaimers">
          <P>
            THE PLATFORM AND ALL SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY
            KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR THAT THE PLATFORM WILL BE
            UNINTERRUPTED, SECURE, OR ERROR-FREE. GIEVA DOES NOT WARRANT OR GUARANTEE ANY SPECIFIC OUTCOME,
            INCLUDING ADMISSION, EXAM RESULTS, VISA APPROVAL, OR SCHOLARSHIP AWARDS.
          </P>
        </Section>

        <Section title="9. Limitation of Liability">
          <P>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, GIEVA, ITS DIRECTORS, EMPLOYEES, VOLUNTEERS,
            AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OPPORTUNITY, OR GOODWILL, ARISING FROM OR RELATED TO
            YOUR USE OF THE PLATFORM, WHETHER BASED ON CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR
            OTHERWISE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </P>
          <P>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, GIEVA'S TOTAL AGGREGATE LIABILITY TO YOU FOR ANY CLAIM
            ARISING OUT OF OR RELATING TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE TOTAL AMOUNT YOU
            PAID TO GIEVA FOR THE SPECIFIC SERVICE GIVING RISE TO THE CLAIM IN THE SIX (6) MONTHS PRECEDING THE
            EVENT GIVING RISE TO LIABILITY.
          </P>
          <P>
            Nothing in these Terms excludes or limits liability that cannot be excluded or limited under
            applicable law, including liability for fraud or willful misconduct.
          </P>
        </Section>

        <Section title="10. Indemnification">
          <P>
            You agree to indemnify, defend, and hold harmless GIEVA and its directors, employees, volunteers,
            agents, and affiliates from and against any claims, liabilities, damages, losses, and expenses
            (including reasonable legal fees) arising out of or in any way connected with: (a) your use or
            misuse of the Platform; (b) your violation of these Terms; (c) your violation of any rights of a
            third party; or (d) any information or content you submit to the Platform.
          </P>
        </Section>

        <Section title="11. Third-Party Services and Links">
          <P>
            The Platform may facilitate interactions with third-party bodies (testing organizations,
            universities, payment processors, visa authorities). GIEVA is not responsible for the acts,
            omissions, policies, or availability of any third party. Your use of third-party services is
            governed by that third party's own terms and policies.
          </P>
        </Section>

        <Section title="12. Termination">
          <P>
            We may suspend or terminate your access to the Platform at any time, with or without notice, for
            conduct that we believe violates these Terms, is harmful to other users, or is otherwise
            objectionable, without liability to you. You may terminate your account at any time by contacting
            us. Provisions of these Terms that by their nature should survive termination (including Sections
            6, 8, 9, 10, and 14) will survive.
          </P>
        </Section>

        <Section title="13. Changes to These Terms">
          <P>
            We may revise these Terms from time to time. Material changes will be indicated by updating the
            "Last updated" date above and, where appropriate, communicated via the Platform or email. Your
            continued use of the Platform after changes take effect constitutes acceptance of the revised
            Terms. If you do not agree to the revised Terms, you must stop using the Platform.
          </P>
        </Section>

        <Section title="14. Governing Law and Dispute Resolution">
          <P>
            These Terms are governed by and construed in accordance with the laws of the Federal Republic of
            Nigeria, without regard to conflict-of-law principles. Any dispute arising out of or relating to
            these Terms or the Platform shall first be addressed through good-faith negotiation between the
            parties. If unresolved within thirty (30) days, the dispute shall be submitted to arbitration in
            Abuja, Nigeria, in accordance with the Arbitration and Conciliation Act, or, at GIEVA's election,
            to the exclusive jurisdiction of the courts of the Federal Capital Territory, Abuja, Nigeria.
          </P>
        </Section>

        <Section title="15. Severability">
          <P>
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be
            limited or eliminated to the minimum extent necessary so that the remaining Terms remain in full
            force and effect.
          </P>
        </Section>

        <Section title="16. Entire Agreement">
          <P>
            These Terms, together with our Privacy Policy and any service-specific terms presented to you at
            the point of purchase, constitute the entire agreement between you and GIEVA regarding your use of
            the Platform, superseding any prior agreements.
          </P>
        </Section>

        <Section title="17. Contact Us">
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