---
title: CareerPilot AI
subtitle: Turns a CV and a job posting into a complete application kit.
tagline: Upload a CV, paste a job, and get a fit score, CV fixes, a cover letter and an email, with no invented facts.
dates: May 2026 – Jul 2026
order: 1
role: Solo project
stack: [Node.js, LLM API, Structured JSON, Brave Search API, Vercel]
links:
  code: https://github.com/Lecberg/Jb-Hunting-Assistant
  demo: https://careerpilot-ai-application-studio.vercel.app
  demoLabel: Live demo
problem: >-
  For every job, I read the posting, looked up the company, compared both with my CV, then wrote a cover letter and an application email by hand. Each claim had to stay true to the CV while still fitting the role.
flow:
  - { kind: human, text: Upload a CV and paste a job link or text }
  - { kind: step, text: Read the CV; fetch the job page safely }
  - { kind: step, text: Search for company news (Brave API) }
  - { kind: ai, text: "LLM 1: pull CV facts into JSON" }
  - { kind: ai, text: "LLM 2: write the kit as JSON" }
  - { kind: human, text: Review, edit and save the kit }
figures:
  - { value: "4", label: "outputs per kit: fit analysis, CV fixes, cover letter, email" }
  - { value: "2", label: "LLM steps, each with one job" }
  - { value: "3", label: "writing tones, same structure" }
  - { value: "0", label: "CVs stored on the server" }
cover: ../../assets/careerpilot/kit.png
coverAlt: The generated application kit, showing a fit-score ring, strong matches, gaps and company research.
gallery:
  - src: ../../assets/careerpilot/studio.png
    alt: The Application Studio form with CV upload, job URL, company name, job text and writing tone.
    caption: "Input: upload a CV (PDF, DOCX or TXT), add a job link or pasted text, and pick a writing tone."
  - src: ../../assets/careerpilot/kit.png
    alt: The generated kit with a fit score, matches and gaps.
    caption: "Output: a fit score, matches and gaps, and what the company research found. Demo data."
  - src: ../../assets/careerpilot/kit-dark.png
    alt: The same kit view in dark mode.
    caption: The interface follows the system's light or dark setting.
---

## What I built

- **Two LLM steps, each with one job.** The first reads the CV and returns its facts in fixed JSON fields (name, skills, projects, target roles), at a low temperature (0.1) so the result is stable. The second writes the whole kit in one fixed JSON shape: the job summary, a fit score with matches and gaps, CV fixes, a cover letter and an email.
- **Prompt rules that keep it honest.** The model may not invent employers, figures, degrees, dates or certificates. Every claim has to tie back to the CV, the posting or the search results. If evidence is missing, it names the gap and suggests how to close it, instead of filling it in. It also avoids stock phrases that recruiters skip over.
- **Company research.** Before writing, it searches the web for the company and passes the top results into the prompt, so the cover letter can open with what the company is actually doing. Results are cached for 15 minutes.
- **Three writing tones.** Bold Professional, Warm Storytelling and Formal Executive change the voice but not the structure.
- **Saved kits.** Kits are saved in the user's own browser (up to 30), so nothing personal sits on a server.

## Keeping it reliable

- **Safe job-page fetching.** The server refuses private and local addresses, checks DNS answers, and re-checks every redirect, so a job link cannot be used to reach internal systems.
- **A clear fallback.** If a page cannot be read or has too little job text, the app asks the user to paste the text instead of guessing.
- **Checked output.** Scores are clamped to 0–100, and a reply that is not valid JSON is rejected rather than shown.
- **Limits for a public demo.** 5 requests per 10 minutes per user. CVs are processed in memory and never written to disk.
