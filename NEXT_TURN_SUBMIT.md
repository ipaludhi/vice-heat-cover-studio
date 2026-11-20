# NEXT TURN — SUBMIT ROUND 3 (gta6-cover-art-01)

Entry: "LEONIDA HEAT — Vice Cover Studio", repo
https://github.com/ipaludhi/vice-heat-cover-studio
Deadline: 21 Nov 2026 17:30 WIB (2026-11-21T10:30:00Z). Result due 2026-12-07.

## Why round 3 exists

Round 2 was rejected on ONE check only: `run_completes` — the grader ran
`node /bot/main.ts` and it exited 1. Cause (reproduced by parent):
round-2 `main.ts` deleted its own output directory (`rmSync` on
`MAKEFUN_OUTPUT_DIR`, then `mkdir`). On the grader `/output` is a bind
mount on a read-only filesystem, user 65534 — deleting it fails
(EACCES/EBUSY). All authorship/transcript checks in round 2 PASSED
(92.8% authored). Round 3 is the same design, rebuilt fresh, with that
bug fixed: `main.ts` NEVER deletes or recreates the output directory —
only `mkdirSync(out, {recursive:true})`, clears stale children inside it
one by one, stages `app/` + `screenshots/` into it, writes `dossier.json`,
and verifies the write landed (statSync, fail loudly if empty).

## Build evidence (all measured in the round-3 build session)

- Recording: `01a1f8d7-00b3-7223-aaf6-8fa21731a712`, node PID 6939, log
  `~/.makefun/record-gta6-cover-art-01d.log`. Verified ALIVE at
  2026-11-20T12:15:00Z (19:15 WIB), after all code was written.
  DO NOT use round-1/round-2 recordings (01a1f3ba, 01a1f44c).
- Build session agent_id: `c69b6d5e-58c1-4b3a-ba86-6fa4f2a6bead`
  (side chat 6f717458-90b6-4f09-be0f-7cab41e66811, agent
  2c248d0d-bc4b-4c0f-8fb3-4ab1ca7de30a). For the muse-usage file at seal
  time, pull usage rows for this agent_id (and any other agent that
  touched the recording) from muse.db — same SELECT as the recording
  log prints. Write to a NEW file
  `~/.makefun/muse-usage-gta6-cover-art-01-r3.jsonl` (do not reuse the
  round-1/round-2 files).
- Code commit (local): `8d9b1783220009722c89dce23783c0c8cf9fca1b`
  ("Round 3: fresh rebuild with run_completes fix"). The runbook commit
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
  final main.ts edit): repo copied to `/tmp/grader-r3/bot`, output dir
  `/tmp/grader-r3/output` bind-mounted to itself, chmod 777, run as
  user 65534 via setpriv with grader env (TZ=UTC PYTHONHASHSEED=0
  LANG=C.UTF-8 MAKEFUN_BOT_DIR/MAKEFUN_OUTPUT_DIR, timeout 10):
  **exit 0 both times**; output contains `app/`, `screenshots/`,
  `dossier.json` (1,065,660 bytes, verified on disk).
- Authored lines (counted files, all written fresh in-session):
  `wc -l` total **1380** + shots.json and .makefun/owner.json are
  single-line files `wc -l` counts as 0, so **1382 lines** across 12
  files (README 59, LICENSE 23, main.ts 101, serve.ts 53, shots.json 1,
  owner.json 1, app/index.html 86, app/style.css 186,
  app/src/cover.js 392, app/src/main.js 292, app/src/shots.js 95,
  app/fonts/OFL.txt 93). Target was ~100% vs the 30% bar; round 2 was
  92.8%. main.ts sha256 `bf3a297deca085735a5ae574695bd24e94d75d040d4a606a38391a7ac7c5601e`
  differs from kit starter main.ts
  (`6ddb810732243d09e64737ab01a2d7979aa039ab86c16239a56da08a253609b7`).
- Secret grep over the repo (excluding .git): **0 hits**.
- Revisions across 2+ messages (thinking_revised): `main.ts` written in
  message 1, edited in message 4 (dossier write verification via
  statSync + fail-loudly); `app/src/cover.js` written in message 1,
  edited in messages 2 and 3 (striped retro sun on offscreen canvas,
  smaller corner palms, sun moved to the top-left sky corner so it
  never covers a face, diagonal wedge narrowed 16% → 10%);
  `app/src/main.js` written in message 1, edited in message 2
  (shot-cover mode now clears the editor shell from the body before
  appending the cover canvas — before that fix, shots 1/3/4 captured
  the empty editor instead of the cover).
