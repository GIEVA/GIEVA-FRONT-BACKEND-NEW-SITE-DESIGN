// components/visa/VisaTimeline.jsx  (used by the applicant page and the admin drawer)
import { Box, Typography } from "@mui/material";
import { STATUS, MUTED, INK, LINE, fmtDate } from "./visaUi";

export default function VisaTimeline({ events = [] }) {
  const list = [...events].reverse(); // newest first
  if (!list.length) return <Typography sx={{ color: MUTED, fontSize: 13.5 }}>No updates yet.</Typography>;
  return (
    <Box>
      {list.map((e, i) => {
        const s = STATUS[e.toStatus] || STATUS.draft;
        const who = e.actorType === "admin" ? "GIEVA team" : e.actorType === "user" ? "You" : "System";
        return (
          <Box key={e.id} sx={{ display: "flex", gap: 1.75, position: "relative", pb: i === list.length - 1 ? 0 : 2.5 }}>
            {i < list.length - 1 && <Box sx={{ position: "absolute", left: 7, top: 18, bottom: 0, width: 2, bgcolor: LINE }} />}
            <Box sx={{ width: 16, height: 16, borderRadius: "50%", mt: 0.4, flexShrink: 0, bgcolor: s.color, boxShadow: `0 0 0 4px ${s.bg}`, zIndex: 1 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14, color: INK }}>{s.label}</Typography>
              <Typography sx={{ fontSize: 12, color: MUTED }}>{fmtDate(e.createdAt, true)} · {who}</Typography>
              {e.note && (
                <Box sx={{ mt: 0.75, p: 1.25, borderRadius: 2, bgcolor: "#F8FAFC", borderLeft: `3px solid ${s.color}` }}>
                  <Typography sx={{ fontSize: 13.5, color: INK, whiteSpace: "pre-wrap" }}>{e.note}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
