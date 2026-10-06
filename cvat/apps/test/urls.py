from django.urls import include, path
from rest_framework import routers

from cvat.apps.test import views

router = routers.DefaultRouter(trailing_slash=False)
router.register("tasks", views.TaskLabelCountsViewSet, basename="test_tasks")

urlpatterns = [
    path("test/", include(router.urls)),
]
