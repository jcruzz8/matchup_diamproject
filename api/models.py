from django.db import models

# Create your models here.

class Player(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    is_public = models.BooleanField(default=True) # Perfil público ou privado
    
    # Estatísticas (cruciais para a Opção 2 de Auto-Balanceamento)
    matches_played = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    goals = models.IntegerField(default=0)
    assists = models.IntegerField(default=0)

    def __str__(self):
        return self.name

class Team(models.Model):
    name = models.CharField(max_length=100)
    captain = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='captain_of')
    members = models.ManyToManyField(Player, related_name='teams')

    def __str__(self):
        return self.name

class Game(models.Model):
    # As 3 opções de distribuição exigidas na tua proposta
    DISTRIBUTION_CHOICES = [
        ('1', 'Escolha Livre (Equipa 1 ou 2)'),
        ('2', 'Auto-Balanceamento por Estatísticas'),
        ('3', 'Inscrição de Equipa Inteira'),
    ]

    sport = models.CharField(max_length=50)
    location = models.CharField(max_length=200) # Admin seleciona o campo
    date = models.DateTimeField()
    organizer = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='organized_games')
    
    # Configurações do campo
    max_players_per_team = models.IntegerField(default=7)
    max_subs_per_team = models.IntegerField(default=2) # Máximo de suplentes definido pelo admin
    
    distribution_option = models.CharField(max_length=1, choices=DISTRIBUTION_CHOICES)
    is_registration_open = models.BooleanField(default=True) # Controla a fase de inscrições

    def __str__(self):
        return f"{self.sport} em {self.location} - {self.date.strftime('%d/%m/%Y')}"

class Registration(models.Model):
    # O ciclo de vida da inscrição (Aprovação -> Pagamento -> Validação)
    STATUS_CHOICES = [
        ('PENDING', 'Pendente (Aguardar admin)'),
        ('ACCEPTED', 'Aceite (Aguardar pagamento)'),
        ('PAID', 'Pago (Inscrição Válida)'),
        ('INVALID', 'Inválida (Expirou tempo de pagamento)'),
    ]

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='registrations')
    player = models.ForeignKey(Player, on_delete=models.CASCADE, null=True, blank=True) # Usado nas Opções 1 e 2
    team = models.ForeignKey(Team, on_delete=models.CASCADE, null=True, blank=True) # Usado apenas na Opção 3
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    selected_side = models.IntegerField(null=True, blank=True) # Guarda 1 ou 2 se o jogo for Opção 1
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inscrição: {self.game.sport} - Status: {self.status}"