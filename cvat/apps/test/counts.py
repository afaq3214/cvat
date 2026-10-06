from collections import Counter

from django.db.models import Count

from cvat.apps.engine.models import JobType, LabeledImage, LabeledShape, LabeledTrack, Task


def count_annotations_per_label(task: Task) -> list[dict]:
    """
    Returns one entry per label of the task, including labels with no annotations.

    Shapes, tracks and tags are each counted with one GROUP BY query.
    A track is one annotation, whatever number of frames it covers.
    Only regular annotation jobs are counted: ground truth and consensus replica
    jobs hold second copies of the same objects.
    """
    counts: Counter[int] = Counter()

    for model in (LabeledShape, LabeledTrack, LabeledImage):
        annotations = model.objects.filter(
            job__segment__task_id=task.id, job__type=JobType.ANNOTATION
        )
        if model is not LabeledImage:
            # skeleton elements are stored as child rows of the skeleton itself
            annotations = annotations.filter(parent__isnull=True)

        for row in annotations.values("label_id").annotate(count=Count("id")):
            counts[row["label_id"]] += row["count"]

    labels = [
        {"id": label.id, "name": label.name, "color": label.color, "count": counts[label.id]}
        for label in task.get_labels()
    ]
    labels.sort(key=lambda label: (-label["count"], label["name"]))

    return labels
