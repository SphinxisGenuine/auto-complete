import {Pool} from "pg"
import dotenv from "dotenv"
dotenv.config()
console.log(process.env.DATABASE_URL)
export const pool = new Pool({
  connectionString:
    // process.env.DATABASE_URL,
    "postgresql://admin:password123@localhost:5432/myapp"
});

pool.on("connect", () => {
  console.log("connection with database is succeful");
})
