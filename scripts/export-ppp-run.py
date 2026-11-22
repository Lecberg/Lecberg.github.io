"""Record one real run of the PPP Newsletter collect step for the site's "Try it" panel.

Safety: this never touches the client's Google Sheet, Brevo or an LLM.
- Run it from an EMPTY folder with no .env file (the pipeline reads .env from the current folder).
- It clears the GOOGLE_*, BREVO_* and OPENAI_* variables before importing the pipeline.
- It only calls collect_from_source() on the 10 built-in public sources and does the
  scoring, de-duplication and selection in memory. Nothing is written except the output file.

Usage (from an empty folder, with the newsletter project's virtual environment):
    <Newsletter_project>/.venv/Scripts/python <site>/scripts/export-ppp-run.py <site>/public/data/ppp-run.json
"""
from __future__ import annotations

import json
import os
import sys
import time
from datetime import date, datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path

if Path(".env").exists() or Path(".env.local").exists():
    sys.exit("Refusing to run: this folder has a .env file. Run from an empty folder.")
for key in list(os.environ):
    if key.startswith(("GOOGLE_", "BREVO_", "OPENAI_")):
        del os.environ[key]

from newsletter.cli import DEFAULT_MAX_ITEMS, MIN_RELEVANCE_SCORE, _is_newsletter_candidate  # noqa: E402
from newsletter.collectors import collect_from_source  # noqa: E402
from newsletter.config import DEFAULT_KEYWORDS, DEFAULT_SOURCES  # noqa: E402
from newsletter.models import Source  # noqa: E402
from newsletter.scoring import (  # noqa: E402
    dedupe_articles,
    is_low_value,
    keyword_matches,
    normalize_title,
    normalize_url,
    score_article,
)

out_path = Path(sys.argv[1])
keywords = list(DEFAULT_KEYWORDS)
sources = [Source.from_row(row) for row in DEFAULT_SOURCES]
started = time.time()

# 1. Collect from each source.
collected = []
source_rows = []
for source in sources:
    try:
        found = collect_from_source(source, limit=100, keywords=keywords)
        error = ""
    except Exception as exc:  # a source failing is part of a real run
        found, error = [], type(exc).__name__
    source_rows.append({"name": source.name, "url": source.url, "found": len(found), "error": error})
    collected.extend(found)

# 2. De-duplicate, recording which kept article each duplicate matched (same rule as dedupe_articles).
kept, seen_urls, dup_of = [], {}, {}
for idx, article in enumerate(collected):
    url = normalize_url(article.url)
    if url in seen_urls:
        dup_of[idx] = (seen_urls[url], "same link")
        continue
    title = normalize_title(article.title)
    match = next(
        (k for k in kept if SequenceMatcher(None, title, normalize_title(collected[k].title)).ratio() >= 0.92),
        None,
    )
    if match is not None:
        dup_of[idx] = (match, "near-identical headline")
        continue
    seen_urls[url] = idx
    kept.append(idx)
assert [collected[i].url for i in kept] == [a.url for a in dedupe_articles(collected)], "de-duplication mismatch"

# 3. Score parts, so the browser can re-score with fewer keywords using the same rule as score_article().
def parts(article):
    text = f"{article.title}\n{article.excerpt}"
    return {
        "textKw": [keywords.index(k) for k in keyword_matches(text, keywords)],
        "titleKw": [keywords.index(k) for k in keyword_matches(article.title, keywords)],
        "hk": "Hong Kong" in text or "香港" in text,
        "gov": article.source.lower().endswith(("bureau", "department")) or "government" in article.source.lower(),
        "low": is_low_value(article),
    }

def rescore(p):
    if p["low"]:
        return 0
    return 10 * len(p["textKw"]) + 8 * len(p["titleKw"]) + 8 * p["hk"] + 3 * p["gov"]

articles = []
for idx, a in enumerate(collected):
    p = parts(a)
    assert rescore(p) == score_article(a, keywords) == a.relevance_score, f"score mismatch: {a.title}"
    # Every selection rule except the score threshold (category, low value, junk links, date window).
    other_rules_ok = _is_newsletter_candidate(a, min_score=-1)
    articles.append({
        "i": idx,
        "title": a.title,
        "url": a.url,
        "source": a.source,
        "date": a.publish_date,
        "score": a.relevance_score,
        "dupOf": dup_of[idx][0] if idx in dup_of else None,
        "dupWhy": dup_of[idx][1] if idx in dup_of else None,
        "ok": other_rules_ok,
        **p,
    })

# 4. Select: eligible, highest score first, at most 30 (same as generate()).
eligible = [x for x in articles if x["dupOf"] is None and x["ok"] and x["score"] >= MIN_RELEVANCE_SCORE]
selected = [x["i"] for x in sorted(eligible, key=lambda x: x["score"], reverse=True)[:DEFAULT_MAX_ITEMS]]

result = {
    "ranAt": datetime.now(timezone.utc).isoformat(timespec="minutes"),
    "runDate": date.today().isoformat(),
    "seconds": round(time.time() - started),
    "keywords": keywords,
    "minScore": MIN_RELEVANCE_SCORE,
    "maxItems": DEFAULT_MAX_ITEMS,
    "sources": source_rows,
    "articles": articles,
    "selected": selected,
}
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(
    f"collected {len(collected)}, duplicates {len(dup_of)}, eligible {len(eligible)}, "
    f"selected {len(selected)}, {result['seconds']} s, {out_path.stat().st_size // 1024} KB"
)
print("sources:", "; ".join(f"{s['name']}: {s['found']}{' (' + s['error'] + ')' if s['error'] else ''}" for s in source_rows))
