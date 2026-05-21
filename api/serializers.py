from rest_framework import serializers
from .models import Highlight, Player, FollowRequest, Team, Game, Registration, Notification, Message, TeamJoinRequest

class PlayerSerializer(serializers.ModelSerializer):
    colegas = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = Player
        fields = '__all__' # all diz ao django para incluir todos os campos 

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

class FollowRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowRequest
        fields = '__all__' 

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'

class RegistrationSerializer(serializers.ModelSerializer):
    player_username = serializers.CharField(source='player.user.username', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    game_modality = serializers.CharField(source='game.modality', read_only=True)
    game_location = serializers.CharField(source='game.location', read_only=True)
    game_date = serializers.DateField(source='game.date', read_only=True)
    game_time = serializers.TimeField(source='game.time', read_only=True)
    game_price = serializers.DecimalField(source='game.price', max_digits=5, decimal_places=2, read_only=True)
    payment_deadline = serializers.DateField(source='game.payment_deadline', read_only=True)
    registration_deadline = serializers.DateField(source='game.registration_deadline', read_only=True)

    class Meta:
        model = Registration
        fields = '__all__'

    def validate(self, data):
        request = self.context.get('request')
        
        # Se for um PATCH (apenas atualização de status pelo organizador), 
        # saltamos a validação de nova inscrição.
        if request and request.method in ['PATCH', 'PUT']:
            return data

        user = getattr(request, 'user', None)
        player = getattr(user, 'player', None) if user else None
        game = data.get('game', getattr(self.instance, 'game', None))
        team = data.get('team', getattr(self.instance, 'team', None))
        position_id = data.get('position_id', getattr(self.instance, 'position_id', None))

        if user is None or not user.is_authenticated or player is None:
            raise serializers.ValidationError('Precisas de fazer login para inscrever a equipa.')

        if game is None:
            raise serializers.ValidationError('O jogo deve ser especificado.')

        if game.distribution_model == 'Equipa vs Equipa' and team is None:
            raise serializers.ValidationError('Este jogo exige que insiras uma equipa.')

        if team:
            if team.captain != player:
                raise serializers.ValidationError('Só o capitão pode inscrever esta equipa.')

            if game.distribution_model == 'Equipa vs Equipa':
                if position_id not in ['equipa1', 'equipa2']:
                    raise serializers.ValidationError('Tens de selecionar a Equipa 1 ou a Equipa 2.')

                duplicate_team = Registration.objects.filter(
                    game=game,
                    team=team,
                    status__in=['PENDING', 'APPROVED']
                ).exclude(pk=getattr(self.instance, 'pk', None)).exists()
                
                if duplicate_team:
                    raise serializers.ValidationError('Esta Equipa já está inscrita!')

        return data
class GameSerializer(serializers.ModelSerializer):
    vagas = serializers.SerializerMethodField()
    registrations = RegistrationSerializer(many=True, read_only=True)
    # Envia ao React as posições bloqueadas e nomes das equipas
    occupied_data = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = '__all__'

    def validate(self, data):
        from datetime import date
        hoje = date.today() # Data atual para comparação
    
        # Buscamos os valores atuais (do que vem no request ou o que já existe na base de dados)
        game_date = data.get('date', getattr(self.instance, 'date', None))
        reg_deadline = data.get('registration_deadline', getattr(self.instance, 'registration_deadline', None))
        pay_deadline = data.get('payment_deadline', getattr(self.instance, 'payment_deadline', None))

        # Validação de existência (evita erros se campos estiverem nulos)
        if not game_date or not reg_deadline or not pay_deadline:
           raise serializers.ValidationError('É obrigatório definir a data do jogo, prazo de inscrição e prazo de pagamento.')

        # Validações de lógica temporal
        if game_date < hoje:
            raise serializers.ValidationError({'date': "A data do jogo não pode ser no passado."})
        
        if reg_deadline < hoje:
            raise serializers.ValidationError({'registration_deadline': "A data limite de inscrição não pode ser no passado."})

        if reg_deadline > game_date:
            raise serializers.ValidationError({'registration_deadline': "A inscrição tem de acabar antes do dia do jogo."})

        if pay_deadline < reg_deadline:
            raise serializers.ValidationError({'payment_deadline': "O pagamento tem de acabar depois da data limite de inscrição."})
        
        if pay_deadline > game_date:
            raise serializers.ValidationError({'payment_deadline': "O pagamento tem de ser feito antes do dia do jogo."})

        return data

    def get_vagas(self, obj):
        total_lugares = (obj.titulares * 2) + (obj.suplentes * 2)
        inscricoes_ativas = obj.registrations.exclude(status='REJECTED').filter(team__isnull=True).count()
        return total_lugares - inscricoes_ativas

    def get_occupied_data(self, obj):
        # MUDANÇA AQUI: Apenas pedidos APROVADOS ocupam efetivamente o lugar visual
        active_regs = obj.registrations.filter(status='APPROVED') 
        
        data = {
            "positions": [], # IDs das posições individuais ocupadas
            "teams": {},     # Nomes das equipas aceites
            "players": []
        }
        
        for reg in active_regs:
            data["positions"].append(reg.position_id)
            data["players"].append(reg.player.id)
            if reg.team:
                data["teams"][reg.position_id] = reg.team.name
                
        return data

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.user.username', read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'
        # O sender é preenchido automaticamente pelo views.py (quem tem o login feito)
        extra_kwargs = {'sender': {'read_only': True}}

class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.user.username', read_only=True)
    actor_photo = serializers.SerializerMethodField()
    actor_id = serializers.IntegerField(source='actor.id', read_only=True)
    is_processed = serializers.SerializerMethodField()
    class Meta:
        model = Notification
        fields = '__all__'

    def get_actor_photo(self, obj):
        if not obj.actor or not obj.actor.photo:
            return None
        
        # Obtém o caminho da imagem
        photo_url = obj.actor.photo.url
        
        # Se for um caminho relativo, adiciona o domínio do backend
        if photo_url.startswith('/'):
            return f'http://localhost:8000{photo_url}'
        
        return photo_url

    def get_is_processed(self, obj):
        # Verifica se o pedido de referência já foi aceite/recusado
        if obj.reference_type == 'FOLLOW_REQUEST':
            return obj.reference_id and FollowRequest.objects.filter(pk=obj.reference_id, status__in=['ACCEPTED', 'REJECTED']).exists()
        if obj.reference_type == 'TEAM_JOIN_REQUEST':
            return obj.reference_id and TeamJoinRequest.objects.filter(pk=obj.reference_id, status__in=['ACCEPTED', 'REJECTED']).exists()
        return True # Se não for pedido, não deve ter botões
    
class HighlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Highlight
        fields = '__all__'