# Editorial format — Phase 4

This locks the template used for every issue, and the style rules that apply to all of them. It replaces the placeholder structure with one worked example (dated Friday, September 25, 2026), built entirely from public, sourced facts found on 2026-09-26. No figure or fact below was invented.

## One refinement to your original spec

Your brief describes "Top 5 Signals." Building a real issue against real news, a fixed count of 5 unrelated headlines forces padding on quiet days and cuts good stories on busy ones. I used instead:

**One lead signal per sector (3 total), each sourced and scored 1–5, plus a short "Against the thesis" item.** On a day with more news, a sector can carry a second, shorter signal — the count flexes, the structure doesn't. This also matches your own "3 sectors" framing better than an arbitrary 5.

Flagging this as a deliberate change from the spec — reject it and I'll force a fixed 5 instead.

## Daily Radar structure (unchanged from your brief otherwise)

1. **Today in 30 seconds** — one line per sector.
2. **Today's signals** — 1 lead item per sector (see refinement above). Each has: a headline taken from the source, "What happened" (one factual sentence), "Why it matters" (plain English, no recommendation language), an importance score, and a link to the primary source.
3. **Against the thesis** — one item, every day, that cuts against a working sector thesis. Same sourcing standard as the signals.
4. **On the calendar** — confirmed, sourced upcoming dates (earnings, regulatory milestones, government deadlines). Never a forecast dressed up as a date.
5. **Disclosure** — every issue, every day, whether or not that day's names overlap with the author's holdings. Links to the Personal trading policy.

The free **Weekly Wrap** (Fridays) reuses the same 5 parts for the week's most important signals instead of the day's.

## Importance score rubric (1–5)

This scores *how much the news changes the picture for the sector*, never a security's attractiveness:

- **5** — Immediately changes the near-term supply/demand or policy picture.
- **4** — Meaningful shift with visible impact within weeks.
- **3** — Structurally relevant, but conditional, early-stage, or long-dated.
- **2** — Incremental or small in scale; mostly directional.
- **1** — Minor or largely symbolic.

## Style rules (from your brief, made concrete)

- Short sentences. Any term a general reader wouldn't know (HALEU, offtake agreement, EIS) is explained inline, once.
- Every number and every claim of fact is a link to its primary source (a filing, a regulator's own page, an official release) wherever one exists — not a news aggregator, if the primary document is public.
- No "buy/sell/hold," no price target, no "we like," no urgency language ("act now," "don't miss").
- Company names are allowed here and in newsletter issues only — never on marketing pages (home, sectors, pricing, about) per your rule.
- If a source is paywalled or a fact can't be pinned down, the issue says so instead of guessing.

## Worked example — sourcing detail

The three signals and two calendar entries now in `sample-brief.html` come from:
- Cameco/Global Laser Enrichment offtake agreement (Sept 18, 2026): [World Nuclear News](https://www.world-nuclear-news.org/articles/cameco-in-offtake-agreement-for-us-laser-enrichment-plant)
- DOE $73M "Mine of the Future" awards (Sept 9, 2026): [Department of Energy](https://www.energy.gov/articles/does-office-critical-minerals-and-energy-innovation-announces-73-million-advance-domestic)
- GenAI.mil weekly usage, Cameron Stanley quote (Sept 23, 2026): [Defense One](https://www.defenseone.com/technology/2026/09/genaimil-saw-more-2-million-users-one-week-top-dod-official-says/416186/)
- Paducah facility licensing timeline (EIS/SER, hearing): [NRC — GLE Facility Licensing](https://www.nrc.gov/facilities-safety/fuel-cycle-facilities/new-fuel-cycle-facility-licensing/global-laser-enrichment-facility-licensing)
- Uranium Energy Corp FY2026 results date (Sept 29, 2026): [Defense World](https://www.defenseworld.net/2026/09/17/uranium-energy-uec-to-post-earnings-on-thursday.html)
- Cameco's ~8% weight in NLR, used only in the Disclosure line to show why a Cameco story touches an author holding indirectly: search result, VanEck NLR top holdings (weightings drift daily; treat as approximate and re-check before each real issue).

## Resolved since this was written

The original Disclosure lineup (URNM, BRES, ARMR) mixed U.S. and European-domiciled (UCITS) funds; the European ones are generally inaccessible to U.S. persons. Replaced with an all-U.S.-listed lineup — NLR (uranium), SETM (mining/critical materials), SHLD (defense) — see `docs/legal-review-checklist.md` for identifiers and the one remaining open item (founder confirming these match the account actually held).
