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
    class Meta:
        model = Game
        fields = '__all__'

class RegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = '__all__'