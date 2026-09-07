import amqp from "amqplib";
import { json } from "stream/consumers";
export type word={
  word:string,

}

// so the rabbit is listening to the 5672 and it only speaks amqb protocol so the we take amqb and 
// intialize a tcp connection  we can hav multiple chaneel over same tcp conncetion 
const connection = await amqp.connect("amqp://localhost");
const channel = await connection.createChannel();

const queue = 'Wordupdate';
let wordTobeupdated:word={
  word:"apple"
}


//this section intializes the queue
await channel.assertQueue(queue, {

  // this means queues surivie restarts but not the message   
  durable: true,
  arguments: {
    'x-queue-type': 'quorum'
  }
});

channel.sendToQueue(queue, Buffer.from(JSON.stringify(wordTobeupdated)));
console.log(" [x] Sent %s", wordTobeupdated);
console.log(" [x] Sent %s", Buffer.from(JSON.stringify(wordTobeupdated)));

setTimeout(function() {
// closes the tcp connection 
    connection.close();
  process.exit(0)
}, 500);