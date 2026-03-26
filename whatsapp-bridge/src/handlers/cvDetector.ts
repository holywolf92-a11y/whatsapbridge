import path from 'path';
import type { Message, MessageMedia } from 'whatsapp-web.js';
import type { BridgeConfig, DetectionResult } from '../types';

const KEYWORDS = ['cv', 'resume', 'biodata', 'curriculum', 'vitae'];
const DOCUMENT_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']);

export function classifyMedia(
  media: MessageMedia,
  message: Message,
  config: BridgeConfig,
): DetectionResult {
  const fileName = String(media.filename ?? '');
  const normalizedFileName = fileName.toLowerCase();
  const extension = path.extname(normalizedFileName);
  const mimeType = String(media.mimetype ?? '').toLowerCase();
  const body = String(message.body ?? '').toLowerCase();
  const reasons: string[] = [];

  if (config.allowedMimeTypes.includes(mimeType)) {
    reasons.push('allowed_mime_type');
  }

  if (DOCUMENT_EXTENSIONS.has(extension)) {
    reasons.push('known_document_extension');
  }

  if (KEYWORDS.some((keyword) => normalizedFileName.includes(keyword))) {
    reasons.push('filename_keyword');
  }

  if (KEYWORDS.some((keyword) => body.includes(keyword))) {
    reasons.push('message_keyword');
  }

  if (mimeType.startsWith('image/')) {
    reasons.push('image_upload');
  }

  const verdict =
    reasons.includes('filename_keyword') || reasons.includes('message_keyword') || mimeType.includes('pdf') || mimeType.includes('word')
      ? 'likely_cv'
      : reasons.length > 0
        ? 'possible_cv'
        : 'not_cv';

  return {
    verdict,
    reasons,
    normalizedFileName,
    mimeType,
  };
}