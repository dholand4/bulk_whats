# Deploy na DigitalOcean

Este projeto pode ser publicado em uma VM Ubuntu usando Docker Compose.

## Estrutura recomendada na VM

```text
/opt/bulk_whats/
|-- app/       # repositorio clonado
`-- storage/   # dados persistentes do Postgres e WhatsApp
```

Valores recomendados:

- `APP_DEPLOY_ROOT=/opt/bulk_whats/app`
- `APP_STORAGE_ROOT=/opt/bulk_whats/storage`

## Preparar diretorios

```bash
sudo mkdir -p /opt/bulk_whats/app
sudo mkdir -p /opt/bulk_whats/storage/postgres
sudo mkdir -p /opt/bulk_whats/storage/backend/data
sudo mkdir -p /opt/bulk_whats/storage/backend/uploads
sudo chown -R $USER:$USER /opt/bulk_whats
```

## Clonar o projeto

```bash
cd /opt/bulk_whats/app
git clone <URL_DO_REPOSITORIO> .
git switch release
```

## Configurar ambiente de producao

```bash
cp .env.production.example .env
```

Edite o arquivo `.env` e ajuste pelo menos:

- `APP_DEPLOY_ROOT=/opt/bulk_whats/app`
- `APP_STORAGE_ROOT=/opt/bulk_whats/storage`
- `POSTGRES_PASSWORD=<senha_forte>`
- `FRONTEND_PORT=80`

## Subir a aplicacao

```bash
cd /opt/bulk_whats/app
docker compose --env-file .env up -d --build
```

## Atualizar deploy

```bash
cd /opt/bulk_whats/app
git pull
docker compose --env-file .env up -d --build
```

## Persistencia usada pelo compose

- PostgreSQL: `/opt/bulk_whats/storage/postgres`
- sessoes locais do WhatsApp: `/opt/bulk_whats/storage/backend/data`
- arquivos locais do backend: `/opt/bulk_whats/storage/backend/uploads`
