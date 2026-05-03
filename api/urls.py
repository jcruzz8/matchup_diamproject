from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    path('players/', views.players),
    path('players/<int:pk>/', views.player_detail),
    path('teams/', views.teams),
    path('games/', views.games),
    path('games/<int:pk>/', views.game_detail),
    path('registrations/', views.registrations),
    path('registrations/<int:pk>/', views.registration_detail),
    path('login/', views.login_view, name='login'),
]