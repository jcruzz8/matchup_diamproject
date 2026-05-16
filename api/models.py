from django.db import models
from django.contrib.auth.models import User

class Player(models.Model):
    GENDER_CHOICES = [
        ('Masculino', 'Masculino'),
        ('Feminino', 'Feminino'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # Campos Obrigatórios
    phone = models.CharField(max_length=20, default="")
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=50, choices=GENDER_CHOICES, default="")
    
    # Campos Opcionais
    photo = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    height = models.IntegerField(null=True, blank=True) # Altura em cm
    zone = models.CharField(max_length=100, null=True, blank=True)
    
    # Guardar as Modalidades e Posições (Estrutura JSON)
    sport_positions = models.JSONField(default=dict, blank=True)
    modality_stats = models.JSONField(default=dict, blank=True)
    is_public = models.BooleanField(default=True) # Perfil público ou privado
    
    followers = models.ManyToManyField('self', symmetrical=False, related_name='following', blank=True)

    # Estatísticas
    matches_played = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    goals = models.IntegerField(default=0)
    assists = models.IntegerField(default=0)

    def __str__(self):
        return self.user.username

    # Lógica inteligente para encontrar os "Colegas" (pessoas que se seguem mutuamente)
    @property
    def colegas(self):
        return self.followers.filter(id__in=self.following.all())
    
class FollowRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('ACCEPTED', 'Aceite'),
        ('REJECTED', 'Rejeitado'),
    ]

    from_user = models.ForeignKey(Player, related_name='sent_requests', on_delete=models.CASCADE)
    to_user = models.ForeignKey(Player, related_name='received_requests', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"Pedido: {self.from_user.username} quer seguir {self.to_user.username} ({self.status})"
    
class Team(models.Model):
    name = models.CharField(max_length=100)
    modality = models.CharField(max_length=50, default='Futebol')
    city = models.CharField(max_length=100, blank=True, null=True)
    logo = models.ImageField(upload_to='team_logos/', null=True, blank=True)
    
    captain = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='captain_of')
    coach = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='coach_of')
    
    members = models.ManyToManyField(Player, related_name='teams', blank=True)

    def __str__(self):
        return self.name

class TeamJoinRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('ACCEPTED', 'Aceite'),
        ('REJECTED', 'Rejeitado'),
    ]

    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='team_requests')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='join_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('player', 'team') # Evita spam de pedidos para a mesma equipa

    def __str__(self):
        return f"{self.player.username} quer aderir à {self.team.name} ({self.status})"

class Game(models.Model):
    organizer = models.ForeignKey('Player', on_delete=models.CASCADE, related_name='organized_games', null=True)
    
    modality = models.CharField(max_length=50, default='Futebol')
    location = models.CharField(max_length=150)
    date = models.DateField()
    time = models.TimeField()
    price = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    titulares = models.IntegerField(default=5)
    suplentes = models.IntegerField(default=0)
    cor_equipa1 = models.CharField(max_length=7, default='#ff0000') 
    cor_equipa2 = models.CharField(max_length=7, default='#0000ff') 
    
    distribution_model = models.CharField(max_length=50, default='Escolha Livre')

    occupiedPositions = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.modality} - {self.location} ({self.date})"

class Registration(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('APPROVED', 'Aceite'),
        ('REJECTED', 'Rejeitada'),
    ]

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='registrations')
    
    # Quem está a fazer o pedido (Jogador)
    player = models.ForeignKey('Player', on_delete=models.CASCADE, related_name='my_registrations')
    
    # Se for uma inscrição "Equipa vs Equipa", guardamos qual é a equipa
    team = models.ForeignKey('Team', on_delete=models.CASCADE, null=True, blank=True, related_name='team_registrations')
    
    # Qual a vaga que quer ocupar
    position_id = models.CharField(max_length=50)
    
    # O estado do pedido (Pendente por defeito)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        nome = self.team.name if self.team else self.player.user.username 
        return f"{nome} -> {self.game.location} ({self.status})"
    
class Highlight(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='highlights')
    image = models.ImageField(upload_to='highlights/')
    caption = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Foto de {self.player.username}"