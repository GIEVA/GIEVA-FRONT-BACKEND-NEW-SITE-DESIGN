import {
    Hero,
    Partners,
    Services,
    AboutPreview,
    WhyChooseUs,
    Statistics,
    Programs,
    Testimonials,
    Campaigns,
    News
} from "./home"

export default function HomePage() {
  return (
    <>
      <Hero />

      <Partners />

      <Services />

      <AboutPreview />

      <WhyChooseUs />

      <Statistics />

      <Programs />

      <Testimonials />

      <Campaigns />

      <News />
    </>
  );
}

// // pages/Home.jsx  (or LandingPage.jsx — wire to "/" in App.jsx)
// //
// // Converted from Astro BaseLayout + page components to React.
// // Matches the GIEVA.org landing page design exactly.
// // Uses only @mui/material, react-router-dom, and inline MUI sx styles —
// // consistent with every other page in this codebase.

// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   Box, Container, Typography, Button, Grid, Paper,
//   Accordion, AccordionSummary, AccordionDetails,
//   TextField, InputAdornment, IconButton, Divider,
//   Stack, Chip,
// } from "@mui/material";
// import {
//   ExpandMore, Search, Add, ArrowForward, Menu, Close,
//   Facebook, Twitter, Instagram, LinkedIn, YouTube,
// } from "@mui/icons-material";

// // ─── Brand tokens ─────────────────────────────────────────────
// const NAVY    = "#0B1F3A";   // primary dark
// const ORANGE  = "#E8651A";   // brand accent / CTA
// const GREEN   = "#1E7F4F";   // secondary CTA
// const WHITE   = "#FFFFFF";
// const OFF_WHITE = "#F7F9FC";
// const MUTED   = "#64748B";
// const TEXT    = "#1A2332";
// const BORDER  = "#E6E9F0";

// // ─── Reusable section label ────────────────────────────────────
// const SectionLabel = ({ children, color = ORANGE }) => (
//   <Typography sx={{
//     fontSize: 11, fontWeight: 800, letterSpacing: 2,
//     textTransform: "uppercase", color, mb: 1,
//   }}>
//     {children}
//   </Typography>
// );

// // ─── NAV ──────────────────────────────────────────────────────
// const NAV_LINKS = ["Consultancy", "About", "Services", "Resources"];

// function SiteHeader() {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const navigate = useNavigate();

//   return (
//     <Box component="header" sx={{
//       position: "sticky", top: 0, zIndex: 1100,
//       bgcolor: WHITE, borderBottom: `1px solid ${BORDER}`,
//       boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
//     }}>
//       <Container maxWidth="xl">
//         <Box sx={{ display: "flex", alignItems: "center", height: 68, gap: 4 }}>
//           {/* Logo */}
//           <Box component={Link} to="/"
//             sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none" }}>
//             <Box sx={{
//               width: 32, height: 32, borderRadius: "50%",
//               background: `linear-gradient(135deg, ${ORANGE}, ${GREEN})`,
//               display: "flex", alignItems: "center", justifyContent: "center",
//             }}>
//               <Typography sx={{ color: WHITE, fontWeight: 900, fontSize: 14 }}>G</Typography>
//             </Box>
//             <Typography sx={{ fontWeight: 900, fontSize: 18, color: NAVY }}>
//               GIEVA<Typography component="span" sx={{ color: ORANGE }}>.org</Typography>
//             </Typography>
//           </Box>

//           {/* Desktop nav */}
//           <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3.5, flex: 1 }}>
//             {NAV_LINKS.map((link) => (
//               <Typography key={link} component={Link} to={`/${link.toLowerCase()}`}
//                 sx={{ fontSize: 14, fontWeight: 600, color: TEXT, textDecoration: "none",
//                       "&:hover": { color: ORANGE }, transition: "color 0.15s" }}>
//                 {link}
//               </Typography>
//             ))}
//           </Box>

//           {/* Search */}
//           <IconButton sx={{ color: MUTED, display: { xs: "none", md: "flex" } }}>
//             <Search sx={{ fontSize: 20 }} />
//           </IconButton>

//           {/* Login */}
//           <Button component={Link} to="/login" variant="outlined"
//             sx={{
//               display: { xs: "none", md: "flex" },
//               textTransform: "none", fontWeight: 700, fontSize: 13,
//               borderColor: BORDER, color: TEXT, borderRadius: 2,
//               "&:hover": { borderColor: NAVY, color: NAVY },
//             }}>
//             Log in
//           </Button>

//           {/* Book CTA */}
//           <Button component={Link} to="/exam-register" variant="contained"
//             sx={{
//               display: { xs: "none", md: "flex" },
//               textTransform: "none", fontWeight: 700, fontSize: 13,
//               bgcolor: GREEN, color: WHITE, borderRadius: 2, px: 2.5,
//               "&:hover": { bgcolor: "#166d3e" },
//             }}>
//             Book Consultation
//           </Button>

