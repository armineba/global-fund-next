import { spawnSync } from "node:child_process";
import { chmodSync, unlinkSync } from "node:fs";

const [envFile, output] = process.argv.slice(2);
if (!envFile || !output) throw new Error("Usage: backup-database.mjs <env file> <dump path>");
process.umask(0o077);
process.loadEnvFile(envFile);
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required before deployment.");
const database = new URL(process.env.DATABASE_URL);
if (!["postgres:", "postgresql:"].includes(database.protocol)) throw new Error("Invalid database protocol.");

// Credentials are passed through the child environment, never its command line.
const env = {
  PATH: "/usr/bin:/bin",
  HOME: process.env.HOME,
  PGHOST: database.hostname,
  PGPORT: database.port || "5432",
  PGUSER: decodeURIComponent(database.username),
  PGPASSWORD: decodeURIComponent(database.password),
  PGDATABASE: decodeURIComponent(database.pathname.slice(1)),
  PGCONNECT_TIMEOUT: "15",
};
for (const [parameter, variable] of [["sslmode", "PGSSLMODE"], ["sslrootcert", "PGSSLROOTCERT"]]) {
  if (database.searchParams.has(parameter)) env[variable] = database.searchParams.get(parameter);
}
const result = spawnSync("/usr/bin/pg_dump", ["--no-password", "--format=custom", "--file", output], {
  env,
  encoding: "utf8",
  timeout: 120_000,
});
if (result.error || result.status !== 0) {
  try { unlinkSync(output); } catch { /* No partial dump to retain. */ }
  // pg_dump diagnostics can contain connection details; keep CI logs private.
  throw new Error("PostgreSQL backup failed; deployment stopped before activation.");
}
chmodSync(output, 0o600);
console.log("PostgreSQL backup saved.");
