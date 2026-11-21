---
title: Hong Kong Traffic Signs Assistant
subtitle: A tool-calling agent that answers questions about Hong Kong's traffic signs on a map, with tests.
tagline: Ask in English or Chinese and get counts, map highlights and drawings, all taken from the data, never made up by the model.
dates: Jul 2026 – Sep 2026
order: 3
role: Solo project; first version built during my MVA internship
stack: [Python, LangGraph, Tool calling, Docker, Leaflet, GitHub Pages]
links:
  code: https://github.com/Lecberg/hk-tpdm-traffic-signs-markings
  demo: https://lecberg.github.io/hk-tpdm-traffic-signs-markings/
  demoLabel: Gallery and map
problem: >-
  To answer a question like "How many Stop signs are near Mong Kok?", an engineer had to search the drawing catalogue for the right sign, look up the place, then filter the survey records by hand in GIS software.
flow:
  - { kind: human, text: Ask in English or Chinese }
  - { kind: ai, text: The LLM agent picks the next tool }
  - { kind: step, text: "8 checked tools: catalogue, place, count, map" }
  - { kind: step, text: Answer cards built only from the data }
  - { kind: human, text: "Refine: \"make it 1 km\"" }
figures:
  - { value: "58/60", label: "test tasks completed (DeepSeek)" }
  - { value: "0", label: "unsupported facts found by the automated check" }
  - { value: "1,327", label: "sign and road-marking drawings" }
  - { value: "~157,000", label: "surveyed sign records on the map" }
cover: ../../assets/tpdm/assistant.png
coverAlt: The map assistant showing 36 surveyed Stop signs within 1 km of Mong Kok, with a circle on the map and a results panel.
gallery:
  - src: ../../assets/tpdm/assistant.png
    alt: The assistant panel beside the map with the answer for Stop signs near Mong Kok.
    caption: "\"Stop signs near Mong Kok within 500 metres\", then \"make it 1 kilometre\": it found 36 surveyed Stop signs and showed them on the map."
  - src: ../../assets/tpdm/map.png
    alt: The public sign map with a search around Mong Kok and a breakdown by drawing.
    caption: The public map, which runs with no installation or API key.
  - src: ../../assets/tpdm/gallery.png
    alt: The gallery of traffic-sign drawings, each with SVG and DXF download buttons.
    caption: The drawing gallery. Every sign can be downloaded as SVG or CAD-ready DXF.
---

## What I built

- **A tool-calling agent** (LangGraph) that routes sign, map and conversion requests through 8 checked tools. The model chooses which lookups to run, reads each result, and decides when it has enough to answer.
- **Grounded in real data:** 1,327 drawings (1,176 signs and 151 road markings) and about 157,000 surveyed sign records. It can count signs around a place, highlight them on the map and offer the drawings for download.
- **Follow-up questions.** "Compare Stop signs near Mong Kok and Tsim Sha Tsui" gives one row per place. "Make it 1 kilometre" builds on what the map already shows. When a name matches several places, it asks the user to pick.
- **Any model provider.** It works with 3 named providers (OpenAI, DeepSeek and Vercel) plus any OpenAI-compatible service.

## Keeping it reliable

- **The model never handles coordinates.** A place lookup returns a short handle such as `p1`, and the counting tool accepts only handles from the current session.
- **Result cards come from the data.** The counts on each card come from the survey records, and drawings and downloads come from the catalogue, not from the model.
- **"How it ran" under every answer** lists the lookups the agent made, so a user can see where the answer came from.
- **An evaluation script.** It runs a model through a fixed set of questions before anyone relies on it. On 60 English and Traditional Chinese prompts, DeepSeek completed 58 of 60 tasks, and the automated check found 0 facts the data did not support.
