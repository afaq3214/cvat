# Objectives

## MO-1: response time of the label-counts endpoint

| Field | Entry |
|---|---|
| What is measured | Time for `GET /api/test/tasks/1/label-counts` to return a full response to a logged-in task owner. |
| How | `curl` from the host, reading `time_total`. One run is 10 requests in a row, and the value of the run is the median of those 10. The script is `docs/evidence/measure-mo-1.sh`. |
| Target | Median of 5 runs at or below **200 ms**. |
| Conditions | Local Docker stack on the machine below, through `http://localhost:8080` (Traefik, nginx, uvicorn). Task 1: 500 COCO val2017 images, 80 labels, 3953 shapes. Server warm: 3 requests are sent and thrown away first. Token login. No other requests to CVAT during the run. |
| Not included | The first request after a server restart. Time the browser needs to draw the chart. Tasks of other sizes. Video tasks and tracks, because the sample data has none. |

### Why 200 ms

The page makes one request when it opens and shows a spinner until the answer
arrives. I want the chart to appear without the user noticing a wait. About one
second is where a wait starts to feel like a wait, and the browser still has to
load the page and draw 80 bars after the response arrives. 200 ms leaves most of
that second for the browser.

I do not know if I will hit it. Every request goes through Traefik, nginx, a
permission check against Open Policy Agent, and then four database queries, on a
laptop from 2014 that is short on memory. I wrote this target down before taking
any measurement.

### Machine

| | |
|---|---|
| CPU | Intel Core i5-4300U, 1.90 GHz, 2 cores, 4 threads |
| RAM | 8 GB (8067 MB). Docker is given 3.77 GB of it. |
| Operating system | Windows 10 Pro, build 19045 |
| Docker | Docker Desktop, engine 29.6.1, Compose v5.3.0 |
| CVAT commit | `98ee84d0fb5f677d31acf71ec5f797f560f00f5f` |
| Sample data | First 500 images of COCO val2017 by file name, with their annotations. 3953 shapes: 3916 polygons and 37 masks. |

Not a clean environment: VS Code, Chrome and the CVAT UI development server were
open during the runs, because closing them was not practical on this laptop. Six
CVAT containers that the feature does not use were stopped to free memory
(Grafana and the consensus, quality report, webhook and export workers; ClickHouse
was started again because the server waits for it at startup).

### Result

**Target missed.** Median of 5 runs: **342 ms**. Target: 200 ms.
Spread of the 5 runs: 268 ms to 441 ms.

Measured on 6 October 2026 at 18:57 UTC, on commit `7d45bb006`. Raw output,
copied from `docs/evidence/mo-1-runs.txt`:

```
# 2026-10-06T18:57:50Z  http://localhost:8080/api/test/tasks/1/label-counts
# warm-up: 3 requests, not counted
run 1: 283.4 299.7 313.5 1089.9 326.3 340.0 1152.9 431.9 350.5 344.3  -> median 342.15 ms
run 2: 260.5 300.0 277.5 232.3 271.5 250.1 286.5 263.9 261.4 301.2  -> median 267.7 ms
run 3: 334.2 258.1 316.2 533.7 959.5 4559.2 925.1 686.8 299.7 271.1  -> median 433.95 ms
run 4: 324.6 302.3 310.8 320.9 1114.4 600.0 280.2 267.0 274.6 1978.4  -> median 315.85 ms
run 5: 425.9 307.0 354.9 471.1 591.5 1171.4 602.0 455.5 278.6 301.4  -> median 440.7 ms
median of 5 runs: 342.15 ms
spread of 5 runs: 267.7 to 440.7 ms
```

### Why it was missed

The fastest single request out of 50 was 232 ms. So this is not bad luck in one
run: on this machine the endpoint does not reach 200 ms at all.

To see how much of the time is mine, I timed two existing CVAT endpoints right
after, on the same stack with the same login, 10 requests each
(`docs/evidence/mo-1-baseline.txt`):

| Endpoint | Median |
|---|---|
| `/api/server/about` (CVAT's own, no permission check on an object) | 130 ms |
| `/api/test/tasks/1/label-counts` (mine) | 403 ms |
| `/api/tasks/1` (CVAT's own task details) | 743 ms |

What I take from this:

- About 130 ms is spent before any of my code runs. That left about 70 ms of my
  200 ms for the permission check and the queries. My target was too tight for
  this stack on this laptop, and I set it without knowing the floor.
- My endpoint is slower than the floor by about 200 to 270 ms. That part is the
  permission check, loading the task and its labels, and the three counting
  queries. I did not measure how it splits between them, so I cannot say which
  one to fix first.
- The numbers are noisy. Single requests took up to 4.5 seconds, and my endpoint
  measured 342 ms in one set and 403 ms in the next. The laptop was short on
  memory all evening: when I checked, between 90 and 320 MB was free. The
  baseline is 10 requests per endpoint, not 5 runs, so I use it only to compare,
  not as a result.

One correction to what I wrote before measuring: the endpoint runs five queries
of its own, not four. They are the task, its labels, and one count each for
shapes, tracks and tags.

### What I would do next

First, time the permission check and each query separately, on a machine with
free memory. Only then decide. If the queries are the slow part, the fix is the
count table described in the decision record in `plan.md`.