//           {/* Mobile hamburger */}
//           <IconButton sx={{ display: { md: "none" }, ml: "auto" }}
//             onClick={() => setMobileOpen(!mobileOpen)}>
//             {mobileOpen ? <Close /> : <Menu />}
//           </IconButton>
//         </Box>
//       </Container>

//       {/* Mobile menu */}
//       {mobileOpen && (
//         <Box sx={{ bgcolor: WHITE, borderTop: `1px solid ${BORDER}`, py: 2 }}>
//           <Container maxWidth="xl">
//             <Stack spacing={1}>
//               {NAV_LINKS.map((link) => (
//                 <Typography key={link} component={Link} to={`/${link.toLowerCase()}`}
//                   onClick={() => setMobileOpen(false)}
//                   sx={{ fontSize: 15, fontWeight: 600, color: TEXT, textDecoration: "none",
//                         py: 1, "&:hover": { color: ORANGE } }}>
//                   {link}
//                 </Typography>
//               ))}
//               <Divider />
//               <Button component={Link} to="/login" fullWidth variant="outlined"
//                 sx={{ textTransform: "none", fontWeight: 700, borderColor: BORDER, color: TEXT }}>
//                 Log in
//               </Button>
//               <Button component={Link} to="/exam-register" fullWidth variant="contained"
//                 sx={{ textTransform: "none", fontWeight: 700, bgcolor: GREEN, color: WHITE }}>
//                 Book Consultation
//               </Button>
//             </Stack>
//           </Container>
//         </Box>
//       )}
//     </Box>
//   );
// }

// // ─── HERO ─────────────────────────────────────────────────────
// function HeroSection() {
//   return (
//     <Box sx={{ bgcolor: WHITE, pt: { xs: 6, md: 8 }, pb: { xs: 6, md: 10 }, overflow: "hidden" }}>
//       <Container maxWidth="xl">
//         {/* Breadcrumb */}
//         <Typography sx={{ fontSize: 11, color: MUTED, mb: 3, letterSpacing: 0.5 }}>
//           EDUCATION / GIEVA /
//         </Typography>

//         <Grid container spacing={4} alignItems="center">
//           <Grid item xs={12} md={6}>
//             <Typography sx={{
//               fontSize: { xs: 36, md: 52, lg: 60 },
//               fontWeight: 900, color: NAVY, lineHeight: 1.1, mb: 2,
//             }}>
//               Your Gateway to{" "}
//               <Typography component="span" sx={{
//                 fontStyle: "italic", color: ORANGE,
//                 fontSize: "inherit", fontWeight: "inherit",
//               }}>
//                 Global
//               </Typography>{" "}
//               Academic{" "}
//               <Typography component="span" sx={{
//                 fontStyle: "italic",
//                 fontSize: "inherit", fontWeight: "inherit", color: NAVY,
//               }}>
//                 Excellence.
//               </Typography>
//             </Typography>

//             <Typography sx={{ fontSize: 16, color: MUTED, mb: 4, maxWidth: 480, lineHeight: 1.7 }}>
//               From standardised test registration to university admissions — GIEVA's certified
//               consultants guide every step of your international education journey.
//             </Typography>

//             <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
//               <Button component={Link} to="/exam-register" variant="contained"
//                 sx={{
//                   textTransform: "none", fontWeight: 800, fontSize: 15,
//                   bgcolor: ORANGE, color: WHITE, borderRadius: 2.5, px: 3.5, py: 1.5,
//                   "&:hover": { bgcolor: "#c95510" },
//                 }}>
//                 Book Consultation
//               </Button>
//               <Button component={Link} to="/exam-register" variant="outlined"
//                 sx={{
//                   textTransform: "none", fontWeight: 700, fontSize: 15,
//                   borderColor: NAVY, color: NAVY, borderRadius: 2.5, px: 3.5, py: 1.5,
//                   "&:hover": { bgcolor: NAVY, color: WHITE },
//                 }}>
//                 Take Test
//               </Button>
//             </Stack>
//           </Grid>

//           {/* Colorful ring graphic */}
//           <Grid item xs={12} md={6} sx={{ display: "flex", justifyContent: "center" }}>
//             <Box sx={{ position: "relative", width: { xs: 260, md: 380 }, height: { xs: 260, md: 380 } }}>
//               {/* Multi-color ring using layered arcs */}
//               {["#E8651A","#1E7F4F","#3b82f6","#f59e0b","#8b5cf6","#ef4444"].map((color, i) => (
//                 <Box key={i} sx={{
//                   position: "absolute",
//                   inset: `${i * 14}px`,
//                   borderRadius: "50%",
//                   border: `${18 - i * 1.5}px solid ${color}`,
//                   opacity: 1 - i * 0.08,
//                   transform: `rotate(${i * 25}deg)`,
//                   borderTopColor: "transparent",
//                   borderLeftColor: "transparent",
//                 }} />
//               ))}
//               {/* Inner content */}
//               <Box sx={{
//                 position: "absolute", inset: "25%",
//                 borderRadius: "50%",
//                 background: `linear-gradient(135deg, ${ORANGE}33, ${GREEN}33)`,
//                 display: "flex", alignItems: "center", justifyContent: "center",
//               }}>
//                 <Typography sx={{ fontSize: 28, fontWeight: 900, color: NAVY }}>G</Typography>
//               </Box>
//             </Box>
//           </Grid>
//         </Grid>
//       </Container>
//     </Box>
//   );
// }

