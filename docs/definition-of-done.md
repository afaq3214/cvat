# Definition of Done

Written before any code. Each line is ticked at the end with a number, a command
output or a link beside it. A line without evidence counts as not done.

## Floor (items 1–4)

- [ ] `GET /api/test/tasks/{id}/label-counts` returns one entry per label of the task.
- [ ] The counts match a hand-written SQL query against the same task, label by label.
- [ ] A task inside a project returns its project's labels, not an empty list.
- [ ] The page at `/tasks/{id}/label-counts` is reachable from the task page.
- [ ] The page draws the counts as a bar chart.
- [ ] A task with no annotations shows an empty state, not a blank chart.
- [ ] A failed request shows an error state with a way to retry.

## Access (item 5)

- [ ] A request with no login is refused with 401. Raw response saved.
- [ ] A logged-in user with no access to the task is refused with 403. Raw response saved.
- [ ] The task owner gets 200.

## Measurement (item 6)

- [ ] MO-1 target written down before the first measurement.
- [ ] 5 runs, raw output saved under `docs/`.
- [ ] Median and spread reported.
- [ ] Target met, or missed with the reason written down.
- [ ] CPU, RAM, OS, CVAT commit SHA and image count stated.

## Beyond the count (item 7)

- [ ] Counts can be grouped by shape type, and the grouped totals add up to the plain counts.

## Housekeeping

- [ ] Plan committed before any code; later commits are small and say what and why.
- [ ] No dead code, commented-out blocks or stray files in the diff against the base commit.
- [ ] Plan change log matches what happened.
- [ ] Everything I did not finish is listed, with the reason.
- [ ] Pull request opened from `dev-test01` into my own fork, not into `cvat-ai/cvat`.
