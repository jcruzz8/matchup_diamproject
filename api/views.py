from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from .models import Player, Team, Game, Registration
from .serializers import PlayerSerializer, TeamSerializer, GameSerializer, RegistrationSerializer

# Create your views here.

# Endpoint para os Jogadores
@api_view(['GET', 'POST'])
def players(request):
    if request.method == 'GET':
        player_list = Player.objects.all()
        serializer = PlayerSerializer(player_list, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = PlayerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Endpoint para as Equipas
@api_view(['GET', 'POST'])
def teams(request):
    if request.method == 'GET':
        team_list = Team.objects.all()
        serializer = TeamSerializer(team_list, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = TeamSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Endpoint para os Jogos
@api_view(['GET', 'POST'])
def games(request):
    if request.method == 'GET':
        game_list = Game.objects.all()
        serializer = GameSerializer(game_list, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = GameSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Endpoint para as Inscrições
@api_view(['GET', 'POST'])
def registrations(request):
    if request.method == 'GET':
        reg_list = Registration.objects.all()
        serializer = RegistrationSerializer(reg_list, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = RegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)