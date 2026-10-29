// components/visa/visaSteps.jsx
// One component per wizard step. They are pure views: `form` in, `set(path, value)` out.

import { useRef, useState } from "react";
import { Box, Typography, Button, MenuItem, FormControlLabel, Switch, Checkbox, CircularProgress, LinearProgress, IconButton, Divider, Alert } from "@mui/material";
import { CloudUpload, CheckCircle, DeleteOutline, Description, Bolt, Schedule, LocationOn, Edit } from "@mui/icons-material";

import { NAVY, GREEN, GOLD, MUTED, LINE, INK, Card, FieldGrid, SectionTitle, Txt, money, fmtDate, errMsg } from "./visaUi";
import { uploadVisaDocument, removeVisaDocument } from "../../services/visaService";

const SPONSORS = [["parent", "Parent"], ["relative", "Relative"], ["other", "Other"]];

// ── selectable tile used for location / appointment type ──
const Tile = ({ active, onClick, icon, title, sub, price }) => (
  <Box
    role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    sx={{
      p: 2.25, borderRadius: 3.5, cursor: "pointer", border: `2px solid ${active ? GREEN : LINE}`,
      bgcolor: active ? "rgba(30,127,79,.06)" : "#fff", transition: "all .15s", outline: "none",
      boxShadow: active ? "0 6px 20px rgba(30,127,79,.14)" : "none",
      "&:hover": { borderColor: active ? GREEN : "#CBD5E1" }, "&:focus-visible": { boxShadow: `0 0 0 3px ${GREEN}55` },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box sx={{ width: 36, height: 36, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: active ? GREEN : "#F1F5F9", color: active ? "#fff" : MUTED }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15, color: INK }}>{title}</Typography>
        {sub && <Typography sx={{ fontSize: 12.5, color: MUTED }}>{sub}</Typography>}
      </Box>
      {price && <Typography sx={{ fontWeight: 900, fontSize: 18, color: NAVY }}>{price}</Typography>}
      {active && <CheckCircle sx={{ color: GREEN }} />}
    </Box>
  </Box>
);

export const StepAppointment = ({ form, set, settings }) => (
  <>
    {settings?.instructions && <Alert severity="info" sx={{ mb: 3, borderRadius: 3, whiteSpace: "pre-wrap" }}>{settings.instructions}</Alert>}
    <SectionTitle title="Where would you like to be interviewed?" hint="Choose the GIEVA office closest to you." />
    <FieldGrid>
      <Tile active={form.interviewLocation === "abuja"} onClick={() => set("interviewLocation", "abuja")} icon={<LocationOn fontSize="small" />} title="Abuja" sub="Lagos State House, CBD" />
      <Tile active={form.interviewLocation === "lagos"} onClick={() => set("interviewLocation", "lagos")} icon={<LocationOn fontSize="small" />} title="Lagos" sub="Agege Motor Road, Oshodi" />
    </FieldGrid>

    <SectionTitle title="Appointment type" hint="The administrative charge is paid once, when you submit." sx={{ mt: 4 }} />
    <FieldGrid>
      <Tile active={form.appointmentType === "normal"} onClick={() => set("appointmentType", "normal")} icon={<Schedule fontSize="small" />} title="Normal" sub="Standard scheduling" price={settings ? money(settings.normalFee, settings.currency) : ""} />
      <Tile active={form.appointmentType === "expedited"} onClick={() => set("appointmentType", "expedited")} icon={<Bolt fontSize="small" />} title="Expedited" sub="Priority scheduling" price={settings ? money(settings.expeditedFee, settings.currency) : ""} />
    </FieldGrid>
  </>
);

export const StepPersonal = ({ form, set }) => (
  <>
    <SectionTitle title="Bio-data" hint="Enter these exactly as they appear on your international passport." />
    <FieldGrid cols={3}>
      <Txt required label="First name" value={form.firstName} onChange={(v) => set("firstName", v)} />
      <Txt label="Middle name" value={form.middleName} onChange={(v) => set("middleName", v)} />
      <Txt required label="Last name" value={form.lastName} onChange={(v) => set("lastName", v)} />
    </FieldGrid>
    <FieldGrid sx={{ mt: 2 }}>
      <Txt required select label="Gender" value={form.gender} onChange={(v) => set("gender", v)}>
        <MenuItem value="male">Male</MenuItem><MenuItem value="female">Female</MenuItem>
      </Txt>
      <Txt required type="date" label="Date of birth" value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} inputProps={{ max: new Date().toISOString().slice(0, 10) }} />
    </FieldGrid>

    <SectionTitle title="Contact details" sx={{ mt: 4 }} />
    <FieldGrid>
      <Txt required label="Phone number" value={form.phone} onChange={(v) => set("phone", v)} />
      <Txt label="Alternative phone" value={form.altPhone} onChange={(v) => set("altPhone", v)} />
    </FieldGrid>
    <Box sx={{ mt: 2, display: "grid", gap: 2 }}>
      <Txt required label="Residential / postal address" value={form.address} onChange={(v) => set("address", v)} multiline rows={2} />
      <Txt required type="email" label="Active email address" value={form.email} onChange={(v) => set("email", v)} helperText="Your receipt, PDF copy and every status update are sent here." />
    </Box>
  </>
);

