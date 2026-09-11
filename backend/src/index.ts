import { AutocCompleteservice } from "./Autocompleteengine.service.js";
import dotenv from "dotenv";
import cluster from "node:cluster";
import { pool } from "./db/db.js";
import amqp from "amqplib";
import { createApp } from "./app.js";

// Enforce Round-Robin across all workers on Windows (prevents single-worker saturation)
cluster.schedulingPolicy = cluster.SCHED_RR;

dotenv.config();

export const instance = new AutocCompleteservice();

// Initialize the RabbitMQ connection & queue
const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://127.0.0.1");
const channel = await connection.createChannel();
const queue = "Wordupdate";

await channel.assertQueue(queue, {
  durable: true,
  arguments: { "x-queue-type": "quorum" },
});

// Load dictionary from Postgres into in-memory Trie
const result = await pool.query(`
  SELECT word, frequency
  FROM search_term
  ORDER BY frequency DESC;
`);
instance.loadDictionary(result.rows);
console.log(`Loaded ${result.rowCount} words.`);

export const app = createApp({
  instance,
  channel,
  queue,
});

app.listen(3000, () => {
  console.log("app is started running on port 3000");
});