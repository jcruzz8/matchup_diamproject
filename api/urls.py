from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    path('players/', views.players),
    path('teams/', views.teams),
    path('games/', views.games),
    path('registrations/', views.registrations),
]