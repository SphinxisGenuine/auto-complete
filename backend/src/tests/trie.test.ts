import { describe, it, expect, beforeEach } from "vitest";
import { Trie } from "../trie.js";
import { AutocCompleteservice } from "../Autocompleteengine.service.js";

describe("Trie Data Structure", () => {
  let trie: Trie;

  beforeEach(() => {
    trie = new Trie();
  });

  it("should insert and search words correctly", () => {
    trie.insert("apple", 100);
    trie.insert("app", 50);
    trie.insert("application", 80);

    expect(trie.search("apple")).toBe(true);
    expect(trie.search("app")).toBe(true);
    expect(trie.search("application")).toBe(true);
    expect(trie.search("appl")).toBe(false);
    expect(trie.search("banana")).toBe(false);
  });

  it("should verify prefix existence with startsWith", () => {
    trie.insert("google", 500);

    expect(trie.startsWith("g")).toBe(true);
    expect(trie.startsWith("goo")).toBe(true);
    expect(trie.startsWith("google")).toBe(true);
    expect(trie.startsWith("ga")).toBe(false);
  });

  it("should return suggestions ranked by frequency in descending order", () => {
    trie.insert("apple", 50);
    trie.insert("application", 200);
    trie.insert("app", 150);
    trie.insert("apply", 75);

    const suggestions = trie.getSuggestion("app");
    expect(suggestions).toBeDefined();
    expect(suggestions.length).toBe(4);

    expect(suggestions[0]!.word).toBe("application");
    expect(suggestions[0]!.freqency).toBe(200);
    expect(suggestions[1]!.word).toBe("app");
    expect(suggestions[1]!.freqency).toBe(150);
    expect(suggestions[2]!.word).toBe("apply");
    expect(suggestions[2]!.freqency).toBe(75);
    expect(suggestions[3]!.word).toBe("apple");
    expect(suggestions[3]!.freqency).toBe(50);
  });

  it("should handle case insensitivity", () => {
    trie.insert("GitHub", 300);

    expect(trie.search("github")).toBe(true);
    expect(trie.search("GITHUB")).toBe(true);

    const suggestions = trie.getSuggestion("GIT");
    expect(suggestions.length).toBe(1);
    expect(suggestions[0]!.word).toBe("github");
  });

  it("should return empty array for non-existent prefixes", () => {
    trie.insert("hello", 10);
    const suggestions = trie.getSuggestion("xyz");
    expect(suggestions).toEqual([]);
  });

  it("should record selection and update frequency + Top-K ranking", () => {
    trie.insert("cat", 10);
    trie.insert("caterpillar", 11);

    let initialSuggestions = trie.getSuggestion("cat");
    expect(initialSuggestions[0]!.word).toBe("caterpillar");

    trie.RecordSelection("cat");
    trie.RecordSelection("cat");

    let updatedSuggestions = trie.getSuggestion("cat");
    expect(updatedSuggestions[0]!.word).toBe("cat");
    expect(updatedSuggestions[0]!.freqency).toBe(12);
  });

  it("should return false when recording selection for non-existent word", () => {
    const success = trie.RecordSelection("nonexistent");
    expect(success).toBe(false);
  });

  it("should respect Top-K limit of 8 entries per node", () => {
    for (let i = 1; i <= 15; i++) {
      trie.insert(`test${i}`, i * 10);
    }

    const suggestions = trie.getSuggestion("test");
    expect(suggestions.length).toBeLessThanOrEqual(8);
    expect(suggestions[0]!.word).toBe("test15");
    expect(suggestions[0]!.freqency).toBe(150);
  });
});

describe("AutocCompleteservice", () => {
  it("should load dictionary and return top 5 autocomplete results", () => {
    const service = new AutocCompleteservice();
    service.loadDictionary([
      { word: "react", freqency: 500 },
      { word: "redux", freqency: 400 },
      { word: "router", freqency: 300 },
      { word: "rest", freqency: 200 },
      { word: "redis", freqency: 150 },
      { word: "ruby", freqency: 100 },
    ]);

    const results = service.autocomplete("re", 5);
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.word === "react")).toBe(true);
  });
});
