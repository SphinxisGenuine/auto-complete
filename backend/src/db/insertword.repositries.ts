import { pool } from "./db.js";
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

export async function WordExist(word: string) {
  const sql = `
    SELECT word FROM search_term
    WHERE word = $1    
    `;

  const result = await pool.query(sql, [word]);

  if (result.rowCount === 0) {
    return 0; // Word doesn't exist
  } else {
    return 1;
  }
}

export async function incrementWordFrequencyBulk(updates: Map<string, number>) {
  const values = [...updates.entries()];

  if (values.length === 0) return;


  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const [word, count] of values) {
      await client.query(
        `
          UPDATE search_term
          SET frequency = frequency + $1
          WHERE word = $2
        `,
        [count, word],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
