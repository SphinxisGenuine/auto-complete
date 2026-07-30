import amqp from "amqplib"
import type { word } from "./rabbit.js";
import { pool } from "./db/db.js";
import { incrementWordFrequency } from "./db/insertword.repositries.js";
import { instance } from "./index.js";



async function main() {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queue = 'Wordupdate';
        
//this section intializes the queue
    await channel.assertQueue(queue, {
        durable: true,
        arguments: { 'x-queue-type': 'quorum' }
    });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

     channel.consume(queue, function(msg:any) {
        const word=JSON.parse(msg.content).word
        console.log(" [x] Received %s", word);
        console.log(" [x] Received %s",word);
   
        async function increament(){
            const updatefreq=await  incrementWordFrequency(word);
            instance.recordselection(word);
        }

     
    }, {
        noAck: true
    });
}

main();