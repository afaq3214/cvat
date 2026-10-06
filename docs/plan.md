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

Added at the end. Times are commit times on 6 October, local time.

- **Step 0 took much longer than 45 minutes.** Installing the UI packages took
  24 minutes and the first UI build took 6 minutes. During the install the laptop
  was too busy to do anything else.
- **I lost about 20 minutes to my own mistake.** I stopped the ClickHouse
  container to save memory. The CVAT server waits for ClickHouse when it starts,
  with no timeout, so after a restart it never came up. I found the reason in the
  container log and started ClickHouse again.
- **How the dev loop ended up.** Backend: a `docker-compose.override.yml` (ignored
  by Git) mounts `cvat/apps/test`, `settings/base.py` and `urls.py` into the
  server container, so a change needs a restart and not an image rebuild.
  Frontend: the webpack dev server on port 3000, pointed at the Docker backend.
- **I used 500 images, not all 5000.** CVAT refuses an annotation file that
  mentions images the task does not have, so I also cut the COCO file down to the
  same 500 images. The result is 3953 shapes.
- **The data has no boxes.** COCO 1.0 imports as polygons (3916) and masks (37).
  So the grouping in item 7 shows two groups, not the rectangle group I expected.
- **Steps 6 and 7 swapped.** I wrote the item 7 backend while the UI was
  building, then measured MO-1 after it, so the number describes the code I am
  submitting. The target was committed first (`a98f5b930`, 23:42) and measured at
  23:57.
- **Item 5 needed no new code.** The 401 and 403 already worked from the
  permission class added in step 1. I only had to prove it.
- **MO-1 was missed.** 342 ms against a target of 200 ms. See `objectives.md`.
- **Items 8 and 9 were not started,** as decided above. Items 1 to 7 were working
  at about 23:45 (step 7 commit `7d45bb006`), but restarts and builds on this
  laptop are too slow for me to add WebSocket support and still test it properly.
  I chose to finish the documents instead.

## What I did not finish

- Item 8, live updates over WebSocket. Not started.
- Item 9, recovering after a dropped connection. Not started.
- MO-1 target not met (342 ms, target 200 ms).
- I did not find out how the 342 ms is split between the permission check and
  the database queries.
- No automated tests. Everything was checked by hand and the output is in
  `docs/evidence/`.
- I did not run CVAT's linters (ESLint, Black, isort) on my files.
- I did not regenerate CVAT's API schema file (`cvat/schema.yml`), so the new
  endpoint is not in the generated API docs or the SDK.
- Tracks and tags are counted by the code but not tested, because the sample
  data has none.
- The page title shows the task number, not the task name.

## Decision record

**The decision:** how to get the count for each label.

**What I did:** count when the page asks. Each request runs one `GROUP BY` query
for shapes, one for tracks and one for tags (`cvat/apps/test/counts.py`). Nothing
is stored.

**What I rejected:** keeping a table of counts per task and label, and updating
it every time annotations are saved, so that a request only reads a few rows.

**Why I rejected it:** CVAT saves annotations with `bulk_create`, which does not
run Django signals. To keep a count table correct I would have to change CVAT's
own save, update and delete code in `dataset_manager`, and every import path as
well. If I missed one path the chart would show wrong numbers with no error. A
new table also needs a migration and a way to fill it for existing tasks. Counting
on read cannot be wrong in that way, and it touches no existing CVAT code.

**What rejecting it cost:**

- Speed. Every request counts again. I measured a median of 342 ms on a task
  with 3953 shapes and missed my 200 ms target. A count table would make the
  request nearly independent of the number of annotations.
- It gets slower as a task grows. I only measured one task size.
- No help for item 8. A hook in the save path is exactly what live updates need.
  By not writing it, I also left nothing to build WebSocket updates on.
