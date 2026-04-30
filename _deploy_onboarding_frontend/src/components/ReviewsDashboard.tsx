import { useState } from 'react';

const GOOGLE_REVIEW_URL =
  (import.meta as any).env?.VITE_GOOGLE_REVIEW_URL || 'https://g.page/r/CVmpd5dYUfULEBM/review';

export function ReviewsDashboard() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh', background: '#f8fafc' }}>

      {/* Minimal top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: '#fff',
        borderBottom: '1px solid #e5e7eb', flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>📋 Review QR & Share</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12, fontWeight: 600, color: '#fff',
              background: '#16a34a', borderRadius: 8,
              padding: '5px 12px', textDecoration: 'none',
            }}
          >
            ⭐ Google Reviews
          </a>
          <button
            onClick={() => setShowFeedback(v => !v)}
            style={{
              fontSize: 12, fontWeight: 600, color: '#374151',
              background: '#f3f4f6', border: '1px solid #e5e7eb',
              borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
            }}
          >
            {showFeedback ? '▲ Hide Feedback' : '▼ Internal Feedback'}
          </button>
        </div>
      </div>

      {/* QR page iframe — full height */}
      <iframe
        src="/review/qr"
        style={{
          flex: 1, width: '100%', border: 'none',
          minHeight: showFeedback ? '60vh' : 'calc(100vh - 49px)',
        }}
        title="Review QR Code"
      />

      {/* Collapsible internal feedback (lazy) */}
      {showFeedback && <FeedbackSection />}
    </div>
  );
}

// ── Lazy-loaded feedback list ──────────────────────────────────────────────
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

function FeedbackSection() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load once on mount
  useState(() => {
    fetch(`${API_BASE}/review/admin/feedback`)
      .then(r => r.json())
      .then(fb => setData(Array.isArray(fb.feedback) ? fb.feedback : Array.isArray(fb) ? fb : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  return (
    <div style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '16px', maxHeight: 380, overflowY: 'auto' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Internal Feedback (1–4 ★)
      </p>
      {loading && <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading…</p>}
      {!loading && data.length === 0 && <p style={{ fontSize: 13, color: '#9ca3af' }}>No feedback yet.</p>}
      {data.map((fb: any) => (
        <div key={fb.id} style={{
          padding: '10px 0', borderBottom: '1px solid #f3f4f6',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{
            fontSize: 12, fontWeight: 800, color: '#fff',
            background: fb.rating <= 2 ? '#dc2626' : '#d97706',
            borderRadius: 6, padding: '2px 7px', flexShrink: 0,
          }}>{fb.rating}★</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: '#374151', margin: '0 0 2px', lineHeight: 1.5 }}>
              {fb.message?.trim() || <em style={{ color: '#9ca3af' }}>No message</em>}
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
              {new Date(fb.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

