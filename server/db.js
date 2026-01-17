import mysql from "mysql2/promise";

export function makeDbPool() {
  const useSSL =
    process.env.DB_SSL === "true" ||
    process.env.DB_SSL === "1" ||
    process.env.DB_SSL === "required";

  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: useSSL ? { rejectUnauthorized: false } : undefined,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}


/*export function makeDbPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}
*/
