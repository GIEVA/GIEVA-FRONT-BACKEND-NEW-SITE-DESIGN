// middleware/corsConfig.js
import cors from "cors";

const splitCsv = (v) =>
  String(v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export default function corsConfig(app) {
  // ✅ Allowlist from env + sensible dev defaults
  // Example .env:
  // CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://admin.easyrent.com,https://easyrent.com
  const allowList = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "https://gieva-front-backend-new-site-design.vercel.app",
  "https://gieva.ng",
  ...splitCsv(process.env.CORS_ORIGINS),
]);

  const corsOptions = {
    origin(origin, callback) {
      // Allow non-browser requests (Postman, server-to-server, curl)
      if (!origin) return callback(null, true);

      // Allow exact matches
      if (allowList.has(origin)) return callback(null, true);

      // Optional: allow all subdomains of your domain (uncomment + adjust)
      // if (origin.endsWith(".easyrent.com") || origin === "https://easyrent.com") {
      //   return callback(null, true);
      // }

      // Block others
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },

    credentials: true, // keep true if you use cookies; safe even with Bearer tokens
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Length"],

    // Some legacy browsers choke on 204
    optionsSuccessStatus: 200,
  };

  // ✅ Apply CORS
  app.use(cors(corsOptions));

  // ✅ Preflight handler for all routes (avoid "*")
  app.options(/.*/, cors(corsOptions));

  // ✅ Nice: return useful error instead of silent "Network Error"
  app.use((err, req, res, next) => {
    if (err?.message?.startsWith("CORS blocked")) {
      return res.status(403).json({
        message: "CORS policy blocked this request",
        detail: err.message,
      });
    }
    next(err);
  });
}
