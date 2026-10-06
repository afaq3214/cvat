# Definition of Done

Written before any code. Each line is ticked at the end with a number, a command
output or a link beside it. A line without evidence counts as not done.

How I checked each line is under "How I tested" at the end. Screenshots are in
the pull request description.

## Floor (items 1–4)

- [x] `GET /api/test/tasks/{id}/label-counts` returns one entry per label of the task.
  Task 1 has 80 labels and the endpoint returns 80. Test 1.
- [x] The counts match a hand-written SQL query against the same task, label by label.
  All 80 labels match. Total 3953 on both sides. Test 1.
- [x] A task inside a project returns its project's labels, not an empty list.
  Task 3 is in project 1 and returns the project's labels `cat` and `dog`. Test 2.
- [ ] The page at `/tasks/{id}/label-counts` is reachable from the task page.
  The "Annotation counts" entry is in the code of the Actions menu, but I have no
  screenshot of it. I opened the page by typing the address.
- [x] The page draws the counts as a bar chart.
  Screenshot 1: 3953 annotations across 80 labels, `person` first.
- [x] A task with no annotations shows an empty state, not a blank chart.
  Screenshot 2, task 2.
- [x] A failed request shows an error state with a way to retry.
  Screenshot 3, task 999, which does not exist. It shows a "Try again" button.

## Access (item 5)

- [x] A request with no login is refused with 401. Raw response saved.
  Test 3.
- [x] A logged-in user with no access to the task is refused with 403. Raw response saved.
  Test 3, user `outsider`.
- [x] The task owner gets 200.
  Test 3.

## Measurement (item 6)

- [x] MO-1 target written down before the first measurement.
  Target committed at 23:42 (`a98f5b930`). Measured at 23:57.
- [x] 5 runs, raw output saved under `docs/`.
  In `objectives.md`.
- [x] Median and spread reported.
  342 ms, spread 268 to 441 ms.
- [x] Target met, or missed with the reason written down.
  Missed: 342 ms against 200 ms. The reason is in `objectives.md`.
- [x] CPU, RAM, OS, CVAT commit SHA and image count stated.
  In `objectives.md`. 500 images.

## Beyond the count (item 7)

- [x] Counts can be grouped by shape type, and the grouped totals add up to the plain counts.
  3916 polygons + 37 masks = 3953. Test 1.
- [ ] The grouped chart is shown on the page. (Line added at the end; it was missing from my first list.)
  The "Group by shape type" switch is on the page, but I have no screenshot of it.

## Housekeeping

- [x] Plan committed before any code; later commits are small and say what and why.
  Plan at 21:03 (`b3243b42f`). First code at 22:49 (`5df0f8ac0`).
- [x] No dead code, commented-out blocks or stray files in the diff against the base commit.
  I read the list from `git diff --stat 98ee84d0f..HEAD`: 7 new backend files, 3 new
  frontend files, 12 lines added to 4 existing files, and the 3 documents.
- [x] Plan change log matches what happened.
  `plan.md`, "Changes to this plan".
- [x] Everything I did not finish is listed, with the reason.
  `plan.md`, "What I did not finish".
- [ ] Pull request opened from `dev-test01` into my own fork, not into `cvat-ai/cvat`.

## How I tested

Anyone can repeat these on the same data. All output below is from my machine.

### Test 1: do the counts match the database?

I asked the database directly and compared the answer with what the endpoint
returns.

```sql
select l.name, count(s.id)
from engine_label l
left join engine_labeledshape s on s.label_id = l.id
where l.task_id = 1
group by l.name
order by count(s.id) desc;
```

| Label | Database | Endpoint |
|---|---|---|
| person | 1217 | 1217 |
| chair | 227 | 227 |
| car | 195 | 195 |
| bottle | 120 | 120 |
| book | 113 | 113 |
| hair drier | 0 | 0 |
| toaster | 0 | 0 |
| **all 80 labels** | **3953** | **3953** |

I compared all 80 labels and all 80 are the same. The table shows the five
biggest and the two with zero.

For the shape types I ran `select type, count(*) from engine_labeledshape group by type;`

| Shape type | Database | Endpoint |
|---|---|---|
| polygon | 3916 | 3916 |
| mask | 37 | 37 |
| total | 3953 | 3953 |

### Test 2: a task inside a project

I made a project with the labels `cat` and `dog`, and a task inside it with no
labels of its own. Then I asked for the counts of that task:

```
GET /api/test/tasks/3/label-counts
{"task_id":3,"total":0,"labels":[{"id":83,"name":"cat","color":"#6080c0","count":0,"by_type":{}},{"id":84,"name":"dog","color":"#406040","count":0,"by_type":{}}]}
```

The labels come from the project, so this case works.

### Test 3: who is allowed?

I sent the same request three times with `curl -i`, as three different people.

No login:

```
$ curl -i http://localhost:8080/api/test/tasks/1/label-counts
HTTP/1.1 401 Unauthorized
{"detail":"Authentication credentials were not provided."}
```

Logged in as `outsider`, a normal user who does not own task 1 and is not assigned to it:

```
$ curl -i -u outsider:*** http://localhost:8080/api/test/tasks/1/label-counts
HTTP/1.1 403 Forbidden
{"detail":"You do not have permission to perform this action."}
```

Logged in as the owner of task 1 (answer cut short):

```
$ curl -i -H 'Authorization: Token ***' http://localhost:8080/api/test/tasks/1/label-counts
HTTP/1.1 200 OK
{"task_id":1,"total":3953,"labels":[{"id":1,"name":"person","color":"#c06060","count":1217}, ...
```

### Test 4: the page

I opened three addresses in Chrome and took a screenshot of each.

| Address | What I saw | Screenshot |
|---|---|---|
| `/tasks/1/label-counts` | Bar chart, 80 labels, `person` at the top | 1 |
| `/tasks/2/label-counts` (task with no annotations) | "This task has no annotations yet" | 2 |
| `/tasks/999/label-counts` (task does not exist) | "Could not load annotation counts" and a "Try again" button | 3 |
