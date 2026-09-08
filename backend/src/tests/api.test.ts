import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { AutocCompleteservice } from "../Autocompleteengine.service.js";

describe("API Endpoints Integration Tests", () => {
  let app: ReturnType<typeof createApp>;
  let mockService: AutocCompleteservice;
  let mockChannel: { sendToQueue: ReturnType<typeof vi.fn> };
  let mockWordExist: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockService = new AutocCompleteservice();
    mockService.loadDictionary([
      { word: "google", freqency: 1000 },
      { word: "golang", freqency: 800 },
      { word: "goroutine", freqency: 600 },
      { word: "godot", freqency: 400 },
      { word: "good", freqency: 200 },
      { word: "goodbye", freqency: 100 },
    ]);

    mockChannel = {
      sendToQueue: vi.fn().mockReturnValue(true),
    };

    mockWordExist = vi.fn(async (word: string) => {
      const existing = ["google", "golang", "apple", "application"];
      return existing.includes(word.toLowerCase()) ? 1 : 0;
    });

    app = createApp({
      instance: mockService,
      channel: mockChannel as any,
      queue: "Wordupdate",
      wordExistFn: mockWordExist as any,
    });
  });

  describe("GET /health", () => {
    it("should return 200 and status ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });
  });

  describe("GET /autocomplete", () => {
    it("should return 200 and top suggestions for a valid prefix", async () => {
      const res = await request(app).get("/autocomplete?q=go");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("result");
      expect(Array.isArray(res.body.result)).toBe(true);
      expect(res.body.result.length).toBeGreaterThan(0);
      expect(res.body.result[0].word).toBe("google");
      expect(res.body.result[0].freqency).toBe(1000);
    });

    it("should be case-insensitive for search queries", async () => {
      const resUpper = await request(app).get("/autocomplete?q=GO");
      const resLower = await request(app).get("/autocomplete?q=go");
      expect(resUpper.status).toBe(200);
      expect(resLower.status).toBe(200);
      expect(resUpper.body.result).toEqual(resLower.body.result);
    });

    it("should return empty array when no words match prefix", async () => {
      const res = await request(app).get("/autocomplete?q=zzzznotfound");
      expect(res.status).toBe(200);
      expect(res.body.result).toEqual([]);
    });

    it("should return empty result when query is missing", async () => {
      const res = await request(app).get("/autocomplete");
      expect(res.status).toBe(200);
      expect(res.body.result).toEqual([]);
    });

    it("should respond within low latency", async () => {
      const startTime = performance.now();
      await request(app).get("/autocomplete?q=goo");
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(100);
    });
  });

  describe("POST /selcetion (original spelling)", () => {
    it("should record selection and publish to queue when word exists", async () => {
      const res = await request(app)
        .post("/selcetion")
        .send({ word: "google" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ msg: "Secltion Recorded" });
      expect(mockWordExist).toHaveBeenCalledWith("google");
      expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(1);

      const firstCall = mockChannel.sendToQueue.mock.calls[0] as [string, Buffer];
      expect(firstCall).toBeDefined();
      const [queueName, buffer] = firstCall;
      expect(queueName).toBe("Wordupdate");
      const payload = JSON.parse(buffer.toString());
      expect(payload).toEqual({ word: "google" });
    });

    it("should return 400 when word does not exist in repository", async () => {
      const res = await request(app)
        .post("/selcetion")
        .send({ word: "unknownword12345" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ msg: "Word dosent exist" });
      expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
    });

    it("should return 400 if word is missing in body", async () => {
      const res = await request(app).post("/selcetion").send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ msg: "Word is required" });
    });
  });

  describe("POST /selection (alias)", () => {
    it("should record selection using standard spelling endpoint", async () => {
      const res = await request(app)
        .post("/selection")
        .send({ word: "apple" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ msg: "Secltion Recorded" });
      expect(mockChannel.sendToQueue).toHaveBeenCalled();
    });
  });
});
