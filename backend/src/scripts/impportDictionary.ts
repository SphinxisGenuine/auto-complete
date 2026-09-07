import fs from "fs";
import { from as copyFrom } from "pg-copy-streams";
import { pool } from "../db/db.js";

async function importDictionary() {

    const client = await pool.connect();

    try {

        const stream = client.query(
            copyFrom(`
                COPY search_term(word, frequency)
                FROM STDIN
                WITH (
                    FORMAT csv,
                    HEADER true
                )
            `)
        );

        const fileStream = fs.createReadStream("./src/wiki-100k.csv");

        fileStream.pipe(stream);

        await new Promise((resolve, reject) => {

            stream.on("finish", resolve);
            stream.on("error", reject);

        });

        console.log("Dictionary Imported");

    } finally {

        client.release();

    }

}

importDictionary();