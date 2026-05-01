from django.db import models

class Player(models.Model):
    GENDER_CHOICES = [
        ('Masculino', 'Masculino'),
        ('Feminino', 'Feminino'),
    ]

    # Campos Obrigatórios
    username = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128, default="") 
    phone = models.CharField(max_length=20, default="")
    age = models.IntegerField(default=18)
    gender = models.CharField(max_length=50, choices=GENDER_CHOICES, default="")
    
    # Campos Opcionais
    photo = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    height = models.IntegerField(null=True, blank=True) # Altura em cm
    zone = models.CharField(max_length=100, null=True, blank=True)
    
    # Guardar as Modalidades e Posições (Estrutura JSON)
    sport_positions = models.JSONField(default=dict, blank=True)

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
        return self.username

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
        # Garante que não podes enviar 50 pedidos à mesma pessoa enquanto o primeiro estiver pendente
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"Pedido: {self.from_user.username} quer seguir {self.to_user.username} ({self.status})"
    
class Team(models.Model):
    name = models.CharField(max_length=100)
    captain = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='captain_of')
    members = models.ManyToManyField(Player, related_name='teams')

    def __str__(self):
        return self.name

class Game(models.Model):
    DISTRIBUTION_CHOICES = [
        ('1', 'Escolha Livre (Equipa 1 ou 2)'),
        ('2', 'Auto-Balanceamento por Estatísticas'),
        ('3', 'Inscrição de Equipa Inteira'),
    ]

    sport = models.CharField(max_length=50)
    location = models.CharField(max_length=200)
    date = models.DateTimeField()
    organizer = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='organized_games')
    
    max_players_per_team = models.IntegerField(default=7)
    max_subs_per_team = models.IntegerField(default=2)
    
    distribution_option = models.CharField(max_length=1, choices=DISTRIBUTION_CHOICES)
    is_registration_open = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.sport} em {self.location} - {self.date.strftime('%d/%m/%Y')}"

class Registration(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendente (Aguardar admin)'),
        ('ACCEPTED', 'Aceite (Aguardar pagamento)'),
        ('PAID', 'Pago (Inscrição Válida)'),
        ('INVALID', 'Inválida (Expirou tempo de pagamento)'),
    ]

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='registrations')
    player = models.ForeignKey(Player, on_delete=models.CASCADE, null=True, blank=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, null=True, blank=True)
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    selected_side = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inscrição: {self.game.sport} - Status: {self.status}"