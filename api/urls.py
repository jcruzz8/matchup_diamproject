from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    path('players/', views.players),
    path('players/<int:pk>/', views.player_detail),
    path('players/<int:pk>/relationship-status/', views.relationship_status),
    path('players/<int:pk>/follow/', views.toggle_follow),
    path('teams/', views.teams),
    path('teams/<int:pk>/', views.team_detail),
    path('teams/<int:pk>/request-status/', views.team_request_status),
    path('teams/<int:pk>/join/', views.request_team_join),
    path('notifications/', views.notifications),
    path('notifications/mark-all-read/', views.mark_all_notifications_read),
    path('notifications/<int:pk>/action/', views.notification_action),
    path('games/', views.games),
    path('games/<int:pk>/', views.game_detail),
    path('registrations/', views.registrations),
    path('registrations/me/', views.my_registrations),
    path('registrations/<int:pk>/', views.registration_detail),
    path('login/', views.login_view),
    path('logout/', views.logout_view),
    path('user/', views.user_view),
    path('messages/', views.messages_view),
    path('highlights/', views.highlights_view),
    path('highlights/<int:pk>/', views.highlight_detail),
    path('highlights/<int:pk>/like/', views.toggle_like),
]