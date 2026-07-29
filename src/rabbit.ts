import amqp from "amqplib";

// so the rabbit is listening to the 5672 and it only speaks amqb protocol so the we take amqb and 
// intialize a tcp connection  we can hav multiple chaneel over same tcp conncetion 
const connection = await amqp.connect("amqp://localhost");
const channel = await connection.createChannel();

const queue = 'hello';
const msg = 'Hello World!';


//this section intializes the queue
await channel.assertQueue(queue, {

  // this means queues surivie restarts but not the message   
  durable: true,
  arguments: {
    'x-queue-type': 'quorum'
  }
});

channel.sendToQueue(queue, Buffer.from(msg));
console.log(" [x] Sent %s", msg);

setTimeout(function() {
// closes the tcp connection 
    connection.close();
  process.exit(0)
}, 500);