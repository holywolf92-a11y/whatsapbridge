# Pilot Runbook

## Objective

Run one approved legacy WhatsApp account through the bridge with minimal operational risk.

## Pilot Rules

- Use only one business-owned account.
- Keep `AUTO_REPLY_ENABLED=false`.
- Set `BRIDGE_MODE=meta-forward`.
- Restrict processing with `allowedSenders` during initial testing.
- Do not add bulk outbound behavior.

## Setup

1. Copy `.env.pilot.example` to `.env`.
2. Copy `config/accounts.pilot.example.json` to `config/accounts.pilot.json`.
3. Set the destination Meta WhatsApp ID in `.env`.
4. Add the approved test sender number to `allowedSenders`.
5. Run `npm install`.
6. Run `npm run check:config`.
7. Run `npm run build`.
8. Run `npm run dev`.

## First Login

1. Watch the terminal for the QR code.
2. Scan it using the approved legacy WhatsApp account.
3. Wait for the session to enter `connected` state.
4. Verify `GET /status` reports the account as connected.

## First End-to-End Test

1. Send a PDF CV from the approved sender.
2. Confirm the bridge logs a media processing event.
3. Confirm the file is forwarded to the Meta intake number.
4. Confirm the backend receives the forwarded message.
5. Confirm the WhatsApp inbox preview includes the `[FALISHA_BRIDGE]` metadata block.
6. Confirm media processing queues CV parsing.

## Pause Conditions

Stop the pilot immediately if any of the following occur:

- repeated disconnects
- unexpected outbound messages
- duplicate forwarding behavior
- parser failures caused by forwarded files
- unusual account warnings

## Operator Controls

Use these commands without editing account inventory files:

```bash
npm run account:status
npm run account:pause -- legacy-1
npm run account:resume -- legacy-1
```

## Expansion Gate

Add a second account only after:

- 7 days of stable operation
- low duplicate rate
- stable webhook processing
- no spam-like behavior