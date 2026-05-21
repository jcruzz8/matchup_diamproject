from email.message import Message

from rest_framework import serializers
from .models import Highlight, Player, FollowRequest, Team, Game, Registration, Notification

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

class GameSerializer(serializers.ModelSerializer):
    vagas = serializers.SerializerMethodField()
    
    # Envia ao React as posições bloqueadas e nomes das equipas
    occupied_data = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = '__all__'

    def validate(self, data):
        registration_deadline = data.get('registration_deadline', getattr(self.instance, 'registration_deadline', None))
        payment_deadline = data.get('payment_deadline', getattr(self.instance, 'payment_deadline', None))
        if registration_deadline is None or payment_deadline is None:
            raise serializers.ValidationError('É obrigatório definir prazos de inscrição e pagamento.')
        if registration_deadline > payment_deadline:
            raise serializers.ValidationError('A data limite de inscrição deve ser anterior ou igual à data limite de pagamento.')
        return data

    def get_vagas(self, obj):
        total_lugares = (obj.titulares * 2) + (obj.suplentes * 2)
        inscricoes_ativas = obj.registrations.exclude(status='REJECTED').filter(team__isnull=True).count()
        return total_lugares - inscricoes_ativas

    def get_occupied_data(self, obj):
        active_regs = obj.registrations.exclude(status='REJECTED')
        
        data = {
            "positions": [], # IDs das posições individuais ocupadas
            "teams": {},     # Nomes das equipas pendentes/aceites
            "players": []
        }
        
        for reg in active_regs:
            data["positions"].append(reg.position_id)
            data["players"].append(reg.player.id)
            if reg.team:
                data["teams"][reg.position_id] = reg.team.name
                
        return data
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

    class Meta:
        model = Notification
        fields = '__all__'

    def get_actor_photo(self, obj):
        if not obj.actor or not obj.actor.photo:
            return None
        photo = obj.actor.photo
        if isinstance(photo, str) and photo.startswith('/'):
            return f'http://localhost:8000{photo}'
        return photo

class HighlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Highlight
        fields = '__all__'