import { pool } from "./db.js";
import { instance } from "../index.js";
export async function incrementWordFrequency(word: string) {
    const sql = `
        UPDATE search_term
        SET frequency = frequency + 1
        WHERE word = $1
        RETURNING word, frequency;
    `;

    const result = await pool.query(sql, [word]);

    if (result.rowCount === 0) {
        return null; // Word doesn't exist
    }

    return result.rows[0];
}