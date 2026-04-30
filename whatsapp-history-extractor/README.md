# WhatsApp Historical PDF Extractor

## What this does

This tool connects to WhatsApp via **Baileys** (protocol-level WebSocket, no browser) as a new linked device.

When a device first links, WhatsApp automatically pushes historical messages from the server.
This script captures all PDF messages in a configurable date window, downloads them, and
produces a ZIP package ready for the backend importer.

## How it is different from the whatsapp-web.js approach

| | Old approach (whatsapp-web.js) | This tool (Baileys) |
|---|---|---|
| Protocol | Controls a Chrome browser | Direct WebSocket to WA servers |
| History | Manually scrapes DOM — unstable | Receives history as push events — reliable |
| Production safety | Shares session with live bridge | **Completely separate session** |
| Historical data | Fails with `waitForChatLoading` etc. | WhatsApp server delivers it natively |

## Prerequisites

```powershell
cd D:\falisha\whatsapp-history-extractor
npm install
```

## Run (dry-run first — no files downloaded)

```powershell
$env:START_DATE  = "2024-01-01T00:00:00Z"
$env:END_DATE    = "2024-03-31T23:59:59Z"
$env:MAX_PDFS    = "200"
$env:DRY_RUN     = "true"
$env:BATCH_ID    = "whatsapp-q1-2024"
npm run extract
```

On first run you will see a QR code. **Scan it in WhatsApp on your phone:**
`Settings → Linked Devices → Link a Device`

This adds the script as a NEW linked device — it does **not** affect or disconnect
the production bridge (`whatsapp1` on Railway).

After scanning, WhatsApp will push your message history. Wait for "History sync complete."

## Run for real (downloads PDFs)

```powershell
$env:DRY_RUN = "false"
npm run extract
```

## Output

```
output/
  manifest.csv        # one row per PDF downloaded
  manifest.json       # same data as JSON
  files/
    candidate-cv-abc12345.pdf
    resume-xyz67890.pdf
whatsapp-q1-2024.zip  # ready for backend importer
```

## Feed into the backend importer

```powershell
cd D:\falisha\recruitment-portal-backend

# Dry-run first
npm run backfill:whatsapp-pdf -- `
  --manifest D:\falisha\whatsapp-history-extractor\whatsapp-q1-2024.zip `
  --batch-id whatsapp-q1-2024 `
  --start-date 2024-01-01T00:00:00Z `
  --end-date 2024-03-31T23:59:59Z `
  --dry-run

# Real import
npm run backfill:whatsapp-pdf -- `
  --manifest D:\falisha\whatsapp-history-extractor\whatsapp-q1-2024.zip `
  --batch-id whatsapp-q1-2024 `
  --start-date 2024-01-01T00:00:00Z `
  --end-date 2024-03-31T23:59:59Z `
  --max-files 50 `
  --throttle-ms-between-downloads 750 `
  --stop-on-error-threshold 5 `
  --resume-from-checkpoint
```

## Quarterly batches

```
Q1 2024: START_DATE=2024-01-01  END_DATE=2024-03-31
Q2 2024: START_DATE=2024-04-01  END_DATE=2024-06-30
Q3 2024: START_DATE=2024-07-01  END_DATE=2024-09-30
Q4 2024: START_DATE=2024-10-01  END_DATE=2024-12-31
```

Change `BATCH_ID` for each quarter so checkpoints and ZIPs don't overlap.

## Important notes

- WhatsApp limits how far back it syncs for new linked devices (typically recent months).
  If data older than ~3 months is needed, the first sync may not include it.
  Try running without date filters first to see what WhatsApp actually synced.
- Keep `./auth` folder between runs so you don't need to scan QR again.
- WhatsApp allows up to 4 linked devices. The production bridge uses 1, so 3 slots remain.
- Production bridge (`whatsapp1` on Railway) is completely unaffected by this tool.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| START_DATE | `2024-01-01T00:00:00Z` | Filter window start |
| END_DATE | `2024-03-31T23:59:59Z` | Filter window end |
| MAX_PDFS | `200` | Maximum PDFs to download per run |
| DRY_RUN | `false` | List PDFs without downloading |
| BATCH_ID | `wa-baileys-YYYY-MM-DD` | Prefix for ZIP and batch tracking |
| TIMEOUT_MIN | `10` | Minutes to wait for history sync |
| SKIP_GROUPS | `true` | Skip group chats |
| AUTH_DIR | `./auth` | Session storage directory |
| OUTPUT_DIR | `./output` | Downloaded files directory |
