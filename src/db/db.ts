import {Pool} from "pg"

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("connection with database is succeful");
})
