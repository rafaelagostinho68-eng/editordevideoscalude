# Rollback e backups

## O que foi feito antes de começar (Etapa 0)
O projeto existente **não foi alterado**: todo o sistema novo vive na pasta `saykaro-sushi/` (nenhum arquivo preexistente foi editado ou apagado).
Antes da primeira linha de código foi criado, **fora do repositório**, um backup completo:

```
/home/user/backups/pre-saykaro-20261027-130423/
  repo-completo.bundle        # todo o repositório git (todas as branches/commits)
  arvore-de-trabalho.tar.gz   # cópia dos arquivos da pasta de trabalho (inclui arquivos não versionados)
  SHA256SUMS.txt / BACKUP-SHA256.txt   # somas de verificação
```
e a tag git local `backup/pre-saykaro-20261027-130423` apontando para o commit anterior ao trabalho.

> ⚠️ Esse backup está no ambiente onde o trabalho foi feito (`/home/user/backups`). Se esse ambiente for descartado, **copie a pasta para um local seu** (nuvem/HD externo) antes.

## Desfazer só o sistema novo (código)
```bash
git rm -r saykaro-sushi && git commit -m "Remove saykaro-sushi"      # ou simplesmente apague a pasta
# ou volte ao commit anterior ao trabalho:
git checkout backup/pre-saykaro-20261027-130423   # (somente leitura; crie uma branch a partir dele se for continuar)
```
Se o código já foi publicado em produção, o rollback correto é **implantar novamente a versão anterior** (veja `docs/DEPLOY.md`, “Atualizar e voltar versão”).

## Restaurar o repositório completo a partir do backup
```bash
B=/home/user/backups/pre-saykaro-20261027-130423
(cd "$B" && sha256sum -c BACKUP-SHA256.txt)                # confere integridade
git clone "$B/repo-completo.bundle" repo-restaurado         # repositório inteiro
# ou arquivos de trabalho:
mkdir restaurado && tar -xzf "$B/arvore-de-trabalho.tar.gz" -C restaurado
```

## Banco de dados
* **Antes de qualquer atualização em produção:** `./scripts/backup.sh` (gera `banco.dump` + `uploads.tar.gz` + somas de verificação).
* As migrações da v1 só **criam** tabelas. Nenhuma migração destrutiva (apagar coluna/tabela, trocar tipo) deve ser aplicada sem aprovação e sem backup recente.
* Restaurar um backup (substitui o conteúdo do banco!):
  ```bash
  pg_restore --clean --if-exists --no-owner -d "postgresql://usuario:senha@host/banco" backups/saykaro-AAAAMMDD-HHMMSS/banco.dump
  tar -xzf backups/saykaro-AAAAMMDD-HHMMSS/uploads.tar.gz -C "$(dirname "$UPLOAD_DIR")"
  ```
* Desfazer completamente o ambiente de **desenvolvimento**: `dropdb saykaro_dev && createdb saykaro_dev && npm run db:migrate && npm run db:seed`.

## Voltar uma alteração de cardápio feita no painel
O painel não tem “desfazer”. Pedidos já feitos **nunca mudam** (guardam nome/preço/opções do momento). Para reverter produtos/preços, restaure o backup do banco acima (ou corrija pelo painel).
