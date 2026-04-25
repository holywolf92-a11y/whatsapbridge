import http from 'http';
import { URL } from 'url';
import QRCode from 'qrcode';
import { loadConfig } from './config/config';
import { createLogger } from './utils/logger';
import { FileBackedDedupeService } from './services/dedupeService';
import { DeliveryService } from './services/deliveryService';
import { MediaHandler } from './handlers/mediaHandler';
import { MessageHandler } from './handlers/messageHandler';
import { SessionManager } from './services/sessionManager';
import { AccountControlService } from './services/accountControlService';

async function readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}

function renderScanPage(accountId: string, options?: { notice?: string | null; error?: string | null }): string {
  const escapedAccountId = JSON.stringify(accountId);
  const notice = options?.notice ? String(options.notice) : '';
  const error = options?.error ? String(options.error) : '';
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>WhatsApp Bridge Scan</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f7fb;
        --panel: #ffffff;
        --text: #122033;
        --muted: #5c6a7c;
        --accent: #0f8f54;
        --border: #d8e0eb;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        background: radial-gradient(circle at top, #ffffff 0%, var(--bg) 58%);
        color: var(--text);
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .panel {
        width: min(100%, 720px);
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 20px;
        box-shadow: 0 18px 48px rgba(18, 32, 51, 0.08);
        padding: 28px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 28px;
      }
      p {
        margin: 0 0 16px;
        color: var(--muted);
        line-height: 1.5;
      }
      .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      button, .button-link {
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        font: inherit;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .primary {
        background: var(--accent);
        color: white;
      }
      .secondary {
        background: #edf2f7;
        color: var(--text);
      }
      .status {
        padding: 14px 16px;
        border-radius: 14px;
        background: #f8fafc;
        border: 1px solid var(--border);
        margin-bottom: 20px;
        white-space: pre-wrap;
      }
      .notice {
        padding: 12px 14px;
        border-radius: 14px;
        margin-bottom: 16px;
        font-size: 14px;
      }
      .notice.success {
        background: #edf9f1;
        color: #12623f;
        border: 1px solid #b8e3c7;
      }
      .notice.error {
        background: #fff1f1;
        color: #9b1c1c;
        border: 1px solid #f3c2c2;
      }
      .qr-wrap {
        display: grid;
        place-items: center;
        min-height: 340px;
        border: 1px dashed var(--border);
        border-radius: 18px;
        background: #fcfdff;
        overflow: hidden;
      }
      .qr-wrap img {
        width: min(100%, 360px);
        height: auto;
        display: block;
      }
      .hint {
        margin-top: 18px;
        font-size: 14px;
      }
      code {
        background: #eef4f8;
        padding: 2px 6px;
        border-radius: 6px;
      }
    </style>
  </head>
  <body>
    <main class="panel">
      <h1>WhatsApp QR Scan</h1>
      <p>Open this local page, click connect if needed, and scan the QR with the WhatsApp account you want to link.</p>
      ${notice ? `<div class="notice success">${notice}</div>` : ''}
      ${error ? `<div class="notice error">${error}</div>` : ''}
      <div class="actions">
        <a id="connectBtn" class="button-link primary" href="/sessions/${accountId}/connect-ui">Start / Refresh QR</a>
        <button id="statusBtn" class="secondary">Check Status</button>
      </div>
      <div id="status" class="status">Waiting to start...</div>
      <div id="qrWrap" class="qr-wrap">QR code will appear here.</div>
      <p class="hint">Account: <code>${accountId}</code></p>
    </main>
    <script>
      const accountId = ${escapedAccountId};
      const statusEl = document.getElementById('status');
      const qrWrap = document.getElementById('qrWrap');
      let qrPoll = null;
      let statusPoll = null;

      function clearPolls() {
        if (qrPoll) {
          clearInterval(qrPoll);
          qrPoll = null;
        }
        if (statusPoll) {
          clearInterval(statusPoll);
          statusPoll = null;
        }
      }

      function setStatus(message) {
        statusEl.textContent = message;
      }

      function setQr(imageUrl) {
        if (!imageUrl) {
          qrWrap.textContent = 'QR code will appear here.';
          return;
        }
        qrWrap.innerHTML = '<img alt="WhatsApp QR" src="' + imageUrl + '" />';
      }

      async function fetchStatus() {
        const response = await fetch('/status');
        const payload = await response.json();
        const session = Array.isArray(payload.sessions)
          ? payload.sessions.find((item) => item.accountId === accountId)
          : null;

        if (!session) {
          setStatus('No session found for account ' + accountId);
          return null;
        }

        setStatus('Status: ' + session.status + '\nLast event: ' + (session.lastEventAt || 'n/a') + '\nLast error: ' + (session.lastError || 'none'));
        return session;
      }

      async function fetchQr() {
        const qrImageUrl = '/sessions/' + encodeURIComponent(accountId) + '/qr-image?ts=' + Date.now();
        const response = await fetch(qrImageUrl, { method: 'HEAD' });
        if (!response.ok) {
          setQr(null);
          return false;
        }

        setQr(qrImageUrl);
        return true;
      }

      function startPolling() {
        clearPolls();

        qrPoll = setInterval(fetchQr, 3000);
        statusPoll = setInterval(async () => {
          const session = await fetchStatus();
          if (!session) {
            return;
          }

          if (session.status === 'connected') {
            clearPolls();
            setQr(null);
            setStatus('Connected. QR scan complete.');
            return;
          }

          if (session.status === 'idle') {
            window.location.href = '/sessions/' + encodeURIComponent(accountId) + '/connect-ui';
          }
        }, 4000);
      }

      document.getElementById('statusBtn').addEventListener('click', fetchStatus);
      void (async () => {
        const session = await fetchStatus();
        const hasQr = await fetchQr();

        if (session && session.status === 'idle' && !hasQr) {
          window.location.href = '/sessions/' + encodeURIComponent(accountId) + '/connect-ui';
          return;
        }

        startPolling();
      })();
    </script>
  </body>
</html>`;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const dedupeService = new FileBackedDedupeService(config.dedupeStorePath);
  const accountControlService = new AccountControlService(config.accountControlPath);
  const deliveryService = new DeliveryService(config, logger);
  const mediaHandler = new MediaHandler(config, dedupeService, deliveryService, logger);
  const messageHandler = new MessageHandler(mediaHandler, logger);
  const sessionManager = new SessionManager(config.sessionDataPath, config.accounts, messageHandler, accountControlService, logger);

  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(404).end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? `127.0.0.1:${config.healthPort}`}`);

    if (url.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, service: 'falisha-whatsapp-bridge' }));
      return;
    }

    if (url.pathname === '/status') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        bridgeMode: config.bridgeMode,
        sessions: sessionManager.snapshot(),
        dedupe: dedupeService.stats(),
        controls: accountControlService.getState(),
      }));
      return;
    }

    const qrMatch = url.pathname.match(/^\/sessions\/([^/]+)\/qr$/);
    if (qrMatch) {
      const accountId = decodeURIComponent(qrMatch[1]);
      const qrCode = sessionManager.getQrCode(accountId);

      if (!qrCode) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'qr_not_available', accountId }));
        return;
      }

      const qrImageDataUrl = await QRCode.toDataURL(qrCode, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 320,
      });

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, accountId, qrCode, qrImageDataUrl }));
      return;
    }

    const qrImageMatch = url.pathname.match(/^\/sessions\/([^/]+)\/qr-image$/);
    if (qrImageMatch) {
      const accountId = decodeURIComponent(qrImageMatch[1]);
      const qrCode = sessionManager.getQrCode(accountId);

      if (!qrCode) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('QR not available');
        return;
      }

      const qrPng = await QRCode.toBuffer(qrCode, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 320,
      });

      res.writeHead(200, {
        'content-type': 'image/png',
        'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      });
      res.end(qrPng);
      return;
    }

    const scanMatch = url.pathname.match(/^\/sessions\/([^/]+)\/scan$/);
    if (scanMatch) {
      const accountId = decodeURIComponent(scanMatch[1]);
      const notice = url.searchParams.get('notice');
      const error = url.searchParams.get('error');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(renderScanPage(accountId, { notice, error }));
      return;
    }

    const connectUiMatch = url.pathname.match(/^\/sessions\/([^/]+)\/connect-ui$/);
    if (connectUiMatch) {
      const accountId = decodeURIComponent(connectUiMatch[1]);
      try {
        await sessionManager.connectAccount(accountId);
        res.writeHead(302, {
          location: `/sessions/${encodeURIComponent(accountId)}/scan?notice=${encodeURIComponent('QR requested. If it expires, click Start / Refresh QR again.')}`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.writeHead(302, {
          location: `/sessions/${encodeURIComponent(accountId)}/scan?error=${encodeURIComponent(message)}`,
        });
      }
      res.end();
      return;
    }

    const pairingCodeMatch = url.pathname.match(/^\/sessions\/([^/]+)\/pairing-code$/);
    if (pairingCodeMatch && req.method === 'POST') {
      try {
        const accountId = decodeURIComponent(pairingCodeMatch[1]);
        const body = await readJsonBody(req);
        const phoneNumber = typeof body.phoneNumber === 'string' ? body.phoneNumber : '';
        const result = await sessionManager.requestPairingCode(accountId, phoneNumber);

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, ...result }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'pairing_code_failed', message }));
      }
      return;
    }

    const connectMatch = url.pathname.match(/^\/sessions\/([^/]+)\/connect$/);
    if (connectMatch && req.method === 'POST') {
      try {
        const accountId = decodeURIComponent(connectMatch[1]);
        await sessionManager.connectAccount(accountId);

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, accountId }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'connect_failed', message }));
      }
      return;
    }

    const restartMatch = url.pathname.match(/^\/sessions\/([^/]+)\/restart$/);
    if (restartMatch && req.method === 'POST') {
      try {
        const accountId = decodeURIComponent(restartMatch[1]);
        await sessionManager.forceRestartAccount(accountId);

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, accountId }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'restart_failed', message }));
      }
      return;
    }

    const cancelMatch = url.pathname.match(/^\/sessions\/([^/]+)\/cancel$/);
    if (cancelMatch && req.method === 'POST') {
      try {
        const accountId = decodeURIComponent(cancelMatch[1]);
        await sessionManager.cancelSession(accountId);

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, accountId }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'cancel_failed', message }));
      }
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'not_found' }));
  });

  server.listen(config.healthPort, () => {
    logger.info({ port: config.healthPort, mode: config.bridgeMode, accountCount: config.accounts.length }, 'WhatsApp bridge health server listening');
  });

  await sessionManager.start();

  const shutdown = async () => {
    logger.info('Shutting down WhatsApp bridge');
    server.close();
    await sessionManager.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());

  // ── Enterprise safety net ─────────────────────────────────────────────────
  // RemoteAuth's 5-minute backup timer can throw ENOENT (Chrome "Default" dir
  // not yet present) inside an async setInterval callback.  Without these
  // handlers Node 15+ exits on any unhandled rejection, killing ALL sessions.
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error({ reason }, 'Unhandled promise rejection — process kept alive');
  });
  process.on('uncaughtException', (error: Error) => {
    logger.error({ error: error.message, stack: error.stack }, 'Uncaught exception — process kept alive');
  });
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(message);
  process.exit(1);
});