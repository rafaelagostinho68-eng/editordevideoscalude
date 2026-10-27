# Publicar em produção

## O que você precisa
1. **PostgreSQL gerenciado** (Neon, Supabase, Railway, Render, RDS…) ou instalado no servidor.
2. **Hospedagem Node 20+ com disco persistente** para as fotos (`UPLOAD_DIR`): VPS (Hetzner, DigitalOcean, Contabo…), Railway/Render/Fly com volume, etc.
   > ⚠️ **Vercel/Netlify (funções serverless) NÃO servem para as fotos desta versão**: o sistema de arquivos deles é temporário e as imagens enviadas pelo painel sumiriam. Se quiser Vercel, as imagens precisam ir para um armazenamento de objetos (S3/R2/Vercel Blob) — o ponto de troca é pequeno: `src/server/images.ts` (gravar/apagar) e `src/app/media/[name]/route.ts` (servir). Hoje isso **não está implementado**.
3. **HTTPS** (obrigatório: o cookie de sessão usa `Secure`/`__Host-` em produção).
4. Um domínio apontando para o servidor.

## Passo a passo (VPS com Nginx)
```bash
git clone <repositório> && cd <repositório>/saykaro-sushi
cp .env.example .env && nano .env        # DATABASE_URL, APP_SECRET, NEXT_PUBLIC_SITE_URL, UPLOAD_DIR
chmod 600 .env
npm ci
npm run build                            # gera o cliente Prisma e compila
npm run db:deploy                        # aplica as migrações (NÃO use db:migrate em produção)
npm run db:seed                          # só na 1ª vez: catálogo inicial (não sobrescreve se já houver dados)
npm run admin:create                     # cria o administrador
npm start                                # porta 3000 (PORT=… para mudar)
```
Mantenha rodando com **systemd** ou **pm2**:
```ini
# /etc/systemd/system/saykaro.service
[Service]
WorkingDirectory=/srv/saykaro/saykaro-sushi
EnvironmentFile=/srv/saykaro/saykaro-sushi/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
User=saykaro
[Install]
WantedBy=multi-user.target
```
Nginx (HTTPS via Let's Encrypt/certbot):
```nginx
server {
  server_name seudominio.com.br;
  client_max_body_size 6m;                       # fotos de até 5 MB
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;   # SOBRESCREVE o cabeçalho (impede IP forjado nos limites de tentativa)
  }
}
```
Com Cloudflare na frente do Nginx, ajuste `TRUSTED_PROXY_HOPS=2`.

## Checklist antes de divulgar o link
- [ ] `NEXT_PUBLIC_SITE_URL` com o domínio real (https).
- [ ] `APP_SECRET` forte e único; `.env` fora do git e com permissão 600.
- [ ] Administrador criado; testou login em `/admin/login` e logout.
- [ ] Painel → Restaurante: **horários**, **bairros/taxas**, **formas de pagamento**, WhatsApp e Instagram conferidos.
- [ ] Fotos dos produtos (ou aceitar os espaços reservados com a marca).
- [ ] Pendências em `/admin/pendencias` revisadas.
- [ ] Pedido de teste de ponta a ponta (celular real): enviar pelo WhatsApp, ver no painel, **depois cancelar** o pedido de teste.
- [ ] Backup automático agendado (`cron`: `0 4 * * * cd /srv/saykaro/saykaro-sushi && ./scripts/backup.sh`) e cópia fora do servidor.
- [ ] Monitor de disponibilidade (ex.: UptimeRobot em `https://seudominio.com.br/api/menu`).

## Atualizar e voltar versão
```bash
./scripts/backup.sh                       # sempre antes
git pull && npm ci && npm run build && npm run db:deploy && sudo systemctl restart saykaro
# voltar: git checkout <commit-anterior> && npm ci && npm run build && sudo systemctl restart saykaro
#   (se a atualização aplicou uma migração, restaure o banco do backup — veja ROLLBACK.md)
```

## Observações
* A tabela `LoginAttempt`/`RateLimitHit` se limpa sozinha (registros com mais de 24 h).
* O Next.js em modo `start` serve as fotos pela rota `/media/<uuid>.webp` com cache longo e imutável.
* Para mais de uma instância do app, o disco de uploads precisa ser compartilhado (ou migrar para armazenamento de objetos).
