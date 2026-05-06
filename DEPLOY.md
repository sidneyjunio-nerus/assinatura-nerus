# Deploy em producao

Este projeto publica duas imagens Docker no GitHub Container Registry:

- `ghcr.io/sidneyjunio-nerus/assinatura-nerus/backend:latest`
- `ghcr.io/sidneyjunio-nerus/assinatura-nerus/frontend:latest`

O servidor de producao usa o arquivo `docker-compose.prod.yml` para puxar essas imagens e iniciar a aplicacao.

## 1. Configurar o GitHub

No repositorio `sidneyjunio-nerus/assinatura-nerus`, acesse:

`Settings > Actions > General`

Em `Workflow permissions`, marque:

`Read and write permissions`

Depois acesse:

`Settings > Secrets and variables > Actions > Variables`

Crie as variaveis:

```env
NEXT_PUBLIC_API_URL=https://dominio-ou-ip-do-cliente:3001
NEXT_PUBLIC_SFTP_BASE_URL=https://assinaturas.nerus.com.br
```

Essas variaveis entram no build da imagem do frontend.

## 2. Fazer a imagem subir sozinha

O workflow roda automaticamente quando houver push na branch `main` ou `master`.

Fluxo normal:

```bash
git add .
git commit -m "configura build automatico"
git push origin main
```

Se a branch principal for `master`, use:

```bash
git push origin master
```

Depois acompanhe em:

`Actions > Build and publish Docker images`

Quando o workflow terminar com sucesso, as imagens estarao em:

`Packages`, dentro do repositorio ou da organizacao/usuario.

## 3. Preparar o servidor do cliente

No servidor, instale Docker e Docker Compose.

Crie uma pasta para a aplicacao:

```bash
mkdir -p /opt/assinatura-nerus
cd /opt/assinatura-nerus
```

Coloque estes arquivos nessa pasta:

- `docker-compose.prod.yml`
- `.env.production`

Voce pode criar o `.env.production` a partir do `.env.production.example`.

Exemplo:

```env
TZ=America/Sao_Paulo

BACKEND_IMAGE=ghcr.io/sidneyjunio-nerus/assinatura-nerus/backend:latest
FRONTEND_IMAGE=ghcr.io/sidneyjunio-nerus/assinatura-nerus/frontend:latest
BACKEND_PORT=3001
FRONTEND_PORT=3000

DB_PASS=senha_forte_do_mysql
DB_NAME=assinaturas

SFTP_HOST=sftp.exemplo.com
SFTP_PORT=22
SFTP_USER=usuario_sftp
SFTP_PASS=senha_sftp
SFTP_BASE_URL=https://assinaturas.nerus.com.br
SFTP_REMOTE_DIR=/
NEXT_PUBLIC_SFTP_BASE_URL=https://assinaturas.nerus.com.br
```

## 4. Login no registry

Se o package estiver privado, faca login no GHCR no servidor:

```bash
docker login ghcr.io
```

Use seu usuario do GitHub e um Personal Access Token com permissao:

`read:packages`

Se o package estiver publico, esse login pode nao ser necessario.

## 5. Subir a producao

Dentro de `/opt/assinatura-nerus`:

```bash
docker-compose --env-file .env.production -f docker-compose.prod.yml pull
docker-compose --env-file .env.production -f docker-compose.prod.yml up -d
```

Ver logs:

```bash
docker-compose --env-file .env.production -f docker-compose.prod.yml logs -f
```

Atualizar depois de um novo build:

```bash
docker-compose --env-file .env.production -f docker-compose.prod.yml pull
docker-compose --env-file .env.production -f docker-compose.prod.yml up -d
```
