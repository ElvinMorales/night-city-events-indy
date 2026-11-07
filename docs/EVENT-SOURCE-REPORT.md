# Phase 3A event source report

Historical snapshot: [Phase 3B](PHASE-3B-REPORT.md) rechecks the four urgent leads, separates occurrence confirmation from feature completeness, and supersedes this report’s end-required/empty-review-array conclusions.

Research date: **2026-11-07 UTC** (the evening of November 6 in Indianapolis). Public-source checks ran from **2026-11-07T01:29:00Z through 2026-11-07T01:33:57Z**. Times below are actual access/check times from this run, not search-engine crawl dates, publication dates, or invented moderator verification times. Browser timestamps identify when navigation/checking began; the directory snapshot has its completion timestamp.

## Outcome and publication boundary

- **0 fully verified upcoming occurrences; 0 complete schema-ready candidates.**
- **16 incomplete upcoming listings within 40 miles**: 15 on the official game's store/event pages and one on the Carmel organizer's calendar. Two Mage's listings may describe the same November 28 occurrence; counts are listings, not deduplicated events.
- **19 incomplete upcoming listings in the separate 40–100-mile area**: 18 on official store/event pages and one aggregator-only Muncie lead.
- **31 official directory entries**: 15 within 40 miles (including two likely duplicate Books & Brews entries), 16 over 40 and at most 100 miles. These are venue leads, not 31 confirmed event hosts. Three additional general venue leads are recorded below.
- Six historical occurrences are retained as research context, not upcoming candidates.
- The review-only file is [`review/events.candidates.json`](review/events.candidates.json), intentionally `[]`. No placeholder end times, inferred recurrence, fabricated links, or incomplete records were added. `src/data/events.json` remains unchanged.

The discovered listings are ready for **moderator investigation**, not publication. No listing has all facts and link checks required by [`VERIFICATION.md`](VERIFICATION.md). A valid schema alone would not establish factual confirmation.

## Method, scope, and source limitations

The center is the application's downtown Indianapolis point, **39.7684, −86.1581**. The official [store locator](https://cyberpunktcg.com/stores) was rendered in a normal unauthenticated browser, using that explicitly configured research center and its 100-mile option. This is a research location, not the user's detected location. Distances below were independently calculated using the application's Haversine formula and coordinates actually supplied by each official listing's public directions link. Rounded values match the locator; grouping uses unrounded values. They are straight-line miles, not driving distances. Directory/map coordinates are source evidence and still merit moderator review before publication.

Searches began with Indianapolis and nearby Carmel, Greenwood, Fishers, Noblesville, Greenfield, Plainfield and Anderson; expanded searches covered Muncie, Kokomo, Bloomington (Indiana), Lafayette, Columbus, Richmond and Terre Haute. Queries combined Cyberpunk TCG, organizer/store names, dates, Night City Brawl/Showdown and public Melee listings. Unrelated Cyberpunk RPGs, Cyberpunk Legends, product sales, and same-name cities in other states were excluded. This is a bounded discovery pass, not an assertion that no other events exist.

Sources were prioritized as original organizer calendars, official game pages and the public registration links they expose. Aggregators were used only as leads. No login, private Discord, attendee data, Melee API, paid source, registration, message, or account creation was used. A local installed browser resolved JavaScript-only pages; no scraper or browser dependency was added to this application.

Access results:

