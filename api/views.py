import json

from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from .models import FollowRequest, Player, Team, Game, Registration, Message, Highlight, TeamJoinRequest, Notification
from .serializers import HighlightSerializer, MessageSerializer, PlayerSerializer, TeamSerializer, GameSerializer, RegistrationSerializer, NotificationSerializer
from django.contrib.auth.models import User
from django.db.models import Q

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

# Endpoint para Verificar o Status da Relação com Outro Jogador (Seguindo, Pedido Pendente, Nenhuma)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def relationship_status(request, pk):
    current_player = request.user.player
    target_player = get_object_or_404(Player, pk=pk)
    if target_player in current_player.following.all(): status = 'FOLLOWING'
    elif FollowRequest.objects.filter(from_user=current_player, to_user=target_player, status='PENDING').exists(): status = 'PENDING'
    else: status = 'NONE'
    return Response({'status': status})

# Endpoint para Seguir/Deixar de Seguir Outro Jogador ou Enviar Pedido de Seguimento
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_follow(request, pk):
    current_player = request.user.player
    target_player = get_object_or_404(Player, pk=pk)
    if target_player in current_player.following.all():
        current_player.following.remove(target_player)
        return Response({'status': 'NONE', 'message': 'Deixaste de seguir.'})
    if target_player.is_public:
        target_player.followers.add(current_player)
        Notification.objects.create(
            recipient=target_player,
            actor=current_player,
            category='Seguidores',
            message=f'O player {current_player.user.username} começou a seguir-te.',
            type='success',
            link=f'/perfil/{current_player.id}'
        )
        return Response({'status': 'FOLLOWING', 'message': 'Começaste a seguir!'})
    req, created = FollowRequest.objects.get_or_create(from_user=current_player, to_user=target_player)
    if not created and req.status == 'PENDING':
        return Response({'error': 'Pedido já pendente.'}, status=status.HTTP_400_BAD_REQUEST)
    req.status = 'PENDING'
    req.save()
    Notification.objects.create(
        recipient=target_player,
        actor=current_player,
        category='Seguidores',
        message=f'O player {current_player.user.username} pediu para te seguir.',
        type='info',
        link=f'/perfil/{current_player.id}',
        reference_type='FOLLOW_REQUEST',
        reference_id=req.id
    )
    return Response({'status': 'PENDING', 'message': 'Pedido enviado!'})

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

# Endpoint para Pedir para Entrar numa Equipa
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def request_team_join(request, pk):
    current_player = request.user.player
    team = get_object_or_404(Team, pk=pk)
    req, created = TeamJoinRequest.objects.get_or_create(player=current_player, team=team)
    if not created and req.status == 'PENDING':
        return Response({'error': 'Pedido já pendente.'}, status=status.HTTP_400_BAD_REQUEST)
    req.status = 'PENDING'
    req.save()
    Notification.objects.create(
        recipient=team.captain,
        actor=current_player,
        category='Equipa',
        message=f'O player {current_player.user.username} pediu para entrar na tua equipa {team.name}.',
        type='info',
        link=f'/equipa/{team.id}',
        reference_type='TEAM_JOIN_REQUEST',
        reference_id=req.id
    )
    return Response({'status': 'PENDING', 'message': 'Pedido enviado ao capitão!'})

# Endpoint para Verificar o Status do Pedido para Entrar numa Equipa
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_request_status(request, pk):
    current_player = request.user.player
    team = get_object_or_404(Team, pk=pk)
    if current_player == team.captain or (team.members and current_player in team.members.all()): status = 'MEMBER'
    elif TeamJoinRequest.objects.filter(player=current_player, team=team, status='PENDING').exists(): status = 'PENDING'
    else: status = 'NONE'
    return Response({'status': status})

