# WhatsApp Old Attachment Extraction Issue

## Summary

We need a one-time backfill of old WhatsApp CV and document attachments from historical chats.

The current live bridge can receive new WhatsApp messages correctly, but it is **not reliably able to traverse old chat history and extract historical attachments** from the existing WhatsApp session.

This is the main issue:

- New inbound WhatsApp messages work.
- Existing production WhatsApp session is connected.
- Historical attachment extraction from old chats is failing before old PDFs or documents can be scanned and imported.

## Current Production State

- Live bridge service is up and healthy.
- `whatsapp1` is connected.
- `whatsapp2`, `whatsapp3`, and `whatsapp4` are paused.
- No QR is currently required.

So the problem is **not** account removal, logout, or missing session auth.

## What We Are Trying To Do

We want to recover older WhatsApp CVs and document attachments, ideally in small windows such as 3 months at a time, and pass them through the existing Falisha ingestion pipeline.

Target outcome:

- Find old WhatsApp attachments.
- Download them safely.
- Send them into the backend as historical imports.
- Avoid duplicate candidate creation.
- Avoid destabilizing the live production WhatsApp bridge.

## What Is Failing

The failure happens when the system tries to access older WhatsApp chat history through the live WhatsApp Web session.

The backfill runner can authenticate successfully, but historical chat traversal fails during message loading.

Observed runtime errors include:

- `Cannot read properties of undefined (reading 'waitForChatLoading')`
- `Cannot read properties of undefined (reading 'getChat')`
- `Cannot read properties of undefined (reading 'Chat')`
- `Execution context was destroyed, most likely because of a navigation`
- `TargetCloseError` during cleanup after failed history access

## Root Cause

The historical extraction path currently depends on `whatsapp-web.js` plus WhatsApp Web internals.

That stack is working for live inbound events, but it is unreliable for large-scale historical replay because:

- old message loading depends on internal WhatsApp Web behavior,
- those internal objects are not stable across web builds,
- chat history methods break when the WhatsApp Web runtime changes,
- browser context resets or navigations interrupt long-running history scans.

In short:

**The live browser-based WhatsApp Web session is stable enough for current inbound bridge operation, but not stable enough for production-grade historical attachment recovery.**

## What We Already Tried

We already tested several approaches on the connected production session:

1. Direct `chat.fetchMessages()` based history scanning.
2. Skipping group chats and continuing after per-chat failures.
3. Direct page/runtime access through WhatsApp Web internal store objects.
4. Explicitly opening chats before loading older messages.
5. Running very small bounded windows with delivery caps and dry-run mode.

These changes improved control and safety, but they did **not** solve the core history-loading failure.

## Operational Impact

Because old history cannot be traversed reliably:

- old CVs and old attachments are not being imported,
- quarter-by-quarter backfill runs complete with zero useful extracted files,
- broad history scans risk unnecessary instability without delivering data,
- production time is being spent fighting WhatsApp Web internals rather than importing records.

## Why This Is Risky To Continue As-Is

Continuing with whole-account live scraping through `whatsapp-web.js` has these risks:

- brittle behavior when WhatsApp Web changes,
- repeated failed runs with no data recovered,
- possible disruption to the live connected business account,
- difficult-to-debug failures inside private runtime internals,
- no strong guarantee that a future run will behave consistently.

## Recommended Direction

The safest path is:

### Preferred approach

Recover historical attachments through **export and import**, not through live history scraping.

Recommended format:

- exported WhatsApp chat data,
- extracted attachment files,
- manifest file with sender, timestamp, and file metadata,
- bulk import into the backend with dedupe and `backfill` markers.

### If export is not available

Use a **separate one-time migration worker** rather than the live bridge session.

If a live protocol-based path is needed, a tool like **Baileys** is a better candidate than `whatsapp-web.js` for controlled history sync work, because it is socket-based rather than browser-DOM driven.

Even then, the migration should be:

- one-time only,
- run in small bounded windows,
- limited to allowlisted chats,
- resumable with checkpoints,
- idempotent and deduplicated,
- isolated from the production inbound bridge.

## Clear Issue Statement

**Issue:** Falisha cannot currently extract old WhatsApp attachments reliably from historical chats using the live production WhatsApp Web bridge.

**Reason:** Historical replay depends on unstable WhatsApp Web internal history-loading behavior, which breaks during old chat traversal even though the session itself remains connected.

**Effect:** Old CVs and document attachments are not being recovered, and live bridge based backfill runs finish without importing historical files.

**Recommended resolution:** Move historical recovery to an export/import pipeline or to a separate one-time migration worker, instead of relying on production live history scraping.

## Decision

For Falisha, old WhatsApp attachment recovery should be treated as a **historical migration problem**, not as a normal live bridge feature.

See the implementation guidance in `FALISHA_WHATSAPP_HISTORICAL_CV_PDF_RECOVERY_SAFE_PLAN.md`.
