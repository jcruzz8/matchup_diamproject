import json

from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from .models import Player, Team, Game, Registration
from .serializers import PlayerSerializer, TeamSerializer, GameSerializer, RegistrationSerializer
from django.contrib.auth.models import User

# Create your views here.

# Endpoint para os Jogadores
@api_view(['GET', 'POST'])
def players(request):
    if request.method == 'GET':
        player_list = Player.objects.all()
        serializer = PlayerSerializer(player_list, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')

        if not username or not email or not password or not first_name or not last_name:
            return Response({'msg':'existem campos obrigatórios em falta'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists() or User.objects.filter(email=email).exists():
            return Response({'msg': 'username ou email já existem'}, status=status.HTTP_400_BAD_REQUEST)

        sport_positions_str = request.data.get('sport_positions', '{}')
        try:
            sport_positions = json.loads(sport_positions_str)
        except json.JSONDecodeError:
            sport_positions = {}


        try:
            new_user = User.objects.create_user(username=username, email=email, password=password, first_name=first_name, last_name=last_name)

            birth_date = request.data.get('birth_date')
            height = request.data.get('height')
            zone = request.data.get('zone')
            if birth_date == '':
                birth_date = None
            if height == '':
                height = None
            if zone == '':
                zone = None


            new_player = Player.objects.create(
                user=new_user,
                phone=request.data.get('phone', ''),
                birth_date=birth_date,
                gender=request.data.get('gender', ''),
                height=height,
                zone=zone,
                is_public=request.data.get('is_public', True),
                sport_positions=sport_positions
            )

            if 'photo' in request.FILES:
                new_player.photo = request.FILES['photo']
                new_player.save()

            return Response(status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"Ocorreu um erro no registo: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

# Endpoint para as Equipas
@api_view(['GET', 'POST'])
def teams(request):
    if request.method == 'GET':
        team_list = Team.objects.all()
        serializer = TeamSerializer(team_list, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'error': 'Precisas de fazer login para editar isto.'}, status=status.HTTP_401_UNAUTHORIZED)
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
        if not request.user.is_authenticated:
            return Response({'error': 'Precisas de fazer login para editar isto.'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = GameSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Endpoint para as Inscrições
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
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

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return Response({
                "message": "Login efetuado com sucesso!",
                "player_id": user.player.id,
                "username": user.username
            }, status=status.HTTP_200_OK)
    else:
        return Response({"error": "Nome de utilizador ou palavra-passe incorreta."}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        # A magia acontece aqui: o Django limpa os dados da sessão atual
        logout(request)

        return Response({"message": "Sessão terminada com sucesso!"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": "Erro ao terminar sessão."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

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
        if not request.user.is_authenticated:
            return Response({'error': 'Precisas de fazer login para editar isto.'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = GameSerializer(game, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if not request.user.is_authenticated:
            return Response({'error': 'Precisas de fazer login para editar isto.'}, status=status.HTTP_401_UNAUTHORIZED)
        game.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Endpoint de Detalhe para UMA Inscrição Específica (Aceitar/Rejeitar)
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
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
        if not request.user.is_authenticated:
            return Response({'error': 'Precisas de fazer login para editar isto.'}, status=status.HTTP_401_UNAUTHORIZED)
        user = player.user
        username = request.data.get('username')
        email = request.data.get('email')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')

        if username and User.objects.filter(username=username).exclude(pk=user.pk).exists():
            return Response({'error': 'Este nome de utilizador já está em uso'}, status=status.HTTP_400_BAD_REQUEST)

        if email and User.objects.filter(email=email).exclude(pk=user.pk).exists():
            return Response({'error': 'Este email já está em uso.'}, status=status.HTTP_400_BAD_REQUEST)

        if username: user.username = username
        if email: user.email = email
        if first_name is not None: user.first_name = first_name
        if last_name is not None: user.last_name = last_name
        user.save()

        data = request.data.copy()
        if 'birth_date' in data and data['birth_date'] == '':
            data['birth_date'] = None
        if 'height' in data and data['height'] == '':
            data['height'] = None

        serializer = PlayerSerializer(player, data=data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if not request.user.is_authenticated:
            return Response({'error': 'Precisas de fazer login para editar isto.'}, status=status.HTTP_401_UNAUTHORIZED)
        player.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)