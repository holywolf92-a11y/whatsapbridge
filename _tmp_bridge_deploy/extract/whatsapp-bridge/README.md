# Falisha WhatsApp Bridge

Controlled inbound-only WhatsApp bridge for Falisha CV ingestion.

## Goals

- connect a small number of approved legacy WhatsApp accounts
- detect likely CV uploads
- prevent duplicates before delivery
- deliver accepted files either to the Meta intake number or to a future direct backend ingest endpoint
- provide basic operational health and account status visibility

## Delivery Modes

- `meta-forward`: forwards media to the configured WhatsApp destination number
- `backend-upload`: uploads files to a backend endpoint with bridge metadata

## Configuration

Copy `.env.example` to `.env` and set:

- `API_WHATSAPP_NUMBER` for `meta-forward` mode
- `BACKEND_UPLOAD_URL` and `BACKEND_UPLOAD_TOKEN` for `backend-upload` mode
- `BRIDGE_ACCOUNTS_PATH` to load approved accounts from a JSON file
- or `BRIDGE_ACCOUNTS` as an inline JSON array of approved accounts
- `ACCOUNT_CONTROL_PATH` for runtime pause and resume control

Example:

```json
[
  {
    "id": "legacy-1",
    "displayName": "Legacy Account 1",
    "enabled": true,
    "owner": "Operations",
    "rolloutWave": "pilot",
    "allowedSenders": ["923001112223@c.us"]
  }
]
```

If `allowedSenders` is set for an account, only those senders will be processed for that account. This is recommended for pilot mode.

Use `.env.pilot.example` as the safer starting point for the first production-like rollout.

## Operator Commands

```bash
npm run account:status
npm run account:pause -- legacy-1
npm run account:resume -- legacy-1
```

Pause and resume operate through the configured account control file and do not require editing the account inventory.

## Commands

```bash
npm install
npm run dev
npm run build
npm start
```

## Health Endpoints

- `GET /health`
- `GET /status`

## Notes

- This module is designed for low-volume, inbound-only processing.
- Auto reply is disabled by default.
- Dedupe is persisted locally in a JSON store for single-instance operation.
- For horizontal scaling, replace the file-backed dedupe service with Redis.