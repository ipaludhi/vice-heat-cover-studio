# NEXT TURN — SUBMIT ROUND 4 (gta6-cover-art-01)

Entry: "LEONIDA HEAT — Vice Cover Studio", repo
https://github.com/ipaludhi/vice-heat-cover-studio
Deadline: 21 Nov 2026 17:30 WIB (2026-11-21T10:30:00Z). Result due 2026-12-07.

## Why round 4 exists

Round 2 was rejected on ONE check only: `run_completes` — the grader ran
`node /bot/main.ts` and it exited 1. Cause (reproduced by parent):
round-2 `main.ts` deleted its own output directory (`rmSync` on
`MAKEFUN_OUTPUT_DIR`, then `mkdir`). On the grader `/output` is a bind
mount on a read-only filesystem, user 65534 — deleting it fails
(EACCES/EBUSY). All authorship/transcript checks in round 2 PASSED
(92.8% authored). Round 3 rebuilt it fresh with the fix and passed every
local gate (sandbox exit 0, kit 4/0, 1,382 lines) — but its SUBMIT was
refused because the SEAL was broken: parent ran the diagnostic
`record --finish` while the recorder was still alive, which triggered a
SITE-side seal at chunk 162 whose receipt carries NO session-file
references, so `submit` could not build the run record ("record the
build again"). No entry was created; quota untouched. Round 4 is the same
design, rebuilt fresh again, with the fix — and turn 2 MUST use the
corrected seal sequence below.

## Build evidence (all measured in the round-4 build session)

- Recording: `01a1f8f1-7bce-75e4-a6d2-8e6726b49375`, node PID 13453, log
  `~/.makefun/record-gta6-cover-art-01e.log`. Verified ALIVE at
  2026-11-20T12:33:00Z (19:33 WIB), before any code was written, and
  still alive after all code was written. DO NOT use round-1/2/3
  recordings (01a1f3ba, 01a1f44c, 01a1f8d7).
- Build session agent_id: `5ce7adff-4551-42aa-a67d-baee7342aea6`
  (side chat 6f717458-90b6-4f09-be0f-7cab41e66811, agent
  2c248d0d-bc4b-4c0f-8fb3-4ab1ca7de30a). For the muse-usage file at seal
  time, pull usage rows for this agent_id (and any other agent that
  touched the recording) from muse.db — same SELECT as the recording
  log prints. Write to a NEW file
  `~/.makefun/muse-usage-gta6-cover-art-01-r4.jsonl` (do not reuse the
  round-1/2/3 files).
- Code commit (local): `379c9dbf94a346a826e2ae3c756fde155362a3ba`
  ("Round 4: fresh rebuild with run_completes fix"). The runbook commit
  on top of it is the local HEAD at push time. Push-api recreates the
  local HEAD as a NEW remote commit (different SHA, same tree) — the
  SUBMIT SHA is the remote one printed by push-api, verified below.
- Kit check (pre-commit, from the kit dir):
  `node cli/makefun.mjs check --kit . --repo <repo>` → **4 passed,
  0 failed, 17 skipped, 5 at submission**. Re-run AFTER commit+push
  (kit check reads committed files); the 5 at-submission items resolve
  once the new commit is on GitHub.
- Determinism: `main.ts` run twice to different dirs, `diff -r` empty.
  Re-run after the final main.ts edit: still empty.
- Sandbox repro (THE gate — run twice, once before and once after the
  final main.ts edit): repo copied to `/tmp/grader-r4/bot`, output dir
  `/tmp/grader-r4/output` bind-mounted to itself, chmod 777, run as
  user 65534 via setpriv with grader env (TZ=UTC PYTHONHASHSEED=0
  LANG=C.UTF-8 MAKEFUN_BOT_DIR/MAKEFUN_OUTPUT_DIR, timeout 10):
  **exit 0 both times**; output contains `app/`, `screenshots/`,
  `dossier.json` (1,102,672 bytes, verified on disk).
- Authored lines (counted files, all written fresh in-session):
  `wc -l` total **1226** + shots.json and .makefun/owner.json are
  single-line files `wc -l` counts as 0, so **1228 lines** across 12
  files (README 54, LICENSE 23, main.ts 99, serve.ts 44, shots.json 1,
  owner.json 1, app/index.html 78, app/style.css 88,
  app/src/cover.js 354, app/src/main.js 297, app/src/shots.js 96,
  app/fonts/OFL.txt 93). Target was ~100% vs the 30% bar; round 2 was
  92.8%. main.ts sha256 `49400af22b79e0dc57b17801fa4115270eb4b433440e96277f7d2162492fc754`
  differs from kit starter main.ts
  (`6ddb810732243d09e64737ab01a2d7979aa039ab86c16239a56da08a253609b7`).
  Font Anton-Regular.ttf sha256 `a4ba3a92350ebb031da0cb47630ac49eb265082ca1bc0450442f4a83ab947cab`
  (fresh download from google/fonts, same upstream bytes as round 2/3).
- Secret grep over the repo (excluding .git): **0 hits**.
- Revisions across 2+ messages (thinking_revised): `main.ts` written in
  message 1, edited in a later message (clearChild → clearChildren:
  now clears EVERY stale entry inside the output dir, still never the
  directory itself); `app/src/cover.js` written in message 1, edited in
  a later message (sun smaller, 0.085 → 0.07 of min(W,H), moved tighter
  to the corner so it never sits on a face; badge moved from the title
  row to the subtitle row at the right edge — it used to clip the
  title's last letter on square and portrait covers).
- What changed vs round 3 (besides the fix, already in round 3):
  badge no longer clips the title; sun smaller and further into the
  corner; main.ts clears all stale children inside the output dir.
  Chrome was still present (158.0.8127.36, no reinstall needed this time).

## Screenshots (4, all ≤256 KiB, visually checked)

- `1-cover.jpg` — 1280×720, 156,549 B,
  sha256 `2605bb4d5e747575606a24e1746434596728e8e6bc09ca799f466b39d4f042eb`
  (diagonal hero, sunset grade)
- `2-editor.jpg` — 1280×900, 177,293 B,
  sha256 `2eeeb93704f35114be334a7d8909209c0eb7d63ae025acca2aa5945d89903836`
  (editor, all 6 layout + 6 grade chips + 3 presets visible)
- `3-cover-square.jpg` — 1080×1080, 226,527 B,
  sha256 `9c541779443342f0943972323d607fc20f96b79b76d584e7ade0d7c3b7dc4942`
  (five panel, neon grade)
- `4-cover-portrait.jpg` — 1024×1280, 240,021 B,
  sha256 `91f76cb8a907d34d9ea020699168d6892b72792f572759287e4e34906af3119b`
  (nine grid, dusk grade)

Visual check: title "SUNSET HEIST" fully readable on all covers (badge
fix verified on square + portrait), subtitle + badge + footer visible,
palms small in the corners, striped sun reads as a sun, faces whole,
posterize clean on skin (not blotchy). Known cosmetic nit: in the
diagonal cover the sun still touches the top-left subject's hat brim
slightly; accepted — the face stays fully readable.

## Turn 2 — seal + submit (PARENT does this, not the build session)

CORRECTED SEAL SEQUENCE (round 3's seal broke because the diagnostic
--finish ran while the recorder was alive):

1. KILL the recorder FIRST: `kill 13453` (or pkill the record process),
   then confirm it is dead (`pgrep -af "record --competition
   gta6-cover-art-01"` shows nothing). NEVER run `record --finish`
   (with or without --muse-usage) while the recorder is alive.
2. THEN run the diagnostic `record --finish
   01a1f8f1-7bce-75e4-a6d2-8e6726b49375` (no --muse-usage) to learn the
   session list. With the recorder dead, the site cannot seal a moving
   target.
3. Write the muse-usage file (see above) — NEW file for round 4.
4. Seal: `record --finish 01a1f8f1-7bce-75e4-a6d2-8e6726b49375
   --muse-usage ~/.makefun/muse-usage-gta6-cover-art-01-r4.jsonl`
   from the kit dir.
5. VERIFY THE SEAL before submitting: in recordings.json, the entry for
   01a1f8f1 MUST have a `file` field (absolute session-file path) on
   EVERY document. A seal without `file` fields is broken (round 3) —
   DO NOT submit it; report back instead.
6. Verify the remote HEAD (the SUBMIT SHA) — from the push-api output
   in this session's report, double-checked with
   `git ls-remote https://github.com/ipaludhi/vice-heat-cover-studio.git HEAD`.
   The remote SHA differs from the local HEAD SHA (push-api recreates
   the commit); submit the REMOTE sha.
7. Re-run the kit check AFTER the push (must still be 0 failed).
8. Submit (from the kit dir, recording submit — NOT bundle):
   ```
   node cli/makefun.mjs submit --competition gta6-cover-art-01 \
     --recording 01a1f8f1-7bce-75e4-a6d2-8e6726b49375 \
     --repo-url https://github.com/ipaludhi/vice-heat-cover-studio \
     --commit <REMOTE SHA> \
     --title "LEONIDA HEAT — Vice Cover Studio" \
     --keypair ~/workspace/makefun/makefun-keypair.json \
     --repo ~/workspace/makefun/gta6-cover-art-01/repo \
     --prompt-file ~/workspace/makefun/gta6-cover-art-01/prompt-user.txt \
     --prompt-origin handed-off --mcp none \
     --harness muse-app --harness-version 1.3 \
     --provider meta --model ipnext/avocado-5.17-v2 --effort default \
     --parent-session <chain from the ACTUAL ancestry of build session
       5ce7adff-4551-42aa-a67d-baee7342aea6: nearest parent first —
       side chat 2c248d0d-bc4b-4c0f-8fb3-4ab1ca7de30a, then its parent
       main-chat session. DO NOT copy the round-1/2/3 chains; derive
       it from agent.agents parent links, as round 2 did.>
   ```
   (Round-2 lesson: --no-family is NOT valid for a recording submit;
   --muse-usage belongs to `record --finish` only, never to submit.)
9. Save the receipt: submission id + claim code go ONLY in this side
   chat (never in MEMORY.md or a file). Do NOT claim automatically.
10. Verify the result live via the API (submission status + checks),
    especially `run_completes` this time, and report the judge score
    when it lands. Top-10 bar was 94.1683% at 20 Nov 18:57 WIB
    (5,535 ranked) — the bar keeps rising; round 4 needs ~94%+ to
    reach top 10.
