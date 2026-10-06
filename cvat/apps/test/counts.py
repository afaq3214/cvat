from collections import Counter, defaultdict

from django.db.models import Count, F, Value

from cvat.apps.engine.models import JobType, LabeledImage, LabeledShape, LabeledTrack, Task

# Tracks and tags have no shape type column of their own, so they get a fixed group name
ANNOTATION_KINDS = (
    (LabeledShape, F("type")),
    (LabeledTrack, Value("track")),
    (LabeledImage, Value("tag")),
)


def count_annotations_per_label(task: Task) -> list[dict]:
    """
    Returns one entry per label of the task, including labels with no annotations.
    Each entry has the total count and the same count split by shape type.

    Shapes, tracks and tags are each counted with one GROUP BY query.
    A track is one annotation, whatever number of frames it covers.
    Only regular annotation jobs are counted: ground truth and consensus replica
    jobs hold second copies of the same objects.
    """
    counts_by_type: defaultdict[int, Counter[str]] = defaultdict(Counter)

    for model, kind in ANNOTATION_KINDS:
        annotations = model.objects.filter(
            job__segment__task_id=task.id, job__type=JobType.ANNOTATION
        )
        if model is not LabeledImage:
            # skeleton elements are stored as child rows of the skeleton itself
            annotations = annotations.filter(parent__isnull=True)

        rows = annotations.values("label_id", kind=kind).annotate(count=Count("id"))
        for row in rows:
            counts_by_type[row["label_id"]][row["kind"]] += row["count"]

    labels = [
        {
            "id": label.id,
            "name": label.name,
            "color": label.color,
            "count": counts_by_type[label.id].total(),
            "by_type": dict(counts_by_type[label.id]),
        }
        for label in task.get_labels()
    ]
    labels.sort(key=lambda label: (-label["count"], label["name"]))

    return labels
