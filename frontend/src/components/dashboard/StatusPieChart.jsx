import { Box, Typography, Stack } from "@mui/material";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const NAVY = "#0B1F3A";
const MUTED = "#64748B";

const PALETTE = ["#1E7F4F", "#D4A017", "#0B1F3A", "#DC2626", "#7C3AED", "#0EA5E9", "#EC4899"];

export default function StatusPieChart({ title, data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (!data.length) {
    return (
      <Box>
        {title && <Typography sx={{ fontSize: 14, fontWeight: 700, color: NAVY, mb: 1.5 }}>{title}</Typography>}
        <Typography sx={{ fontSize: 13, color: MUTED, textAlign: "center", py: 4 }}>No data yet.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {title && <Typography sx={{ fontSize: 14, fontWeight: 700, color: NAVY, mb: 1.5 }}>{title}</Typography>}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ width: 140, height: 140, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Stack spacing={0.75} sx={{ flex: 1 }}>
          {data.map((entry, i) => (
            <Stack key={entry.name} direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
              <Typography sx={{ fontSize: 12.5, color: MUTED, flex: 1 }}>{entry.name}</Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: NAVY }}>
                {entry.value} {total > 0 && `(${((entry.value / total) * 100).toFixed(0)}%)`}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}