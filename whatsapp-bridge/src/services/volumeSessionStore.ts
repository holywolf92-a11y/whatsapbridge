/**
 * RemoteAuth store backed by the Railway persistent volume.
 *
 * RemoteAuth calls:
 *   save({ session })     — session = full path WITHOUT .zip, e.g. /data/sessions/RemoteAuth-whatsapp1
 *                           The zip already exists at `${session}.zip`; we copy it to our backups dir.
 *   extract({ session, path }) — session = name only, e.g. RemoteAuth-whatsapp1
 *                                path = where to write the zip so RemoteAuth can unzip it.
 *   sessionExists({ session }) — session = name only; return true if we have a backup zip.
 *   delete({ session })   — session = name only; remove the backup zip.
 */
import fs from 'fs';
import path from 'path';

export class VolumeSessionStore {
  constructor(private readonly backupsDir: string) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  async sessionExists({ session }: { session: string }): Promise<boolean> {
    const name = path.basename(session); // strip any leading path if present
    return fs.existsSync(path.join(this.backupsDir, `${name}.zip`));
  }

  async save({ session }: { session: string }): Promise<void> {
    // session = full path without extension, supplied by RemoteAuth.
    const zipSource = `${session}.zip`;
    const name = path.basename(session);
    const zipDest = path.join(this.backupsDir, `${name}.zip`);
    fs.copyFileSync(zipSource, zipDest);
  }

  async extract({ session, path: extractPath }: { session: string; path: string }): Promise<void> {
    // session = bare session name; extractPath = where RemoteAuth wants the zip written.
    const name = path.basename(session);
    const zipSrc = path.join(this.backupsDir, `${name}.zip`);
    fs.copyFileSync(zipSrc, extractPath);
  }

  async delete({ session }: { session: string }): Promise<void> {
    const name = path.basename(session);
    const zipPath = path.join(this.backupsDir, `${name}.zip`);
    try { fs.unlinkSync(zipPath); } catch { /* already gone */ }
  }

  /** Returns true if a backup zip exists for the given whatsapp-web.js clientId. */
  hasBackup(clientId: string): boolean {
    return fs.existsSync(path.join(this.backupsDir, `RemoteAuth-${clientId}.zip`));
  }
}
