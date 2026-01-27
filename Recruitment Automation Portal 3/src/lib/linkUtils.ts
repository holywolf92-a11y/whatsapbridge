import { Candidate } from './mockData';

// Generate unique profile link for candidate
export function generateProfileLink(candidate: Candidate): string {
  const slug = candidate.name.toLowerCase().replace(/\s+/g, '-');
  return `https://falisha.com/profile/${candidate.id}/${slug}`;
}

// Generate shareable recruiter CV link
export function generateCVShareLink(candidate: Candidate): string {
  const slug = candidate.name.toLowerCase().replace(/\s+/g, '-');
  return `https://falisha.com/cv/${candidate.id}/${slug}`;
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