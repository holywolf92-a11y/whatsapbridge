import { Candidate } from './mockData';
import { getFrontendBaseUrl } from './publicUrl';

// Generate unique profile link for candidate (uses current frontend URL)
export function generateProfileLink(candidate: Candidate): string {
  const name = candidate.name || 'candidate';
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const candidateId = candidate.id || '';
  const baseUrl = getFrontendBaseUrl();
  return `${baseUrl}/profile/${candidateId}/${slug}`;
}

// Generate shareable recruiter CV link (uses current frontend URL)
export function generateCVShareLink(candidate: Candidate): string {
  const name = candidate.name || 'candidate';
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const candidateId = candidate.id || '';
  const baseUrl = getFrontendBaseUrl();
  return `${baseUrl}/cv/${candidateId}/${slug}`;
}

// Copy to clipboard helper
export function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(resolve)
        .catch(() => {
          // Fallback to traditional method
          fallbackCopyToClipboard(text, resolve, reject);
        });
    } else {
      // Use fallback method directly
      fallbackCopyToClipboard(text, resolve, reject);
    }
  });
}

// Fallback method using textarea
function fallbackCopyToClipboard(text: string, resolve: () => void, reject: (error: Error) => void): void {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea invisible
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        resolve();
      } else {
        reject(new Error('Copy command was unsuccessful'));
      }
    } catch (err) {
      document.body.removeChild(textArea);
      reject(err as Error);
    }
  } catch (err) {
    reject(err as Error);
  }
}