const Person = ({ prefix, form, set, title }) => (
  <Box sx={{ mb: 3 }}>
    <SectionTitle title={title} />
    <FieldGrid cols={3} sx={{ mb: 2 }}>
      <Txt select label="Relationship" value={form[prefix]?.type} onChange={(v) => set(`${prefix}.type`, v)} required>
        {SPONSORS.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
      </Txt>
      <Txt required label="Last name" value={form[prefix]?.lastName} onChange={(v) => set(`${prefix}.lastName`, v)} />
      <Txt label="Other names" value={form[prefix]?.otherNames} onChange={(v) => set(`${prefix}.otherNames`, v)} />
    </FieldGrid>
    <FieldGrid>
      <Txt label="Phone number" value={form[prefix]?.phone} onChange={(v) => set(`${prefix}.phone`, v)} />
      <Txt type="email" label="Email" value={form[prefix]?.email} onChange={(v) => set(`${prefix}.email`, v)} />
    </FieldGrid>
  </Box>
);

export const StepTravelSponsors = ({ form, set }) => (
  <>
    <SectionTitle title="Travel history (last 5 years)" hint="Up to three countries. Leave blank if none." />
    {[0, 1, 2].map((i) => (
      <FieldGrid key={i} cols={3} sx={{ mb: 1.5 }}>
        <Txt label={`Country ${i + 1}`} value={form.travelHistory?.[i]?.country} onChange={(v) => set(`travelHistory.${i}.country`, v)} />
        <Txt type="date" label="From" value={form.travelHistory?.[i]?.from} onChange={(v) => set(`travelHistory.${i}.from`, v)} />
        <Txt type="date" label="To" value={form.travelHistory?.[i]?.to} onChange={(v) => set(`travelHistory.${i}.to`, v)} />
      </FieldGrid>
    ))}
    <Divider sx={{ my: 3.5 }} />
    <Person prefix="tripSponsor" form={form} set={set} title="Who is paying for your trip?" />
    <Divider sx={{ my: 3.5 }} />
    <Person prefix="educationSponsor" form={form} set={set} title="Who is paying for your education?" />
    <FormControlLabel
      control={<Switch checked={!!form.educationSponsor?.onScholarship} onChange={(e) => set("educationSponsor.onScholarship", e.target.checked)} />}
      label="I am on a scholarship"
    />
    {form.educationSponsor?.onScholarship && (
      <Box sx={{ mt: 1.5, maxWidth: 320 }}>
        <Txt label="Scholarship amount (US $)" value={form.educationSponsor?.scholarshipAmountUsd} onChange={(v) => set("educationSponsor.scholarshipAmountUsd", v)} inputProps={{ inputMode: "decimal" }} />
      </Box>
    )}
  </>
);

const JobBlock = ({ prefix, form, set, title, hint }) => {
  const j = form[prefix] || {};
  return (
    <Box sx={{ mb: 3 }}>
      <SectionTitle title={title} hint={hint} />
      <Txt select label="Status" value={j.status} onChange={(v) => set(`${prefix}.status`, v)} sx={{ maxWidth: 280, mb: 2 }}>
        <MenuItem value="employed">Employed</MenuItem><MenuItem value="unemployed">Unemployed</MenuItem>
      </Txt>
      {j.status === "employed" && (
        <Box sx={{ display: "grid", gap: 2 }}>
          <FieldGrid>
            <Txt required={prefix === "currentJob"} label="Organization name" value={j.organizationName} onChange={(v) => set(`${prefix}.organizationName`, v)} />
            <Txt label="Organization phone" value={j.organizationPhone} onChange={(v) => set(`${prefix}.organizationPhone`, v)} />
          </FieldGrid>
          <Txt label="Organization address" value={j.organizationAddress} onChange={(v) => set(`${prefix}.organizationAddress`, v)} />
          <Txt required={prefix === "currentJob"} label="Job description" value={j.jobDescription} onChange={(v) => set(`${prefix}.jobDescription`, v)} multiline rows={2} />
          <FieldGrid>
            <Txt label="Supervisor's last name" value={j.supervisorLastName} onChange={(v) => set(`${prefix}.supervisorLastName`, v)} />
            <Txt label="Supervisor's other names" value={j.supervisorOtherNames} onChange={(v) => set(`${prefix}.supervisorOtherNames`, v)} />
          </FieldGrid>
          <FieldGrid cols={3}>
            <Txt required={prefix === "currentJob"} label="Monthly income (₦)" value={j.monthlyIncome} onChange={(v) => set(`${prefix}.monthlyIncome`, v)} inputProps={{ inputMode: "numeric" }} />
            <Txt type="date" label="Employed from" value={j.fromDate} onChange={(v) => set(`${prefix}.fromDate`, v)} />
            <Txt type="date" label="Employed to" value={j.toDate} onChange={(v) => set(`${prefix}.toDate`, v)} />
          </FieldGrid>
        </Box>
      )}
    </Box>
  );
};

export const StepWork = ({ form, set }) => (
  <>
    <JobBlock prefix="currentJob" form={form} set={set} title="Current job" hint="If employed, complete the details below." />
    <Divider sx={{ my: 3 }} />
    <JobBlock prefix="previousJob" form={form} set={set} title="Previous job (optional)" hint="Within the last 5 years, if applicable." />
  </>
);

const Parent = ({ prefix, form, set, title }) => (
  <Box sx={{ mb: 3 }}>
    <SectionTitle title={title} />
    <FieldGrid cols={3}>
      <Txt required label="Last name" value={form[prefix]?.lastName} onChange={(v) => set(`${prefix}.lastName`, v)} />
      <Txt required label="First name" value={form[prefix]?.firstName} onChange={(v) => set(`${prefix}.firstName`, v)} />
      <Txt type="date" label="Date of birth" value={form[prefix]?.dateOfBirth} onChange={(v) => set(`${prefix}.dateOfBirth`, v)} />
    </FieldGrid>
    <Box sx={{ mt: 2 }}><Txt type="email" label="Email" value={form[prefix]?.email} onChange={(v) => set(`${prefix}.email`, v)} /></Box>
  </Box>
);

export const StepFamilyEducation = ({ form, set }) => (
  <>
    <Parent prefix="father" form={form} set={set} title="Father" />
    <Parent prefix="mother" form={form} set={set} title="Mother" />
    <Divider sx={{ my: 3 }} />
    {[0, 1].map((i) => (
      <Box key={i} sx={{ mb: 3 }}>
        <SectionTitle title={`School ${i + 1}${i === 1 ? " (optional)" : ""}`} />
        <FieldGrid>
          <Txt required={i === 0} label="Name of school" value={form.schools?.[i]?.name} onChange={(v) => set(`schools.${i}.name`, v)} />
          <Txt label="Address" value={form.schools?.[i]?.address} onChange={(v) => set(`schools.${i}.address`, v)} />
          <Txt type="date" label="From" value={form.schools?.[i]?.from} onChange={(v) => set(`schools.${i}.from`, v)} />
          <Txt type="date" label="To" value={form.schools?.[i]?.to} onChange={(v) => set(`schools.${i}.to`, v)} />
          <Txt label="Phone" value={form.schools?.[i]?.phone} onChange={(v) => set(`schools.${i}.phone`, v)} />
          <Txt type="email" label="Email" value={form.schools?.[i]?.email} onChange={(v) => set(`schools.${i}.email`, v)} />
        </FieldGrid>
        <Box sx={{ mt: 2 }}><Txt label="Certificate obtained" value={form.schools?.[i]?.certificate} onChange={(v) => set(`schools.${i}.certificate`, v)} /></Box>
      </Box>
    ))}
  </>
);

export const StepBackground = ({ form, set }) => (
  <>
    <SectionTitle title="Awards, courses, conferences and certifications" hint="Up to three. Optional." />
    {[0, 1, 2].map((i) => (
      <FieldGrid key={i} sx={{ gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, mb: 1.5 }}>
        <Txt label={`Award / certification ${i + 1}`} value={form.awards?.[i]?.name} onChange={(v) => set(`awards.${i}.name`, v)} />
        <Txt type="date" label="Date obtained" value={form.awards?.[i]?.dateObtained} onChange={(v) => set(`awards.${i}.dateObtained`, v)} />
      </FieldGrid>
    ))}

    <Divider sx={{ my: 3.5 }} />
    <SectionTitle title="Volunteer experience" hint="Up to three organizations. Optional." />
    {[0, 1, 2].map((i) => (
      <FieldGrid key={i} cols={3} sx={{ mb: 1.5 }}>
        <Txt label={`Organization ${i + 1}`} value={form.volunteer?.[i]?.organization} onChange={(v) => set(`volunteer.${i}.organization`, v)} />
        <Txt type="date" label="From" value={form.volunteer?.[i]?.from} onChange={(v) => set(`volunteer.${i}.from`, v)} />
        <Txt type="date" label="To" value={form.volunteer?.[i]?.to} onChange={(v) => set(`volunteer.${i}.to`, v)} />
      </FieldGrid>
    ))}

    <Divider sx={{ my: 3.5 }} />
    <SectionTitle title="Relatives in the USA" hint="Sibling, cousin, niece, nephew, etc. Optional." />
    {[0, 1, 2].map((i) => (
      <FieldGrid key={i} cols={4} sx={{ mb: 1.5 }}>
        <Txt label="Last name" value={form.usRelatives?.[i]?.lastName} onChange={(v) => set(`usRelatives.${i}.lastName`, v)} />
        <Txt label="Other names" value={form.usRelatives?.[i]?.otherNames} onChange={(v) => set(`usRelatives.${i}.otherNames`, v)} />
        <Txt label="Relationship" value={form.usRelatives?.[i]?.relationship} onChange={(v) => set(`usRelatives.${i}.relationship`, v)} />
        <Txt label="State of residence" value={form.usRelatives?.[i]?.stateOfResidence} onChange={(v) => set(`usRelatives.${i}.stateOfResidence`, v)} />
      </FieldGrid>
    ))}

    <Divider sx={{ my: 3.5 }} />
    <SectionTitle title="Social media handles" hint="Optional." />
    <FieldGrid>
      {["facebook", "instagram", "twitter", "linkedin"].map((k) => (
        <Txt key={k} label={k === "twitter" ? "Twitter / X" : k[0].toUpperCase() + k.slice(1)} value={form.social?.[k]} onChange={(v) => set(`social.${k}`, v)} />
      ))}
    </FieldGrid>
  </>
);

// ── document uploader ──
export const DocCard = ({ applicationId, type, label, hint, accept, doc, onChange, locked, replaceOnly }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState("");

  const pick = async (file) => {
    if (!file) return;
    setError("");
    if (file.size > 5 * 1024 * 1024) return setError("File is larger than 5 MB");
    try {
      setBusy(true); setPct(0);
      const res = await uploadVisaDocument(applicationId, type, file, setPct);
      onChange(res.document);
    } catch (err) {
      setError(errMsg(err, "Upload failed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  const remove = async () => {
    try { await removeVisaDocument(applicationId, type); onChange(null); } catch (err) { setError(errMsg(err, "Could not remove")); }
  };

  return (
    <Box
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); if (!locked && !doc) pick(e.dataTransfer.files?.[0]); }}
      sx={{ p: 2, borderRadius: 3.5, border: `2px ${doc ? "solid" : "dashed"} ${doc ? GREEN : "#CBD5E1"}`, bgcolor: doc ? "rgba(30,127,79,.04)" : "#FAFBFD" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: doc ? GREEN : "#EEF2F7", color: doc ? "#fff" : MUTED }}>
          {doc ? <CheckCircle fontSize="small" /> : <Description fontSize="small" />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 14, color: INK }}>{label}</Typography>
          <Typography noWrap sx={{ fontSize: 12.5, color: MUTED }}>{doc ? `${doc.name} · ${(doc.size / 1024).toFixed(0)} KB` : hint}</Typography>
        </Box>
        {!locked && (doc && replaceOnly ? (
          <Button size="small" variant="outlined" disabled={busy} onClick={() => inputRef.current?.click()} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5 }}>
            {busy ? `${pct}%` : "Replace"}
          </Button>
        ) : doc ? (
          <IconButton onClick={remove} size="small" aria-label={`Remove ${label}`}><DeleteOutline fontSize="small" /></IconButton>
        ) : (
          <Button size="small" variant="contained" disableElevation disabled={busy} onClick={() => inputRef.current?.click()}
            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <CloudUpload />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, bgcolor: NAVY, "&:hover": { bgcolor: GREEN } }}>
            {busy ? `${pct}%` : "Upload"}
          </Button>
        ))}
      </Box>
      {busy && <LinearProgress variant="determinate" value={pct} sx={{ mt: 1.5, borderRadius: 2, "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />}
      {error && <Typography sx={{ mt: 1, fontSize: 12.5, color: "#B91C1C" }}>{error}</Typography>}
      <input ref={inputRef} type="file" hidden accept={accept} onChange={(e) => pick(e.target.files?.[0])} />
    </Box>
  );
};

export const StepReferencesDocs = ({ form, set, applicationId, setDocument }) => (
  <>
    <SectionTitle title="Two references (non-relatives)" hint="People who know you well and can be contacted." />
    {[0, 1].map((i) => (
      <Box key={i} sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 13, color: MUTED, mb: 1 }}>Reference {i + 1}</Typography>
        <FieldGrid>
          <Txt required label="Last name" value={form.references?.[i]?.lastName} onChange={(v) => set(`references.${i}.lastName`, v)} />
          <Txt label="Other names" value={form.references?.[i]?.otherNames} onChange={(v) => set(`references.${i}.otherNames`, v)} />
          <Txt required type="email" label="Email address" value={form.references?.[i]?.email} onChange={(v) => set(`references.${i}.email`, v)} />
          <Txt required label="Phone number" value={form.references?.[i]?.phone} onChange={(v) => set(`references.${i}.phone`, v)} />
        </FieldGrid>
        <Box sx={{ mt: 2 }}><Txt label="Residential address" value={form.references?.[i]?.address} onChange={(v) => set(`references.${i}.address`, v)} /></Box>
      </Box>
    ))}

    <Divider sx={{ my: 3.5 }} />
    <SectionTitle title="Required documents" hint="JPG, PNG or PDF, up to 5 MB each." />
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <DocCard applicationId={applicationId} type="passportPhoto" label="Passport photograph" hint="2x2, white background (JPG or PNG)" accept="image/jpeg,image/png" doc={form.documents?.passportPhoto} onChange={(d) => setDocument("passportPhoto", d)} />
      <DocCard applicationId={applicationId} type="i20" label="I-20 document" hint="Copy of your I-20 (PDF, JPG or PNG)" accept="application/pdf,image/jpeg,image/png" doc={form.documents?.i20} onChange={(d) => setDocument("i20", d)} />
      <DocCard applicationId={applicationId} type="passportBio" label="Passport bio-data page" hint="Photo page of your international passport" accept="application/pdf,image/jpeg,image/png" doc={form.documents?.passportBio} onChange={(d) => setDocument("passportBio", d)} />
    </Box>
  </>
);

