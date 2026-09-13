# Autocomplete Engine — Sub-10ms Trie-based Search with Async Write Path

## Summary

I built an autocomplete engine capable of serving **100,000 words** with a **1.56 ms median response time** and over **8,000 requests per second** on a single process.

Instead of standard SQL `LIKE` queries or naive DFS traversal, each Trie node maintains a pre-ranked **Top-K cache**, making lookups $O(k)$ for the typed prefix. For writes, user selections are decoupled through **RabbitMQ** with a 200ms batching worker into **PostgreSQL**, ensuring reads never wait on database locks. In stress testing up to 1,000 concurrent virtual users, the system maintained a **0.00% failure rate** across nearly a million requests.

---

## Why This Exists

I built this Trie-based autocomplete to explore what it takes to turn an algorithmic concept into a production-grade system capable of handling substantial traffic.

Key questions tackled after building v1:

- **How do you serve suggestions without recursive DFS on every keystroke?**
- **How do you increment word frequencies in the database and in-memory without waiting on disk I/O?**
- **How do you scale an application from zero while maintaining predictable end-to-end performance?**

---

## Architecture

[diagram ](./diagram.png)

---

## Performance & Benchmark Highlights

### 1. 1.56 ms Median Read Latency (p95: 6.09 ms)

- **What it is:** Returned autocomplete suggestions in 1.56 ms under 30–50 concurrent users.
- **Engineering:** Cached Top-5 suggestions at every Trie node, turning queries into a simple $O(k)$ prefix traversal with no DFS or database lookup.

### 2. 8,291 Requests/Second on a Single Node.js Instance

- **What it is:** Sustained 8.3k RPS during load testing with up to 1,000 virtual users.
- **Engineering:** Kept the read path 100% in-memory and moved writes to RabbitMQ + async workers, preventing event-loop blocking and maintaining high throughput.

### 3. 0.00% Error Rate Under 1,000 VU Stress

- **What it is:** Across 787,654 requests in the stress suite pushing up to 1,000 concurrent Virtual Users, the system recorded 0 failed requests (0.00% error rate).
- **Details:** [View Detailed Reports](./backend/reports/)

### 4. 0.53 ms Decoupled Write Pipeline via RabbitMQ & Batching

- **What it is:** When a user selects a word, recording the selection takes only 0.53 milliseconds (median), with a p95 of 2.61 ms.
- **Engineering:** Selection updates are immediately acknowledged and queued, isolating database operations from the client request cycle.

---

> **Reads and writes are fully decoupled:** A user selecting a word never blocks another user's search — updates are queued, batched, and applied asynchronously to both the database and the live in-memory Trie.

---

## Load Test Results (k6)

| Concurrent Users (VU) | p95 Latency   |
| :-------------------- | :------------ |
| **30–100**            | **6.05 ms**   |
| **500**               | **73.96 ms**  |
| **1,000**             | **176.00 ms** |

---

## Key Engineering Decisions

| Problem                   | Naive Approach                       | What I Built Instead                                                | Why                                                                                     |
| :------------------------ | :----------------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------------- |
| **Storing 100k+ words**   | Array, linear scan                   | Trie (prefix tree)                                                  | $O(k)$ lookup by prefix length instead of $O(n)$ scan                                   |
| **Ranking suggestions**   | DFS from prefix node on every query  | Top-K cache stored per Trie node, updated on write                  | Removes per-query tree walk entirely — this is what achieved sub-ms latency             |
| **Frequency updates**     | Update DB on every selection         | Batched writes: flush on 200ms elapsed _or_ 200 pending updates     | Reduces DB calls by orders of magnitude under load; prevents connection pool exhaustion |
| **Read/write contention** | Selection updates block search reads | Async queue (RabbitMQ) + dedicated worker consumer                  | Keeps read path latency independent of write volume                                     |
| **Frequency persistence** | Reload static dictionary on boot     | Trie rebuilt from Postgres on startup; live updates persisted async | Frequency reflects real usage, not a static seed file, and survives restarts            |
| **Backpressure**          | Unbounded queue growth under load    | Queue capped, tuned around 200 in-flight requests                   | Prevents the worker from being overwhelmed during traffic spikes                        |

---

## Engineering Journal & Design Notes

For an in-depth, step-by-step walkthrough of how this system evolved from first principles — including why naive DFS traversal failed, how the asynchronous RabbitMQ write pipeline was designed, handling database race conditions, and bottlenecks uncovered during stress testing — see the **[Architecture & Engineering Journal](./Journal.md)**.

---

## Running Locally

1. **Start backend services & database:**

   ```bash
   docker compose up --build
   ```

2. **Open the web application:**
   - [http://localhost:5173](http://localhost:5173)
