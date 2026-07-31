import { AutocCompleteservice } from "./Autocompleteengine.service.js";
import { readFileSync } from "fs";
import express from "express"
import dotenv from "dotenv";import { pool } from "./db/db.js";
import { WordExist } from "./db/insertword.repositries.js";
dotenv.config()
export const instance = new AutocCompleteservice();
const app = express()
console.log(process.env.DATABASE_URL)
const result = await pool.query(`
SELECT word,frequency
FROM search_term
ORDER BY frequency DESC;
`);
instance.loadDictionary(result.rows);
console.log(`Loaded ${result.rowCount} words.`);

app.get('/autocomplete',(req,res)=>{
    const querq= req.query.q
const suggestion = instance.autocomplete(String(querq),5);
res.json({result:suggestion})
})
app.post('/selcetion',async (req,res)=>{
  const wordq=req.body.word
  const Iswordexxist=await WordExist(wordq)
  if (!Iswordexxist){
    return res.status(400).json({msg:"Word dosent exist"})
  }
    else {

      // publish to queue

      return res.status(400).json({msg:"Secltion Recorder"})
    }

})

  app.listen(3000,()=>{
    console.log("app is started runnig");
  })