---
title: Hong Kong PPP Weekly Newsletter
subtitle: An AI drafting pipeline for a bilingual infrastructure newsletter, run by the client.
tagline: Collects news from 10 sources, drafts English and Traditional Chinese summaries, and holds every issue for human approval.
dates: Sep 2026 – Oct 2026
order: 2
tryit: ppp
role: Solo project, built for one client
stack: [Python, LLM API, GitHub Actions, Google Sheets API, Brevo API, Next.js, Postgres]
links:
  code: https://github.com/Lecberg/PPP-Newsletter
problem: >-
  Each week, someone had to check many news sites for Hong Kong public-private partnership (PPP) and infrastructure news, pick the relevant stories, write a summary of each in English and Traditional Chinese, and build the email by hand.
flow:
  - { kind: step, text: Hourly GitHub Actions run; drafts only in the client's slot }
  - { kind: step, text: Collect from 10 sources (web pages and RSS) }
  - { kind: step, text: "Score by keywords, remove duplicates, keep up to 30" }
  - { kind: ai, text: "LLM: bilingual headlines and summaries as JSON" }
  - { kind: step, text: Create a Brevo email campaign as a draft }
  - { kind: human, text: Client reviews and confirms in the portal }
figures:
  - { value: "10", label: "news sources checked each run" }
  - { value: "30", label: "articles at most per issue" }
  - { value: "2", label: "languages: English and Traditional Chinese" }
  - { value: "176", label: "automated tests on the review portal" }
cover: ../../assets/ppp/newsletter.png
coverAlt: The review portal showing the latest draft newsletter and its delivery details, with a Confirm delivery button.
gallery:
  - src: ../../assets/ppp/newsletter.png
    alt: The newsletter review page with the draft on the left and delivery details on the right.
    caption: "Review page: read the draft, check recipients, then confirm delivery. Demo data."
  - src: ../../assets/ppp/recipients.png
    alt: The recipients page with a table of subscribers and checkboxes for this issue.
    caption: The client manages who receives each issue. Demo data.
  - src: ../../assets/ppp/mobile.png
    alt: The review page on a phone.
    caption: The portal works on a phone, so a draft can be approved anywhere.
---

## What I built

- **A Python pipeline** that collects articles, scores them against the client's keywords, removes duplicates and keeps up to 30 per issue.
- **One LLM step** that writes an English and a Traditional Chinese headline and summary for each article, returned as structured JSON. The prompt forbids any fact that is not in the source article.
- **Brevo drafts, never automatic sends.** Each issue becomes a draft email campaign. A person approves it in the portal or in Brevo before anything goes out.
- **A private review portal** (Next.js, TypeScript, Vercel, Neon Postgres) with email-link sign-in. The client reads the draft, chooses recipients and confirms delivery. A "Create draft now" button starts a run through the GitHub API.

## Handing it over

The client runs the newsletter without me. Everything they might want to change lives in a Google Sheet:

- **Sources:** one row per news site. Set `enabled` to FALSE to pause one, or add a row to include a new one.
- **Keywords:** the words that decide which articles score highest.
- **Timing:** weekly or monthly, the day, the hour and the time zone.

Changes take effect on the next run, with no code change and no redeploy. Invalid values fall back to safe defaults.

## Keeping it reliable

- **No duplicate issues.** GitHub Actions runs every hour, but the pipeline drafts at most once a day and only in the client's chosen slot.
- **Works without the cloud.** If the Google Sheets credentials are missing, it falls back to local JSON files, so the whole pipeline can be tested on a laptop.
- **Tests on both halves.** The Python pipeline and the portal each have their own GitHub Actions checks. The portal alone has 176 automated tests.
