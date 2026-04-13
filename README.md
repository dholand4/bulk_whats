# Bulk Whats

## Indice

- [Sobre](#sobre)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Funcionalidades](#funcionalidades)
- [Pre-requisitos](#pre-requisitos)
- [Como rodar o projeto](#como-rodar-o-projeto)
- [Configuracao do banco de dados](#configuracao-do-banco-de-dados)
- [Variaveis de ambiente](#variaveis-de-ambiente)
- [Scripts uteis](#scripts-uteis)

---

## Sobre

Projeto **Bulk Whats**, um painel para operacao de envios em massa via WhatsApp Web.

O sistema permite:

- autenticar usuarios por email
- conectar uma sessao WhatsApp por usuario
- cadastrar e importar listas de contatos
- criar campanhas com mensagem personalizada
- enviar imediatamente ou agendar envios
- acompanhar fila, historico e administracao de acessos

---

## Estrutura do projeto

```
bulk_whats/
|-- backend/   # API em Node.js + Express + PostgreSQL + WhatsApp Web
`-- frontend/  # Interface em React + TypeScript + Vite + Styled-Components
```

---

## Tecnologias utilizadas

### Backend

- Node.js
- Express
- PostgreSQL
- `pg`
- `dotenv`
- `multer`
- `qrcode`
- `whatsapp-web.js`

### Frontend

- React
- TypeScript
- Vite
- Styled-Components
- React Router DOM
- XLSX

---

## Funcionalidades

- Login por email
- Controle de usuarios e perfis
- Conexao de dispositivo WhatsApp por usuario
- Geracao e exibicao de QR Code para autenticacao
- Cadastro manual de contatos
- Importacao de contatos por planilha
- Organizacao de contatos por listas
- Montagem de campanhas com placeholders dinamicos
- Upload de anexos
- Envio imediato ou agendado
- Acompanhamento de fila de processamento
- Visualizacao de historico de campanhas

---

## Pre-requisitos

Antes de iniciar, voce precisa ter instalado na maquina:

- Node.js 22.x
- npm
- PostgreSQL
- Google Chrome ou Microsoft Edge

---

## Como rodar o projeto

### 1. Clonar o repositorio

```
git clone <URL_DO_REPOSITORIO>
cd bulk_whats
```

### 2. Instalar dependencias do backend

```
cd backend
npm install
```

### 3. Instalar dependencias do frontend

```
cd ../frontend
npm install
```

### 4. Rodar o backend

Em um terminal:

```
cd backend
npm start
```

O backend sobe na porta `3000`.

### 5. Rodar o frontend

Em outro terminal:

```
cd frontend
npm run dev
```

O frontend roda localmente, em geral, na porta `5173`.

Abra no navegador o endereco mostrado pelo Vite no terminal. Normalmente sera:

```
http://127.0.0.1:5173
```

Observacoes:

- `127.0.0.1` aponta para a propria maquina de quem estiver rodando o projeto
- na maioria dos casos o Vite usa a porta `5173`, mas se ela estiver ocupada pode usar outra
- em desenvolvimento, o frontend usa proxy do Vite para falar com a API em `127.0.0.1:3000`
- o frontend depende do backend rodando para login, contatos, dispositivos, fila e historico

---

## Configuracao do banco de dados

### 1. Criar o banco no PostgreSQL

Exemplo usando `psql`:

```
CREATE DATABASE bulk_whats;
```

### 2. Configurar o `.env` do backend

Crie o arquivo `backend/.env` com base em `backend/.env.example`.

Exemplo:

```
PORT=
PGHOST=
PGPORT=
PGDATABASE=
PGUSER=
PGPASSWORD=
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

Observacoes:

- voce pode deixar no `.env` apenas o que quiser sobrescrever
- se preferir, pode usar apenas `PGPASSWORD` e `CHROME_PATH` no ambiente local
- o administrador inicial deve ser criado diretamente no banco de dados

### 3. Criar as tabelas

O backend executa automaticamente o schema ao iniciar, usando o arquivo:

- [backend/src/modules/storage/schema.sql](/C:/Daniel/Projetos/bulk_whats/backend/src/modules/storage/schema.sql)

Esse schema cria estruturas como:

- `app_state`
- `users`
- `stored_files`
- `whatsapp_sessions`
- `contacts`

Ou seja: basta configurar o banco e iniciar o backend.

---

## Variaveis de ambiente

### Backend

Arquivo base: `backend/.env.example`

- `PORT`: porta da API
- `PGHOST`: host do PostgreSQL
- `PGPORT`: porta do PostgreSQL
- `PGDATABASE`: nome do banco
- `PGUSER`: usuario do banco
- `PGPASSWORD`: senha do banco
- `CHROME_PATH`: caminho do executavel do Chrome

Modelo recomendado para projeto compartilhado:

```env
PORT=3000
PGHOST=localhost
PGPORT=5432
PGDATABASE=bulk_whats
PGUSER=postgres
PGPASSWORD=sua_senha
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

Minimo recomendado para ambiente local:

```env
PGPASSWORD=sua_senha
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

### Frontend

No estado atual, o frontend nao exige `.env` para rodar localmente.

---

## Scripts uteis

### Backend

```
npm start
```

### Frontend

```
npm run dev
npm run build
npm run preview
```

---

## Fluxo recomendado de desenvolvimento

1. subir o PostgreSQL
2. configurar o `backend/.env`
3. iniciar o backend
4. iniciar o frontend
5. acessar o endereco local informado pelo Vite no terminal, normalmente `http://127.0.0.1:5173`

---

## Observacoes importantes

- a autenticacao do WhatsApp depende do Chrome ou Edge instalado
- sessoes do WhatsApp e arquivos locais do backend nao devem ser versionados
- o projeto foi organizado para desenvolvimento com frontend e backend rodando separadamente
