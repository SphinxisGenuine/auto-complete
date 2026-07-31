import { AutocCompleteservice } from "./Autocompleteengine.service.js";
import express from "express"
import dotenv from "dotenv";
import { pool } from "./db/db.js";
import { WordExist } from "./db/insertword.repositries.js";
import amqp from "amqplib"
import { json } from "node:stream/consumers";
dotenv.config()

export const instance = new AutocCompleteservice();
const app = express()



//intialize the queue
const connection = await amqp.connect('amqp://localhost');
const channel = await connection.createChannel();
const queue = 'Wordupdate';

//this section intializes the queue
await channel.assertQueue(queue, {
  durable: true,
  arguments: { 'x-queue-type': 'quorum' }
});




const result = await pool.query(`
  SELECT word,frequency
  FROM search_term
  ORDER BY frequency DESC;
  `);
  instance.loadDictionary(result.rows);
  console.log(`Loaded ${result.rowCount} words.`);
  

  app.use(express.json())



app.get('/autocomplete',(req,res)=>{
    const querq= req.query.q
const suggestion = instance.autocomplete(String(querq),5);
res.json({result:suggestion})
})
app.post('/selcetion',async (req,res)=>{
  const wordq=req.body.word
  console.log(wordq)
  const Iswordexxist=await WordExist(wordq)
  if (!Iswordexxist){
    return res.status(400).json({msg:"Word dosent exist"})
  }
    else {
      let word ={
        word:wordq
      }
    channel.sendToQueue(queue,Buffer.from(JSON.stringify(word)));
      // publish to queue
      return res.status(200).json({msg:"Secltion Recorded"})
    }

})

  app.listen(3000,()=>{
    console.log("app is started runnig");
  })