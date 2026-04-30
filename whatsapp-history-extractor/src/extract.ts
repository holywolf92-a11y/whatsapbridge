/**
 * WhatsApp Historical PDF Extractor — Baileys-based
 *
 * This script connects to WhatsApp as a NEW linked device (requires one QR scan).
 * WhatsApp automatically pushes message history when a device first links.
 * We capture all PDF/document messages in a configurable date window, download
 * them, and write a manifest.csv + ZIP package ready for the backend importer.
 *
 * Safety:
 *  - This is a SEPARATE session from the live production bridge (different ./auth dir).
 *  - It does not touch the bridge's RemoteAuth session or Railway volume.
 *  - WhatsApp supports up to 4 linked devices. The bridge uses 1.
 *
 * Usage:
 *   START_DATE=2024-01-01T00:00:00Z \
 *   END_DATE=2024-03-31T23:59:59Z \
 *   MAX_PDFS=200 \
 *   DRY_RUN=false \
 *   npm run extract
 */

import makeWASocket, {
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
  isJidGroup,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import AdmZip from 'adm-zip';
import P from 'pino';
import { promises as fs } from 'fs';
import path from 'path';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';

// ─── Config from environment ──────────────────────────────────────────────────
const OUTPUT_DIR  = path.resolve(process.env.OUTPUT_DIR  || './output');
const AUTH_DIR    = path.resolve(process.env.AUTH_DIR    || './auth');
const START_ISO   = process.env.START_DATE || '2020-01-01T00:00:00.000Z';
const END_ISO     = process.env.END_DATE   || new Date().toISOString();
const MAX_PDFS    = parseInt(process.env.MAX_PDFS    || '200', 10);
const TIMEOUT_MIN = parseInt(process.env.TIMEOUT_MIN || '10', 10);
const DRY_RUN     = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const BATCH_ID    = process.env.BATCH_ID || `wa-baileys-${new Date().toISOString().slice(0, 10)}`;
const SKIP_GROUPS = process.env.SKIP_GROUPS !== 'false'; // default true

const START_MS = new Date(START_ISO).getTime();
const END_MS   = new Date(END_ISO).getTime();

// ─── Types ────────────────────────────────────────────────────────────────────
interface ManifestEntry {
  chatId: string;
  senderNumber: string;
  messageTimestamp: string;
  localFilePath: string;
  messageId: string;
  originalFilename: string;
  mimeType: string;
}

interface RunStats {
  historyBatches: number;
  messagesScanned: number;
  pdfsFound: number;
  pdfsDownloaded: number;
  pdfsSkipped: number;
  downloadErrors: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Suppress all Baileys internal logs; we have our own output.
const SILENT_LOGGER = P({ level: 'silent' });

function extractDocumentMessage(msg: any): any {
  const m = msg?.message;
  if (!m) return null;
  if (m.documentMessage)                                        return m.documentMessage;
  if (m.documentWithCaptionMessage?.message?.documentMessage)   return m.documentWithCaptionMessage.message.documentMessage;
  return null;
}

function isPdf(docMsg: any): boolean {
  if (!docMsg) return false;
  const mime = String(docMsg.mimetype || '').toLowerCase();
  const name = String(docMsg.fileName || '').toLowerCase();
  return mime.includes('pdf') || name.endsWith('.pdf');
}

function inRange(epochSec: any): boolean {
  if (epochSec == null) return false;
  const ms = parseInt(String(epochSec), 10) * 1000;
  return ms >= START_MS && ms <= END_MS;
}

function jidToPhone(jid: string): string {
  return (jid || '').replace(/[@:].*/g, '');
}

function buildSafeFileName(originalName: string, msgId: string): string {
  const ext  = path.extname(originalName) || '.pdf';
  const base = path.basename(originalName, ext).replace(/[^\w.-]/g, '_').slice(0, 80);
  return `${base}-${msgId.slice(-8)}${ext}`;
}

function csvEscape(v: string): string {
  const s = String(v || '');
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? `"${s.replace(/"/g, '""')}"` : s;
}

// ─── Module-level state (survives reconnects) ─────────────────────────────────
const STATS: RunStats = {
  historyBatches: 0, messagesScanned: 0,
  pdfsFound: 0, pdfsDownloaded: 0, pdfsSkipped: 0, downloadErrors: 0,
};
const MANIFEST: ManifestEntry[] = [];
let FINISHED = false;
let RECONNECT_ATTEMPTS = 0;
const MAX_RECONNECTS = 3;
let GLOBAL_TIMEOUT: ReturnType<typeof setTimeout> | null = null;

// ─── Main entry ───────────────────────────────────────────────────────────────
async function run() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(AUTH_DIR, { recursive: true });
  await fs.mkdir(path.join(OUTPUT_DIR, 'files'), { recursive: true });

  if (RECONNECT_ATTEMPTS === 0) {
    // Print banner only on first run
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║   WhatsApp Historical PDF Extractor  —  Baileys     ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    console.log(`  Window      : ${START_ISO}  →  ${END_ISO}`);
    console.log(`  Max PDFs    : ${MAX_PDFS}`);
    console.log(`  Dry-run     : ${DRY_RUN}`);
    console.log(`  Skip groups : ${SKIP_GROUPS}`);
    console.log(`  Output      : ${OUTPUT_DIR}`);
    console.log(`  Auth        : ${AUTH_DIR}`);
    console.log(`  Batch ID    : ${BATCH_ID}`);
    console.log(`  Timeout     : ${TIMEOUT_MIN} min`);
    console.log('');
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  if (RECONNECT_ATTEMPTS === 0) {
    console.log(`  Baileys v${version.join('.')} (server-latest=${isLatest})\n`);
  }

  const sock = makeWASocket({
    version,
    logger: SILENT_LOGGER as any,
    auth: state,
    syncFullHistory: true,       // Request full history from WhatsApp servers
    markOnlineOnConnect: false,  // Don't appear online
    generateHighQualityLinkPreview: false,
    getMessage: async () => undefined,
  });

  sock.ev.on('creds.update', saveCreds);

  // (Re-)arm global timeout guard each connection cycle
  if (GLOBAL_TIMEOUT) clearTimeout(GLOBAL_TIMEOUT);
  GLOBAL_TIMEOUT = setTimeout(async () => {
    if (!FINISHED) {
      FINISHED = true;
      console.log(`\n⏱  Timeout (${TIMEOUT_MIN} min). Finalising with data received so far.`);
      await finalise(sock, MANIFEST, STATS);
      process.exit(0);
    }
  }, TIMEOUT_MIN * 60_000);
  GLOBAL_TIMEOUT.unref();

  // ── Connection events ────────────────────────────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update as any;

    if (qr) {
      // Write browser-viewable HTML file
      const qrHtmlPath = path.resolve(process.env.OUTPUT_DIR || './output', '..', 'qr.html');
      try {
        const svgString = await QRCode.toString(qr, { type: 'svg', width: 400 });
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="20">
  <title>WhatsApp QR Code — Scan Now</title>
  <style>
    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #f0f2f5; margin: 0; }
    h1 { color: #128C7E; margin-bottom: 8px; }
    p { color: #555; margin-bottom: 24px; text-align: center; }
    .qr { background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .step { background: #25D366; color: white; border-radius: 8px; padding: 12px 24px; margin-top: 20px; font-weight: bold; }
    small { color: #888; margin-top: 12px; }
  </style>
</head>
<body>
  <h1>Scan to Link WhatsApp Device</h1>
  <p>Open WhatsApp on your phone &rarr; <b>Settings &rarr; Linked Devices &rarr; Link a Device</b></p>
  <div class="qr">${svgString}</div>
  <div class="step">Point your phone camera at the QR above</div>
  <small>This page refreshes every 20 seconds (QR codes expire). Keep this page open until connected.</small>
</body>
</html>`;
        await fs.mkdir(path.dirname(qrHtmlPath), { recursive: true });
        await fs.writeFile(qrHtmlPath, htmlContent, 'utf-8');
        console.log(`\n╔═══════════════════════════════════════════════════════╗`);
        console.log(`║  QR CODE READY — open this file in your browser:     ║`);
        console.log(`║                                                       ║`);
        console.log(`║  ${qrHtmlPath.padEnd(53)}║`);
        console.log(`╚═══════════════════════════════════════════════════════╝\n`);
      } catch (qrErr: any) {
        // Fallback to terminal
        qrcodeTerminal.generate(qr, { small: true }, (code: string) => console.log(code));
      }
    }

    if (connection === 'open') {
      console.log(`\n✅ Connected to WhatsApp!  (attempt ${RECONNECT_ATTEMPTS + 1})\n`);
      console.log('   Waiting for history sync…  (WhatsApp pushes old messages automatically)');
      console.log('   This usually takes 1-5 minutes for large accounts.\n');
    }

    if (connection === 'close') {
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
      if (GLOBAL_TIMEOUT) { clearTimeout(GLOBAL_TIMEOUT); GLOBAL_TIMEOUT = null; }

      if (code === DisconnectReason.loggedOut) {
        console.error('\n❌ Session logged out. Delete ./auth folder and re-run to get a new QR.');
        process.exit(1);
      }

      if (FINISHED) return;

      // If we already received at least one history batch, finalise now rather
      // than reconnecting — more batches won't arrive on reconnect once history
      // sync is interrupted.
      if (STATS.historyBatches > 0) {
        FINISHED = true;
        console.log(`\n⚠️  Connection dropped after ${STATS.historyBatches} batch(es). Finalising with data received.`);
        await finalise(sock, MANIFEST, STATS);
        process.exit(0);
      }

      // No batches yet — try to reconnect (up to MAX_RECONNECTS)
      RECONNECT_ATTEMPTS++;
      if (RECONNECT_ATTEMPTS > MAX_RECONNECTS) {
        console.error(`\n❌ Connection dropped ${MAX_RECONNECTS} times without receiving history.`);
        console.error('   Try deleting the ./auth folder and re-running to do a fresh QR link.');
        process.exit(1);
      }
      const delayMs = RECONNECT_ATTEMPTS * 3_000;
      console.log(`  Connection dropped (reason=${code}). Reconnecting in ${delayMs / 1000}s… (attempt ${RECONNECT_ATTEMPTS}/${MAX_RECONNECTS})`);
      setTimeout(run, delayMs);
    }
  });

  // ── History sync ─────────────────────────────────────────────────────────
  sock.ev.on('messaging-history.set' as any, async ({ messages, isLatest: batchIsLatest }: any) => {
    STATS.historyBatches++;
    const batchCount = Array.isArray(messages) ? messages.length : 0;

    // Compute actual date range of this batch for diagnostics
    let batchMinMs = Infinity, batchMaxMs = 0;
    if (Array.isArray(messages)) {
      for (const m of messages) {
        const ts = parseInt(String(m?.messageTimestamp || 0), 10) * 1000;
        if (ts > 0) { batchMinMs = Math.min(batchMinMs, ts); batchMaxMs = Math.max(batchMaxMs, ts); }
      }
    }
    const batchFrom = batchMinMs < Infinity ? new Date(batchMinMs).toISOString().slice(0, 10) : 'unknown';
    const batchTo   = batchMaxMs > 0        ? new Date(batchMaxMs).toISOString().slice(0, 10) : 'unknown';
    console.log(`  📦 History batch #${STATS.historyBatches}:  ${batchCount} messages  |  dates: ${batchFrom} → ${batchTo}  |  isLatest=${batchIsLatest}`);

    if (Array.isArray(messages)) {
      await processBatch(messages, sock, STATS, MANIFEST);
    }

    if (batchIsLatest) {
      FINISHED = true;
      if (GLOBAL_TIMEOUT) { clearTimeout(GLOBAL_TIMEOUT); GLOBAL_TIMEOUT = null; }
      console.log('\n✅ WhatsApp history sync complete.');
      await finalise(sock, MANIFEST, STATS);
      process.exit(0);
    }
  });
}

// ─── Process one history batch ────────────────────────────────────────────────
async function processBatch(
  messages: any[],
  sock: any,
  stats: RunStats,
  manifest: ManifestEntry[],
) {
  for (const msg of messages) {
    stats.messagesScanned++;

    if (!inRange(msg.messageTimestamp)) continue;

    const chatId: string = msg.key?.remoteJid || '';
    if (!chatId) continue;
    if (SKIP_GROUPS && isJidGroup(chatId)) continue;

    const docMsg = extractDocumentMessage(msg);
    if (!docMsg || !isPdf(docMsg)) continue;

    stats.pdfsFound++;

    if (stats.pdfsDownloaded >= MAX_PDFS) {
      stats.pdfsSkipped++;
      continue;
    }

    const msgId        = String(msg.key?.id || `auto-${stats.pdfsFound}`);
    const epochSec     = parseInt(String(msg.messageTimestamp), 10);
    const msgTs        = new Date(epochSec * 1000).toISOString();
    const fromMe       = Boolean(msg.key?.fromMe);
    const senderJid    = fromMe ? (sock.user?.id || chatId) : (msg.key?.participant || chatId);
    const senderNumber = jidToPhone(senderJid);
    const originalName = docMsg.fileName || `document-${msgId}.pdf`;
    const safeFile     = buildSafeFileName(originalName, msgId);
    const relPath      = `files/${safeFile}`;
    const absPath      = path.join(OUTPUT_DIR, relPath);

    if (DRY_RUN) {
      const sizeKb = Math.round(Number(docMsg.fileLength || 0) / 1024);
      console.log(`    [DRY] ${originalName}  (${sizeKb} KB)  from=${senderNumber}  chat=${chatId}  ts=${msgTs}`);
      manifest.push({ chatId, senderNumber, messageTimestamp: msgTs, localFilePath: relPath, messageId: msgId, originalFilename: originalName, mimeType: docMsg.mimetype || 'application/pdf' });
      stats.pdfsDownloaded++;
      continue;
    }

    try {
      const sizeKb = Math.round(Number(docMsg.fileLength || 0) / 1024);
      process.stdout.write(`    ⬇  ${originalName} (${sizeKb} KB) … `);

      const buffer = await downloadMediaMessage(
        msg,
        'buffer',
        {},
        {
          logger: SILENT_LOGGER as any,
          reuploadRequest: sock.updateMediaMessage,
        }
      ) as Buffer;

      await fs.writeFile(absPath, buffer);
      console.log('✅');
      manifest.push({ chatId, senderNumber, messageTimestamp: msgTs, localFilePath: relPath, messageId: msgId, originalFilename: originalName, mimeType: docMsg.mimetype || 'application/pdf' });
      stats.pdfsDownloaded++;
    } catch (err: any) {
      stats.downloadErrors++;
      console.log(`❌  ${err.message}`);
    }
  }
}

// ─── Write manifest + ZIP ────────────────────────────────────────────────────
async function finalise(sock: any, manifest: ManifestEntry[], stats: RunStats) {
  console.log('\n──────────────────────────────────────────────────────');

  if (manifest.length === 0) {
    console.log('\n⚠️  No PDFs found in date range.');
    console.log('   Possible reasons:');
    console.log('   1. WhatsApp only synced recent history to this new device.');
    console.log('      For data older than ~3 months, WhatsApp may limit what is pushed.');
    console.log('   2. No PDFs were actually sent in this window.');
    console.log('   3. Try a wider date range or run without START_DATE/END_DATE to see');
    console.log('      all PDFs that WhatsApp synced.');
    printStats(stats);
    return;
  }

  // Write manifest.csv
  const csvPath = path.join(OUTPUT_DIR, 'manifest.csv');
  const csvRows = [
    'chatId,senderNumber,messageTimestamp,localFilePath,messageId,originalFilename,mimeType',
    ...manifest.map(e =>
      [e.chatId, e.senderNumber, e.messageTimestamp, e.localFilePath, e.messageId, e.originalFilename, e.mimeType]
        .map(csvEscape).join(',')
    ),
  ];
  await fs.writeFile(csvPath, csvRows.join('\n'), 'utf-8');

  // Write manifest.json
  const jsonPath = path.join(OUTPUT_DIR, 'manifest.json');
  await fs.writeFile(jsonPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`\n  📄 manifest.csv   →  ${manifest.length} entries  (${csvPath})`);
  console.log(`  📄 manifest.json  →  ${manifest.length} entries  (${jsonPath})`);

  if (!DRY_RUN) {
    // Package output/ into a ZIP ready for the importer
    const zipPath = path.join(path.dirname(OUTPUT_DIR), `${BATCH_ID}.zip`);
    const zip = new AdmZip();
    zip.addLocalFile(csvPath);
    zip.addLocalFile(jsonPath);
    try {
      const filesDir = path.join(OUTPUT_DIR, 'files');
      const entries  = await fs.readdir(filesDir);
      for (const entry of entries) {
        zip.addLocalFile(path.join(filesDir, entry), 'files');
      }
    } catch { /* no files yet */ }
    zip.writeZip(zipPath);

    console.log(`\n  📦 ZIP package    →  ${zipPath}`);
    console.log('\n  ╔═══════════════════════════════════════════════════════════════╗');
    console.log('  ║  Next step: run the backend importer (dry-run first)          ║');
    console.log('  ╠═══════════════════════════════════════════════════════════════╣');
    console.log(`  ║  cd ../recruitment-portal-backend                             ║`);
    console.log(`  ║  npm run backfill:whatsapp-pdf -- \\                           ║`);
    console.log(`  ║    --manifest "${zipPath}" \\`);
    console.log(`  ║    --batch-id ${BATCH_ID} \\`);
    console.log(`  ║    --start-date ${START_ISO} \\`);
    console.log(`  ║    --end-date ${END_ISO} \\`);
    console.log(`  ║    --dry-run                                                  ║`);
    console.log('  ╚═══════════════════════════════════════════════════════════════╝');
  } else {
    console.log('\n  [DRY RUN] ZIP packaging skipped. Re-run without DRY_RUN=true to download PDFs.');
  }

  printStats(stats);
}

function printStats(s: RunStats) {
  console.log('\n  ── Stats ───────────────────────────────────────────');
  console.log(`  History batches  : ${s.historyBatches}`);
  console.log(`  Messages scanned : ${s.messagesScanned}`);
  console.log(`  PDFs found       : ${s.pdfsFound}`);
  console.log(`  PDFs downloaded  : ${s.pdfsDownloaded}`);
  console.log(`  PDFs skipped     : ${s.pdfsSkipped}  (max reached)`);
  console.log(`  Download errors  : ${s.downloadErrors}`);
  console.log('  ────────────────────────────────────────────────────\n');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
