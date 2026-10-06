from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from cvat.apps.engine.models import Task
from cvat.apps.engine.types import ExtendedRequest

from .counts import count_annotations_per_label
from .permissions import TaskLabelCountsPermission
from .serializers import TaskLabelCountsSerializer


class TaskLabelCountsViewSet(viewsets.GenericViewSet):
    queryset = Task.objects.select_related("organization", "project")
    serializer_class = TaskLabelCountsSerializer
    iam_permission_class = TaskLabelCountsPermission
    filter_backends = []
    pagination_class = None

    @action(detail=True, methods=["GET"], url_path="label-counts")
    def label_counts(self, request: ExtendedRequest, pk: int) -> Response:
        task = self.get_object()  # checks that the user may view this task
        labels = count_annotations_per_label(task)

        serializer = self.get_serializer(
            {
                "task_id": task.id,
                "total": sum(label["count"] for label in labels),
                "labels": labels,
            }
        )
        return Response(serializer.data)
