# Echo Diary Improvements — Design Spec
_2026-05-06_

## Overview

Four improvements to Echo Diary, delivered in two phases:

**Phase 1 (foundation):** IndexedDB storage migration + JSON backup  
**Phase 2 (UI):** Photo thumbnails, comparison view, audio upload fallback

---

## Phase 1: Storage Migration + Backup

### Problem
All entry data (text, photos as base64, audio as base64) is stored in localStorage. localStorage is synchronous, blocks the main thread, and has a 5–10 MB browser limit — a few entries with photos or audio can exhaust it silently.

### Solution: IndexedDB via `idb`

**Library:** `idb` (~1 KB), a lightweight Promise wrapper over the IndexedDB API.

**Database:** `echo-diary-db`, version 1  
**Object store:** `entries`, keyPath `id`, index on `date`

**Migration (one-time, silent):**
1. On app load, open IndexedDB.
2. If localStorage has `echo-diary-entries`, read entries, write them to IndexedDB, then delete the localStorage key.
3. If localStorage is empty, skip migration.
4. App renders after migration resolves (brief async delay, no flash).

**New file:** `src/utils/db.js`
- `openDB()` — opens/creates the database
- `migrateFromLocalStorage()` — one-time migration
- `getAllEntries()` — returns all entries sorted by date desc
- `putEntry(entry)` — upsert
- `deleteEntry(id)` — delete by id

**Updated hook:** `src/hooks/useEntries.js`
- `useEntries()` becomes async on mount: calls `migrateFromLocalStorage()` then `getAllEntries()`
- Returns `{ entries, addEntry, deleteEntry, loading }` — `loading: true` until initial fetch resolves
- `addEntry` / `deleteEntry` external signatures unchanged; internally use IndexedDB

**Loading state:** App shows a minimal skeleton (faded parchment background, no content) while `loading === true`. Duration is negligible in practice but prevents layout shift.

### Backup UI

A settings icon (⚙) is added to the header, left of the new-entry (+) button. Tapping it opens a bottom sheet with two actions:

- **导出 JSON** — serialises all entries to JSON, triggers a file download named `echo-diary-backup-YYYYMMDD.json`
- **导入 JSON** — file picker (`.json`), parses the file, merges entries by `id` (existing entries kept, new ones appended), then refreshes state

**New component:** `src/components/BackupSheet.jsx`

---

## Phase 2: UI Features

### 2a. Photo Thumbnails

**Scope:** `src/components/EntryCard.jsx`

- Remove the "View photo / Hide photo" toggle button.
- If `entry.photoDataUrl` exists, render a strip below the text and audio controls:
  - Default (collapsed): `height: 80px`, `object-fit: cover`, full card width, `border-radius: 8px`
  - Expanded (tap to toggle): `max-height: 256px`, `object-fit: cover`, same width
- Tap anywhere on the image to toggle expanded/collapsed.
- Entries without photos are unaffected.

### 2b. Comparison View (升级"历年今天"标签)

**Scope:** `src/components/OnThisDayView.jsx` + `src/utils/dateUtils.js`

The existing OnThisDay tab is extended with two additional modes, selectable via chips at the top of the view.

**Three modes:**

| Chip label | Logic | Display style |
|---|---|---|
| 历年今天 | Same MM-DD across all years | Timeline grouped by year (existing) |
| 每周X | Same weekday, last 8 occurrences | Flat list with relative date labels |
| 每月X号 | Same day-of-month, last 8 months | Flat list with relative date labels |

**Chip values are auto-derived from today:**
- "每周X" → today's weekday name (e.g. 每周二)
- "每月X号" → today's day of month (e.g. 每月6号)
- Chips are display-only labels; tapping switches the active mode

**New dateUtils helpers:**
- `getSameDayOfWeek(entries, dayOfWeek, n=8)` — returns up to n most recent entries whose date falls on `dayOfWeek` (0–6), sorted descending
- `getSameDayOfMonth(entries, dayOfMonth, n=8)` — returns up to n most recent entries whose date has `dayOfMonth`, sorted descending

**Navigation label:** Tab continues to be labelled "历年今天" (existing icon kept).

**Empty states:**
- 历年今天: existing empty state copy unchanged
- 每周X / 每月X号: "还没有这一天的记录" with same visual treatment

### 2c. Audio Upload Fallback

**Scope:** `src/components/AudioRecorder.jsx`

- On `startRecording()`, catch `DOMException` with name `NotFoundError`.
- When caught: hide the record button, show an "上传音频文件" button instead.
- The upload button triggers a hidden `<input type="file" accept="audio/*">`.
- On file select, read as data URL and call `onChange(dataUrl)` — identical to the post-recording flow.
- All other errors (e.g. `NotAllowedError`) continue to surface as text.
- On devices with a microphone, behaviour is completely unchanged.

---

## File Change Summary

| File | Change |
|---|---|
| `package.json` | Add `idb` dependency |
| `src/utils/db.js` | New — IndexedDB helpers + migration |
| `src/hooks/useEntries.js` | Rewrite to use IndexedDB; add `loading` |
| `src/components/BackupSheet.jsx` | New — export/import UI |
| `src/App.jsx` | Add settings button + BackupSheet; pass `loading` to skeleton |
| `src/components/EntryCard.jsx` | Photo thumbnail strip; remove toggle button |
| `src/components/OnThisDayView.jsx` | Add mode chips + 每周/每月 display logic |
| `src/utils/dateUtils.js` | Add `getSameDayOfWeek`, `getSameDayOfMonth` |
| `src/components/AudioRecorder.jsx` | Catch `NotFoundError`; show file upload fallback |

---

## Out of Scope

- Cross-device sync (no backend)
- Editing existing entries
- Audio recording on desktop when microphone is present (already works via browser permissions)
