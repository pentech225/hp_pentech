"""サイト内検索の目録（search-index.json）を作る。

使い方（hp_pentech/school/mukonoso で）:
    python build-search-index.py

ページを足したり文章を直したりしたら、公開前にこれを実行して search-index.json もコミットする。
検索の画面と動きは js/site-nav.js、見た目は css/layout.css。
"""
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# 検索に入れるページ（ROOTからの相対パスのglob）
INCLUDE = [
    "index.html",
    "html/*.html",
    "html/blog/*.html",
    "html/blog/2026/*.html",
    "event/*.html",
    "student/work/index.html",
]
# 入れないページ（ひな形・表示用の器・準備中・古い一覧）
EXCLUDE = {
    "html/blog/ARTICLE_TEMPLATE.html",
    "html/blog/article-viewer.html",
    "html/coming-soon.html",
    "html/blog.html",
}
SKIP_TAGS = {"script", "style", "noscript", "svg", "header", "aside", "nav", "footer", "template"}
BODY_LIMIT = 4000  # 1ページあたりの本文の文字数の上限


class Extractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.desc = ""
        self.h1 = ""
        self._in_title = False
        self._in_h1 = False
        self._skip = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self._in_title = True
        elif tag == "h1":
            self._in_h1 = True
        elif tag == "meta" and a.get("name") == "description":
            self.desc = (a.get("content") or "").strip()
        if tag in SKIP_TAGS:
            self._skip += 1

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag == "h1":
            self._in_h1 = False
        if tag in SKIP_TAGS and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if self._in_title:
            self.title += data
            return
        if self._skip:
            return
        if self._in_h1:
            self.h1 += data
        self.parts.append(data)


def clean(s):
    return re.sub(r"\s+", " ", s).strip()


def main():
    files = []
    for pat in INCLUDE:
        files.extend(sorted(ROOT.glob(pat)))
    pages = []
    seen = set()
    for f in files:
        rel = f.relative_to(ROOT).as_posix()
        if rel in EXCLUDE or rel in seen:
            continue
        seen.add(rel)
        p = Extractor()
        p.feed(f.read_text(encoding="utf-8", errors="ignore"))
        title = clean(p.title) or clean(p.h1) or rel
        # 「 | iTeen 武庫之荘校」のような共通の後ろ部分は外す
        title = re.split(r"\s*[|｜]\s*iTeen", title)[0].strip() or title
        if rel == "index.html":
            title = "トップページ"
        body = clean(" ".join(p.parts))[:BODY_LIMIT]
        pages.append({"url": rel, "title": title, "desc": clean(p.desc), "body": body})
    out = ROOT / "search-index.json"
    out.write_text(json.dumps(pages, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(pages)}ページ → {out.name} ({out.stat().st_size // 1024}KB)")


if __name__ == "__main__":
    main()
