import "dotenv/config";
import { pool } from "./db.js";
import  fs,{  readdirSync } from "fs"
import path from "path"
async function main(){
await pool.query(`
CREATE TABLE IF NOT EXISTS migrations(
name VARCHAR(255) PRIMARY KEY,
applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)    
`);
  const { rows } = await pool.query('SELECT name FROM migrations');
  const applied = new Set(rows.map(r=>r.name))

    const dir = path.join(process.cwd(),"src\\db\\migration")
    const files = readdirSync(dir).filter((f)=>f.endsWith('.sql')).sort()
    for (const file of files) {
        if (applied.has(file)){
            console.log(`Skipping (already applied): ${file}`);
            continue;
        }
        console.log(`Applying: ${file}`);
        const sql =fs.readFileSync(path.join(dir,file),'utf-8');
        await pool.query(sql); 
        await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        console.log(`Done: ${file}`);
    }
  process.exit(0);
}
main()