// // ─── TRUSTED PARTNERS ─────────────────────────────────────────
// const PARTNERS = ["Microsoft", "CoLAB", "Drake", "ets", "UN", "ECOS"];

// function TrustedPartners() {
//   return (
//     <Box sx={{ bgcolor: OFF_WHITE, borderTop: `1px solid ${BORDER}`,
//                borderBottom: `1px solid ${BORDER}`, py: 3 }}>
//       <Container maxWidth="xl">
//         <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
//           <Typography sx={{ fontSize: 11, fontWeight: 800, color: MUTED,
//                              textTransform: "uppercase", letterSpacing: 1.5, flexShrink: 0 }}>
//             Trusted Partners
//           </Typography>
//           <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
//             {PARTNERS.map((p) => (
//               <Typography key={p} sx={{
//                 fontSize: { xs: 14, md: 16 }, fontWeight: 800,
//                 color: MUTED, letterSpacing: 0.5, opacity: 0.7,
//               }}>
//                 {p}
//               </Typography>
//             ))}
//           </Box>
//         </Box>
//       </Container>
//     </Box>
//   );
// }

// // ─── WHO WE ARE ───────────────────────────────────────────────
// function WhoWeAre() {
//   return (
//     <Box sx={{ bgcolor: WHITE, py: { xs: 7, md: 10 } }}>
//       <Container maxWidth="xl">
//         <SectionLabel>WHO WE ARE</SectionLabel>
//         <Grid container spacing={6} alignItems="flex-start">
//           <Grid item xs={12} md={5}>
//             <Typography sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 900,
//                                color: NAVY, lineHeight: 1.25 }}>
//               Global Integrated Education Volunteers Association (GIEVA)
//             </Typography>
//           </Grid>
//           <Grid item xs={12} md={7}>
//             <Typography sx={{ fontSize: 15, color: MUTED, lineHeight: 1.8, mb: 3 }}>
//               GIEVA was registered in 2012 as a nonprofit association to reduce barriers to quality
//               education and global learning opportunities among young Nigerians. Over the years, GIEVA
//               has grown to serve over 5,000 young Nigerians annually, with a strong focus on
//               inclusive education, digital empowerment, and youth development.
//             </Typography>
//             <Button component={Link} to="/about" variant="outlined"
//               sx={{
//                 textTransform: "none", fontWeight: 700, fontSize: 14,
//                 borderColor: ORANGE, color: ORANGE, borderRadius: 2,
//                 "&:hover": { bgcolor: ORANGE, color: WHITE, borderColor: ORANGE },
//               }}>
//               Learn more about us
//             </Button>
//           </Grid>
//         </Grid>
//       </Container>
//     </Box>
//   );
// }

// // ─── STATS BANNER ─────────────────────────────────────────────
// const STATS = [
//   { value: "10,000+", label: "Lives Changed" },
//   { value: "30+",     label: "Global Partners" },
//   { value: "12+",     label: "Years Active" },
//   { value: "98%",     label: "Success Rate" },
// ];

// function StatsBanner() {
//   return (
//     <Box sx={{ position: "relative", height: { xs: 320, md: 400 }, overflow: "hidden" }}>
//       {/* Classroom background image */}
//       <Box sx={{
//         position: "absolute", inset: 0,
//         backgroundImage: `url(https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=80)`,
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//         filter: "brightness(0.45)",
//       }} />

//       {/* Stats overlay */}
//       <Box sx={{
//         position: "absolute", bottom: 0, left: 0, right: 0,
//         background: "linear-gradient(transparent, rgba(11,31,58,0.95))",
//         pt: 8, pb: 5,
//       }}>
//         <Container maxWidth="xl">
//           <Grid container spacing={4}>
//             {STATS.map((s) => (
//               <Grid item xs={6} md={3} key={s.label}>
//                 <Typography sx={{ fontSize: { xs: 32, md: 44 }, fontWeight: 900, color: WHITE }}>
//                   {s.value}
//                 </Typography>
//                 <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
//                   {s.label}
//                 </Typography>
//               </Grid>
//             ))}
//           </Grid>
//         </Container>
//       </Box>
//     </Box>
//   );
// }

