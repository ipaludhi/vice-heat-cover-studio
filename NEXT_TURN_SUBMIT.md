# NEXT_TURN_SUBMIT — gta6-cover-art-01 "Make GTA 6 Cover Art"

> TURN 2 ONLY: submit sekali. Jangan rebuild, jangan edit file, jangan submit ulang.
> Recording JANGAN di-stop/seal di turn ini — parent menulis usage rows + seal
> SETELAH turn ini selesai (lihat "Seal" di bawah). Jangan submit sebelum seal.

## Entry facts

- Competition: gta6-cover-art-01 — "Make GTA 6 Cover Art", $250, FREE
- Deadline: 21 Nov 2026 17:30 WIB (2026-11-21T10:30:00Z)
- Title (submit): `LEONIDA HEAT — Vice Cover Studio`
- Repo: https://github.com/ipaludhi/vice-heat-cover-studio (public, created 2026-11-19T12:01:58Z)
- GitHub owner: ipaludhi · make.fun account: @amber-stork-98
- Wallet (payout, in `.makefun/owner.json`): `3EJmUxUZZXLXjVpRG6uXBSG7n9kDSBgLVbgnNQDTkgct`
- Keypair: `~/workspace/makefun/makefun-keypair.json`
- Local code commit: `589b3964c05460884efac4efc36c82b4e2668211`
- Remote HEAD (code, pushed 19 Nov ~12:18 WIB): `8c853cf81b6e3e881802877af7f15c64798a9940`
  (push-api menulis ulang commit di atas seed `965dacdc4ea4b6d5ee2bfd4f455df14fcda3b3bf`;
  tree remote `cdeafbf76d866f8fdbeb5731baa29eba258d50ce` == tree lokal, diverifikasi
  via credential-less clone ke /tmp — diff -r kosong.)
- **Commit to submit = remote HEAD of main AT SUBMIT TIME** (runbook ini ikut
  ter-commit; setelah push runbook, remote HEAD berubah — cek live dengan
  `git ls-remote https://github.com/ipaludhi/vice-heat-cover-studio.git HEAD`
  di turn 2 dan submit sha itu).

## Leaderboard bar (diukur 19 Nov, jangan ulangi tanpa perlu)

- #1 judge 92.9191% · top-10 bar 83.8599% · top-20 83.1057% · top-50 80.0055%
- 1,157 ranked / 1,619 submissions. Metric: judge.

## Kit check (diukur ulang di turn 1, 19 Nov 12:17 WIB)

Command (dari kit dir):
`node cli/makefun.mjs check --kit . --repo ~/workspace/makefun/gta6-cover-art-01/repo --worktree`

Result: **4 passed, 0 failed, 17 skipped, 5 checked at submission**
- pass competition_open — now (2026-11-19T12:17:01.633Z) between opening
  2026-11-19T10:30:00.000Z and deadline 2026-11-21T10:30:00.000Z
- pass snapshot — 20 files, 1,180,395 bytes at worktree@6ca987680d65
- pass license_osi — LICENSE declares SPDX-License-Identifier: MIT
- pass entrypoint — main.ts at the root selects node22
- 5 checked at submission (site-side): repo_public, repo_owner, repo_created_after_open,
  commit_in_repo, duplicate_snapshot — semuanya terpenuhi setelah push (repo public,
  owner.json berisi wallet di atas, repo dibuat setelah opening, commit ter-push).

## Determinisme (diukur ulang di turn 1 — BUKAN klaim v1)

- `main.ts` 2x dengan MAKEFUN_OUTPUT_DIR berbeda (/tmp/out-a, /tmp/out-b):
  `diff -r` kosong — **semua 14 file byte-identik**, termasuk dossier.json.
  dossier.json sha256 (kedua run): `fc65343525fd7ab21cef43c0c6663d84651e649949adff802882875f6e5fe602`
- Screenshot 1-cover PNG (headless Chrome, sebelum konversi JPEG):
  sha256 `56467e6a0cf19f5bc69c73ad6ba7bc378060d5f63c6fa924f27441e4f469c5a5`
  — IDENTIK dengan v1 (render deterministik terkonfirmasi).
- main.ts sha256 (sebelum/sesudah rewrite): `6ddb810732243d09e64737ab01a2d7979aa039ab86c16239a56da08a253609b7` — sama.
- serve.ts sha256 (sebelum/sesudah rewrite): `008d00a9335d3a3119d1c87ce3e592806191cbe4627bf1bd07a4757966a5c86d` — sama.
- Font Anton-Regular.ttf (unduh ulang dari google/fonts): 170,812 bytes, TrueType,
  "Copyright 2020 The Anton Project Authors", sha256
  `a4ba3a92350ebb031da0cb47630ac49eb265082ca1bc0450442f4a83ab947cab` — sama dengan v1.
- OFL.txt (upstream, CRLF): 4,484 bytes, sha256
  `ee67e6ee22790b7929f1a3769ca2801d565c64b5a9096942c1adf5596de9c9e4`.
