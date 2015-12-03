CACHE MANIFEST
index.html
static/favicon.ico
static/img/icon.png
{% assets "css" %}
{{ ASSET_URL }}
{% endassets %}

{% assets "js" %}
{{ ASSET_URL }}
{% endassets %}

languages/en-US/common.lang.json
languages/en-US/diary.lang.json
languages/de-DE/common.lang.json
languages/de-DE/diary.lang.json

static/fonts/fontawesome-webfont.woff2?v=4.4.0
static/fonts/fontawesome-webfont.woff?v=4.4.0
static/fonts/fontawesome-webfont.ttf?v=4.4.0
static/flags/4x3/us.svg
static/flags/4x3/de.svg

static/fonts/josefin-sans-400-latin-ext.woff2
static/fonts/josefin-sans-400-latin.woff2
static/fonts/josefin-sans-600-latin-ext.woff2
static/fonts/josefin-sans-600-latin.woff2
static/fonts/josefin-sans-700-latin-ext.woff2
static/fonts/josefin-sans-700-latin.woff2

{% for template in template_list %}
templates/{{ template }}
{% endfor %}

FALLBACK:
favicon.ico static/favicon.ico
