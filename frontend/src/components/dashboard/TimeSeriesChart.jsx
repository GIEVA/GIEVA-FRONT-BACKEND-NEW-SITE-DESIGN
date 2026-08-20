import { Box, Typography } from "@mui/material";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const BORDER = "#E6E9F0";
const MUTED = "#64748B";

export default function TimeSeriesChart({ title, data, dataKey = "count", xKey = "date", color = GREEN }) {
  return (
    <Box>
      {title && (
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: NAVY, mb: 1.5 }}>{title}</Typography>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: MUTED }}
            tickFormatter={(v) => (v?.length > 7 ? v.slice(5) : v)}
            axisLine={{ stroke: BORDER }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}