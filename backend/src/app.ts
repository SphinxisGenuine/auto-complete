import express from "express";
import type { Express } from "express";
import { AutocCompleteservice } from "./Autocompleteengine.service.js";
import { WordExist as defaultWordExist } from "./db/insertword.repositries.js";
import type { Channel } from "amqplib";

export interface AppOptions {
  instance: AutocCompleteservice;
  channel?: { sendToQueue: (queue: string, content: Buffer, options?: any) => boolean } | null;
  queue?: string;
  wordExistFn?: (word: string) => Promise<number | boolean>;
}

export function createApp(options: AppOptions): Express {
  const app = express();
  const {
    instance,
    channel,
    queue = "Wordupdate",
    wordExistFn,
  } = options;

  app.use(express.json());
  app.use((_req, res, next) => {
    res.setHeader("X-Worker-Id", process.env.NODE_APP_INSTANCE ?? String(process.pid));
    next();
  });

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Autocomplete endpoint
  app.get("/autocomplete", (req, res) => {
    const querq = req.query.q;
    if (querq === undefined || querq === null) {
      return res.json({ result: [] });
    }
    const suggestion = instance.autocomplete(String(querq), 5);
    return res.json({ result: suggestion });
  });

  // Handler for recording selection
  const handleSelection = async (req: any, res: any) => {
    const wordq = req.body?.word;
    if (!wordq || typeof wordq !== "string") {
      return res.status(400).json({ msg: "Word is required" });
    }

    try {
      const isWordExist = wordExistFn
        ? await wordExistFn(wordq)
        : instance.iswordexist(wordq);

      if (!isWordExist) {
        return res.status(400).json({ msg: "Word dosent exist" });
      }

      instance.recordselection(wordq);

      if (channel) {
        const payload = { word: wordq };
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)));
      }

      return res.status(200).json({ msg: "Secltion Recorded" });
    } catch (error) {
      console.error("Error in selection handler:", error);
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  };

  // Support both original spelling /selcetion and standard spelling /selection
  app.post("/selcetion", handleSelection);
  app.post("/selection", handleSelection);

  return app;
}
