/**
 * WhatsApp Export Chat ZIP Parser
 *
 * Processes one or more WhatsApp "Export Chat > Include Media" ZIPs.
 * Parses _chat.txt to correlate each PDF with its sender + timestamp,
 * copies all PDFs to output/files/, writes manifest.csv + manifest.json,
 * and creates a final ZIP ready for the backend importer.
 *
 * Usage:
 *   node src/parseExportZip.ts  <zip1> [zip2] [zip3] ...
 *
 *   or via npm:
 *   INPUT_ZIPS="D:\path\to\chat1.zip,D:\path\to\chat2.zip" npm run parse-export
 *
 * The final output ZIP will be at:
 *   D:\falisha\whatsapp-history-extractor\whatsapp-export-<date>.zip
 */

import AdmZip from 'adm-zip';
import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';
import { Readable } from 'stream';

// ─── Config ──────────────────────────────────────────────────────────────────
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || 'D:\\falisha\\whatsapp-history-extractor\\output');
const BATCH_ID   = process.env.BATCH_ID || `whatsapp-export-${new Date().toISOString().slice(0, 10)}`;

// Date filter — default: accept everything
const START_MS = process.env.START_DATE ? new Date(process.env.START_DATE).getTime() : 0;
const END_MS   = process.env.END_DATE   ? new Date(process.env.END_DATE).getTime()   : Infinity;

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

// ─── WhatsApp chat.txt line patterns ─────────────────────────────────────────
// Android: "18/04/2026, 12:00 - +92 313 5678933: filename.pdf (file attached)"
// Android: "4/18/26, 12:00 AM - +92 313 5678933: filename.pdf (file attached)"
// iOS:     "[18/04/2026, 12:00:00] +92 313 5678933: ‎filename.pdf (file attached)"
// iOS:     "[4/18/26, 12:00:00 AM] +92 313 5678933: ‎filename.pdf (file attached)"
// Also matches: "<attached: filename.pdf>" and "‎<attached: filename.pdf>"

const ANDROID_LINE = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s+-\s+([^:]+):\s+(.+)$/i;
const IOS_LINE     = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s+([^:]+):\s+(.+)$/i;

// Patterns that indicate a file attachment in the message body
const FILE_ATTACHED_PATTERNS = [
  /^‎?(.+?\.pdf)\s+\(file attached\)$/i,          // "filename.pdf (file attached)"
  /^<attached:\s*(.+?\.pdf)>$/i,                   // "<attached: filename.pdf>"
  /^‎<attached:\s*(.+?\.pdf)>$/i,                  // "‎<attached: filename.pdf>"
  /^‎(.+?\.pdf)$/i,                                // bare "filename.pdf" with BOM char
];

function parseAttachedFilename(body: string): string | null {
  const trimmed = body.trim();
  for (const pat of FILE_ATTACHED_PATTERNS) {
    const m = trimmed.match(pat);
    if (m) return m[1].trim();
  }
  // Also handle just "filename.pdf" as the whole message body with no other text
  if (/^[\u200e\u200f]?[^\n]+\.pdf$/i.test(trimmed)) {
    return trimmed.replace(/^[\u200e\u200f]+/, '').trim();
  }
  return null;
}