// // ─── SERVICES ─────────────────────────────────────────────────
// const SERVICES = [
//   { num: "01", title: "TEST REGISTRATION",     desc: "Practitioners rely on research as an important tool to enable them to study and understand conflict. It is also important that…" },
//   { num: "02", title: "STUDY ABROAD",          desc: "Practitioners rely on research as an important tool to enable them to study and understand conflict. It is also important that…" },
//   { num: "03", title: "PROFESSIONAL DEVELOPMENT", desc: "Practitioners rely on research as an important tool to enable them to study and understand conflict. It is also important that…" },
// ];

// function ConsultancyServices() {
//   return (
//     <Box sx={{ bgcolor: OFF_WHITE, py: { xs: 7, md: 10 } }}>
//       <Container maxWidth="xl">
//         <SectionLabel>CONSULTANCY SERVICES</SectionLabel>
//         <Typography sx={{
//           fontSize: { xs: 26, md: 38 }, fontWeight: 900,
//           color: NAVY, mb: 1, maxWidth: 600, lineHeight: 1.2,
//         }}>
//           We don't just register you.{" "}
//           <br />
//           We guide you{" "}
//           <Typography component="span" sx={{
//             fontStyle: "italic", color: ORANGE,
//             fontSize: "inherit", fontWeight: "inherit",
//           }}>
//             all the way to acceptance.
//           </Typography>
//         </Typography>
//         <Typography sx={{ fontSize: 15, color: MUTED, mb: 6, maxWidth: 500 }}>
//           GIEVA handles your entire registration process — from account setup to score reporting —
//           with certified guidance at every step.
//         </Typography>

//         <Grid container spacing={3}>
//           {SERVICES.map((s) => (
//             <Grid item xs={12} md={4} key={s.num}>
//               <Paper elevation={0} sx={{
//                 bgcolor: NAVY, borderRadius: 3, p: 4, height: "100%",
//                 cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
//                 "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 32px rgba(0,0,0,0.25)" },
//               }}>
//                 <Typography sx={{ fontSize: 13, fontWeight: 800, color: ORANGE,
//                                    letterSpacing: 1, mb: 3 }}>
//                   {s.num}
//                 </Typography>
//                 <Typography sx={{ fontSize: 16, fontWeight: 800, color: WHITE, mb: 2 }}>
//                   {s.title}
//                 </Typography>
//                 <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, mb: 4 }}>
//                   {s.desc}
//                 </Typography>
//                 <Typography component={Link} to="/consultancy"
//                   sx={{ fontSize: 13, fontWeight: 700, color: ORANGE, textDecoration: "none",
//                         display: "flex", alignItems: "center", gap: 0.5,
//                         "&:hover": { gap: 1 }, transition: "gap 0.15s" }}>
//                   Learn more <ArrowForward sx={{ fontSize: 15 }} />
//                 </Typography>
//               </Paper>
//             </Grid>
//           ))}
//         </Grid>
//       </Container>
//     </Box>
//   );
// }

// // ─── CORE TEAM ────────────────────────────────────────────────
// const TEAM = [
//   { name: "Jane Sande", role: "Media Director",    img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80" },
//   { name: "Jane Sande", role: "Media Director",    img: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&q=80" },
//   { name: "Jane Sande", role: "Media Director",    img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80" },
//   { name: "Jane Sande", role: "Media Director",    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80" },
// ];

// function CoreTeam() {
//   return (
//     <Box sx={{ bgcolor: WHITE, py: { xs: 7, md: 10 } }}>
//       <Container maxWidth="xl">
//         <SectionLabel>CORE TEAM</SectionLabel>
//         <Typography sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 900,
//                            color: NAVY, mb: 1.5, lineHeight: 1.2 }}>
//           Intelligent Minds{" "}
//           <Typography component="span" sx={{
//             fontStyle: "italic", color: ORANGE,
//             fontSize: "inherit", fontWeight: "inherit",
//           }}>
//             Leading the Way.
//           </Typography>
//         </Typography>
//         <Typography sx={{ fontSize: 15, color: MUTED, mb: 6, maxWidth: 480 }}>
//           GIEVA handles your entire registration process — from account setup to score reporting —
//           with certified guidance at every step.
//         </Typography>

//         <Grid container spacing={3}>
//           {TEAM.map((member, idx) => (
//             <Grid item xs={6} md={3} key={idx}>
//               <Paper elevation={0} sx={{
//                 borderRadius: 3, overflow: "hidden",
//                 border: `1px solid ${BORDER}`,
//                 transition: "transform 0.2s, box-shadow 0.2s",
//                 "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" },
//               }}>
//                 <Box sx={{ aspectRatio: "4/5", overflow: "hidden" }}>
//                   <Box component="img" src={member.img} alt={member.name}
//                     sx={{ width: "100%", height: "100%", objectFit: "cover",
//                           transition: "transform 0.3s",
//                           "&:hover": { transform: "scale(1.05)" } }} />
//                 </Box>
//                 <Box sx={{ p: 2 }}>
//                   <Typography sx={{ fontWeight: 800, fontSize: 15, color: NAVY }}>{member.name}</Typography>
//                   <Typography sx={{ fontSize: 13, color: MUTED }}>{member.role}</Typography>
//                 </Box>
//               </Paper>
//             </Grid>
//           ))}
//         </Grid>
//       </Container>
//     </Box>
//   );
// }

