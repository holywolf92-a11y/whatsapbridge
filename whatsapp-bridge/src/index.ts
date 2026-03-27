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
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(message);
  process.exit(1);
});