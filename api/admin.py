from django.contrib import admin
from .models import Player, Team, Game, Registration, FollowRequest, Notification, PlayerModalityProfile

# Register your models here.

admin.site.register(Player)
admin.site.register(Team)
admin.site.register(Game)
admin.site.register(Registration)
admin.site.register(FollowRequest)
admin.site.register(Notification)
admin.site.register(PlayerModalityProfile)