// // ─── TESTIMONIALS ─────────────────────────────────────────────
// const TESTIMONIALS = [
//   {
//     text: "This is where I encountered GIEVA. They took me through every step of my TOEFL registration. They helped me and they did very difficult, I wonder. I got my scores in good standing and got my application in for university before the deadline.",
//     name: "Tolulope Ogarwale", title: "TOEFL Client · Admitted to University of Michigan",
//     img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80",
//   },
//   {
//     text: "This is where I encountered GIEVA. They took me through every step. They helped me and they did all the very difficult, I wonder. I got my scores in good standing and got my application in for university before the deadline.",
//     name: "Tolulope Ogarwale", title: "TOEFL Client · Admitted to University of Michigan",
//     img: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=80",
//   },
//   {
//     text: "This is where I encountered GIEVA. They took me through every step of my TOEFL registration. They helped me. I got my scores in good standing and got my application in for university.",
//     name: "Tolulope Ogarwale", title: "TOEFL Client · Admitted to University of Michigan",
//     img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
//   },
// ];

// function Testimonials() {
//   return (
//     <Box sx={{ bgcolor: OFF_WHITE, py: { xs: 7, md: 10 } }}>
//       <Container maxWidth="xl">
//         <Grid container spacing={6} alignItems="flex-start">
//           {/* Left heading */}
//           <Grid item xs={12} md={4}>
//             <SectionLabel>TESTIMONIALS</SectionLabel>
//             <Typography sx={{ fontSize: { xs: 26, md: 34 }, fontWeight: 900,
//                                color: NAVY, mb: 2, lineHeight: 1.2 }}>
//               What our clients have to say{" "}
//               <Typography component="span" sx={{
//                 fontStyle: "italic", color: ORANGE,
//                 fontSize: "inherit", fontWeight: "inherit",
//               }}>
//                 about us
//               </Typography>
//             </Typography>
//             <Typography sx={{ fontSize: 14, color: MUTED, mb: 3, lineHeight: 1.7 }}>
//               At GIEVA, we're committed to continuous growth and improvement. Whether you're
//               participated in our programs, taken our consultancy services, or simply connected — we'd
//               love to hear from you.
//             </Typography>
//             <Button variant="outlined"
//               sx={{ textTransform: "none", fontWeight: 700, fontSize: 14,
//                     borderColor: ORANGE, color: ORANGE, borderRadius: 2,
//                     "&:hover": { bgcolor: ORANGE, color: WHITE } }}>
//               Share your Feedback ↗
//             </Button>
//           </Grid>

//           {/* Cards */}
//           <Grid item xs={12} md={8}>
//             <Grid container spacing={2.5}>
//               {TESTIMONIALS.map((t, i) => (
//                 <Grid item xs={12} sm={4} key={i}>
//                   <Paper elevation={0} sx={{
//                     borderRadius: 3, overflow: "hidden",
//                     border: `1px solid ${BORDER}`, height: "100%",
//                     display: "flex", flexDirection: "column",
//                   }}>
//                     {/* Photo */}
//                     <Box sx={{ height: 160, overflow: "hidden" }}>
//                       <Box component="img" src={t.img} alt={t.name}
//                         sx={{ width: "100%", height: "100%", objectFit: "cover",
//                               filter: "grayscale(30%)" }} />
//                     </Box>
//                     <Box sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
//                       <Typography sx={{ fontSize: 13, color: MUTED, lineHeight: 1.7, mb: 2, flex: 1 }}>
//                         "{t.text}"
//                       </Typography>
//                       <Box>
//                         <Typography sx={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{t.name}</Typography>
//                         <Typography sx={{ fontSize: 11, color: MUTED }}>{t.title}</Typography>
//                       </Box>
//                     </Box>
//                   </Paper>
//                 </Grid>
//               ))}
//             </Grid>
//           </Grid>
//         </Grid>
//       </Container>
//     </Box>
//   );
// }

// // ─── FAQ ──────────────────────────────────────────────────────
// const FAQS = [
//   { q: "How long does the registration process take?",         a: "The process typically takes 3–7 business days depending on the exam type and your document readiness. SAT and GRE registrations are usually completed within 48 hours." },
//   { q: "What documents do I need to bring?",                   a: "You'll need a valid government-issued ID (passport or national ID), recent passport photograph, and proof of payment. Specific exams may require additional documents." },
//   { q: "Do you offer test preparation alongside registration?", a: "Yes! We offer comprehensive test prep for SAT, IELTS, TOEFL, and GRE as part of our consultancy packages. Ask your assigned consultant for details." },
//   { q: "Is my payment secure?",                                 a: "Absolutely. All payments are processed through PCI-DSS compliant gateways. We support Paystack and direct bank transfers with instant receipts." },
// ];

