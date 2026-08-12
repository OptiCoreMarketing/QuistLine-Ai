import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

// Hostede Postgres-udbydere (Railway, Heroku m.fl.) kræver typisk SSL på
// eksterne forbindelser, ofte med selvsignerede certifikater. localhost
// (lokal udvikling) har normalt ikke SSL sat op overhovedet.
const useSsl = Boolean(connectionString) && !connectionString.includes("localhost");

export const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 5
});

export function isDatabaseConfigured() {
  return Boolean(connectionString);
}