# Endpoint para as Notificações do Utilizador
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications(request):
    current_player = request.user.player
    notifications_list = Notification.objects.filter(recipient=current_player).order_by('-created_at')
    serializer = NotificationSerializer(notifications_list, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    current_player = request.user.player
    Notification.objects.filter(recipient=current_player, read=False).update(read=True)
    return Response({'status': 'OK'})

# Endpoint para aceitar/rejeitar notificações com ação
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_action(request, pk):
    current_player = request.user.player
    notification = get_object_or_404(Notification, pk=pk, recipient=current_player)
    action = request.data.get('action')
    if action not in ['accept', 'reject']:
        return Response({'error': 'Ação inválida.'}, status=status.HTTP_400_BAD_REQUEST)

    notification.read = True
    notification.save()

    if notification.reference_type == 'FOLLOW_REQUEST':
        follow_req = get_object_or_404(FollowRequest, pk=notification.reference_id, to_user=current_player)
        if follow_req.status != 'PENDING':
            return Response({'error': 'Pedido já processado.'}, status=status.HTTP_400_BAD_REQUEST)
        if action == 'accept':
            follow_req.status = 'ACCEPTED'
            follow_req.save()
            current_player.followers.add(follow_req.from_user)
            Notification.objects.create(
                recipient=follow_req.from_user,
                actor=current_player,
                category='Seguidores',
                message=f'O player {current_player.user.username} aceitou o teu pedido para seguir.',
                type='success',
                link=f'/perfil/{current_player.id}'
            )
            return Response({'status': 'ACCEPTED', 'message': 'Pedido aceite.'})
        follow_req.status = 'REJECTED'
        follow_req.save()
        Notification.objects.create(
            recipient=follow_req.from_user,
            actor=current_player,
            category='Seguidores',
            message=f'O player {current_player.user.username} recusou o teu pedido para seguir.',
            type='danger',
            link=f'/perfil/{current_player.id}'
        )
        return Response({'status': 'REJECTED', 'message': 'Pedido recusado.'})

    if notification.reference_type == 'TEAM_JOIN_REQUEST':
        join_req = get_object_or_404(TeamJoinRequest, pk=notification.reference_id, team__captain=current_player)
        if join_req.status != 'PENDING':
            return Response({'error': 'Pedido já processado.'}, status=status.HTTP_400_BAD_REQUEST)
        if action == 'accept':
            join_req.status = 'ACCEPTED'
            join_req.save()
            team = join_req.team
            existing_members = list(team.members.exclude(pk=join_req.player.pk))
            team.members.add(join_req.player)
            Notification.objects.create(
                recipient=join_req.player,
                actor=current_player,
                category='Equipa',
                message=f'O teu pedido para entrar na equipa {team.name} foi aceite.',
                type='success',
                link=f'/equipa/{team.id}'
            )
            for member in existing_members:
                Notification.objects.create(
                    recipient=member,
                    actor=current_player,
                    category='Equipa',
                    message=f'Um novo player acabou de se juntar à tua equipa {team.name}, diz olá ao teu novo colega!',
                    type='info',
                    link=f'/equipa/{team.id}'
                )
            return Response({'status': 'ACCEPTED', 'message': 'Pedido de adesão aceite.'})
        join_req.status = 'REJECTED'
        join_req.save()
        Notification.objects.create(
            recipient=join_req.player,
            actor=current_player,
            category='Equipa',
            message=f'O teu pedido para entrar na equipa {join_req.team.name} foi recusado.',
            type='danger',
            link=f'/equipa/{join_req.team.id}'
        )
        return Response({'status': 'REJECTED', 'message': 'Pedido de adesão recusado.'})

    return Response({'error': 'Ação não suportada.'}, status=status.HTTP_400_BAD_REQUEST)

# Endpoint de Detalhe para UMA Equipa Específica (Ler, Atualizar, Apagar)
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def team_detail(request, pk):
    try:
        team = Team.objects.get(pk=pk)
    except Team.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TeamSerializer(team)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        if not request.user.is_authenticated:
            return Response({'error': 'Precisas de fazer login para editar isto.'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = TeamSerializer(team, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if not request.user.is_authenticated:
            return Response({'error': 'Precisas de fazer login para editar isto.'}, status=status.HTTP_401_UNAUTHORIZED)
        team.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

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
            serializer.save(organizer=request.user.player)
            return Response(status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
            saved_registration = serializer.save()
            if saved_registration.status == 'APPROVED':
                if saved_registration.game.price == 0 or saved_registration.payment_status == 'PAID':
                    saved_registration.payment_status = 'PAID'
                    if not saved_registration.payment_receipt:
                        saved_registration.payment_receipt = 'Grátis' if saved_registration.game.price == 0 else 'Pagamento registado'
                    if not saved_registration.payment_date:
                        saved_registration.payment_date = timezone.now()
                    saved_registration.save()
            elif saved_registration.payment_status == 'PAID' and not saved_registration.payment_date:
                saved_registration.payment_date = timezone.now()
                saved_registration.save()
            return Response(RegistrationSerializer(saved_registration).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        registration.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Endpoint para as Inscrições do jogador autenticado
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_registrations(request):
    player = request.user.player
    registrations = Registration.objects.filter(player=player).order_by('-created_at')
    serializer = RegistrationSerializer(registrations, many=True)
    return Response(serializer.data)
    
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
        #request.session.cycle_key()
        return Response({
                "message": "Login efetuado com sucesso!",
                "player_id": user.player.id,
                "username": user.username
            }, status=status.HTTP_200_OK)
    else:
        return Response({"error": "Nome de utilizador ou palavra-passe incorreta."}, status=status.HTTP_401_UNAUTHORIZED)

# Endpoint para o Logout
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        #request.session.flush()
        # o Django limpa os dados da sessão atual
        logout(request)

        response = Response({"message": "Sessão terminada com sucesso!"}, status=status.HTTP_200_OK)

        #response.delete_cookie('sessionid')
        #response.delete_cookie('csrftoken')

        return response
    except Exception as e:
        return Response({"error": "Erro ao terminar sessão."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# Endpoint para obter os dados do jogador autenticado
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_view(request):
    return Response({
        'username': request.user.username,
        'player_id': request.user.player.id
    })

# Endpoint das Mensagens
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def messages_view(request):
    player = request.user.player
    
    if request.method == 'GET':
        # Vai buscar mensagens que enviei, recebi diretamente, ou que foram para as minhas equipas
        my_teams = player.teams.all()
        msgs = Message.objects.filter(
            Q(sender=player) | 
            Q(receiver=player) | 
            Q(team__in=my_teams)
        ).order_by('timestamp')
        
        serializer = MessageSerializer(msgs, many=True)
        return Response(serializer.data)
        
    elif request.method == 'POST':
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            # Grava a mensagem forçando o 'sender' a ser o jogador autenticado
            serializer.save(sender=player)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# Endpoint de Detalhe para UMA Mensagem Específica (Apagar)
@api_view(['GET', 'POST'])
def highlights_view(request):
    if request.method == 'GET':
        # Devolve todos os highlights ordenados do mais recente para o mais antigo
        highlights = Highlight.objects.all().order_by('-created_at')
        serializer = HighlightSerializer(highlights, many=True)
        return Response(serializer.data)
        
    elif request.method == 'POST':
        serializer = HighlightSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# Endpoint de Detalhe para UM Highlight Específico (Apagar)
@api_view(['DELETE'])
def highlight_detail(request, pk):
    highlight = get_object_or_404(Highlight, pk=pk)
    
    # Verifica se quem quer apagar é o dono do Highlight
    if request.user.player != highlight.player:
        return Response({'error': 'Não tens permissão.'}, status=status.HTTP_403_FORBIDDEN)

    highlight.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# Endpoint para dar Like/Dislike a um Highlight
@api_view(['POST'])
def toggle_like(request, pk):
    # Vai buscar a foto pelo ID
    highlight = get_object_or_404(Highlight, pk=pk)
    
    # Descobre quem é o jogador que clicou (com base no login)
    player = request.user.player
    
    # Se o jogador já estiver na lista de likes, remove-o
    if player in highlight.likes.all():
        highlight.likes.remove(player)
        liked = False
    # Se não estiver, adiciona-o
    else:
        highlight.likes.add(player)
        liked = True
        
    return Response({'liked': liked, 'total_likes': highlight.likes.count()}, status=status.HTTP_200_OK)