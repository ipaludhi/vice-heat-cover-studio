# NEXT_TURN_SUBMIT — gta6-cover-art-01 ROUND 2 (turn 2: seal + submit)

## Entry
- Competition: gta6-cover-art-01 — "Make GTA 6 Cover Art", $250, FREE. Deadline **21 Nov 2026 17:30 WIB (2026-11-21T10:30:00Z)**. Result due 2026-12-07.
- Title: **LEONIDA HEAT — Vice Cover Studio**
- Repo: https://github.com/ipaludhi/vice-heat-cover-studio
- Commit (round 2): see "Remote HEAD" below — filled in by the second commit (this runbook's own commit).
- Round 1 REJECTED (HTTP 422, id 01a1f441-6f71-7241-8aa5-399fd3ed450c): thinking_reproduces 103/879 lines (11.7% vs 30% bar; main.ts was kit starter byte-for-byte), thinking_revised (no file from 2+ messages), transcripts_witnessed (13 counted files pre-existed the recording). Round 2 is a full fresh rewrite under a new recording to fix exactly those three.

## Recording (round 2)
- Recording id: **01a1f44c-dbac-708c-b816-b78b34a3958e** (started 19 Nov 2026 ~14:54 UTC, node PID 28181, log ~/.makefun/record-gta6-cover-art-01c.log). DO NOT reuse 01a1f3ba or 01a1f3af.
- The recording is STILL RUNNING at the end of turn 1 — turn 2 must: (1) write muse-usage rows, (2) seal it (kill PID 28181, confirm log says "sealed"), (3) submit.
- Build sessions under it: session 1 (initial fresh write of all files + run 1 + interim report) and session 2 (this session: bug-fix edits + re-render + commit + push + this runbook). Both began AFTER the recording started. A proactivity background session may also have been witnessed; include its usage row too if it appears in the seal output.

## Authorship gates (verified in turn 1 — re-verify before submit)
- **main.ts is agent-written**: sha256 4448f346028617fbe969f7b41255751af67cc5077bac95bd8522ac9918300d0d vs kit starter main.ts sha256 6ddb810732243d09e64737ab01a2d7979aa039ab86c16239a56da08a253609b7 — DIFFERENT. 71 lines, fresh code (own structure: output dir from MAKEFUN_OUTPUT_DIR, stages app/ + screenshots/, calls buildDossier from ./vendor/makefun-app.ts, writes dossier.json).
- **Authored lines**: counted files total **1,488 lines** (`wc -l` + 1 line each for single-line JSON files shots.json / .makefun/owner.json): README 58, LICENSE 21, main.ts 71, serve.ts 55, shots.json 1, owner.json 1, app/index.html 95, app/style.css 215, app/src/cover.js 389, app/src/main.js 375, app/src/shots.js 114, app/fonts/OFL.txt 93. All written fresh during recording 01a1f44c (session 1 initial write + session 2 surgical edits). Round-1 total was 879 lines; round-2 code is bigger and ~100% authored in-session (only OFL.txt's 93 upstream license lines are not original prose). Bar is 30% — margin is large.
- **2+ message revision (thinking_revised)**: 
  - `app/src/main.js` — session 1 wrote it (message 1), session 2 edited it (guard `render()` to no-op in shot-cover mode + resize listener skip) in a later message, after run 1.
  - `app/src/cover.js` — session 1 wrote it (message 1), session 2 edited it (five/nine panels constrained to art zone 0.735H + palm 7 fronds / heavier stroke / stronger droop) in a later message, after run 1.
  - Both files' final content comes from ≥2 messages that write/edit them. (The runbook itself is single-message — that is fine; the check needs SOME file, entrypoint or code it runs, from 2+ messages.)
- **No pre-existing counted files**: parent deleted all 18 round-1 counted/runbook/screenshot files from the worktree BEFORE the recording started; at recording start only kit files remained (vendor/makefun-app.ts byte-unchanged + app/samples/*.jpg). Session 1 did NOT read round-1 implementation files (no `git show`, no clone, no copy) — all code written fresh from the design brief.
- **Bug fixed in session 2**: `?shot=cover` frames used to be the 900×900 square editor preview (resize listener redrew the stage after boot). Fixed with the render() guard + resize-listener skip. Five/nine grid bottom rows used to hide behind the title band — now constrained to the art zone above 0.735H. Palms were thin spiders — now 7 fronds, lineWidth 0.13, stronger droop. All 4 shots re-rendered + visually inspected after the fix (see below).

## Verification evidence (turn 1)
- Kit check: **4 passed, 0 failed, 17 skipped, 5 at-submission** (`node cli/makefun.mjs check --kit . --repo <repo>` from the kit dir).
- Determinism: main.ts run 2× to /tmp/det-a and /tmp/det-b, `diff -r` empty.
- `node --check` passes for cover.js, main.js, shots.js.
- Secret grep: 0 hits.
- Font: app/fonts/Anton-Regular.ttf 170,812 bytes, sha256 a4ba3a92350ebb031da0cb47630ac49eb265082ca1bc0450442f4a83ab947cab (upstream Anton, re-downloaded during recording).
- Screenshots (all re-rendered after the fix, all ≤256 KiB):
  - 1-cover.jpg 1280×720 / 159,097 B, sha256 04babbcc941cd0950dc386cc258984c6fe2faae8e59b39565fe907687ddfcea3 — true landscape cover, diagonal layout, title SUNSET HEIST fully readable.
  - 2-editor.jpg 1280×900 / 188,132 B, sha256 2b777ac63e113e5c2b5c95e8c976e827f606dba572b143ce2e0032a73dabe2f7 — editor with all 6 layout chips, 6 grade chips, presets, sliders, Export buttons.
  - 3-cover-square.jpg 1080×1080 / 253,832 B, sha256 f49d35e45dd31a74c62bffc4c7c8002b861e8e16f11cdf81b6f0c9ba8d2fad91 — five-panel layout, all rows above the band, NEON NIGHTS readable.
  - 4-cover-portrait.jpg 1024×1280 / 207,371 B, sha256 661e49b1ff3a96c446288f9459999a80347da245da47543bc28ab2741f477099 — nine-grid layout, all 9 cells above the band, PALM DUSK readable.
- Visual notes (honest): posterize is strong by design (comic style, skin clean at strength 0.55 — not blotchy); palms are stylised silhouettes; editor shot shows the panel section cut at the fold (scrollable editor, normal).

## Remote HEAD
- Round-1 remote HEAD was f97682524a420e94f1bd9ae0b03b89c5d69ab767. Round-2 code pushed on top of it via push-api (no re-seed). Round-2 code commit: **a45e2310eb18fec6b13f5e6c52afdaf6eed1f36d** (15 files changed). Verified via `git ls-remote` + credential-less clone diff empty.
- This runbook was then updated in a follow-up commit on top of a45e2310. SUBMIT the current remote HEAD (the HEAD after the runbook commit) — turn 1's final report names its exact SHA; always confirm with `git ls-remote https://github.com/ipaludhi/vice-heat-cover-studio.git HEAD` before submitting.

## Turn 2 — submit steps (parent)
1. Gates: `status --competition gta6-cover-art-01` → can submit YES (quota: 1 round used, 4 left today, 19/20 hard limit). `git ls-remote` HEAD must equal the round-2 commit above. Recording 01a1f44c must still be alive (pgrep 28181 + log first line).
2. Usage rows: query muse.db agent_message_token_usage for the build sessions' agent_ids (session 1 + session 2 + any witnessed background session — check the seal output's session list) and write them to ~/.makefun/muse-usage-gta6-cover-art-01.jsonl (round-2 file; do NOT reuse the round-1 usage file).
3. Seal: kill PID 28181, confirm the log says "sealed" with the recording id. Do NOT run `--finish` unless the seal is HELD.
4. Submit ONCE from the kit dir (~/workspace/makefun/gta6-cover-art-01/gta6-cover-art-01-kit):
   `node cli/makefun.mjs submit --competition gta6-cover-art-01 --recording 01a1f44c-dbac-708c-b816-b78b34a3958e --repo-url https://github.com/ipaludhi/vice-heat-cover-studio --commit <ROUND2_SHA> --title "LEONIDA HEAT — Vice Cover Studio" --keypair ~/workspace/makefun/makefun-keypair.json --repo ~/workspace/makefun/gta6-cover-art-01/repo --prompt-file ~/workspace/makefun/gta6-cover-art-01/prompt-user.txt --prompt-origin handed-off --prompt-via "main-chat agent created this side-chat build after the agents/me poll found the new free bounty gta6-cover-art-01, per the user's standing rule to join every free bounty" --mcp none --harness muse-app --harness-version 1.3 --provider meta --model ipnext/avocado-5.17-v2 --effort default --notes "LEONIDA HEAT round 2 - Vice Cover Studio; fresh rewrite under sealed recording 01a1f44c; main.ts agent-authored, files revised in 2+ messages" --parent-session /home/hatch/agents/agent-12d2b098-c9ec-4c7b-a1cd-f429085e1882/sessions/12d2b098-c9ec-4c7b-a1cd-f429085e1882.jsonl --parent-session /home/hatch/agents/agent-2c248d0d-bc4b-4c0f-8fb3-4ab1ca7de30a/sessions/2c248d0d-bc4b-4c0f-8fb3-4ab1ca7de30a.jsonl --parent-session /home/hatch/agents/agent-dc091632-401d-42aa-96c7-e1731d4bcbf3/sessions/dc091632-401d-42aa-96c7-e1731d4bcbf3.jsonl`
   Notes: --no-family is INVALID for recording submits (only for --transcript/--bundle). The --parent-session chain is the round-1 chain (coordinator → side chat → main chat); it still applies because the prompt is the same handed-off message. If the submit is refused, read the new refusal and fix exactly what it names — never retry blind.
5. On success: receipt (submission id + claim code) ONLY in the side chat, never in files/memory. Verify with `status --submission <id>` and report id + judge score (when scored) to the main chat. Update MEMORY.md (no claim code).
