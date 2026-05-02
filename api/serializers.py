from rest_framework import serializers
from .models import Player, FollowRequest, Team, Game, Registration

class PlayerSerializer(serializers.ModelSerializer):
    colegas = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

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
    player_username = serializers.CharField(source='player.username', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)

    class Meta:
        model = Registration
        fields = '__all__'