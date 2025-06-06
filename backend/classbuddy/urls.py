"""
URL configuration for classbuddy project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from apps.meetings import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/study-groups/', include('apps.study_groups.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/meetings/', include('apps.meetings.urls')),
    path('api/', include('apps.group_tasks.urls')),
    path('api/direct-messages/', include('apps.direct_messages.urls')),
    path('meetings/<int:meeting_id>/availability/', views.MeetingAvailabilityView.as_view()),
    path('study-groups/<int:group_id>/members/', views.StudyGroupMembersView.as_view()),
]
