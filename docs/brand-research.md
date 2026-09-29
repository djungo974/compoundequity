# Brand name research — paused (2026-09-26)

Paused at Férid's request; `[BRAND]` stays as the placeholder until a name is picked.
Checks done so far are listed below. USPTO, FCA, and social handle checks are still to do.

## Findings

| Candidate | .com | .io | SEC/FINRA firms using the key word | Verdict |
|---|---|---|---|---|
| Faultline Brief | free (`faultlinebrief.com`, `faultlineradar.com`) | free | 0 | Clean so far. USPTO "faultline": 27 marks, none live in class 36 or 41 |
| Hard Signal | taken (`hardsignalbrief.com` free) | free | 0 | Clean so far |
| Critical Signal | taken (`criticalsignalbrief.com` free) | free | 0 | Clean so far |
| Five Signals | taken (`fivesignalsdaily.com` free) | free | 0 | Clean so far |
| Assay Radar | taken (`assaydaily.com` free) | free | 1 (probably an alias match) | Probably clean, check the alias |
| Triad Signal | free | free | 15 (Triad Advisors, Triad Securities…) | Drop: confusion risk |
| Lodestar Brief | free | free | 10 (Lodestar Capital, Lodestar Securities…) | Drop |
| Bedrock Brief | taken | free | 13 | Drop |
| Strata Radar | taken | free | 15 | Drop |
| Sentry Brief | taken | free | 20 | Drop |

Also: "Compound Equity Group" is already an FCA-authorised UK investment firm, which is why the current name has to go.

## Method notes
- `.com`: Verisign RDAP (`rdap.verisign.com/com/v1/domain/…`); 404 means not registered.
- `.io`: no RDAP server listed by IANA. Use `whois.nic.io` port 43. A taken domain returns a `Domain Name:` line and a free one returns `Domain not found.`. Don't match on the word "available", which also appears in the terms-of-use text of every response.
- SEC IAPD: `api.adviserinfo.sec.gov/search/firm?query=…`. FINRA: `api.brokercheck.finra.org/search/firm?query=…`.
- USPTO: tmsearch.uspto.gov. The `?query=` URL parameter doesn't run a search, so type the term into the search box.
