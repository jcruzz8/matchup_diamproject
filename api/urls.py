from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    # Rotas de Autenticação e Utilizador
    path('login/', views.login_view),
    path('logout/', views.logout_view),
    path('user/', views.user_view),
    
    # Rotas de Notificações
    path('notifications/', views.notifications),
    path('notifications/mark-all-read/', views.mark_all_notifications_read),
    path('notifications/<int:pk>/action/', views.notification_action),
    
    # Rotas de Jogadores
    path('players/', views.players),
    path('my-following/', views.my_following),
    path('players/<int:pk>/relationship-status/', views.relationship_status),
    path('players/<int:pk>/follow/', views.toggle_follow),
    path('players/<int:pk>/', views.player_detail),
    
    # Rotas de Equipas
    path('teams/', views.teams),
    path('teams/<int:pk>/request-status/', views.team_request_status),
    path('teams/<int:pk>/join/', views.request_team_join),
    path('teams/<int:pk>/', views.team_detail),
    
    # Rotas de Jogos e Inscrições
    path('games/', views.games),
    path('games/<int:pk>/', views.game_detail),
    path('registrations/', views.registrations),
    path('registrations/me/', views.my_registrations),
    path('registrations/<int:pk>/pay/', views.pay_registration),
    path('registrations/<int:pk>/', views.registration_detail),
    
    # Rotas de Mensagens e Conteúdo
    path('messages/', views.messages_view),
    path('highlights/', views.highlights_view),
    path('highlights/<int:pk>/', views.highlight_detail),
    path('highlights/<int:pk>/like/', views.toggle_like),
]