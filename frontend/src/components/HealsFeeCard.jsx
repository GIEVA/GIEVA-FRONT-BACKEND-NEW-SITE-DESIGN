import { useEffect, useState } from "react";
import {
  Paper, Typography, Stack, TextField, MenuItem, Button, Alert, CircularProgress,
} from "@mui/material";
import { getHealsFeeSetting, updateHealsFeeSetting } from "../services/healsAdminService";

const NAVY = "#0B1F3A";

export default function HealsFeeCard() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    getHealsFeeSetting()
      .then((r) => {
        setAmount(r.amount ? String(r.amount) : "");
        setCurrency(r.currency || "NGN");
        setUpdatedAt(r.updatedAt);
      })
      .catch(() => setMsg({ type: "error", text: "Could not load the current fee" }))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setMsg(null);
    if (!window.confirm(`Set the HEALS application fee to ${currency} ${Number(amount).toLocaleString()}?`)) return;
    try {
      setSaving(true);
      await updateHealsFeeSetting({ amount: Number(amount), currency });
      setUpdatedAt(new Date().toISOString());
      setMsg({ type: "success", text: "Fee updated. New applicants will be charged this amount." });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to update fee" });
    } finally { setSaving(false); }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E5E7EB", mt: 4 }}>
      <Typography fontWeight={800} mb={0.5}>HEALS Application Fee</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Charged when a student submits an application. Payments already started keep the amount they were created with.
      </Typography>

      {msg && <Alert severity={msg.type} sx={{ mb: 2 }}>{msg.text}</Alert>}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
        <TextField
          label="Amount" type="number" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputProps={{ min: 1 }} sx={{ width: 200 }}
        />
        <TextField select label="Currency" value={currency}
          onChange={(e) => setCurrency(e.target.value)} sx={{ width: 140 }}>
          <MenuItem value="NGN">NGN (₦)</MenuItem>
          <MenuItem value="USD">USD ($)</MenuItem>
        </TextField>
        <Button variant="contained" onClick={save} disabled={saving || !Number(amount)}
          sx={{ bgcolor: NAVY, "&:hover": { bgcolor: "#0B1F3A" } }}>
          {saving ? "Saving..." : "Save Fee"}
        </Button>
      </Stack>

      {updatedAt && (
        <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
          Last updated {new Date(updatedAt).toLocaleString()}
        </Typography>
      )}
      {currency === "USD" && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          USD only works if USD payments are enabled on your Paystack account. Otherwise checkout will fail. Use NGN to be safe.
        </Alert>
      )}
    </Paper>
  );
}