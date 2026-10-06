# Objectives

## MO-1: response time of the label-counts endpoint

| Field | Entry |
|---|---|
| What is measured | Time for `GET /api/test/tasks/1/label-counts` to return a full response to a logged-in task owner. |
| How | `curl` from the host, reading `time_total`. One run is 10 requests in a row, and the value of the run is the median of those 10. The exact steps are under "How to repeat it". |
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

**Target missed: 342 ms. The target was 200 ms.**

| Run | Middle value of its 10 requests |
|---|---|
| 1 | 342 ms |
| 2 | 268 ms |
| 3 | 434 ms |
| 4 | 316 ms |
| 5 | 441 ms |

In order: 268, 316, **342**, 434, 441. The middle one is 342 ms. The spread is
268 to 441 ms.

Measured on 6 October 2026 at 23:57 (18:57 UTC), on commit `7d45bb006`. Raw output:

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

### Why I missed it

- The fastest of all 50 requests took 232 ms. So this is not one unlucky run. On
  this laptop the endpoint never gets under 200 ms.
- Right after, I timed two of CVAT's own endpoints the same way, 10 requests each:

  | Endpoint | Middle value |
  |---|---|
  | `/api/server/about` (CVAT's own, does almost no work) | 130 ms |
  | `/api/test/tasks/1/label-counts` (mine) | 403 ms |
  | `/api/tasks/1` (CVAT's own task details) | 743 ms |

  ```
  /api/test/tasks/1/label-counts: 1287.3 1949.4 357.4 451.5 1195.4 389.3 297.1 249.0 228.5 416.6
  /api/tasks/1: 1953.0 10209.8 514.8 3610.5 2327.1 447.1 682.0 804.5 288.5 492.8
  /api/server/about: 290.7 136.6 1403.2 313.2 184.4 104.5 102.0 124.0 104.7 111.0
  ```

- So about 130 ms is gone before my code even runs. 200 - 130 = 70 ms was all I
  had left for the permission check and my queries. My target was too tight, and
  I set it without knowing this.
- The laptop was short on memory the whole evening (90 to 320 MB free when I
  looked). That is why some requests took over a second, and one took 4.5.
- I did not measure which part of my own code is the slow one.

One correction to what I wrote before measuring: my endpoint runs five queries,
not four. They are the task, its labels, and one count each for shapes, tracks
and tags.

### How to repeat it

1. Start the stack and get an API token for the owner of task 1.
2. Run this command. It prints the time of one request in seconds:

   ```
   curl -s -o /dev/null -H "Authorization: Token <token>" -w "%{time_total}\n" http://localhost:8080/api/test/tasks/1/label-counts
   ```

3. Run it 3 times and ignore the results. This warms the server up.
4. Run it 10 times and write the times down in order. The value of the run is
   the middle: halfway between the 5th and the 6th.
5. Do step 4 five times. Put the five values in order and take the 3rd.

I put these steps in a small shell loop so I did not have to type the command
53 times. The loop does nothing else.
