import amqp from "amqplib";
import type { word } from "./rabbit.js";
import { pool } from "./db/db.js";
import { incrementWordFrequencyBulk } from "./db/insertword.repositries.js";

const batchMap = new Map<string, number>();
const Max_Batch = 200;
const Flush_Interval = 200;
const pendingMessages: amqp.ConsumeMessage[] = [];

// fixing scope issue
let channel:amqp.Channel

let Event_Count = 0;
let isFlushing=false
async function main() {
    console.log("recievd the word");
    const connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();
    
    const queue = "Wordupdate";
    
    //this section intializes the queue
    await channel.assertQueue(queue, {
        durable: true,
        arguments: { "x-queue-type": "quorum" },
    });
    
  console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

  channel.consume(
    queue,
    function (msg: any) {
      if (!msg) return;
      const word = JSON.parse(msg.content).word;
      console.log(" [x] Received %s", word);
      console.log(" [x] Received %s", word);

      // this sends the word to in-memory map and accumulates counts for DB bulk update
      batchMap.set(word, (batchMap.get(word) ?? 0) + 1);
      pendingMessages.push(msg);
      Event_Count++;
      if (Event_Count >= Max_Batch) {
        flushbatch()
      }
    },
    {
      noAck: false,
    },
  );
}

main();

setInterval(() => {
    console.log("200mms passed")
  flushbatch()
}, Flush_Interval);

async function flushbatch() {
  if (Event_Count === 0) return;
  if(isFlushing) return;
  isFlushing=true

  const updates = new Map(batchMap);
  const messages=[...pendingMessages]
  batchMap.clear();
  Event_Count= 0;
  pendingMessages.length=0


  try {
    console.log("Batch updates sent for "+ messages.entries)
    await incrementWordFrequencyBulk(updates);
    for (const msg of messages) {
    channel.ack(msg);
}
  } catch (err) {
    console.error("Batch write failed:", err);
    for (const [word, count] of updates) {
      batchMap.set(word, (batchMap.get(word) ?? 0) + count);
    }
    pendingMessages.push(...messages);
    Event_Count += messages.length;
  } finally {
    isFlushing = false;
  }
}
