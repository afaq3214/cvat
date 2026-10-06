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

Not measured yet.
