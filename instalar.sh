#!/bin/bash
# Instalador do Cais.
# Uso: curl -fsSL https://77sorryz.github.io/cais-dock/instalar.sh | bash -s -- CODIGO-DA-COMPRA
# O que faz: baixa a versão atual, abre o pacote com o código da compra, confere a assinatura,
# põe o Cais em Aplicativos (o anterior vai para a Lixeira) e abre.
set -euo pipefail

BASE="${CAIS_BASE:-https://77sorryz.github.io/cais-dock}"
DEST="${CAIS_DEST:-/Applications}"
TESTE="${CAIS_TESTE:-}"     # CAIS_TESTE=1: só instala em CAIS_DEST, sem fechar, abrir nem gravar o código

fail() { printf '\nNão deu certo: %s\n' "$*" >&2; exit 1; }

[ "$(uname -s)" = Darwin ] || fail "o Cais só roda no macOS."
[ "$(uname -m)" = arm64 ] || fail "o Cais precisa de um Mac com chip Apple (M1 em diante)."
MAJOR=$(sw_vers -productVersion | cut -d. -f1)
[ "$MAJOR" -ge 14 ] || fail "o Cais precisa do macOS 14 ou mais novo (este Mac está no $(sw_vers -productVersion))."

CODE="${1:-}"
if [ -z "$CODE" ]; then printf 'Código da compra: '; read -r CODE </dev/tty; fi
CODE=$(printf '%s' "$CODE" | tr -d '[:space:]' | tr '[:lower:]' '[:upper:]')
[ -n "$CODE" ] || fail "faltou o código da compra."

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "Procurando a versão atual do Cais…"
PKG=$(curl -fsSL "$BASE/versao.json" | sed -n 's/.*"pacote" *: *"\([^"]*\)".*/\1/p')
[ -n "$PKG" ] || fail "não consegui ler a versão atual. Confira a internet e tente de novo."
echo "Baixando…"
curl -fL --progress-bar "$PKG" -o "$TMP/Cais.zip.enc" || fail "o download falhou. Tente de novo."

if ! CAIS_CODE="$CODE" /usr/bin/openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -md sha256 -pass env:CAIS_CODE \
      -in "$TMP/Cais.zip.enc" -out "$TMP/Cais.zip" 2>/dev/null \
   || ! /usr/bin/ditto -x -k "$TMP/Cais.zip" "$TMP/app" 2>/dev/null \
   || [ ! -d "$TMP/app/Cais.app" ]; then
  fail "o código da compra não confere. Copie de novo do e-mail da compra."
fi
/usr/bin/codesign --verify --deep "$TMP/app/Cais.app" 2>/dev/null || fail "o arquivo baixado veio com problema. Tente de novo."
[ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$TMP/app/Cais.app/Contents/Info.plist")" = app.cais.dock ] \
  || fail "o arquivo baixado não é o Cais."

mkdir -p "$DEST" 2>/dev/null || true
if [ ! -w "$DEST" ]; then DEST="$HOME/Applications"; mkdir -p "$DEST"; fi
if [ -z "$TESTE" ] && pgrep -x Cais >/dev/null; then
  echo "Fechando o Cais que está aberto…"
  pkill -x Cais || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do pgrep -x Cais >/dev/null || break; sleep 0.3; done
fi
# O Cais anterior vai para a Lixeira; se o macOS não deixar o Terminal mexer na Lixeira, é apagado.
if [ -d "$DEST/Cais.app" ]; then mv "$DEST/Cais.app" "$HOME/.Trash/Cais-anterior-$(date +%s).app" 2>/dev/null || rm -rf "$DEST/Cais.app"; fi
/usr/bin/ditto "$TMP/app/Cais.app" "$DEST/Cais.app"
V=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$DEST/Cais.app/Contents/Info.plist")

if [ -z "$TESTE" ]; then
  defaults write app.cais.dock purchase.code "$CODE"     # o Cais usa o código para baixar as atualizações
  open "$DEST/Cais.app"
fi
echo
echo "Pronto: Cais $V instalado em $DEST."