// function FAQSection() {
//   const [expanded, setExpanded] = useState(null);

//   return (
//     <Box sx={{ bgcolor: WHITE, py: { xs: 7, md: 10 } }}>
//       <Container maxWidth="xl">
//         <Grid container spacing={8} alignItems="flex-start">
//           {/* Left */}
//           <Grid item xs={12} md={5}>
//             <SectionLabel>FAQ</SectionLabel>
//             <Typography sx={{ fontSize: { xs: 28, md: 38 }, fontWeight: 900,
//                                color: NAVY, lineHeight: 1.2, mb: 1 }}>
//               Common Questions,{" "}
//               <br />
//               <Typography component="span" sx={{
//                 fontStyle: "italic", color: ORANGE,
//                 fontSize: "inherit", fontWeight: "inherit",
//               }}>
//                 Clear Answers.
//               </Typography>
//             </Typography>
//             <Typography sx={{ fontSize: 14, color: MUTED, mt: 2, mb: 4, lineHeight: 1.7 }}>
//               Still have questions? Our consultants are available Monday–Friday, 9am–5pm via
//               WhatsApp, email, and in person at our Abuja, Lagos, and Jos offices.
//             </Typography>
//             <Button component={Link} to="/contact" variant="outlined"
//               sx={{ textTransform: "none", fontWeight: 700, fontSize: 14,
//                     borderColor: NAVY, color: NAVY, borderRadius: 2,
//                     "&:hover": { bgcolor: NAVY, color: WHITE } }}>
//               Chat with us →
//             </Button>
//           </Grid>

//           {/* Accordions */}
//           <Grid item xs={12} md={7}>
//             {FAQS.map((faq, i) => (
//               <Accordion key={i} expanded={expanded === i}
//                 onChange={() => setExpanded(expanded === i ? null : i)}
//                 elevation={0} disableGutters
//                 sx={{
//                   border: `1px solid ${BORDER}`, borderRadius: "12px !important",
//                   mb: 1.5, overflow: "hidden",
//                   "&:before": { display: "none" },
//                 }}>
//                 <AccordionSummary
//                   expandIcon={
//                     <Box sx={{
//                       width: 28, height: 28, borderRadius: "50%",
//                       border: `1.5px solid ${BORDER}`,
//                       display: "flex", alignItems: "center", justifyContent: "center",
//                       color: NAVY,
//                     }}>
//                       <Add sx={{ fontSize: 16 }} />
//                     </Box>
//                   }
//                   sx={{ px: 3, py: 1.5, "& .MuiAccordionSummary-content": { my: 0.5 } }}>
//                   <Typography sx={{ fontSize: 15, fontWeight: 700, color: NAVY }}>
//                     {faq.q}
//                   </Typography>
//                 </AccordionSummary>
//                 <AccordionDetails sx={{ px: 3, pb: 2.5 }}>
//                   <Typography sx={{ fontSize: 14, color: MUTED, lineHeight: 1.7 }}>
//                     {faq.a}
//                   </Typography>
//                 </AccordionDetails>
//               </Accordion>
//             ))}
//           </Grid>
//         </Grid>
//       </Container>
//     </Box>
//   );
// }

// // ─── CTA BANNER ───────────────────────────────────────────────
// function CTABanner() {
//   return (
//     <Box sx={{ bgcolor: NAVY, py: { xs: 7, md: 9 } }}>
//       <Container maxWidth="xl">
//         <Grid container spacing={4} alignItems="center">
//           <Grid item xs={12} md={7}>
//             <Typography sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 900,
//                                color: WHITE, lineHeight: 1.2 }}>
//               Ready to Take
//               <br />
//               Your{" "}
//               <Typography component="span" sx={{
//                 fontStyle: "italic", color: ORANGE,
//                 fontSize: "inherit", fontWeight: "inherit",
//               }}>
//                 First Step?
//               </Typography>
//             </Typography>
//             <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.65)", mt: 2, maxWidth: 460, lineHeight: 1.7 }}>
//               Book a free consultation with a GIEVA counsellor today. No commitment, no pressure —
//               just carry on your path forward. Book Your Consultation for 50 Services.
//             </Typography>
//           </Grid>
//           <Grid item xs={12} md={5}>
//             <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
//               <Button component={Link} to="/exam-register" variant="contained"
//                 sx={{
//                   textTransform: "none", fontWeight: 800, fontSize: 15,
//                   bgcolor: ORANGE, color: WHITE, borderRadius: 2.5, px: 3.5, py: 1.5,
//                   "&:hover": { bgcolor: "#c95510" },
//                 }}>
//                 Book Consultation
//               </Button>
//               <Button component={Link} to="/services" variant="outlined"
//                 sx={{
//                   textTransform: "none", fontWeight: 700, fontSize: 15,
//                   borderColor: "rgba(255,255,255,0.4)", color: WHITE,
//                   borderRadius: 2.5, px: 3.5, py: 1.5,
//                   "&:hover": { borderColor: WHITE, bgcolor: "rgba(255,255,255,0.08)" },
//                 }}>
//                 View all Services
//               </Button>
//             </Stack>
//           </Grid>
//         </Grid>
//       </Container>
//     </Box>
//   );
// }

