#!/usr/bin/env python3
"""Генерирует rules/ads.json и rules/popups.json (declarativeNetRequest) из списков доменов.
Запуск: python3 tools/build_rules.py  (из корня проекта)"""
import json, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'extension', 'rules')

# Рекламные сети, баннеры и трекеры рекламы
AD_DOMAINS = """
doubleclick.net googlesyndication.com googleadservices.com adservice.google.com
adservice.google.ru pagead2.googlesyndication.com googletagservices.com
securepubads.g.doubleclick.net 2mdn.net adnxs.com adsrvr.org amazon-adsystem.com
criteo.com criteo.net taboola.com outbrain.com outbrainimg.com revcontent.com
mgid.com marketgid.com lentainform.com adskeeper.com adskeeper.co.uk
pubmatic.com rubiconproject.com openx.net casalemedia.com smartadserver.com
yieldmo.com teads.tv sharethrough.com media.net moatads.com serving-sys.com
adform.net adition.com bidswitch.net 33across.com indexww.com sovrn.com
lijit.com contextweb.com districtm.io zedo.com adblade.com adroll.com
quantserve.com scorecardresearch.com zemanta.com triplelift.com spotxchange.com
spotx.tv springserve.com innovid.com freewheel.tv fwmrm.net tremorhub.com
smaato.net inmobi.com applovin.com unityads.unity3d.com vungle.com
an.yandex.ru yabs.yandex.ru adfox.ru ads.adfox.ru adfox.yandex.ru
adriver.ru adhigh.net betweendigital.com buzzoola.com otm-r.com relap.io
smi2.ru smi2.net 24smi.org 24smi.info directadvert.ru adx.com.ru
ad.mail.ru ads.vk.com ad.vk.com adtelligent.com hybrid.ai
admixer.net admixer.com mediasniper.ru utarget.ru ssp.rambler.ru
ad.rambler.ru rambler-co.ru begun.ru tns-counter.ru am15.net
recreativ.ru cityadspix.com adlabs.ru gnezdo.ru traffic-media.co
yadro.ru adwile.com kadam.net nativeroll.tv vidroll.ru getintent.com
segmento.ru sape.ru advmaker.ru moevideo.biz moevideo.net
viqeo.tv videonow.ru mobiads.ru digitaltarget.ru
videoroll.net showvid.ws
"""

# Сети всплывающих окон (pop-up / pop-under) и агрессивной рекламы в видеоплеерах
POPUP_DOMAINS = """
popads.net popcash.net propellerads.com propellerclick.com onclickads.net
onclkds.com onclickmega.com onclickalgo.com adcash.com exoclick.com exosrv.com
exdynsrv.com juicyads.com trafficjunky.net trafficjunky.com trafficstars.com
tsyndicate.com hilltopads.net hilltopads.com clickadu.com clickaine.com
adsterra.com adsterratools.com a-ads.com ad-maven.com admaven.com
popmyads.com poptm.com richpush.co pushame.com evadav.com galaksion.com
clickadilla.com adspyglass.com bebi.com mondiad.com realsrv.com
mobicow.com zeropark.com mgid.org popunder.net popunderjs.com
monetag.com runative-syndicate.com realsrv.com tapjoyads.com
"""

# Рекламные вставки в видео (VAST/VMAP, Google IMA). Плееры без них просто запускают ролик
VIDEO_AD_URLS = [
    "||imasdk.googleapis.com/pal/",
    "||vast.yandex.ru^",
    "||yandex.ru/ads/",
    "||yandex.ru/an/",
    "||mc.yandex.ru/metrika/advert",
    "||vk.com/ads_rotate",
    "||ok.ru/dk?cmd=adv",
    "/vast.xml",
    "/vast?",
    "/vmap?",
]

# Вместо этих скриптов сайт получает пустышку из папки extension/stubs/.
# Сайт считает, что реклама загрузилась, и не показывает «Отключите блокировщик».
STUBS = {
    "||googletagservices.com/tag/js/gpt.js": "googletag.js",
    "||securepubads.g.doubleclick.net/tag/js/gpt.js": "googletag.js",
    "||securepubads.g.doubleclick.net/gpt/pubads_impl_": "noop.js",
    "||pagead2.googlesyndication.com/tag/js/gpt.js": "googletag.js",
    "||pagead2.googlesyndication.com/pagead/js/adsbygoogle.js": "adsbygoogle.js",
    "||pagead2.googlesyndication.com/pagead/show_ads.js": "noop.js",
    "||imasdk.googleapis.com/js/sdkloader/ima3.js": "ima3.js",
    "||imasdk.googleapis.com/js/sdkloader/ima3_dai.js": "ima3.js",
    "||yandex.ru/ads/system/context.js": "yandex-context.js",
    "||an.yandex.ru/system/context.js": "yandex-context.js",
    "||yastatic.net/pcode/adfox/loader.js": "yandex-context.js",
    "||yandex.ru/ads/system/adsdk.js": "noop.js",
    "fuckadblock.js": "fuckadblock.js",
    "blockadblock.js": "fuckadblock.js",
    "sniffadblock.js": "fuckadblock.js",
    "||www.googletagservices.com/activeview/js/current/osd.js": "noop.js",
    "||amazon-adsystem.com/aax2/apstag.js": "noop.js",
}

# Скрипты «верните рекламу» (Google Funding Choices ad-block recovery и т.п.)
ANTI_ADBLOCK_URLS = [
    "||fundingchoicesmessages.google.com/i/*ers=",
    "||fundingchoicesmessages.google.com/f/AGSKWx",
    "||btloader.com^",
    "||blockthrough.com^",
    "||adrecover.com^",
    "||admiral.io^",
    "||getadmiral.com^",
    "||pagefair.com^",
    "||pagefair.net^",
]

SUB_TYPES = ["script", "image", "stylesheet", "object", "xmlhttprequest", "sub_frame",
             "media", "websocket", "ping", "font", "other"]
ALL_TYPES = SUB_TYPES + ["main_frame"]


def domains(text):
    seen = []
    for d in text.split():
        if d not in seen:
            seen.append(d)
    return seen


def write(name, rules):
    for i, r in enumerate(rules, 1):
        r["id"] = i
    with open(os.path.join(ROOT, name), "w") as f:
        json.dump(rules, f, indent=1)
    print(f"{name}: {len(rules)} правил")


ads = []
# По одному правилу на домен через urlFilter "||домен^": так работает во всех версиях Safari
for d in domains(AD_DOMAINS):
    ads.append({"priority": 1, "action": {"type": "block"},
                "condition": {"urlFilter": f"||{d}^", "resourceTypes": SUB_TYPES}})
for u in VIDEO_AD_URLS:
    ads.append({"priority": 1, "action": {"type": "block"},
                "condition": {"urlFilter": u, "resourceTypes": SUB_TYPES}})
for u in ANTI_ADBLOCK_URLS:
    ads.append({"priority": 1, "action": {"type": "block"},
                "condition": {"urlFilter": u, "resourceTypes": SUB_TYPES}})
# Пустышки важнее блокировки (priority 2)
for u, stub in STUBS.items():
    ads.append({"priority": 2,
                "action": {"type": "redirect", "redirect": {"extensionPath": f"/stubs/{stub}"}},
                "condition": {"urlFilter": u, "resourceTypes": ["script"]}})
write("ads.json", ads)

popups = [{"priority": 1, "action": {"type": "block"},
           "condition": {"urlFilter": f"||{d}^", "resourceTypes": ALL_TYPES}}
          for d in domains(POPUP_DOMAINS)]
write("popups.json", popups)
