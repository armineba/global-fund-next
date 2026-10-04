import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Pool } from "pg";

export async function applyMigrations(pool: Pool) {
  const migrationUrl = new URL("../migrations/0000_rooms.sql", import.meta.url);
  const sql = await readFile(migrationUrl, "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

if (
  process.argv[1] &&
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])
) {
  try {
    process.loadEnvFile(
      resolve(dirname(fileURLToPath(import.meta.url)), "../../..", ".env"),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (!process.env.DATABASE_URL)
    throw new Error(
      "DATABASE_URL est nécessaire pour appliquer les migrations.",
    );
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await applyMigrations(pool);
  } finally {
    await pool.end();
  }
}
