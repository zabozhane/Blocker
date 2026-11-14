#!/usr/bin/env python3
"""Скачивает открытые списки рекламных серверов и превращает их в правила Safari.

Источники (лицензия CC BY-SA 3.0 / GPLv3, авторы — команды EasyList и RU AdList):
  * RU AdList — рекламные серверы Рунета (в т.ч. сети пиратских кинотеатров)
  * EasyList  — рекламные серверы со всего мира

Запуск из корня проекта:  python3 tools/update_lists.py
Результат: extension/rules/list-ruadlist.json и extension/rules/list-easylist.json
"""
import json, os, re, sys, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'extension', 'rules')
SOURCES = {
    "list-ruadlist.json": "https://raw.githubusercontent.com/easylist/ruadlist/master/advblock/adservers.txt",
    "list-easylist.json": "https://raw.githubusercontent.com/easylist/easylist/master/easylist/easylist_adservers.txt",
}

TYPE_MAP = {
    "script": "script", "image": "image", "stylesheet": "stylesheet", "object": "object",
    "xmlhttprequest": "xmlhttprequest", "subdocument": "sub_frame", "media": "media",
    "websocket": "websocket", "ping": "ping", "font": "font", "other": "other",
    "document": "main_frame", "popup": "main_frame",
}
FILTER_OK = re.compile(r"^[\x21-\x7e]+$")


def parse(line):
    line = line.strip()
    if not line or line.startswith(("!", "[", "@@", "#")) or "##" in line or "#@#" in line or "#$#" in line:
        return None
    pattern, _, opts = line.partition("$")
    if not pattern or pattern.startswith("/") and pattern.endswith("/"):
        return None  # регулярные выражения пропускаем
    if not FILTER_OK.match(pattern) or len(pattern) < 5:
        return None
    cond = {"urlFilter": pattern}
    types = []
    for o in filter(None, opts.split(",")):
        if o == "third-party":
            cond["domainType"] = "thirdParty"
        elif o in TYPE_MAP:
            types.append(TYPE_MAP[o])
        elif o in ("important", "all"):
            continue
        else:
            return None  # domain=, ~тип, redirect и прочее — пропускаем, чтобы ничего не сломать
    if types:  # без указания типа правило действует на всё, кроме открытия страницы
        cond["resourceTypes"] = sorted(set(types))
    return {"priority": 1, "action": {"type": "block"}, "condition": cond}


def main():
    total = 0
    for name, url in SOURCES.items():
        print(f"→ {url}")
        try:
            text = urllib.request.urlopen(url, timeout=60).read().decode("utf-8", "replace")
        except Exception as e:
            print(f"  не удалось скачать: {e}; оставляю прежний файл")
            continue
        seen, rules = set(), []
        for line in text.splitlines():
            r = parse(line)
            if not r:
                continue
            key = json.dumps(r["condition"], sort_keys=True)
            if key in seen:
                continue
            seen.add(key)
            r["id"] = len(rules) + 1
            rules.append(r)
        with open(os.path.join(ROOT, name), "w") as f:
            json.dump(rules, f, separators=(",", ":"))
        print(f"  {name}: {len(rules)} правил")
        total += len(rules)
    print(f"Всего: {total}")


if __name__ == "__main__":
    sys.exit(main())
