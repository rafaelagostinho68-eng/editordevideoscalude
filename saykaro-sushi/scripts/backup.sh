#!/usr/bin/env bash
# Backup do banco (pg_dump) + fotos/logo enviados. Rode ANTES de qualquer atualização/migração.
#   ./scripts/backup.sh            → cria ./backups/saykaro-AAAAMMDD-HHMMSS/{banco.dump,uploads.tar.gz,SHA256SUMS.txt}
# Lê DATABASE_URL e UPLOAD_DIR do ambiente (ou do arquivo .env).
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
: "${DATABASE_URL:?DATABASE_URL não definido}"
UPLOAD_DIR="${UPLOAD_DIR:-./storage/uploads}"
dest="backups/saykaro-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$dest"
# pg_dump não aceita o parâmetro ?schema=… da URL do Prisma
pg_dump --format=custom --no-owner --file="$dest/banco.dump" "${DATABASE_URL%%\?*}"
if [ -d "$UPLOAD_DIR" ]; then tar -C "$(dirname "$UPLOAD_DIR")" -czf "$dest/uploads.tar.gz" "$(basename "$UPLOAD_DIR")"; else echo "(sem pasta de uploads ainda)"; fi
(cd "$dest" && sha256sum * > SHA256SUMS.txt)
chmod -R go-rwx "$dest"   # contém dados pessoais de clientes: acesso só do dono
echo "Backup criado em $dest"
ls -lh "$dest"
