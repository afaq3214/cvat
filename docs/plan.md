# Plan: annotation counts per class

Branch `dev-test01`, started from CVAT commit `98ee84d0fb5f677d31acf71ec5f797f560f00f5f`.
I wrote this before any code. If the plan changes, I add a note at the bottom
instead of rewriting it.

## What I will build

A page that shows how many annotations each class (label) has in a task.

- Backend: a new Django app in `cvat/apps/test` with one endpoint,
  `GET /api/test/tasks/{id}/label-counts`.
- Frontend: a new page at `/tasks/{id}/label-counts` that shows the counts as a
  bar chart.

## What I learned from reading the code first

I spent about 30 minutes reading CVAT before planning.

- Every annotation has a `label` field that points to the `Label` table. This is
  in `cvat/apps/engine/models.py`. Shapes, tracks and tags all have it.
- To get from a task to its annotations: `Task` → `Segment` → `Job` → shape.
- Labels belong to the task. But if the task is inside a project, the labels
  belong to the project. My endpoint must handle both cases.
- CVAT checks permissions with Open Policy Agent. Tasks already have a
  "view annotations" permission. I will use that one.
- The UI already uses `chart.js`. I do not need to add a chart library.
- CVAT has no WebSocket code. To do item 8, I would have to add it myself.
- CVAT saves annotations in bulk. Django signals do not run for bulk saves, so I
  cannot use signals to detect changes.

## Order and time

I have 8 hours, which is 480 minutes. I follow the order in the brief.

| Step | Work | Minutes |
|---|---|---|
| 0 | Set up a fast way to test my code changes in the running stack | 45 |
| 1 | Endpoint: one database query that counts annotations per label. Check the result by hand with SQL | 60 |
| 2–4 | Page, route, link from the task page, bar chart, "no data" message, error message with a retry button | 90 |
| 5 | Login checks: no login gives 401, a user without access gives 403. Save both responses | 45 |
| 6 | Speed target MO-1: choose the target, measure 5 times, save the raw output | 45 |
| 7 | Group the counts by shape type (rectangle, polygon, mask, …) | 30 |
| 10 | Decision record at the end of this document | 15 |
| — | Write the Objectives document and tick the Definition of Done with evidence | 45 |
| — | Recording and pull request to my own fork | 30 |
| — | Spare time, or items 8–9 if I am ahead (see below) | 75 |

Checkpoint at 4 hours: items 1–4 must work from the page to the database. If they
do not, I stop adding new things and finish those four and the documents.

## Decisions I made before starting

- **Count in the database on every request.** One query, no cache, no extra
  table. It is simple and the numbers are always correct. The cost is that each
  request reads all annotations of the task. MO-1 tells me if that is fast enough.
- **Use the existing task permission.** If a user can see a task's annotations,
  they can see the counts. I do not write new permission rules.
- **Item 7 is grouping by shape type.** COCO data has more than one shape type.
  500 polygons and 500 boxes are not the same thing when you train a detection
  model, and a plain count hides that.
- **Labels with zero annotations are included.** A class with no annotations is
  the most important thing to see on this chart.

## What I already decided to skip

- **Items 8 and 9 (WebSocket and reconnect).** CVAT has no WebSocket support, so
  I would need a new library, changes to how the server starts, changes to the
  proxy, and a hook where annotations are saved. That is a lot on a slow laptop.
  I only start them if items 1–7 are finished and documented and I still have at
  least 75 minutes. If not, I list them as not done.
- Counts for a whole project or a single job. I only do tasks.
- Automated tests, except what I need to prove the Definition of Done.
- A track counts as one annotation, not one per frame.

## Risks

- My laptop has 8 GB of RAM and Docker gets 4 GB. Rebuilding Docker images may be
  too slow. That is why step 0 exists.
- I will use only part of COCO val2017, as many images as my laptop can handle. I
  will write the number in the Objectives document.

## Changes to this plan

None yet.

## Decision record

I will write this at the end, if I reach item 10.
