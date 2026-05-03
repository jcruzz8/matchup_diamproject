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
    
# Endpoint para o Login
@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({"error": "Por favor, preenche todos os campos."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Tenta encontrar o jogador pelo username
        player = Player.objects.get(username=username)
        
        # Verifica se a password coincide
        if player.password == password:
            return Response({
                "message": "Login efetuado com sucesso!",
                "player_id": player.id,
                "username": player.username
            }, status=status.HTTP_200_OK)
        else:
            # Encontrou o utilizador, mas a password está errada
            return Response({"error": "Palavra-passe incorreta."}, status=status.HTTP_401_UNAUTHORIZED)
            
    except Player.DoesNotExist:
        # Não encontrou nenhum jogador com este username
        return Response({"error": "Utilizador não encontrado."}, status=status.HTTP_404_NOT_FOUND)
    

# Endpoint de Detalhe para UM Jogo Específico (Ler, Atualizar, Apagar)
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def game_detail(request, pk):
    try:
        game = Game.objects.get(pk=pk)
    except Game.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = GameSerializer(game)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        serializer = GameSerializer(game, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        game.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Endpoint de Detalhe para UMA Inscrição Específica (Aceitar/Rejeitar)
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def registration_detail(request, pk):
    try:
        registration = Registration.objects.get(pk=pk)
    except Registration.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = RegistrationSerializer(registration)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        serializer = RegistrationSerializer(registration, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        registration.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
# Endpoint de Detalhe para UM Jogador Específico
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def player_detail(request, pk):
    try:
        player = Player.objects.get(pk=pk)
    except Player.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = PlayerSerializer(player)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        serializer = PlayerSerializer(player, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        player.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)