#!/usr/bin/env bash
# Measures MO-1. Usage: CVAT_TOKEN=<api token of the task owner> ./measure-mo-1.sh
# One run is 10 requests in a row; the value of a run is the median of the 10.
set -euo pipefail

URL="http://localhost:8080/api/test/tasks/1/label-counts"

request_ms() {
    curl -s -o /dev/null -H "Authorization: Token ${CVAT_TOKEN}" \
        -w "%{http_code} %{time_total}\n" "$URL" |
        awk '{ if ($1 != 200) { print "HTTP " $1 > "/dev/stderr"; exit 1 } printf "%.1f\n", $2 * 1000 }'
}

median() {
    sort -n | awk '{ v[NR] = $1 } END { print (NR % 2) ? v[(NR + 1) / 2] : (v[NR / 2] + v[NR / 2 + 1]) / 2 }'
}

echo "# $(date -u +%Y-%m-%dT%H:%M:%SZ)  $URL"
echo "# warm-up: 3 requests, not counted"
for _ in 1 2 3; do request_ms > /dev/null; done

run_medians=()
for run in 1 2 3 4 5; do
    times=()
    for _ in $(seq 1 10); do times+=("$(request_ms)"); done
    run_median=$(printf "%s\n" "${times[@]}" | median)
    run_medians+=("$run_median")
    echo "run $run: ${times[*]}  -> median $run_median ms"
done

sorted=$(printf "%s\n" "${run_medians[@]}" | sort -n)
echo "median of 5 runs: $(echo "$sorted" | median) ms"
echo "spread of 5 runs: $(echo "$sorted" | head -1) to $(echo "$sorted" | tail -1) ms"