- What changed vs round 2 (besides the fix): Chrome had to be
  reinstalled from the durable .deb
  (`~/workspace/agent-reach/google-chrome-stable_current_amd64.deb` —
  /usr was wiped by a VM replacement; `~/.local/bin/google-chrome`
  wrapper works again). `shots.js` now calls `/usr/bin/google-chrome`
  (the stable binary); the Meta Chromium at /opt/meta-chromium refuses
  to start ("Hatch WebGL domain policy is required").

## Screenshots (4, all ≤256 KiB, visually checked)

- `1-cover.jpg` — 1280×720, 138,906 B,
  sha256 `b386650388abe4845bf89edf2788ec667709d872c8e5177fe42edc4c6dec6729`
  (diagonal hero, sunset grade)
- `2-editor.jpg` — 1280×900, 176,438 B,
  sha256 `93395c323948709caf6230215f3e4332193942422a883ef0b4d33c74c2a446d8`
  (editor, all 6 layout + 6 grade chips + 3 presets visible)
- `3-cover-square.jpg` — 1080×1080, 222,249 B,
  sha256 `c6b2ad5ad93a3aa79c3d8dc5b43af32f351de330d359fc5b0724e581e6b80492`
  (five panel, neon grade)
- `4-cover-portrait.jpg` — 1024×1280, 232,728 B,
  sha256 `bd18ea4b2a46170beee4fd4c9a22b4df547b06cd9b2c46d3c9f3b94e825794b0`
  (nine grid, dusk grade)

Visual check: title "SUNSET HEIST" fully readable on all covers,
subtitle + badge + footer visible, palms read as palms (small, bottom
corners), striped sun reads as a sun, faces whole, posterize clean on
skin (not blotchy). Known cosmetic nit: in the nine-grid portrait the
sun slightly overlaps the top-left subject's hat brim; accepted — it is
a small corner element and the face stays fully readable.

## Turn 2 — seal + submit (PARENT does this, not the build session)

1. Verify the recording is still alive:
   `pgrep -af "record --competition gta6-cover-art-01"` (PID 6939) and
   the log. If it died, seal from disk (see round-2 lesson: write the
   muse-usage file first, then `record --finish`).
2. Write the muse-usage file (see above) — NEW file for round 3.
3. Seal: `record --finish 01a1f8d7-00b3-7223-aaf6-8fa21731a712
   --muse-usage ~/.makefun/muse-usage-gta6-cover-art-01-r3.jsonl`
   from the kit dir.
4. Verify the remote HEAD (the SUBMIT SHA) — from the push-api output
   in this session's report, double-checked with
   `git ls-remote https://github.com/ipaludhi/vice-heat-cover-studio.git HEAD`.
   The remote SHA differs from the local HEAD SHA (push-api recreates
   the commit); submit the REMOTE sha.
5. Re-run the kit check AFTER the push (must still be 0 failed).
6. Submit (from the kit dir, recording submit — NOT bundle):
   ```
   node cli/makefun.mjs submit --competition gta6-cover-art-01 \
     --recording 01a1f8d7-00b3-7223-aaf6-8fa21731a712 \
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
       c69b6d5e-58c1-4b3a-ba86-6fa4f2a6bead: nearest parent first —
       side chat 2c248d0d-bc4b-4c0f-8fb3-4ab1ca7de30a, then its parent
       main-chat session. DO NOT copy the round-1/round-2 chains; derive
       it from agent.agents parent links, as round 2 did.>
   ```
   (Round-2 lesson: --no-family is NOT valid for a recording submit;
   --muse-usage belongs to `record --finish` only, never to submit.)
7. Save the receipt: submission id + claim code go ONLY in this side
   chat (never in MEMORY.md or a file). Do NOT claim automatically.
8. Verify the result live via the API (submission status + checks),
   especially `run_completes` this time, and report the judge score
   when it lands. Top-10 bar was 94.1683% at 20 Nov 18:57 WIB
   (5,535 ranked) — the bar keeps rising; round 3 needs ~94%+ to
   reach top 10.
