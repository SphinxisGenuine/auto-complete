import { readFileSync, writeFileSync } from "fs";

const file = readFileSync("./src/wiki-100k.txt", "utf-8");

const words = file
    .split("\n")
    .map(word => word.trim())
    .filter(Boolean);

const csv = [
    "word,frequency",
    ...words.map((word, index) => {
        const frequency = words.length - index;
        return `${word},${frequency}`;
    })
].join("\n");

writeFileSync("./src/wiki-100k.csv", csv);

console.log("CSV Generated");