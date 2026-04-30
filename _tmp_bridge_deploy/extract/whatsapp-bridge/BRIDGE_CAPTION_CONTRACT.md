# Bridge Caption Contract

## Purpose

This contract defines the structured caption format attached to media forwarded from the WhatsApp bridge to the Meta intake number.

The goal is to preserve provenance without rebuilding the existing Falisha ingestion pipeline.

## Format

The caption is a newline-delimited block.

Line 1 must be:

```text
[FALISHA_BRIDGE]
```

Subsequent lines use `key=value` format:

```text
bridge_account=legacy-1
bridge_label=Legacy Account 1
original_sender=923001112223@c.us
original_message_id=false_1234567890@c.us_ABCDEF
original_timestamp=2026-03-26T10:00:00.000Z
detection=likely_cv
file_hash=abc123...
```

## Rules

- The first line must remain `[FALISHA_BRIDGE]`.
- Keys must stay lowercase with underscores.
- Values must remain single-line strings.
- New keys may be added, but existing keys should not be renamed without updating backend consumers.

## Current Backend Behavior

- The backend now preserves media captions as message text preview when present.
- This allows forwarded bridge metadata to remain visible in the WhatsApp inbox flow.

## Recommended Future Use

- Parse this block into structured metadata during direct backend ingest.
- Use `original_message_id` and `file_hash` for audit and dedupe analysis.