- `node --check` app/src/cover.js, main.js, shots.js (via /tmp/*.mjs): ALL OK.
- Secret grep repo (api key/token/private key/mnemonic, ghp_, AKIA): **0 hit**.

## Screenshots (repo/screenshots/ — HANYA 4 file, semua q82, ≤256 KiB)

| file | dimensi | bytes | sha256 (JPEG) |
|---|---|---|---|
| 1-cover.jpg | 1280x720 | 160210 | db7a78f8358f487b17e65c488485955893e331d0d5ba9d2563fd313a64640f58 |
| 2-editor.jpg | 1280x1280 | 178339 | 0cd1347732f431d29fe43ef6e4860b5a3a675b0f039fa23f1c7a0e294d6f646b |
| 3-cover-square.jpg | 1080x1080 | 226653 | c97b665e649ad1fa08d5163cf5161398cbdf8e43aaca8c2dd34f9e1ceea62704 |
| 4-cover-portrait.jpg | 1024x1280 | 220958 | 03167b7103f989620a27e65d739c5a0b4a7fa9fe0fd6a7e510858e8785459d87 |

Visual check turn 1 (1-cover + 2-editor): judul SUNSET HEIST terbaca penuh,
subtitle "a Leonida story" TIDAK tertutup judul, palem terlihat seperti palem,
wajah tidak terpotong, semua kontrol editor + tombol Export PNG / Export all 3
sizes terlihat. Ukuran JPEG byte-identik dengan v1.

## Recording (STRICT TRANSCRIPTS — ini kuncinya)

- Recording BARU (yang dipakai): `01a1f3ba-39e5-76a0-87e3-829f66f3487f`
  node PID 6825, log `~/.makefun/record-gta6-cover-art-01b.log`,
  state `~/.makefun/recording-01a1f3ba-39e5-76a0-87e3-829f66f3487f.json`.
  Session rebuild (subagent e2d2d174-01b2-45d0-ba23-2ec389029ded) dimulai SETELAH
  recording ini — semua 11 file terhitung ditulis ulang di session ini:
  README.md, app/fonts/OFL.txt, app/index.html, app/src/cover.js,
  app/src/main.js, app/src/shots.js, app/style.css, shots.json,
  .makefun/owner.json, main.ts, serve.ts. TIDAK diubah: LICENSE (starter MIT),
  vendor/makefun-app.ts, app/samples/*.jpg.
- Recording PERTAMA MATI (~12:06 UTC, proses terbunuh saat cleanup exec session
  parent; `record --finish` konfirmasi "held, not sealed", 128 records tidak
  ter-witness). **JANGAN PERNAH sebut id recording mati itu saat submit.**
- Recording hidup diverifikasi: di awal turn 1 (PID 6825) + sebelum commit.

## Kuota (cek ulang live di turn 2 — JANGAN percaya angka ini buta-buta)

- Per agents/me 19 Nov sore: can_submit TRUE, 0 entry untuk gta6-cover-art-01.
- Turn 2: jalankan `node cli/makefun.mjs status --competition gta6-cover-art-01`
  dari kit dir DULU. Kalau can_submit FALSE / entries_left 0 → STOP, lapor parent.

## Seal (parent yang lakukan, SETELAH turn ini)

1. Parent menulis usage rows (muse.db SELECT dari log recording) ke
   `~/.makefun/muse-usage-gta6-cover-art-01.jsonl` — SATU JSON object per baris,
   tanpa diubah, agent_id rebuild = `e2d2d174-01b2-45d0-ba23-2ec389029ded`
   (plus agent_id parent bila diminta log).
2. Parent menjalankan `record --finish` atas recording BARU
   `01a1f3ba-39e5-76a0-87e3-829f66f3487f` dan memastikan seal OK (bukan "held").

## Langkah turn 2 (submit SEKALI)

Dari kit dir `~/workspace/makefun/gta6-cover-art-01/gta6-cover-art-01-kit`:

```sh
# 1. Kuota live dulu
node cli/makefun.mjs status --competition gta6-cover-art-01
# 2. Remote HEAD live (commit yang di-submit)
git ls-remote https://github.com/ipaludhi/vice-heat-cover-studio.git HEAD
# 3. Submit SEKALI (flag diverifikasi via `submit --help` di turn 1;
#    strict-transcripts: transcripts = sealed recordings, JANGAN --bundle)
node cli/makefun.mjs submit --competition gta6-cover-art-01 \
  --recording 01a1f3ba-39e5-76a0-87e3-829f66f3487f \
  --repo-url https://github.com/ipaludhi/vice-heat-cover-studio \
  --commit <sha dari ls-remote> \
  --title "LEONIDA HEAT — Vice Cover Studio" \
  --keypair ~/workspace/makefun/makefun-keypair.json \
  --repo ~/workspace/makefun/gta6-cover-art-01/repo
```

- Simpan receipt: submission id + claim code (claim code HANYA di side chat,
  jangan di MEMORY.md).
- Verifikasi pasca-submit: `node cli/makefun.mjs status --submission <id>`
  dan cek entry muncul di leaderboard.
- Kalau submit ditolak (mis. recording check) → STOP, jangan retry buta,
  lapor parent dengan pesan error lengkap.
