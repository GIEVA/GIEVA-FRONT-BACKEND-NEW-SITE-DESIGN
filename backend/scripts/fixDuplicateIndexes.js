// scripts/fixDuplicateIndexes.js
// Run once from anywhere: node scripts/fixDuplicateIndexes.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load backend/.env using an absolute path, instead of
// relying on the terminal's current working directory (which is
// what was silently failing before).
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("Resolved .env from:", path.resolve(__dirname, "../.env"));
console.log("DB_HOST:", process.env.DB_HOST || "(MISSING)");
console.log("DB_NAME:", process.env.DB_NAME || "(MISSING)");
console.log("DB_USERNAME:", process.env.DB_USERNAME ? "(set)" : "(MISSING)");
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "(set)" : "(MISSING)");
console.log("");

// Dynamic import so this runs AFTER dotenv has already populated
// process.env above — config/db.js's own dotenv.config() call will
// just be a harmless no-op at that point since the vars already exist.
const { sequelize } = await import("../config/db.js");

const TABLES_TO_CHECK = [
  "class_sessions",
  "users",
  "exam_registrations",
  "exam_payments",
  "exam_types",
];

const run = async () => {
  await sequelize.authenticate();
  console.log("Connected — scanning for duplicate indexes...\n");

  for (const table of TABLES_TO_CHECK) {
    let indexes;
    try {
      [indexes] = await sequelize.query(`SHOW INDEX FROM \`${table}\`;`);
    } catch (err) {
      console.log(`[${table}] skipped — ${err.message}`);
      continue;
    }

    const byColumn = {};
    for (const idx of indexes) {
      if (idx.Key_name === "PRIMARY") continue;
      const col = idx.Column_name;
      (byColumn[col] ||= []).push(idx.Key_name);
    }

    for (const [col, keyNames] of Object.entries(byColumn)) {
      const uniqueKeyNames = [...new Set(keyNames)];
      if (uniqueKeyNames.length <= 1) continue;

      console.log(`[${table}] column "${col}" has ${uniqueKeyNames.length} duplicate indexes`);
      const [keep, ...drop] = uniqueKeyNames;
      console.log(`  keeping: ${keep}`);

      for (const keyName of drop) {
        console.log(`  dropping: ${keyName}`);
        await sequelize.query(`ALTER TABLE \`${table}\` DROP INDEX \`${keyName}\`;`);
      }
    }
  }

  console.log("\nDone.");
  await sequelize.close();
};

run().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});