# Bulk Whats

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

> Painel **self-hosted** para disparos em massa via WhatsApp Web. Gerencie contatos, monte campanhas personalizadas com placeholders dinâmicos, envie imediatamente ou agende — tudo em uma interface web simples e sem dependência de APIs pagas.

---

## Índice

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar](#como-rodar)
- [Banco de dados](#banco-de-dados)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Deploy com Docker](#deploy-com-docker)
- [Scripts úteis](#scripts-úteis)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## Sobre

O **Bulk Whats** é uma solução self-hosted para equipes que precisam disparar mensagens em massa via WhatsApp Web sem depender de APIs pagas ou serviços externos.

O sistema conecta o WhatsApp do usuário via QR Code, importa listas de contatos por planilha, monta campanhas com mensagens personalizadas e gerencia toda a fila de envio — com acompanhamento em tempo real e histórico completo de campanhas.

---

## Funcionalidades

- 🔐 Autenticação por e-mail
- 📱 Conexão do WhatsApp via QR Code (por usuário)
- 👥 Cadastro manual e importação de contatos por planilha (`.xlsx`)
- 📋 Organização de contatos em listas
- ✉️ Campanhas com placeholders dinâmicos (ex: `{{nome}}`)
- 📎 Upload de anexos nas campanhas
- ⏱️ Envio imediato ou agendado
- 📊 Acompanhamento de fila de processamento
- 🗂️ Histórico de campanhas
- 🛡️ Administração de usuários e perfis

---

## Arquitetura

```
┌─────────────────────────────────────────────┐
│                  Usuário                    │
└─────────────────────┬───────────────────────┘
                      │ HTTP (porta 5173 em dev)
┌─────────────────────▼───────────────────────┐
│           Frontend (React + Vite)           │
│  Proxy → backend em 127.0.0.1:3000          │
└─────────────────────┬───────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────┐
│         Backend (Node.js + Express)         │
│                                             │
│  ┌──────────────┐   ┌─────────────────────┐ │
│  │  PostgreSQL  │   │  whatsapp-web.js    │ │
│  │  (pg driver) │   │  (Puppeteer/Chrome) │ │
│  └──────────────┘   └─────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Fluxo principal:**
1. Usuário faz login e escaneia o QR Code para conectar o WhatsApp
2. Importa ou cadastra contatos e os organiza em listas
3. Cria uma campanha com mensagem, placeholders e anexos opcionais
4. Dispara imediatamente ou agenda o envio
5. Acompanha a fila e consulta o histórico

---

## Tecnologias

### Backend
| Tecnologia | Uso |
|---|---|
| Node.js 22 | Runtime |
| Express | API REST |
| PostgreSQL + `pg` | Banco de dados |
| `whatsapp-web.js` | Automação do WhatsApp via Puppeteer |
| `multer` | Upload de arquivos |
| `qrcode` | Geração do QR Code |
| `dotenv` | Variáveis de ambiente |

### Frontend
| Tecnologia | Uso |
|---|---|
| React 18 | Interface |
| TypeScript | Tipagem estática |
| Vite | Bundler e dev server |
| Styled-Components | Estilização |
| React Router DOM | Roteamento |
| XLSX | Leitura de planilhas |

---

## Pré-requisitos

- [Node.js 22.x](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- Google Chrome ou Microsoft Edge instalado na máquina

---

## Como rodar

### 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd bulk_whats
```

### 2. Configure o backend

```bash
cd backend
cp .env.example .env
# edite o .env com suas credenciais
npm install
npm start
```

O backend sobe na porta `3000` e cria as tabelas automaticamente na primeira execução.

### 3. Configure o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://127.0.0.1:5173` no navegador.

> **Nota:** o frontend usa proxy do Vite para se comunicar com a API em `127.0.0.1:3000`. O backend precisa estar rodando antes de usar o frontend.

---

## Banco de dados

### Criar o banco

```sql
CREATE DATABASE bulk_whats;
```

### Tabelas

O schema é executado automaticamente pelo backend na inicialização. As tabelas criadas são:

- `app_state`
- `users`
- `stored_files`
- `whatsapp_sessions`
- `contacts`

> O administrador inicial deve ser criado diretamente no banco de dados.

---

## Variáveis de ambiente

### Backend — `backend/.env`

```env
PORT=3000
PGHOST=localhost
PGPORT=5432
PGDATABASE=bulk_whats
PGUSER=postgres
PGPASSWORD=sua_senha
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

| Variável | Descrição |
|---|---|
| `PORT` | Porta da API |
| `PGHOST` | Host do PostgreSQL |
| `PGPORT` | Porta do PostgreSQL |
| `PGDATABASE` | Nome do banco |
| `PGUSER` | Usuário do banco |
| `PGPASSWORD` | Senha do banco |
| `PGSSLMODE` | Use `require` quando o banco exigir SSL |
| `DATABASE_URL` | String única de conexão (alternativa às variáveis acima) |
| `CHROME_PATH` | Caminho do Chrome no Windows/Mac |
| `PUPPETEER_EXECUTABLE_PATH` | Caminho do Chromium em Linux/Docker |

> **Mínimo para rodar localmente:** `PGPASSWORD` e `CHROME_PATH`

### Frontend

Não requer `.env` para rodar localmente.

---

## Deploy com Docker

### Variáveis de produção — `.env.production`

```env
APP_DEPLOY_ROOT=/opt/bulk_whats/app
APP_STORAGE_ROOT=/opt/bulk_whats/storage
FRONTEND_PORT=80
TZ=America/Sao_Paulo
POSTGRES_DB=bulk_whats
POSTGRES_USER=postgres
POSTGRES_PASSWORD=senha_forte_aqui
```

### Persistência em produção

| Dado | Caminho no host |
|---|---|
| PostgreSQL | `${APP_STORAGE_ROOT}/postgres` |
| Sessões WhatsApp | `${APP_STORAGE_ROOT}/backend/data` |
| Uploads | `${APP_STORAGE_ROOT}/backend/uploads` |

> Manter `backend/data` persistente evita reautenticações desnecessárias do WhatsApp.

Consulte o guia completo em [`docs/deploy-digitalocean.md`](docs/deploy-digitalocean.md).

---

## Scripts úteis

### Backend

```bash
npm start       # inicia o servidor
```

### Frontend

```bash
npm run dev      # dev server com hot reload
npm run build    # build de produção
npm run preview  # preview do build local
```

---

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o repositório
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Commit suas mudanças: `git commit -m "feat: minha feature"`
4. Push para a branch: `git push origin feat/minha-feature`
5. Abra um Pull Request

---

## Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](LICENSE) para mais informações.
