// components/visa/VisaFeeCard.jsx
// Fee editor for the admin dashboard (the visa equivalent of HealsFeeCard).
import { useEffect, useState } from "react";
import { Box, Typography, Button, CircularProgress, InputAdornment, MenuItem } from "@mui/material";
import { Save } from "@mui/icons-material";
import { NAVY, GREEN, MUTED, Card, Txt, money, fmtDate, errMsg } from "./visaUi";
import { adminGetVisaFee, adminUpdateVisaFee } from "../../services/visaService";

export default function VisaFeeCard({ onToast, compact = false }) {
  const [fee, setFee] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGetVisaFee().then(setFee).catch((e) => onToast?.({ msg: errMsg(e, "Could not load fees"), severity: "error" }));
  }, [onToast]);

  if (!fee) return <Card sx={{ p: 4, textAlign: "center" }}><CircularProgress sx={{ color: GREEN }} /></Card>;

  const sym = fee.currency === "USD" ? "$" : "₦";
  const save = async () => {
    try {
      setSaving(true);
      const r = await adminUpdateVisaFee({ normalFee: fee.normalFee, expeditedFee: fee.expeditedFee, currency: fee.currency });
      setFee((f) => ({ ...f, ...r, updatedAt: new Date().toISOString() }));
      onToast?.({ msg: r.message, severity: "success" });
    } catch (e) {
      onToast?.({ msg: errMsg(e, "Could not save fees"), severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ p: { xs: 2.5, sm: 3.5 }, maxWidth: compact ? "none" : 720 }}>
      <Typography sx={{ fontWeight: 900, fontSize: 18, color: NAVY }}>Visa processing fee</Typography>
      <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 3 }}>
        This is what the applicant is charged when they submit. It applies to new payments only; past payments keep the fee they paid.
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 120px" }, gap: 2 }}>
        <Txt label="Normal appointment fee" value={fee.normalFee} onChange={(v) => setFee({ ...fee, normalFee: v })}
          inputProps={{ inputMode: "decimal" }} InputProps={{ startAdornment: <InputAdornment position="start">{sym}</InputAdornment> }} />
        <Txt label="Expedited appointment fee" value={fee.expeditedFee} onChange={(v) => setFee({ ...fee, expeditedFee: v })}
          inputProps={{ inputMode: "decimal" }} InputProps={{ startAdornment: <InputAdornment position="start">{sym}</InputAdornment> }} />
        <Txt select label="Currency" value={fee.currency} onChange={(v) => setFee({ ...fee, currency: v })}>
          <MenuItem value="NGN">NGN</MenuItem>
          <MenuItem value="USD">USD</MenuItem>
        </Txt>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mt: 3 }}>
        <Typography sx={{ fontSize: 12.5, color: MUTED }}>
          {fee.updatedAt ? `Last changed ${fmtDate(fee.updatedAt)}` : "Not changed yet"} · currently {money(fee.normalFee, fee.currency)} / {money(fee.expeditedFee, fee.currency)}
        </Typography>
        <Button onClick={save} disabled={saving} variant="contained" disableElevation
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
          sx={{ textTransform: "none", fontWeight: 800, borderRadius: 3, bgcolor: NAVY, px: 3, "&:hover": { bgcolor: GREEN } }}>
          Save fees
        </Button>
      </Box>
    </Card>
  );
}
