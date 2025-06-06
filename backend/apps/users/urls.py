from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_users, name='list_users'),
    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path('profile/', views.profile, name='profile'),
    path('user/', views.get_user, name='get_user'),
    path('verify/', views.verify_email, name='verify_email'),
    path('send-reset-code/', views.send_reset_code, name='send-reset-code'),
    path('reset-password/', views.reset_password, name='reset-password'),
] 