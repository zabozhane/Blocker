#!/bin/bash
# Собирает блокировщик рекламы для Safari и подписывает его вашим Apple ID,
# чтобы Safari не отключал расширение после перезапуска.
# Нужен Xcode (App Store) и Apple ID, добавленный в Xcode → Settings → Accounts.
set -euo pipefail
cd "$(dirname "$0")"

APP_NAME="AdBlocker"
USER_ID="$(whoami | tr -cd 'a-zA-Z0-9' | tr 'A-Z' 'a-z')"
BUNDLE_ID="com.${USER_ID:-user}.safariadblocker"

# --- 1. Находим команду разработчика (Personal Team вашего Apple ID) ---
find_team() {
  # а) из сертификата «Apple Development» в связке ключей
  local t
  t=$(security find-certificate -a -c "Apple Development" -p 2>/dev/null \
      | openssl x509 -noout -subject 2>/dev/null \
      | grep -o 'OU *= *[A-Z0-9]\{10\}' | head -n1 | grep -o '[A-Z0-9]\{10\}$' || true)
  [ -n "$t" ] && { echo "$t"; return; }
  # б) из настроек Xcode (учётные записи в Xcode → Settings → Accounts)
  for key in IDEProvisioningTeamByIdentifier IDEProvisioningTeams; do
    t=$(defaults read com.apple.dt.Xcode "$key" 2>/dev/null \
        | grep -o 'teamID = [A-Z0-9]\{10\}' | head -n1 | grep -o '[A-Z0-9]\{10\}$' || true)
    [ -n "$t" ] && { echo "$t"; return; }
  done
}

TEAM="${TEAM_ID:-$(find_team)}"

if [ -z "$TEAM" ]; then
  cat <<MSG

Не нашёл ваш Apple ID в Xcode. Сделайте один раз:
  1) Откройте Xcode → Settings (Cmd+,) → Accounts
  2) Нажмите «+» → Apple ID и войдите своим Apple ID
  3) Запустите этот скрипт снова

MSG
  open -a Xcode 2>/dev/null || true
  exit 1
fi
echo "→ Подписываю командой разработчика: $TEAM"

# --- 2. Обновляем списки рекламных серверов (EasyList, RU AdList) ---
echo "→ Обновляю списки рекламных серверов…"
python3 tools/update_lists.py || echo "  (не удалось обновить, использую прежние списки)"

# --- 3. Создаём Xcode-проект (один раз) ---
if [ ! -d "$APP_NAME" ]; then
  echo "→ Создаю Xcode-проект…"
  xcrun safari-web-extension-converter extension \
    --project-location . \
    --app-name "$APP_NAME" \
    --bundle-identifier "$BUNDLE_ID" \
    --swift --macos-only --no-open --no-prompt
fi

# Конвертер иногда даёт приложению другой идентификатор (com.<имя>.AdBlocker),
# чем расширению. Xcode требует, чтобы ID расширения начинался с ID приложения.
for f in "$APP_NAME/$APP_NAME.xcodeproj"/project.*; do
  [ -f "$f" ] || continue
  perl -pi -e 'if (/PRODUCT_BUNDLE_IDENTIFIER/ && !/\.Extension/) { s/(PRODUCT_BUNDLE_IDENTIFIER"?\s*[:=]\s*"?)[A-Za-z0-9.\-]+/${1}'"$BUNDLE_ID"'/ }' "$f"
done

# --- 4. Собираем с настоящей подписью ---
mkdir -p build
LOG="build/xcodebuild.log"
echo "→ Собираю приложение (1–2 минуты)…"
xcodebuild -project "$APP_NAME/$APP_NAME.xcodeproj" \
  -scheme "$APP_NAME" -configuration Release \
  -derivedDataPath build \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Automatic DEVELOPMENT_TEAM="$TEAM" \
  build > "$LOG" 2>&1 || {
    echo "Сборка не удалась. Последние строки журнала:"
    tail -n 25 "$LOG"
    exit 1
  }

# --- 5. Устанавливаем в «Программы» и регистрируем в Safari ---
APP_PATH="build/Build/Products/Release/$APP_NAME.app"
DEST="/Applications/$APP_NAME.app"
[ -w /Applications ] || DEST="$HOME/Applications/$APP_NAME.app"
mkdir -p "$(dirname "$DEST")"
pkill -x "$APP_NAME" 2>/dev/null || true
rm -rf "$DEST"
cp -R "$APP_PATH" "$DEST"
# Убираем копию из папки сборки, иначе Safari покажет расширение дважды
LSREGISTER=/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister
"$LSREGISTER" -u "$APP_PATH" 2>/dev/null || true
rm -rf "$APP_PATH"
open "$DEST"

cat <<MSG

Готово: $DEST
Если включаете впервые: Safari → Настройки → Расширения → поставьте галочку
«Блокировщик рекламы», затем «Изменить сайты…» → «Разрешить» для всех сайтов.
Галочку «Разрешать неподписанные расширения» больше включать не нужно.
MSG
