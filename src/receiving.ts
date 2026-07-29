import amqp from "amqplib"

async function main() {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queue = 'hello';
        
//this section intializes the queue
    await channel.assertQueue(queue, {
        durable: true,
        arguments: { 'x-queue-type': 'quorum' }
    });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

    channel.consume(queue, function(msg:any) {
        console.log(" [x] Received %s", msg.content.toString());
    }, {
        noAck: true
    });
}

main();