function parseDate(dateStr: string, timeStr: string): Date | null {
  try {
    // Normalize: DD/MM/YYYY or MM/DD/YY or M/D/YY etc.
    const dateParts = dateStr.split('/');
    const timeParts = timeStr.trim();

    let day: number, month: number, year: number;

    if (dateParts.length === 3) {
      const a = parseInt(dateParts[0], 10);
      const b = parseInt(dateParts[1], 10);
      let c  = parseInt(dateParts[2], 10);
      if (c < 100) c += 2000;

      // Heuristic: if first number > 12, it must be day (DD/MM/YYYY)
      if (a > 12) {
        day = a; month = b; year = c;
      } else if (b > 12) {
        // second number > 12 means MM/DD/YYYY
        month = a; day = b; year = c;
      } else {
        // Ambiguous — assume DD/MM/YYYY (most common outside US)
        day = a; month = b; year = c;
      }
    } else {
      return null;
    }

    // Build ISO string
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${normaliseTime(timeParts)}`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function normaliseTime(t: string): string {
  // "12:00", "12:00:00", "12:00 AM", "12:00:00 PM"
  const ampm = /([AP]M)/i.exec(t);
  let base = t.replace(/\s*[AP]M/i, '').trim();
  const parts = base.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const s = parts[2] || '00';
  if (ampm) {
    if (ampm[1].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (ampm[1].toUpperCase() === 'AM' && h === 12) h = 0;
  }
  return `${String(h).padStart(2, '0')}:${m}:${s}`;
}

function senderToNumber(sender: string): string {
  // Remove non-digit chars except leading +
  return sender.replace(/[^\d+]/g, '').replace(/^\+/, '');
}

function csvEscape(v: string): string {
  const s = String(v || '');
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function safeFilename(name: string, idx: number): string {
  const ext  = path.extname(name) || '.pdf';
  const base = path.basename(name, ext).replace(/[^\w.-]/g, '_').slice(0, 80);
  return `${base}-${String(idx).padStart(4, '0')}${ext}`;
}

// ─── Parse one WhatsApp export ZIP ───────────────────────────────────────────
async function processZip(
  zipPath: string,
  manifest: ManifestEntry[],
  filesDir: string,
  stats: { found: number; copied: number; noMeta: number; outOfRange: number },
) {
  console.log(`\n📂 Processing: ${zipPath}`);
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  // Find _chat.txt
  const chatEntry = entries.find(e =>
    e.entryName.toLowerCase().endsWith('_chat.txt') ||
    e.entryName.toLowerCase() === 'chat.txt'
  );

  // Build a map: filename (lowercase) → { sender, timestamp }
  const fileMeta = new Map<string, { sender: string; ts: Date }>();

  if (chatEntry) {
    const raw = chatEntry.getData().toString('utf-8');
    const lines = raw.split(/\r?\n/);
    let parsed = 0;

    for (const line of lines) {
      const m = line.match(ANDROID_LINE) || line.match(IOS_LINE);
      if (!m) continue;

      const [, dateStr, timeStr, senderRaw, body] = m;
      const filename = parseAttachedFilename(body);
      if (!filename || !filename.toLowerCase().endsWith('.pdf')) continue;

      const ts = parseDate(dateStr, timeStr);
      if (!ts) continue;

      const sender = senderRaw.trim();
      fileMeta.set(filename.toLowerCase(), { sender, ts });
      parsed++;
    }
    console.log(`  📄 _chat.txt parsed — ${parsed} PDF attachment lines found`);
  } else {
    console.log(`  ⚠️  No _chat.txt found — timestamps/senders will be unknown`);
  }

  // Process all PDF entries in the ZIP
  const pdfEntries = entries.filter(e =>
    e.entryName.toLowerCase().endsWith('.pdf') && !e.isDirectory
  );
  console.log(`  📎 PDF files in ZIP: ${pdfEntries.length}`);

  for (const entry of pdfEntries) {
    stats.found++;
    const originalName = path.basename(entry.entryName);
    const meta = fileMeta.get(originalName.toLowerCase());

    // Date filter
    if (meta?.ts) {
      const ms = meta.ts.getTime();
      if (ms < START_MS || ms > END_MS) {
        stats.outOfRange++;
        continue;
      }
    }

    const idx       = stats.found;
    const safeName  = safeFilename(originalName, idx);
    const destPath  = path.join(filesDir, safeName);
    const relPath   = `files/${safeName}`;
    const msgId     = `export-${String(idx).padStart(6, '0')}`;
    const ts        = meta?.ts ? meta.ts.toISOString() : new Date().toISOString();
    const sender    = meta?.sender ? senderToNumber(meta.sender) : 'unknown';
    const chatId    = sender !== 'unknown' ? `${sender}@s.whatsapp.net` : 'unknown';

    if (!meta) stats.noMeta++;

    // Write file
    const buffer = entry.getData();
    await fs.writeFile(destPath, buffer);
    stats.copied++;

    console.log(`    ✅ ${originalName}  →  ${safeName}  (${Math.round(buffer.length / 1024)} KB)  from=${sender}  ts=${ts.slice(0, 10)}`);

    manifest.push({
      chatId,
      senderNumber: sender,
      messageTimestamp: ts,
      localFilePath: relPath,
      messageId: msgId,
      originalFilename: originalName,
      mimeType: 'application/pdf',
    });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Collect input ZIP paths from args or env
  const args = process.argv.slice(2);
  const envZips = process.env.INPUT_ZIPS ? process.env.INPUT_ZIPS.split(',').map(s => s.trim()) : [];
  const zipPaths = [...args, ...envZips].filter(Boolean);

  if (zipPaths.length === 0) {
    console.error('\n❌ No ZIP files specified.\n');
    console.error('Usage:');
    console.error('  npx ts-node src/parseExportZip.ts "C:\\path\\to\\WhatsApp Chat.zip"');
    console.error('  npx ts-node src/parseExportZip.ts zip1.zip zip2.zip zip3.zip');
    console.error('\n  Or set INPUT_ZIPS env var:');
    console.error('  $env:INPUT_ZIPS="C:\\path\\to\\chat1.zip,C:\\path\\to\\chat2.zip"');
    console.error('  npm run parse-export\n');
    process.exit(1);
  }

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   WhatsApp Export Chat ZIP Parser                   ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  console.log(`  Input ZIPs  : ${zipPaths.length}`);
  console.log(`  Output      : ${OUTPUT_DIR}`);
  console.log(`  Batch ID    : ${BATCH_ID}`);
  if (START_MS > 0)       console.log(`  Start date  : ${new Date(START_MS).toISOString().slice(0, 10)}`);
  if (END_MS < Infinity)  console.log(`  End date    : ${new Date(END_MS).toISOString().slice(0, 10)}`);

  const filesDir = path.join(OUTPUT_DIR, 'files');
  await fs.mkdir(filesDir, { recursive: true });

  const manifest: ManifestEntry[] = [];
  const stats = { found: 0, copied: 0, noMeta: 0, outOfRange: 0 };

  for (const zipPath of zipPaths) {
    const resolved = path.resolve(zipPath);
    try {
      await fs.access(resolved);
    } catch {
      console.error(`\n⚠️  ZIP not found, skipping: ${resolved}`);
      continue;
    }
    await processZip(resolved, manifest, filesDir, stats);
  }

  console.log('\n──────────────────────────────────────────────────────');

  if (manifest.length === 0) {
    console.log('\n⚠️  No PDFs extracted. Check that your ZIP files contain PDF attachments.');
    console.log('   Make sure you exported with "Include Media" on.');
    process.exit(0);
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

  // Build ZIP
  const zipOutPath = path.join(path.dirname(OUTPUT_DIR), `${BATCH_ID}.zip`);
  const AdmZipOut = new AdmZip();
  AdmZipOut.addLocalFile(csvPath);
  AdmZipOut.addLocalFile(jsonPath);
  const fileEntries = await fs.readdir(filesDir);
  for (const f of fileEntries) {
    AdmZipOut.addLocalFile(path.join(filesDir, f), 'files');
  }
  AdmZipOut.writeZip(zipOutPath);

  console.log(`\n  📄 manifest.csv    →  ${manifest.length} entries`);
  console.log(`  📄 manifest.json   →  ${manifest.length} entries`);
  console.log(`  📦 Output ZIP      →  ${zipOutPath}`);

  console.log('\n  ── Stats ───────────────────────────────────────────');
  console.log(`  PDFs found        : ${stats.found}`);
  console.log(`  PDFs extracted    : ${stats.copied}`);
  console.log(`  No metadata       : ${stats.noMeta}  (sender/timestamp unknown)`);
  console.log(`  Out of date range : ${stats.outOfRange}`);
  console.log('  ────────────────────────────────────────────────────');

  console.log('\n  ╔════════════════════════════════════════════════════════════╗');
  console.log('  ║  Next step — run the backend importer:                     ║');
  console.log('  ╠════════════════════════════════════════════════════════════╣');
  console.log(`  ║  cd D:\\falisha\\recruitment-portal-backend                  ║`);
  console.log(`  ║  npm run backfill:whatsapp-pdf -- \\                        ║`);
  console.log(`  ║    --manifest "${zipOutPath}"  \\`);
  console.log(`  ║    --batch-id ${BATCH_ID} \\`);
  console.log(`  ║    --dry-run                                                ║`);
  console.log('  ╚════════════════════════════════════════════════════════════╝\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