| Source | Checked (UTC) | Result and consequence |
| --- | --- | --- |
| [Official calendar](https://cyberpunktcg.com/calendar) | 2026-11-07T01:29:07Z | General Showdown window November 13–December 6 and constructed best-of-three format; does not establish any local occurrence. Past entries also remain under an upcoming heading. |
| [Official organized-play overview](https://cyberpunktcg.com/op) | 2026-11-07T01:29:13Z | General format/program context only; not evidence that a named local weekly event occurs. |
| [Official locator](https://cyberpunktcg.com/stores) | Initial text check 2026-11-07T01:29:07Z; browser directory snapshot 2026-11-07T01:32:27.639Z | Text extraction was empty; normal browser rendering succeeded. Store-specific check times appear below. |
| [Melee home](https://melee.gg/) | 2026-11-07T01:29:25Z | Web tool returned HTTP 403. No attempt to bypass access restrictions. |
| [Official Melee finder shortcut](https://bit.ly/CTCGonMelee) | 2026-11-07T01:29:07Z | Inaccessible through the web tool. No assumed API access. |
| Melee tournament pages 485175, 460450, 460451, 460452, 460453 (linked below) | 2026-11-07T01:32:34Z | Each returned inaccessible through the web tool. Other Melee URLs below were observed on official source pages but not individually opened after these failures. None is certified as publicly readable or registration-open. |
| [Kingdom organizer Facebook](https://www.facebook.com/thekingdomkokomo/) | 2026-11-07T01:30:48Z | Tool returned a temporary-block/login page, with old cached footer. No event evidence obtained; no login or retries to evade the restriction. |

**Year caveat:** official locator event cards show month/day, weekday and EST, but omit the year. The tables use **2026 as a contextual interpretation of the current November/December upcoming view and weekday alignment**, not a full date verified on the inaccessible tournament pages. Moderators must verify the year. EST is displayed as UTC−05:00; no end time is derived from a store's closing hours. Each listed date was individually visible; no extra weekly occurrences were generated.

## Verified upcoming occurrences

**None meet the project's full verification policy.** This is an evidence-completeness finding, not a claim that the events will not happen.

## Incomplete upcoming candidates — within 40 miles

For each official-locator listing below, the named store is the listed venue/host lead; a separately named tournament organizer was not verified on Melee. Address evidence is the linked official directory entry. The registration URL is the actual link observed there, not a synthesized URL. Entry fees are transcribed claims, not paid or independently verified prices. An unknown fee may be omitted from a future schema record, but an unknown end time may not.

### L1: GOOD GAMES - INDIANAPOLIS

Venue and listed host: **GOOD GAMES - INDIANAPOLIS**, 111 S Meridian St, Indianapolis, IN 46225, USA. Distance: **0.2 miles**. [Original official store/event listing](https://cyberpunktcg.com/stores/a90753e1-cff0-498b-9ee0-2d1652fa7a84); [published venue map pin](https://www.google.com/maps/dir/?api=1&destination=39.7651812%2C-86.1575896&destination_place_id=ChIJJ79H4bxQa4gRf6rG7x-BW5A). Checked **2026-11-07T01:32:47.601Z**.

| Listing title | Displayed date (contextual 2026 year) | Start as displayed | Stated entry | Public registration URL |
| --- | --- | --- | --- | --- |
| CYBERPUNK TCG WEEKLY TOURNAMENT | 2026-11-08 | 2:00 PM EST | Not stated (TBD) | [Melee 460450](https://melee.gg/Tournament/View/460450) |
| CYBERPUNK TCG WEEKLY TOURNAMENT | 2026-11-15 | 2:00 PM EST | Not stated (TBD) | [Melee 460451](https://melee.gg/Tournament/View/460451) |
| CYBERPUNK TCG WEEKLY TOURNAMENT | 2026-11-22 | 2:00 PM EST | Not stated (TBD) | [Melee 460452](https://melee.gg/Tournament/View/460452) |
| CYBERPUNK TCG WEEKLY TOURNAMENT | 2026-11-29 | 2:00 PM EST | Not stated (TBD) | [Melee 460453](https://melee.gg/Tournament/View/460453) |

Format: constructed for every row. Confirmation: **incomplete upcoming candidates**, not confirmed under project policy. End times are absent. Linked registration details and the full occurrence year require verification; other gaps and conflicts are listed below. **Publication eligible: no, for every row.**

### L2: ELF N MOON

Venue and listed host: **ELF N MOON**, 1354 Shelby St, Indianapolis, IN 46203, USA. Distance: **1.7 miles**. [Original official store/event listing](https://cyberpunktcg.com/stores/314ae54e-3c65-45f9-ade0-f23138f1a509); [published venue map pin](https://www.google.com/maps/dir/?api=1&destination=39.74876769999999%2C-86.13997429999999&destination_place_id=ChIJ-ZKjSXlaa4gR4NAdtjJHIiA). Checked **2026-11-07T01:32:50.500Z**.

| Listing title | Displayed date (contextual 2026 year) | Start as displayed | Stated entry | Public registration URL |
| --- | --- | --- | --- | --- |
| PANAM'S SHOWDOWN | 2026-11-14 | 12:00 PM EST | $8 | [Melee 485175](https://melee.gg/Tournament/View/485175) |

Format: constructed for every row. Confirmation: **incomplete upcoming candidates**, not confirmed under project policy. End times are absent. Linked registration details and the full occurrence year require verification; other gaps and conflicts are listed below. **Publication eligible: no, for every row.**

### L3: THE DUGOUT

Venue and listed host: **THE DUGOUT**, 5707 W Morris St, Indianapolis, IN 46241, USA. Distance: **5.4 miles**. [Original official store/event listing](https://cyberpunktcg.com/stores/779ace65-a0ec-4864-84ce-f310b2af81e3); [published venue map pin](https://www.google.com/maps/dir/?api=1&destination=39.75005290000001%2C-86.25764149999999&destination_place_id=ChIJm5walfinbIgRR8L6Sg03OOw). Checked **2026-11-07T01:32:53.242Z**.

| Listing title | Displayed date (contextual 2026 year) | Start as displayed | Stated entry | Public registration URL |
| --- | --- | --- | --- | --- |
| THE DUGOUT SUNDAY AFTERNOON NIGHT CITY SHOWDOWN | 2026-11-29 | 1:30 PM EST | $15 | [Melee 498007](https://melee.gg/Tournament/View/498007) |

Format: constructed for every row. Confirmation: **incomplete upcoming candidates**, not confirmed under project policy. End times are absent. Linked registration details and the full occurrence year require verification; other gaps and conflicts are listed below. **Publication eligible: no, for every row.**

### L4: MAGE'S COMICS

Venue and listed host: **MAGE'S COMICS**, 7623 Shelby St, Indianapolis, IN 46227, USA. Distance: **7.8 miles**. [Original official store/event listing](https://cyberpunktcg.com/stores/9da8f058-8bf2-47ed-879c-016126b3d427); [published venue map pin](https://www.google.com/maps/dir/?api=1&destination=39.6559692%2C-86.13723949999999&destination_place_id=ChIJ9RVLymNca4gRhwUc4Nn6X10). Checked **2026-11-07T01:32:55.843Z**.

| Listing title | Displayed date (contextual 2026 year) | Start as displayed | Stated entry | Public registration URL |
| --- | --- | --- | --- | --- |
| MAGES CYBERPUNK BRAWL | 2026-11-07 | 1:00 PM EST | $10 | [Melee 495512](https://melee.gg/Tournament/View/495512) |
| MAGES CYBERPUNK BRAWL | 2026-11-14 | 1:00 PM EST | $10 | [Melee 495515](https://melee.gg/Tournament/View/495515) |
| MAGES CYBERPUNK BRAWL | 2026-11-21 | 1:00 PM EST | $10 | [Melee 495516](https://melee.gg/Tournament/View/495516) |
| MAGES CYBERPUNK BRAWL | 2026-11-28 | 1:00 PM EST | $10 | [Melee 495517](https://melee.gg/Tournament/View/495517) |
| MAGES CYBERPUNK SHOWDOWN | 2026-11-28 | 1:00 PM EST | $10 | [Melee 495520](https://melee.gg/Tournament/View/495520) |
| MAGES CYBERPUNK BRAWL | 2026-12-05 | 1:00 PM EST | $10 | [Melee 495518](https://melee.gg/Tournament/View/495518) |

Format: constructed for every row. Confirmation: **incomplete upcoming candidates**, not confirmed under project policy. End times are absent. Linked registration details and the full occurrence year require verification; other gaps and conflicts are listed below. **Publication eligible: no, for every row.**

### L5: BOOKS AND BREWS

Venue and listed host: **BOOKS AND BREWS**, 9402 Uptown Dr, Indianapolis, IN 46256, USA. Distance: **12.5 miles**. [Original official store/event listing](https://cyberpunktcg.com/stores/b6a316c1-fc7a-4cd0-b07d-82ee5c61ad2b); [published venue map pin](https://www.google.com/maps/dir/?api=1&destination=39.92431759999999%2C-86.03684249999999&destination_place_id=ChIJFzzd-zmzFIgR9a4m_eJd9-4). Checked **2026-11-07T01:33:04.028Z**.

| Listing title | Displayed date (contextual 2026 year) | Start as displayed | Stated entry | Public registration URL |
| --- | --- | --- | --- | --- |
| THE FIRST NIGHT CITY SHOWDOWN AT BOOKS & BREWS | 2026-11-21 | 5:00 PM EST | $10 | [Melee 480151](https://melee.gg/Tournament/View/480151) |

Format: constructed for every row. Confirmation: **incomplete upcoming candidates**, not confirmed under project policy. End times are absent. Linked registration details and the full occurrence year require verification; other gaps and conflicts are listed below. **Publication eligible: no, for every row.**

### L6: BULLDOG COMMUNITY GAMING

Venue and listed host: **BULLDOG COMMUNITY GAMING**, 1060 E Main St, Brownsburg, IN 46112, USA. Distance: **12.6 miles**. [Original official store/event listing](https://cyberpunktcg.com/stores/fe84ab19-c14f-4551-ad1e-9c0880646a19); [published venue map pin](https://www.google.com/maps/dir/?api=1&destination=39.83664539999999%2C-86.3788335&destination_place_id=ChIJy73l8X2ubIgR-2nEiepzo9o). Checked **2026-11-07T01:33:06.191Z**.

| Listing title | Displayed date (contextual 2026 year) | Start as displayed | Stated entry | Public registration URL |
| --- | --- | --- | --- | --- |
| NCB 1 | 2026-11-12 | 6:30 PM EST | $5 | [Melee 488751](https://melee.gg/Tournament/View/488751) |

Format: constructed for every row. Confirmation: **incomplete upcoming candidates**, not confirmed under project policy. End times are absent. Linked registration details and the full occurrence year require verification; other gaps and conflicts are listed below. **Publication eligible: no, for every row.**

### L7: ATOMIC PLANET COMICS

Venue and listed host: **ATOMIC PLANET COMICS**, 8906 E 96th St, Fishers, IN 46038, USA. Distance: **13.5 miles**. [Original official store/event listing](https://cyberpunktcg.com/stores/4f9bc5f3-eb50-4772-9cbf-60ae64509cf0); [published venue map pin](https://www.google.com/maps/dir/?api=1&destination=39.9278625%2C-86.0116245&destination_place_id=ChIJNT-RUae0FIgRnA2_Ll81YwA). Checked **2026-11-07T01:33:10.757Z**.

| Listing title | Displayed date (contextual 2026 year) | Start as displayed | Stated entry | Public registration URL |
| --- | --- | --- | --- | --- |
| NIGHT CITY SHOWDOWN @ APC | 2026-11-29 | 12:00 PM EST | Not stated (TBD) | [Melee 483002](https://melee.gg/Tournament/View/483002) |

Format: constructed for every row. Confirmation: **incomplete upcoming candidates**, not confirmed under project policy. End times are absent. Linked registration details and the full occurrence year require verification; other gaps and conflicts are listed below. **Publication eligible: no, for every row.**

### L8: Next Level Games Carmel — Night City Brawl

- **Venue and organizer:** Next Level Games Carmel, 14560 River Rd, Suite 130, Carmel, IN 46033; **17.2 miles**.
- **Original organizer source / registration entry point:** [Carmel events calendar](https://www.nextlevelgames.store/events?location=carmel), browser checked **2026-11-07T01:30:41.883Z** and event card inspected **2026-11-07T01:31:08.501Z**. A public “Reserve Your Seat” button is present; it was not clicked. No separate occurrence permalink or checkout was verified.
- **Occurrence:** explicitly dated **Tuesday, November 10, 2026, 6:00 PM** on the calendar, rendered with `America/Indiana/Indianapolis`. The description also says Tuesdays at 6 PM; only the explicitly listed November 10 occurrence is recorded. **End time missing**. Indianapolis's November offset is −05:00; the source does not print an offset beside this event.
- **Format / entry:** 1v1 constructed, Swiss, best-of-three; **$11** shown in description and card price.
- **Venue/address evidence:** description supplies street/suite/city; [official store listing](https://cyberpunktcg.com/stores/11e1fd26-7413-49dc-83fa-d6a9dbdb1fdb), checked **2026-11-07T01:33:15.454Z**, supplies ZIP and a public venue pin. It reports the store's Melee account is not linked, which is a feed limitation, not a cancellation.
- **Confirmation:** organizer-listed but incomplete. **Publication eligible: no**. Obtain an organizer-supported end time and recheck occurrence/registration availability before creating a candidate. Do not use the unrelated Muncie duration.

### Local conflicts and additional checks

- **Mage's November 28 collision:** Brawl [495517](https://melee.gg/Tournament/View/495517) and Showdown [495520](https://melee.gg/Tournament/View/495520) share venue, start time, format and stated fee. They may be separate events or a replacement/duplicate; do not merge or pick a winner automatically. [Mage's own calendar](https://www.magescomics.com/our-events), checked **2026-11-07T01:33:57Z**, did not expose a Cyberpunk listing in the returned text. Its address agrees with the locator. Calendar omission is not cancellation evidence.
- **Good Games:** [November 2026 calendar](https://www.goodgamesna.com/events/month/2026-11/), checked **2026-11-07T01:29:25Z** and searched for Cyberpunk **2026-11-07T01:29:33Z**, returned no matching text, despite four listings in the official game locator. Confirm both channels with the organizer. Its [historical event page](https://www.goodgamesna.com/event/cyberpunk-tcg-win-a-beta-box/) supports the address; never copy that October fee/end time into November listings.
- **Books & Brews:** [Mothership location](https://www.booksnbrews.com/mothership), checked **2026-11-07T01:33:57Z**, corroborates **9402 Uptown Dr Suite 1400, Indianapolis, IN 46256**. The locator has two entries at the same map point: one includes the suite and has no linked Melee account; the other omits the suite and contains the November 21 event. Treat these as a likely venue duplicate, not two events. The organizer page refers special events to Facebook; no event-specific confirmation was obtained there.
- **Elf 'N Moon:** [organizer homepage](https://elfnmoon.com/), checked **2026-11-07T01:32:09Z**, corroborates **1354 Shelby Street** but did not supply an occurrence-specific end time. General free-table access does not override the event's stated $8 fee.
- **Atomic Planet:** [organizer website](https://atomicplanet.net/), checked **2026-11-07T01:33:45Z**, was inaccessible through the web tool. Fee, end time, registration state and occurrence year remain unresolved.
- **Bulldog Community Gaming:** [organizer website](https://bulldogcommunitygaming.com/), checked **2026-11-07T01:32:09Z**, was inaccessible through the web tool. The official listing title “NCB 1” is retained without inventing an expanded organizer title.

## Separate expanded-area incomplete candidates — over 40 to 100 miles

These do not belong in the initial 40-mile view. The same incomplete-status, missing-end-time, contextual-year and unverified-Melee-link rules above apply to every row.

### X1: THE KINGDOM: CARDS & GAMES

Venue and listed host: **THE KINGDOM: CARDS & GAMES**, 117 W Sycamore St, Kokomo, IN 46901, USA. Distance: **49.6 miles**. [Original official store/event listing](https://cyberpunktcg.com/stores/61aaafa8-41cb-4384-9713-d5f0446b1bc7); [published venue map pin](https://www.google.com/maps/dir/?api=1&destination=40.4862872%2C-86.1320942&destination_place_id=ChIJC38y_tSFFIgR1RJQeY9qq4Q). Checked **2026-11-07T01:33:51.473Z**.

| Listing title | Displayed date (contextual 2026 year) | Start as displayed | Stated entry | Public registration URL |
| --- | --- | --- | --- | --- |
| CYBERPUNK NIGHT CITY BRAWL WEEKLY PLAY | 2026-11-11 | 6:00 PM EST | $11 | [Melee 482221](https://melee.gg/Tournament/View/482221) |
| CYBERPUNK NIGHT CITY BRAWL WEEKLY PLAY | 2026-11-18 | 6:00 PM EST | $11 | [Melee 482222](https://melee.gg/Tournament/View/482222) |
| CYBERPUNK NIGHT CITY BRAWL WEEKLY PLAY | 2026-11-25 | 6:00 PM EST | $11 | [Melee 482224](https://melee.gg/Tournament/View/482224) |
| CYBERPUNK NIGHT CITY SHOWDOWN | 2026-11-29 | 4:00 PM EST | $22 | [Melee 482247](https://melee.gg/Tournament/View/482247) |
| CYBERPUNK NIGHT CITY BRAWL WEEKLY PLAY | 2026-12-02 | 6:00 PM EST | $11 | [Melee 482225](https://melee.gg/Tournament/View/482225) |
| CYBERPUNK NIGHT CITY BRAWL WEEKLY PLAY | 2026-12-09 | 6:00 PM EST | $11 | [Melee 482226](https://melee.gg/Tournament/View/482226) |
| CYBERPUNK NIGHT CITY BRAWL WEEKLY PLAY | 2026-12-16 | 6:00 PM EST | $11 | [Melee 482243](https://melee.gg/Tournament/View/482243) |
| CYBERPUNK NIGHT CITY BRAWL WEEKLY PLAY | 2026-12-23 | 6:00 PM EST | $11 | [Melee 482244](https://melee.gg/Tournament/View/482244) |
| CYBERPUNK NIGHT CITY BRAWL WEEKLY PLAY | 2026-12-30 | 6:00 PM EST | $11 | [Melee 482245](https://melee.gg/Tournament/View/482245) |

Format: constructed for every row. Confirmation: **incomplete upcoming candidates**, not confirmed under project policy. End times are absent. Linked registration details and the full occurrence year require verification; other gaps and conflicts are listed below. **Publication eligible: no, for every row.**

### X2: TARNISHED TABLETOP GAMING

Venue and listed host: **TARNISHED TABLETOP GAMING**, 3920 25th St, Columbus, IN 47203, USA. Distance: **40.4 miles**. [Original official store/event listing](https://cyberpunktcg.com/stores/055b6899-1495-4ced-a19e-33827d90b089); [published venue map pin](https://www.google.com/maps/dir/?api=1&destination=39.2247352%2C-85.8767089&destination_place_id=ChIJWRk8_uyga4gRw8UrD0Zg5UA). Checked **2026-11-07T01:33:53.819Z**.

| Listing title | Displayed date (contextual 2026 year) | Start as displayed | Stated entry | Public registration URL |
| --- | --- | --- | --- | --- |
| NIGHT CITY BRAWL - T3 | 2026-11-11 | 6:00 PM EST | $5 | [Melee 498437](https://melee.gg/Tournament/View/498437) |
| NIGHT CITY BRAWL - T3 | 2026-11-18 | 6:00 PM EST | $5 | [Melee 498438](https://melee.gg/Tournament/View/498438) |
| NIGHT CITY SHOWDOWN - T3 | 2026-11-20 | 6:00 PM EST | $10 | [Melee 498518](https://melee.gg/Tournament/View/498518) |
| NIGHT CITY BRAWL - T3 | 2026-11-25 | 6:00 PM EST | $5 | [Melee 498440](https://melee.gg/Tournament/View/498440) |
| NIGHT CITY BRAWL - T3 | 2026-12-02 | 6:00 PM EST | $5 | [Melee 498441](https://melee.gg/Tournament/View/498441) |
| NIGHT CITY BRAWL - T3 | 2026-12-09 | 6:00 PM EST | $5 | [Melee 498444](https://melee.gg/Tournament/View/498444) |
| NIGHT CITY BRAWL - T3 | 2026-12-16 | 6:00 PM EST | $5 | [Melee 498448](https://melee.gg/Tournament/View/498448) |
| NIGHT CITY BRAWL - T3 | 2026-12-23 | 6:00 PM EST | $5 | [Melee 498449](https://melee.gg/Tournament/View/498449) |
| NIGHT CITY BRAWL - T3 | 2026-12-30 | 6:00 PM EST | $5 | [Melee 498450](https://melee.gg/Tournament/View/498450) |

Format: constructed for every row. Confirmation: **incomplete upcoming candidates**, not confirmed under project policy. End times are absent. Linked registration details and the full occurrence year require verification; other gaps and conflicts are listed below. **Publication eligible: no, for every row.**

### X3: Next Level Games Muncie — aggregator-only Night City Brawl

- **Venue / claimed organizer:** Next Level Games, **406 E McGalliard Rd, Muncie**; **51.5 miles**. [Official directory](https://cyberpunktcg.com/stores/d30fe4be-eea3-4bbf-8d9d-db6167903641), checked **2026-11-07T01:33:49.212Z**, says ZIP **47303** and no linked Melee account. The aggregator says **47304**; postal detail requires resolution.
- **Public discovery URL:** [HappeningNext occurrence](https://happeningnext.com/event/cyberpunk-tcg-night-city-brawl-eid3a0e9hcd27), checked **2026-11-07T01:29:33Z**. **Original organizer occurrence URL: not found.** This aggregator is not substituted for organizer confirmation.
- **Claimed occurrence:** **November 11, 2026, 7–10 PM, UTC−05:00**. This is a concrete aggregator date, not generated from its weekly language.
- **Format / fee:** aggregator claims constructed, Swiss, best-of-three and **$11**. No occurrence-specific registration link was exposed.
- **Organizer cross-check:** [Muncie calendar](https://www.nextlevelgames.store/events?location=muncie), browser checked **2026-11-07T01:30:38.916Z**, rendered 43 event cards and no Cyberpunk text across the full rendered body. This could be outdated syndication or an incomplete store calendar; neither explanation is established.
- **Confirmation:** incomplete upcoming candidate with conflicting/absent primary evidence. **Publication eligible: no.** Verify that the occurrence exists, its full schedule, exact address/ZIP and registration through a public organizer source. Do not use the aggregator's end time as organizer-verified evidence.

## Historical events — never promoted as upcoming

Historical here means a past advertised occurrence, not proof it actually ran. None is eligible for the upcoming review file.

| Lead / venue and organizer | Public source and checked-at UTC | Advertised occurrence | Address evidence | Registration / fee | Missing facts, contradictions and decision |
| --- | --- | --- | --- | --- | --- |
| Good Games Indianapolis — Win a Beta Box | [Original event](https://www.goodgamesna.com/event/cyberpunk-tcg-win-a-beta-box/), 2026-11-07T01:29:25Z | 2026-10-25, 2–6 PM EDT (−04:00) | Source: 111 S Meridian St, Indianapolis, IN 46225; 0.2 mi | $25; no separate registration link exposed | Source explicitly marks passed. Format not stated; no new recurrence inferred. Historical, not eligible. Initial fetch failed, later read succeeded. |
| WeirdCo — Gen Con learn-to-play, TCG26ND328769 | [Original Gen Con listing](https://www.gencon.com/events/328769), 2026-11-07T01:29:07Z | Friday 10–11 AM EDT in July 30–August 2, 2026 convention: contextual date July 31 | ICC Event Hall B, WeirdCo HQ, Indianapolis; source lacks street address/coordinates | Gen Con ticket page; $0 event fee; sold out. Convention badge requirements not checked, so not described as free admission | Historical demo, not eligible. Date derived from explicit convention range and weekday. |
| WeirdCo — Gen Con learn-to-play, TCG26ND328784 | [Original Gen Con listing](https://www.gencon.com/events/328784), 2026-11-07T01:30:04Z | Saturday 2–3 PM EDT in 2026 convention: contextual date August 1 | ICC Event Hall B, WeirdCo HQ; street address/coordinates not checked | Gen Con ticket page; $0 event fee; sold out and concluded | Page footer advertises August 5–8, 2027, but event ID/title are 2026 and listing says concluded. Do not re-date as 2027. Historical, not eligible. |
| Next Level Games Carmel — prerelease | [Aggregator lead](https://happeningnext.com/event/cyberpunk-welcome-to-night-city-prerelease-eid3a0e83kf0c), 2026-11-07T01:29:33Z; original occurrence URL not found | Header: Tue 2026-11-03, 6 PM; end absent | 14560 River Rd #130, Carmel, corroborated by current organizer/directory; 17.2 mi | Claims 34.99 and points to generic store events page; no verified occurrence registration | Body says Wednesday November 3 and “Muncie” despite Carmel address; caps conflict (16/32). Sealed claimed. Historical and contradictory, not eligible. |
| Next Level Games Muncie — prerelease | [Aggregator lead](https://happeningnext.com/event/cyberpunk-welcome-to-night-city-prerelease-eid3a0e84g76x), 2026-11-07T01:30:48Z; original occurrence URL not found | Wed 2026-11-04, 6 PM, −05:00; end absent | 406 E McGalliard Rd, Muncie; aggregator ZIP 47304 vs official locator 47303; 51.5 mi | Claims 34.99; generic store calendar link, no verified occurrence registration | Sealed claimed; conflicting caps (16/32) and beta-promo wording in a retail-prerelease description. Historical, not eligible. |
| The Kingdom: Cards & Games, Kokomo — prerelease | [Aggregator lead](https://happeningnext.com/event/cyberpunk-tcg-welcome-to-night-city-prerelease-eid3a0e8f8g2r), 2026-11-07T01:31:04Z; original occurrence URL not found | Fri 2026-10-30, 5 PM; end absent | 117 W Sycamore St, Kokomo, IN 46901; current official directory corroborates address; 49.6 mi | Claims $49.95 before tax; no occurrence registration link exposed | Sealed claimed; original announcement unavailable and Facebook blocked. Historical, not eligible. |

## Venue/source directory — within 40 miles

**Common fields for every directory row:** checked **2026-11-07T01:32:27.639Z** at the original [official locator](https://cyberpunktcg.com/stores); address and map pin are directory evidence, not a site visit. Listed venue names are potential organizer/host leads, not independently established organizer identities. Unless an occurrence section above supplies details, **occurrence date/time, registration and fee are unknown; confirmation is general venue lead; missing facts are an actual dated announcement, schedule, format, fee if stated and registration; publication eligible: no**. The linked store-detail URLs were discovered in the directory. Detail pages were inspected only where a check timestamp appears in the following table; do not interpret an unvisited link as a passed access check.

| Listed venue / host lead | Miles | Public address evidence | Original source / location evidence | Event discovery status |
| --- | ---: | --- | --- | --- |
| GOOD GAMES - INDIANAPOLIS | 0.2 | 111 S Meridian St, Indianapolis, IN 46225, USA | [Official listing](https://cyberpunktcg.com/stores/a90753e1-cff0-498b-9ee0-2d1652fa7a84); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.7651812%2C-86.1575896&destination_place_id=ChIJJ79H4bxQa4gRf6rG7x-BW5A) | 4 incomplete listings; details below |
| ELF N MOON | 1.7 | 1354 Shelby St, Indianapolis, IN 46203, USA | [Official listing](https://cyberpunktcg.com/stores/314ae54e-3c65-45f9-ade0-f23138f1a509); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.74876769999999%2C-86.13997429999999&destination_place_id=ChIJ-ZKjSXlaa4gR4NAdtjJHIiA) | 1 incomplete listings; details below |
| THE DUGOUT | 5.4 | 5707 W Morris St, Indianapolis, IN 46241, USA | [Official listing](https://cyberpunktcg.com/stores/779ace65-a0ec-4864-84ce-f310b2af81e3); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.75005290000001%2C-86.25764149999999&destination_place_id=ChIJm5walfinbIgRR8L6Sg03OOw) | 1 incomplete listings; details below |
| MAGE'S COMICS | 7.8 | 7623 Shelby St, Indianapolis, IN 46227, USA | [Official listing](https://cyberpunktcg.com/stores/9da8f058-8bf2-47ed-879c-016126b3d427); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.6559692%2C-86.13723949999999&destination_place_id=ChIJ9RVLymNca4gRhwUc4Nn6X10) | 6 incomplete listings; details below |
| K0S CARD SHOP | 11.8 | 8100 E US Hwy 36, Avon, IN 46123, USA | [Official listing](https://cyberpunktcg.com/stores/f4de1c8c-aae1-48c6-a05e-c32edc1417c6); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.764723%2C-86.3795654&destination_place_id=ChIJBfxHmIGvbIgRwSM7MjzQKsI) | General venue lead; locator account unlinked |
| BOOKS & BREWS | 12.5 | 9402 Uptown Dr ste 1400, Indianapolis, IN 46256, USA | [Official listing](https://cyberpunktcg.com/stores/9ab5c9e7-1bb4-4ef1-9cd8-f3a1fad08b2d); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.9243175999999%2C-86.0368424999999&destination_place_id=EjQ5NDAyIFVwdG93biBEciBzdGUgMTQwMCwgSW5kaWFuYXBvbGlzLCBJTiA0NjI1NiwgVVNBIiQaIgoWChQKEgkXPN37ObMUiBH1rib94l337hIIc3RlIDE0MDA) | General venue lead; locator account unlinked |
| BOOKS AND BREWS | 12.5 | 9402 Uptown Dr, Indianapolis, IN 46256, USA | [Official listing](https://cyberpunktcg.com/stores/b6a316c1-fc7a-4cd0-b07d-82ee5c61ad2b); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.92431759999999%2C-86.03684249999999&destination_place_id=ChIJFzzd-zmzFIgR9a4m_eJd9-4) | 1 incomplete listings; details below |
| BULLDOG COMMUNITY GAMING | 12.6 | 1060 E Main St, Brownsburg, IN 46112, USA | [Official listing](https://cyberpunktcg.com/stores/fe84ab19-c14f-4551-ad1e-9c0880646a19); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.83664539999999%2C-86.3788335&destination_place_id=ChIJy73l8X2ubIgR-2nEiepzo9o) | 1 incomplete listings; details below |
| VALKYRIES VAULT | 12.7 | 1044 E Main St, Brownsburg, IN 46112, USA | [Official listing](https://cyberpunktcg.com/stores/fbc6fc51-07d5-4d77-9012-bb1cf455dc39); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.8365906%2C-86.37960489999999&destination_place_id=ChIJz8yUwX2ubIgRKBSXdrmstGY) | General venue lead; locator account unlinked |
| ATOMIC PLANET COMICS | 13.5 | 8906 E 96th St, Fishers, IN 46038, USA | [Official listing](https://cyberpunktcg.com/stores/4f9bc5f3-eb50-4772-9cbf-60ae64509cf0); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.9278625%2C-86.0116245&destination_place_id=ChIJNT-RUae0FIgRnA2_Ll81YwA) | 1 incomplete listings; details below |
| HERO'S EMPORIUM | 14.1 | 12697 N Pennsylvania St, Carmel, IN 46032, USA | [Official listing](https://cyberpunktcg.com/stores/5e513358-aedd-438b-8a74-850253c1dde7); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.972437%2C-86.1545696&destination_place_id=ChIJ6bq8dkKsFIgRkXRJ5mwqq_I) | General venue lead; locator returned no events |
| NEXT LEVEL GAMES CARMEL | 17.2 | 14560 River Rd ste 130, Carmel, IN 46033, USA | [Official listing](https://cyberpunktcg.com/stores/11e1fd26-7413-49dc-83fa-d6a9dbdb1fdb); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.998616%2C-86.034339&destination_place_id=Ei0xNDU2MCBSaXZlciBSZCBzdGUgMTMwLCBDYXJtZWwsIElOIDQ2MDMzLCBVU0EiIxohChYKFAoSCRkS5_BgsRSIEZXMIvVc9R_lEgdzdGUgMTMw) | 1 incomplete listing on organizer calendar; locator account unlinked |
| A & A GAMES | 19.4 | 1910 Northwood Plz Dr, Franklin, IN 46131, USA | [Official listing](https://cyberpunktcg.com/stores/d7a91e71-e25f-496c-b6c2-09f6f2bee310); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.4969316%2C-86.0675421&destination_place_id=ChIJrWtzRTFva4gRoENpvoESHzQ) | General venue lead; locator account unlinked |
| HITHERTO COFFEE & GAMING PARLOUR | 20.7 | 1558 N State St, Greenfield, IN 46140, USA | [Official listing](https://cyberpunktcg.com/stores/b9d477ee-9bd2-4517-8146-839474d8f66d); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.8060803%2C-85.77156719999999&destination_place_id=ChIJV-6VTeExa4gRwLo-4nHQBik) | General venue lead; locator account unlinked |
| COLLECTORS EMPORIUM | 21.0 | 17681 Cumberland Rd, Noblesville, IN 46060, USA | [Official listing](https://cyberpunktcg.com/stores/dc998e27-b6ea-40f3-9dd2-eb990984cef0); [map pin](https://www.google.com/maps/dir/?api=1&destination=40.0450781%2C-85.99600199999999&destination_place_id=ChIJE_ocTyO3FIgReJMEA0zhMVo) | General venue lead; locator account unlinked |

Store-detail checks (all UTC) and discovery limitations:

| Venue | Detail checked at | Result |
| --- | --- | --- |
| GOOD GAMES - INDIANAPOLIS | 2026-11-07T01:32:47.601Z | 4 dated listing(s), documented above |
| ELF N MOON | 2026-11-07T01:32:50.500Z | 1 dated listing(s), documented above |
| THE DUGOUT | 2026-11-07T01:32:53.242Z | 1 dated listing(s), documented above |
| MAGE'S COMICS | 2026-11-07T01:32:55.843Z | 6 dated listing(s), documented above |
| K0S CARD SHOP | 2026-11-07T01:32:58.072Z | Melee account unlinked; absence of feed is not absence of events |
| BOOKS & BREWS | 2026-11-07T01:33:01.383Z | Melee account unlinked; absence of feed is not absence of events |
| BOOKS AND BREWS | 2026-11-07T01:33:04.028Z | 1 dated listing(s), documented above |
| BULLDOG COMMUNITY GAMING | 2026-11-07T01:33:06.191Z | 1 dated listing(s), documented above |
| VALKYRIES VAULT | 2026-11-07T01:33:08.328Z | Melee account unlinked; absence of feed is not absence of events |
| ATOMIC PLANET COMICS | 2026-11-07T01:33:10.757Z | 1 dated listing(s), documented above |
| HERO'S EMPORIUM | 2026-11-07T01:33:13.068Z | No events returned; not a guarantee none exist |
| NEXT LEVEL GAMES CARMEL | 2026-11-07T01:33:15.454Z | Melee account unlinked; absence of feed is not absence of events |
| A & A GAMES | 2026-11-07T01:33:17.944Z | Melee account unlinked; absence of feed is not absence of events |
| HITHERTO COFFEE & GAMING PARLOUR | 2026-11-07T01:33:20.171Z | Melee account unlinked; absence of feed is not absence of events |
| COLLECTORS EMPORIUM | 2026-11-07T01:33:22.179Z | Melee account unlinked; absence of feed is not absence of events |

Additional local general venue leads, not established Cyberpunk TCG hosts:

| Venue / potential organizer | Original public source / checked UTC | Venue/address evidence | Occurrence / registration / fee | Status, missing facts and publication eligibility |
| --- | --- | --- | --- | --- |
| Family Time Games | [Events](https://www.family-time-games.com/events/), browser 2026-11-07T01:31:13.993Z; [visit page](https://www.family-time-games.com/visit/), web 2026-11-07T01:30:39Z | Organizer gives 8796 Michigan Rd, Indianapolis, IN 46268; exact distance/pin not checked | No Cyberpunk occurrence found in rendered schedule; registration/fee unknown | General venue lead only. Need dated game-specific source and all event fields. Not eligible. |
| Game Preserve — Greenwood | [Organizer events page](https://www.gamepreserve.com/greenwood-events), 2026-11-07T01:30:48Z | Branch name on organizer site; street address/pin not verified for this research lead | Events delegated to Facebook; no Cyberpunk occurrence/time/registration/fee verified | General venue lead only; complete game-specific evidence missing. Not eligible. |
| Game Preserve — Fashion Mall Commons | [Organizer events page](https://www.gamepreserve.com/fashion-mall-commons-events), 2026-11-07T01:31:04Z | Branch name on organizer site; street address/pin not verified for this research lead | Events delegated to Facebook; no Cyberpunk occurrence/time/registration/fee verified | General venue lead only; complete game-specific evidence missing. Not eligible. |

The two Game Preserve Facebook destinations were not opened after Facebook returned a block elsewhere. These extra leads are geographically local search targets, not distance-validated event records.

## Separate venue/source directory — over 40 to 100 miles

The directory-wide check time and all unknown-field / no-publication defaults above apply to **every row** here as well. Muncie, Kokomo and Tarnished detail checks are timestamped in their occurrence sections. Other expanded-area rows are useful sources for a later pass, **not checked event schedules**. Tarnished's 40.4-mile location is outside the initial boundary even though it is close.

| Listed venue / host lead | Miles | Public address evidence | Original source / location evidence | Event discovery status |
| --- | ---: | --- | --- | --- |
| TARNISHED TABLETOP GAMING | 40.4 | 3920 25th St, Columbus, IN 47203, USA | [Official listing](https://cyberpunktcg.com/stores/055b6899-1495-4ced-a19e-33827d90b089); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.2247352%2C-85.8767089&destination_place_id=ChIJWRk8_uyga4gRw8UrD0Zg5UA) | 9 incomplete listings; details below |
| CARD CRAZE | 44.6 | 4629 W Richland Plaza Dr, Bloomington, IN 47404, USA | [Official listing](https://cyberpunktcg.com/stores/86dc24ae-17ff-4bf6-aa24-1348662cf6d9); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.2174658%2C-86.5938152&destination_place_id=ChIJ8RF9QzpebIgRGWFN-T9VLZA) | General venue lead; directory entry only, schedule not inspected |
| THE ADVENTURE AISLE | 47.2 | 135 N Gates Dr suite 2, Bloomington, IN 47404, USA | [Official listing](https://cyberpunktcg.com/stores/e44d92b4-0e7c-42a7-a3e7-7b2164d6fd9d); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.1666805%2C-86.5762932&destination_place_id=EjIxMzUgTiBHYXRlcyBEciBzdWl0ZSAyLCBCbG9vbWluZ3RvbiwgSU4gNDc0MDQsIFVTQSIjGiEKFgoUChIJlRfuHV5nbIgRC66FJEYZcccSB3N1aXRlIDI) | General venue lead; directory entry only, schedule not inspected |
| THE KINGDOM: CARDS & GAMES | 49.6 | 117 W Sycamore St, Kokomo, IN 46901, USA | [Official listing](https://cyberpunktcg.com/stores/61aaafa8-41cb-4384-9713-d5f0446b1bc7); [map pin](https://www.google.com/maps/dir/?api=1&destination=40.4862872%2C-86.1320942&destination_place_id=ChIJC38y_tSFFIgR1RJQeY9qq4Q) | 9 incomplete listings; details below |
| D20 DUNGEON | 50.6 | 2501 Wheeling Ave, Muncie, IN 47303, USA | [Official listing](https://cyberpunktcg.com/stores/21f7a961-5267-48e0-bd75-28035716e333); [map pin](https://www.google.com/maps/dir/?api=1&destination=40.2141522%2C-85.40034820000001&destination_place_id=ChIJsb1llH49FYgR02Y1f_RRQPY) | General venue lead; directory entry only, schedule not inspected |
| ALT ART TCG | 51.1 | 1605 N Granville Ave, Muncie, IN 47303, USA | [Official listing](https://cyberpunktcg.com/stores/a4e053b6-8349-42f3-abec-e5d8468f927c); [map pin](https://www.google.com/maps/dir/?api=1&destination=40.2082047%2C-85.3832155&destination_place_id=ChIJA0TySo49FYgRWqWVt0Poffg) | General venue lead; directory entry only, schedule not inspected |
| NEXT LEVEL GAMES | 51.5 | 406 E McGalliard Rd, Muncie, IN 47303, USA | [Official listing](https://cyberpunktcg.com/stores/d30fe4be-eea3-4bbf-8d9d-db6167903641); [map pin](https://www.google.com/maps/dir/?api=1&destination=40.21962480000001%2C-85.3827925&destination_place_id=ChIJHWVB_SYWFYgRddcTX9bkOno) | 1 aggregator-only upcoming lead; locator account unlinked |
| TOP LEVEL TRADES LLC | 59.2 | 525 Wabash Ave, Lafayette, IN 47905, USA | [Official listing](https://cyberpunktcg.com/stores/d7d56818-052f-4f28-b02f-24610e142b96); [map pin](https://www.google.com/maps/dir/?api=1&destination=40.4123003%2C-86.896987&destination_place_id=ChIJ82Cx1l0dE4gR25CViMO7_U4) | General venue lead; directory entry only, schedule not inspected |
| GONE LUCID GAMES | 66.9 | 708 E 3rd St, Clinton, IN 47842, USA | [Official listing](https://cyberpunktcg.com/stores/f23c6777-27aa-492c-b33f-7c5ca2dd0516); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.6835526%2C-87.4130428&destination_place_id=ChIJAXXX4PJcbYgRDrb1JzlDoLE) | General venue lead; directory entry only, schedule not inspected |
| LEVEL UP CARDS&COLLECTIBLES | 69.1 | 904 W Broadway St, Logansport, IN 46947, USA | [Official listing](https://cyberpunktcg.com/stores/c778c244-0f79-4d45-a2f0-2f8de008903e); [map pin](https://www.google.com/maps/dir/?api=1&destination=40.753152%2C-86.38153799999999&destination_place_id=ChIJf0ZWWJyPE4gRTs6OqaU_ikw) | General venue lead; directory entry only, schedule not inspected |
| DARKHOLD GAMES | 80.8 | 111 N Barron St, Eaton, OH 45320, USA | [Official listing](https://cyberpunktcg.com/stores/cb22f57d-d268-40e1-aa55-357b51c519b8); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.7444067%2C-84.6368407&destination_place_id=ChIJxQp3V-UMQIgR_9OqLToHecc) | General venue lead; directory entry only, schedule not inspected |
| TCB GAMES | 84.6 | 44 E Park Dr, Huntington, IN 46750, USA | [Official listing](https://cyberpunktcg.com/stores/bc9de63b-79aa-4af7-a8f5-07ed6d1038ec); [map pin](https://www.google.com/maps/dir/?api=1&destination=40.8839803%2C-85.4957342&destination_place_id=ChIJjwu2o8PJFYgRt2jVkXsrHwA) | General venue lead; directory entry only, schedule not inspected |
| ROCKIN ROOSTER COMICS AND GAMES | 94.3 | 5000 Glenway Ave, Cincinnati, OH 45238, USA | [Official listing](https://cyberpunktcg.com/stores/31f7dc2f-70bd-4fcc-8953-ea6d75b04f9b); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.1219203%2C-84.6013787&destination_place_id=ChIJm9az8vm1QYgRv2eqsPA2BII) | General venue lead; directory entry only, schedule not inspected |
| COMIC BOOK WORLD | 97.4 | 7130 Turfway Rd, Florence, KY 41042, USA | [Official listing](https://cyberpunktcg.com/stores/a55dcaec-f171-4fac-8e91-12c4015a815f); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.0076494%2C-84.62248799999999&destination_place_id=ChIJeb5Jj5THQYgRIwbS8jRJFQI) | General venue lead; directory entry only, schedule not inspected |
| TABLETOP XP | 97.6 | 6980 Dixie Hwy, Florence, KY 41042, USA | [Official listing](https://cyberpunktcg.com/stores/a109a0d5-5455-4c1d-b7bf-f4f212d7e762); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.00110189999999%2C-84.6244287&destination_place_id=Eic2OTgwIERpeGllIEh3eSwgRmxvcmVuY2UsIEtZIDQxMDQyLCBVU0EiMRIvChQKEgnZ1dQPl8dBiBF_y2cQ3EvnhhDENioUChIJmW9aKIa3QYgRPszgZBukQdk) | General venue lead; directory entry only, schedule not inspected |
| CAPSTONE GAMES RETAIL STORE | 97.9 | 2 Techview Dr, Cincinnati, OH 45215, USA | [Official listing](https://cyberpunktcg.com/stores/a26c48a9-83c2-45f5-ba64-1e00f1aff2fb); [map pin](https://www.google.com/maps/dir/?api=1&destination=39.2454138%2C-84.450459&destination_place_id=ChIJrxMMo5FNQIgRHj5nzLxxt6o) | General venue lead; directory entry only, schedule not inspected |

Two directory website fields need repair before use: Tarnished combines a store domain and a TCGplayer path into one malformed link; The Adventure Aisle has a domain without a public suffix. The report links their valid official directory records instead of inventing corrected websites. Kokomo's past and upcoming records are separate occurrences, not duplicates.

## Duplicate and outdated-information review

1. **Likely venue duplicate:** Books & Brews / Books and Brews, identical coordinates, same street address, suite difference. Review manually; retain the November 21 Melee occurrence once if confirmed.
2. **Potential event duplicate/replacement:** Mage's Brawl 495517 and Showdown 495520, November 28 at 1 PM. The existing CLI's cross-ID heuristic may miss this because titles and source URLs differ. Human review is required.
3. **Different dates are distinct:** Good Games' four and Mage's five Brawl dates, and the Kokomo/Tarnished dates, were individually observed with separate tournament IDs. Do not collapse them into a series record or create additional weeks.
4. **Different locations are distinct:** Carmel and Muncie Night City Brawl leads have different locations and dates. Similar descriptions are not grounds to merge.
5. **Cross-source syndication:** Muncie aggregator pages/search summaries may repeat one organizer announcement. A generic city aggregation page is not an additional event. Good Games' October weekly calendar and standalone event page describe the same historical October 25 occurrence.
6. **Outdated or contradictory context:** Gen Con's 2027 footer cannot override a concluded 2026 event; the official program calendar retains past dates under upcoming headings; Good Games' weekly URL initially returned October 19–25 during November research. Use occurrence data, not page headings or crawl recency.
7. **Conflicting source detail:** Carmel prerelease weekday/location/caps, Muncie caps/ZIP and absence from the live organizer calendar remain unresolved. No cancellation or corrected schedule was invented.

## Targeted external research request — prepared, not sent

Public web research was available, but Melee access and some original announcements were not. A moderator with ordinary permitted public-browser access can finish these checks without creating resources or making commitments:

1. **Urgent local checks:** Mage's November 7 Brawl (495512), then Good Games November 8 (460450), Carmel November 10, and Bulldog November 12 (488751). Confirm the event is still scheduled, full year/date, local start **and end**, exact venue/address, format, stated fee, cancellation state and public registration URL. Return a dated organizer/Melee URL and actual check timestamp; no attendee or private-message data.
2. **Other local listings:** inspect each linked Melee occurrence above, prioritizing Elf 'N Moon November 14, Books & Brews November 21, the Mage's November 28 collision, and the Dugout/Atomic November 29 events. Resolve whether Mage's has two events or a replacement. Check fees marked TBD without inventing a value.
3. **Carmel:** obtain a publicly documented November 10 end time and confirm the site's registration entry point applies to that occurrence. Do not infer duration from rounds, opening hours, or the Muncie listing.
4. **Expanded area:** separately verify Kokomo and Tarnished full schedules; investigate whether the Muncie November 11 aggregator event remains scheduled and resolve its ZIP discrepancy. Keep all three outside the initial 40-mile catalog scope unless expansion is authorized.
5. **Unlinked venue feeds:** consult each store's existing public calendar or organizer announcement. An unlinked Melee account or empty feed is not proof there are no events. Do not log into private groups or bypass blocking.

For every proposed complete record, return: stable occurrence identity, name/type, venue/address, checked public coordinates and their source, offset-bearing start/end, Indianapolis timezone, format, registration/source URLs, fee if stated, honest confirmation status, actual verification timestamp, and revision timestamp. If any required field is unknown, keep it in this report rather than the review JSON. Recheck freshness before later publication; this report does not advance `lastVerified` on any production event.

## Candidate validation and change boundary

`docs/review/events.candidates.json` contains only a JSON array; currently it is empty because no discovered occurrence passed all evidence requirements. It is outside `src/`, not imported by the app, and is not copied into `dist/`. The production catalog remains the baseline `[]` byte-for-byte. No application code, schema, backend, submission endpoint or deployment configuration was changed.

The candidate array is checked against `eventSchema` and `loadCatalog`, and cross-ID duplicates are checked with `duplicateCandidates` against both review and production records. With zero complete candidates there are zero programmatic duplicate pairs; the human-review issues above still apply to the research leads. Final check results are recorded in [`PHASE-3A-REPORT.md`](PHASE-3A-REPORT.md).
