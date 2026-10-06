from cvat.apps.engine.models import Task
from cvat.apps.engine.permissions import TaskPermission
from cvat.apps.engine.types import ExtendedRequest
from cvat.apps.iam.permissions import IamContext


class TaskLabelCountsPermission:
    """
    Label counts are derived from the annotations of a task, so whoever
    may view the annotations of that task may view the counts.
    """

    @classmethod
    def create(
        cls, request: ExtendedRequest, view, obj: Task, iam_context: IamContext
    ) -> list[TaskPermission]:
        return [
            TaskPermission.create_base_perm(
                request, view, TaskPermission.Scopes.VIEW_ANNOTATIONS, iam_context, obj
            )
        ]