// // ─── FOOTER ───────────────────────────────────────────────────
// const FOOTER_LINKS = {
//   Solutions: ["About", "Services", "Programs", "Resources"],
//   Company:   ["About", "Services", "Programs", "Resources"],
// };

// const SOCIAL_ICONS = [
//   { icon: <Facebook sx={{ fontSize: 18 }} />,  href: "#" },
//   { icon: <Twitter  sx={{ fontSize: 18 }} />,  href: "#" },
//   { icon: <Instagram sx={{ fontSize: 18 }} />, href: "#" },
//   { icon: <LinkedIn sx={{ fontSize: 18 }} />,  href: "#" },
//   { icon: <YouTube  sx={{ fontSize: 18 }} />,  href: "#" },
// ];

// function SiteFooter() {
//   return (
//     <Box component="footer" sx={{ bgcolor: "#080F1C", color: WHITE, pt: 8, pb: 4 }}>
//       <Container maxWidth="xl">
//         <Grid container spacing={6} mb={6}>
//           {/* Brand col */}
//           <Grid item xs={12} md={4}>
//             <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
//               <Box sx={{
//                 width: 28, height: 28, borderRadius: "50%",
//                 background: `linear-gradient(135deg, ${ORANGE}, ${GREEN})`,
//                 display: "flex", alignItems: "center", justifyContent: "center",
//               }}>
//                 <Typography sx={{ color: WHITE, fontWeight: 900, fontSize: 13 }}>G</Typography>
//               </Box>
//               <Typography sx={{ fontWeight: 900, fontSize: 17, color: WHITE }}>
//                 GIEVA<Typography component="span" sx={{ color: ORANGE }}>.org</Typography>
//               </Typography>
//             </Box>
//             <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)", mb: 3, lineHeight: 1.7 }}>
//               Sign Up to our Newsletter to get the latest news and offers.
//             </Typography>
//             <Box sx={{ display: "flex", gap: 1 }}>
//               <TextField size="small" placeholder="Enter Email Address..."
//                 sx={{
//                   flex: 1,
//                   "& .MuiOutlinedInput-root": {
//                     bgcolor: "rgba(255,255,255,0.08)", borderRadius: 2,
//                     color: WHITE, fontSize: 13,
//                     "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
//                     "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
//                   },
//                   "& input::placeholder": { color: "rgba(255,255,255,0.4)" },
//                 }}
//               />
//               <Button variant="contained"
//                 sx={{ bgcolor: ORANGE, minWidth: 44, px: 2, borderRadius: 2,
//                       "&:hover": { bgcolor: "#c95510" } }}>
//                 <ArrowForward sx={{ fontSize: 18 }} />
//               </Button>
//             </Box>
//           </Grid>

//           {/* Link cols */}
//           {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
//             <Grid item xs={6} md={2} key={heading}>
//               <Typography sx={{ fontWeight: 800, fontSize: 13, color: WHITE,
//                                  textTransform: "uppercase", letterSpacing: 1, mb: 2.5 }}>
//                 {heading}
//               </Typography>
//               <Stack spacing={1.5}>
//                 {links.map((l) => (
//                   <Typography key={l} component={Link} to={`/${l.toLowerCase()}`}
//                     sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none",
//                           "&:hover": { color: WHITE }, transition: "color 0.15s" }}>
//                     {l}
//                   </Typography>
//                 ))}
//               </Stack>
//             </Grid>
//           ))}

//           {/* Contact col */}
//           <Grid item xs={12} md={4}>
//             <Typography sx={{ fontWeight: 800, fontSize: 13, color: WHITE,
//                                textTransform: "uppercase", letterSpacing: 1, mb: 2.5 }}>
//               Contact
//             </Typography>
//             <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
//               © Lagos State House 3rd Floor Suite 329
//               <br />
//               29 Glover Road Ikoyi Lagos Island CMS
//               <br />
//               Lagos, Nigeria
//             </Typography>
//             <Box sx={{ display: "flex", gap: 1, mt: 3 }}>
//               {SOCIAL_ICONS.map((s, i) => (
//                 <IconButton key={i} href={s.href} component="a" size="small"
//                   sx={{
//                     color: "rgba(255,255,255,0.5)", bgcolor: "rgba(255,255,255,0.07)",
//                     borderRadius: 1.5, width: 34, height: 34,
//                     "&:hover": { bgcolor: ORANGE, color: WHITE },
//                     transition: "all 0.15s",
//                   }}>
//                   {s.icon}
//                 </IconButton>
//               ))}
//             </Box>
//             <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.4)", mt: 3 }}>
//               www.gieva.org
//             </Typography>
//           </Grid>
//         </Grid>

