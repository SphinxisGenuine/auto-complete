import { AutocCompleteservice } from "./Autocompleteengine.service.js";
import { readFileSync } from "fs";
import express from "express"
export const instance = new AutocCompleteservice();
const app = express()
const file = readFileSync("\src\\wiki-100k.txt","utf-8");
// const file = readFileSync("\src\\google-10000-english.txt","utf-8");
const list =file.split("\n") .map(word => word.trim())
.filter(word => word.length > 0);
  console.log(list)
instance.loadDictionary(list);


app.get('/autocomplete',(req,res)=>{
    const querq= req.query.q
const suggestion = instance.autocomplete(String(querq),5);
res.json({result:suggestion})
})


  app.listen(3000,()=>{
    console.log("app is started runnig");
  })