// ── Review & pay ──
const Row = ({ l, v }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.9, borderBottom: `1px dashed ${LINE}` }}>
    <Typography sx={{ fontSize: 13, color: MUTED }}>{l}</Typography>
    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: INK, textAlign: "right", wordBreak: "break-word" }}>{v || "-"}</Typography>
  </Box>
);
const Block = ({ title, onEdit, children }) => (
  <Card sx={{ p: 2.25, mb: 2 }}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
      <Typography sx={{ fontWeight: 800, fontSize: 14, color: NAVY }}>{title}</Typography>
      <Button size="small" startIcon={<Edit sx={{ fontSize: 14 }} />} onClick={onEdit} sx={{ textTransform: "none", fontWeight: 700, color: GREEN }}>Edit</Button>
    </Box>
    {children}
  </Card>
);

export const StepReview = ({ form, set, settings, missing, goTo, onPay, paying }) => {
  const fee = settings ? (form.appointmentType === "expedited" ? settings.expeditedFee : settings.normalFee) : null;
  const problems = [...(missing?.fields || []), ...(missing?.documents || []).map((d) => `Document: ${d}`)];
  const name = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");

  return (
    <>
      {problems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 0.5 }}>Complete these before paying</Typography>
          {problems.map((p) => <Typography key={p} sx={{ fontSize: 13 }}>• {p}</Typography>)}
        </Alert>
      )}

      <Block title="Appointment" onEdit={() => goTo(0)}>
        <Row l="Interview location" v={cap(form.interviewLocation)} />
        <Row l="Appointment type" v={cap(form.appointmentType)} />
      </Block>
      <Block title="Personal" onEdit={() => goTo(1)}>
        <Row l="Full name" v={name} /><Row l="Gender" v={cap(form.gender)} /><Row l="Date of birth" v={fmtDate(form.dateOfBirth)} />
        <Row l="Phone" v={form.phone} /><Row l="Email" v={form.email} /><Row l="Address" v={form.address} />
      </Block>
      <Block title="Sponsors & work" onEdit={() => goTo(2)}>
        <Row l="Trip paid by" v={[cap(form.tripSponsor?.type), form.tripSponsor?.lastName].filter(Boolean).join(" · ")} />
        <Row l="Education paid by" v={[cap(form.educationSponsor?.type), form.educationSponsor?.lastName].filter(Boolean).join(" · ")} />
        <Row l="Current job" v={form.currentJob?.status === "employed" ? `${form.currentJob.organizationName || ""} (employed)` : cap(form.currentJob?.status)} />
      </Block>
      <Block title="Family & education" onEdit={() => goTo(4)}>
        <Row l="Father" v={[form.father?.firstName, form.father?.lastName].filter(Boolean).join(" ")} />
        <Row l="Mother" v={[form.mother?.firstName, form.mother?.lastName].filter(Boolean).join(" ")} />
        <Row l="School 1" v={form.schools?.[0]?.name} />
      </Block>
      <Block title="References & documents" onEdit={() => goTo(6)}>
        <Row l="Reference 1" v={form.references?.[0]?.lastName} /><Row l="Reference 2" v={form.references?.[1]?.lastName} />
        <Row l="Passport photograph" v={form.documents?.passportPhoto ? "Uploaded" : "Missing"} />
        <Row l="I-20" v={form.documents?.i20 ? "Uploaded" : "Missing"} />
        <Row l="Passport bio page" v={form.documents?.passportBio ? "Uploaded" : "Missing"} />
      </Block>

      <Card sx={{ p: 2.5, mt: 3, background: `linear-gradient(135deg, ${NAVY}, #12315A)`, color: "#fff", border: "none" }}>
        <Typography sx={{ fontSize: 12, letterSpacing: 1.4, fontWeight: 800, color: GOLD }}>ADMINISTRATIVE CHARGE</Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mt: 0.5 }}>
          <Typography sx={{ fontSize: 34, fontWeight: 900 }}>{fee != null ? money(fee, settings.currency) : "..."}</Typography>
          <Typography sx={{ fontSize: 13, color: "#CBD5E1" }}>{cap(form.appointmentType)} appointment</Typography>
        </Box>
        <Typography sx={{ fontSize: 12.5, color: "#CBD5E1", mt: 1 }}>
          Your application is submitted only after your payment succeeds. A PDF copy is emailed to you automatically.
        </Typography>
      </Card>

      <FormControlLabel
        sx={{ mt: 2.5, alignItems: "flex-start" }}
        control={<Checkbox checked={!!form.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)} sx={{ color: GREEN, "&.Mui-checked": { color: GREEN } }} />}
        label={<Typography sx={{ fontSize: 13.5, color: INK }}>I confirm the information I provided is true and complete, and I consent to GIEVA processing my personal data and documents for this visa application.</Typography>}
      />

      <Button fullWidth size="large" variant="contained" disableElevation onClick={onPay} disabled={paying || problems.length > 0 || !form.acceptTerms}
        startIcon={paying ? <CircularProgress size={18} color="inherit" /> : null}
        sx={{ mt: 2, py: 1.5, borderRadius: 3, textTransform: "none", fontWeight: 800, fontSize: 16, bgcolor: GREEN, "&:hover": { bgcolor: "#166d3e" } }}>
        {paying ? "Redirecting to Paystack..." : `Pay ${fee != null ? money(fee, settings.currency) : ""} & submit`}
      </Button>
      <Typography sx={{ textAlign: "center", fontSize: 12, color: MUTED, mt: 1 }}>Secured by Paystack. We never see your card details.</Typography>
    </>
  );
};
