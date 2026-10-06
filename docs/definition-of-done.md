# Definition of Done

Written before any code. Each line is ticked at the end with a number, a command
output or a link beside it. A line without evidence counts as not done.

Evidence files are in `docs/evidence/`. Commit hashes are on branch `dev-test01`.

## Floor (items 1–4)

- [x] `GET /api/test/tasks/{id}/label-counts` returns one entry per label of the task.
  Task 1 has 80 labels and the endpoint returns 80. `counts-vs-sql.txt`, commit `5df0f8ac0`.
- [x] The counts match a hand-written SQL query against the same task, label by label.
  80 of 80 labels match, total 3953 on both sides, 0 mismatches. `counts-vs-sql.txt`.
- [x] A task inside a project returns its project's labels, not an empty list.
  Task 3 in project 1 returns the project's two labels, `cat` and `dog`. `project-task-check.txt`.
- [ ] The page at `/tasks/{id}/label-counts` is reachable from the task page.
  The menu entry "Annotation counts" is in `actions-menu-items.tsx` line 114, but I have
  no screenshot of it. I opened the page by typing the address.
- [x] The page draws the counts as a bar chart.
  `page-chart.png`: 3953 annotations across 80 labels, `person` first. Commit `d720d1c06`.
- [x] A task with no annotations shows an empty state, not a blank chart.
  `page-empty-state.png`, task 2.
- [x] A failed request shows an error state with a way to retry.
  `page-error-state.png`, task 999, which does not exist. The page shows the server's
  message and a "Try again" button.

## Access (item 5)

- [x] A request with no login is refused with 401. Raw response saved.
  `access-checks.txt`, section 1.
- [x] A logged-in user with no access to the task is refused with 403. Raw response saved.
  `access-checks.txt`, section 2, user `outsider`.
- [x] The task owner gets 200.
  `access-checks.txt`, section 3.

## Measurement (item 6)

- [x] MO-1 target written down before the first measurement.
  Target committed in `a98f5b930` at 23:42. Measured at 23:57 (18:57 UTC in the raw output).
- [x] 5 runs, raw output saved under `docs/`.
  `mo-1-runs.txt`, produced by `measure-mo-1.sh`.
- [x] Median and spread reported.
  Median 342 ms, spread 268 to 441 ms. `objectives.md`.
- [x] Target met, or missed with the reason written down.
  Missed: 342 ms against 200 ms. Reason and baseline in `objectives.md`, `mo-1-baseline.txt`.
- [x] CPU, RAM, OS, CVAT commit SHA and image count stated.
  `objectives.md`, section "Machine". 500 images.

## Beyond the count (item 7)

- [x] Counts can be grouped by shape type, and the grouped totals add up to the plain counts.
  3916 polygons + 37 masks = 3953. Every label's split equals its count. `counts-vs-sql.txt`,
  commit `7d45bb006`.
- [ ] The grouped chart is shown on the page. (Line added at the end; it was missing from my first list.)
  The "Group by shape type" switch is in the page, but I have no screenshot of the stacked chart.

## Housekeeping

- [x] Plan committed before any code; later commits are small and say what and why.
  Plan: `b3243b42f` at 21:03. First code: `5df0f8ac0` at 22:49. `git log` on the branch.
- [x] No dead code, commented-out blocks or stray files in the diff against the base commit.
  `git diff --stat 98ee84d0f..HEAD`: 7 new backend files, 3 new frontend files, 4 existing
  files with 12 added lines in total, and `docs/`. Linters were not run; that is listed in `plan.md`.
- [x] Plan change log matches what happened.
  `plan.md`, section "Changes to this plan".
- [x] Everything I did not finish is listed, with the reason.
  `plan.md`, section "What I did not finish".
- [ ] Pull request opened from `dev-test01` into my own fork, not into `cvat-ai/cvat`.