//         <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 3 }} />

//         <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
//           © {new Date().getFullYear()} GIEVA. All rights reserved.
//         </Typography>
//       </Container>
//     </Box>
//   );
// }

// // ─── PAGE EXPORT ──────────────────────────────────────────────
// export default function LandingPage() {
//   return (
//     <Box>
//       <SiteHeader />
//       <main>
//         <HeroSection />
//         <TrustedPartners />
//         <WhoWeAre />
//         <StatsBanner />
//         <ConsultancyServices />
//         <CoreTeam />
//         <Testimonials />
//         <FAQSection />
//         <CTABanner />
//       </main>
//       <SiteFooter />
//     </Box>
//   );
// }


// // import { useState } from "react";

// // import {
// //   Box,
// //   Button,
// //   Container,
// //   Dialog,
// //   DialogTitle,
// //   DialogContent,
// //   DialogActions,
// //   Typography,
// //   Stack,
// // } from "@mui/material";

// // import {
// //   Construction,
// //   School,
// // } from "@mui/icons-material";

// // import { useNavigate } from "react-router-dom";

// // const NAVY = "#0B1F3A";
// // const GREEN = "#1E7F4F";

// // export default function HomePage() {
// //   const navigate = useNavigate();

// //   const [open, setOpen] = useState(true);

// //   return (
// //     <>
// //       <Box
// //         sx={{
// //           minHeight: "100vh",
// //           bgcolor: "#F8FAFC",
// //           display: "flex",
// //           alignItems: "center",
// //           justifyContent: "center",
// //         }}
// //       >
// //         <Container maxWidth="md">

// //           <Stack
// //             spacing={3}
// //             alignItems="center"
// //           >
// //             <School
// //               sx={{
// //                 fontSize: 80,
// //                 color: GREEN,
// //               }}
// //             />

// //             <Typography
// //               variant="h2"
// //               fontWeight={800}
// //               color={NAVY}
// //               textAlign="center"
// //             >
// //               GIEVA
// //             </Typography>

// //             <Typography
// //               variant="h6"
// //               color="text.secondary"
// //               textAlign="center"
// //             >
// //               Empowering Learning Through Innovation
// //             </Typography>

// //             <Button
// //               variant="contained"
// //               size="large"
// //               onClick={() => navigate("/login")}
// //               sx={{
// //                 bgcolor: GREEN,
// //                 px: 5,
// //                 py: 1.5,
// //                 borderRadius: 3,
// //                 textTransform: "none",
// //                 fontWeight: 700,
// //                 "&:hover": {
// //                   bgcolor: "#17633f",
// //                 },
// //               }}
// //             >
// //               Go to LMS
// //             </Button>
// //           </Stack>

// //         </Container>
// //       </Box>

// //       <Dialog
// //         open={open}
// //         maxWidth="sm"
// //         fullWidth
// //       >
// //         <DialogTitle
// //           sx={{
// //             display: "flex",
// //             alignItems: "center",
// //             gap: 1,
// //             color: NAVY,
// //             fontWeight: 800,
// //           }}
// //         >
// //           <Construction color="warning" />

// //           Website Under Development
// //         </DialogTitle>

// //         <DialogContent>

// //           <Typography
// //             sx={{
// //               mt: 1,
// //               lineHeight: 1.8,
// //             }}
// //           >
// //             Welcome to GIEVA.

// //             <br />
// //             <br />

// //             Our public website is currently being redesigned to provide a
// //             richer experience for students, tutors, organizations, and
// //             partners.

// //             <br />
// //             <br />

// //             The Learning Management System (LMS) remains fully operational.
// //             You may continue to access your dashboard by logging in below.

// //             <br />
// //             <br />

// //             We appreciate your patience as we prepare the new GIEVA website.
// //           </Typography>

// //         </DialogContent>

// //         <DialogActions
// //           sx={{
// //             p: 3,
// //           }}
// //         >
// //           <Button
// //             onClick={() => setOpen(false)}
// //           >
// //             Close
// //           </Button>

// //           <Button
// //             variant="contained"
// //             onClick={() => navigate("/login")}
// //             sx={{
// //               bgcolor: GREEN,
// //               textTransform: "none",
// //               "&:hover": {
// //                 bgcolor: "#17633f",
// //               },
// //             }}
// //           >
// //             Login to LMS
// //           </Button>

// //         </DialogActions>
// //       </Dialog>
// //     </>
// //   );
// // }