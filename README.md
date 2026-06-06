# MatchUp - Projeto DIAM

## Membros do grupo:
- Diogo Gregório 130485

- HenriqueAfonso 123279

- José Cruz 123292

- Samuel Monteiro 123300

## Como instalar e correr o projeto

Para correres este projeto no teu computador, precisas de ter o **Python** e o **Node.js** instalados.

### 1. Configurar o Backend (Django)

Abre um terminal na pasta principal do projeto e segue estes passos:

1. **Criar o Ambiente Virtual:**
   ```bash
   python -m venv .venv
   ```
2. **Ativar o Ambiente Virtual:**
   - No Windows: `.\.venv\Scripts\activate`
   - No Mac/Linux: `source .venv/bin/activate`
3. **Instalar as dependências:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Correr o Servidor:**
   ```bash
   python manage.py runserver
   ```
   *(O backend vai ficar a correr em http://localhost:8000)*

---

### 2. Configurar o Frontend (React)

Abre um **novo/segundo terminal**, entra na pasta do frontend e segue estes passos:

1. **Entrar na pasta:**
   ```bash
   cd frontend
   ```
2. **Instalar as dependências:**
   ```bash
   npm install
   ```
3. **Correr o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   *(O frontend vai abrir em http://localhost:5173)*

---

## Credenciais de users que já constam na base de dados (para teste)

1. - **Username:** teste
   - **Password:** TestePeladinhas


2. - **Username:** privado
   - **Password:** PrivadoPeladinhas


3. - **Username:** samu
   - **Password:** SamuPeladinhas


4. **SUPERUSER (APENAS BACKEND)**
   - **Username:** admin
   - **Password:** admin