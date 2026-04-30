import { useState, useEffect, useCallback, useRef } from 'react';
import { CANONICAL_FRONTEND_URL } from '../lib/publicUrl';

// ─── Config ──────────────────────────────────────────────────────────────────
const GOOGLE_REVIEW_URL =
  (import.meta as any).env?.VITE_GOOGLE_REVIEW_URL || 'https://g.page/r/CVmpd5dYUfULEBM/review';
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
const BUSINESS_NAME = (import.meta as any).env?.VITE_BUSINESS_NAME || 'Falisha Manpower';
const BUSINESS_LOGO_URL: string = (import.meta as any).env?.VITE_BUSINESS_LOGO_URL || '/logo.png';
const GOOGLE_REVIEW_FLOW_PATH = '/review/google';

const SOCIAL_ACTIONS = [
  {
    label: 'Google Business Profile',
    icon: '📍',
    buttonLabel: 'Open Review Setup',
    accent: '#16a34a',
    internalHref: GOOGLE_REVIEW_FLOW_PATH,
    description: 'Open the guided Google review flow with emojis and comment help.',
  },
  {
    label: 'LinkedIn',
    icon: 'in',
    buttonLabel: 'Follow On LinkedIn',
    accent: '#0A66C2',
    url: 'https://www.linkedin.com/company/falishaenterprises',
    description: 'Follow company updates and hiring news.',
  },
  {
    label: 'Facebook',
    icon: 'f',
    buttonLabel: 'Follow On Facebook',
    accent: '#1877F2',
    url: 'https://www.facebook.com/falishaenterprises.pk/',
    description: 'See updates, posts, and community activity.',
  },
  {
    label: 'Instagram',
    icon: '◎',
    buttonLabel: 'Follow On Instagram',
    accent: '#E4405F',
    url: 'https://www.instagram.com/falisha.manpower',
    description: 'View reels, stories, and daily highlights.',
  },
  {
    label: 'TikTok',
    icon: '♪',
    buttonLabel: 'Follow On TikTok',
    accent: '#111827',
    url: 'https://www.tiktok.com/@falishamanpower',
    description: 'Watch short videos and follow new content.',
  },
  {
    label: 'YouTube',
    icon: '▶',
    buttonLabel: 'Subscribe On YouTube',
    accent: '#FF0000',
    url: 'https://youtube.com/@falishamanpower897?si=-sKB5_wZdoICyLbj',
    description: 'Watch videos and subscribe for updates.',
  },
] as const;

// ─── Mood options (emoji + label + auto-comment) ─────────────────────────────
const MOODS = [
  { emoji: '🤩', label: 'Exceptional', comment: 'Absolutely exceptional service! Far exceeded all my expectations. Highly recommended to everyone looking for professional manpower services.' },
  { emoji: '😍', label: 'Amazing',     comment: 'Amazing experience from start to finish. Professional team, smooth process, and outstanding results!' },
  { emoji: '🙌', label: 'Excellent',   comment: 'Excellent service and very professional staff. Very satisfied with the overall experience.' },
  { emoji: '⚡', label: 'Fast & Easy', comment: 'Quick response and smooth process. Everything was handled efficiently and professionally.' },
  { emoji: '🤝', label: 'Professional',comment: 'Highly professional team with great communication throughout. Smooth and hassle-free experience.' },
  { emoji: '💪', label: 'Recommended', comment: 'Highly recommended to others! Friendly team and great support. Will definitely use their services again.' },
] as const;

// ─── Countries with flags ────────────────────────────────────────────────────
const COUNTRIES = [
  { flag: '🇦🇪', name: 'UAE' },
  { flag: '🇸🇦', name: 'Saudi Arabia' },
  { flag: '🇶🇦', name: 'Qatar' },
  { flag: '🇰🇼', name: 'Kuwait' },
  { flag: '🇧🇭', name: 'Bahrain' },
  { flag: '🇴🇲', name: 'Oman' },
  { flag: '🇵🇰', name: 'Pakistan' },
  { flag: '🇧🇩', name: 'Bangladesh' },
  { flag: '🇮🇳', name: 'India' },
  { flag: '🇵🇭', name: 'Philippines' },
  { flag: '🇲🇾', name: 'Malaysia' },
  { flag: '🇬🇧', name: 'UK' },
] as const;

// ─── Recent activity (seeded social proof) ───────────────────────────────────
const RECENT_REVIEWS = [
  { name: 'Muhammad A.', country: '🇵🇰', text: 'Great service, found my job in UAE!',          ago: '2 days ago'  },
  { name: 'Tariq S.',    country: '🇧🇩', text: 'Professional team, very smooth process.',       ago: '4 days ago'  },
  { name: 'Vikram R.',   country: '🇮🇳', text: 'Fast process, highly recommended!',             ago: '6 days ago'  },
  { name: 'Ali H.',      country: '🇵🇰', text: 'Excellent support. Got placed in Saudi Arabia.', ago: '1 week ago'  },
  { name: 'Reza K.',     country: '🇧🇩', text: 'Trusted manpower agency, 5 stars!',             ago: '10 days ago' },
];

// ─── 200 pre-written review templates ────────────────────────────────────────
const REVIEW_TEMPLATES = [
  'Best manpower agency in Islamabad.',
  'Excellent overseas employment service.',
  'Very professional recruitment agency.',
  'I got job through FALISHA manpower.',
  'Highly recommended consultancy.',
  'Good overseas job guidance.',
  'Trusted manpower agency in Pakistan.',
  'Helpful staff and good service.',
  'I am satisfied with their process.',
  'Best recruitment agency for Gulf jobs.',
  'I got Saudi Arabia job through them.',
  'Good manpower recruitment service.',
  'Excellent visa processing help.',
  'Professional overseas employment agency.',
  'Fast response and good support.',
  'Trusted overseas job consultant.',
  'Good data bank of candidates.',
  'Recommended manpower agency.',
  'Honest and reliable service.',
  'Good consultancy in Islamabad.',
  'I am working in UAE through them.',
  'Best agency for Qatar jobs.',
  'Good Bahrain employment service.',
  'Excellent Saudi recruitment support.',
  'I got job visa through FALISHA manpower.',
  'Good Gulf job consultancy.',
  'Professional recruitment team.',
  'Highly satisfied with service.',
  'Best manpower exporter from Pakistan.',
  'Good technical worker placement.',
  'I got electrician job abroad.',
  'Good welding job recruitment.',
  'Best HVAC technician placement.',
  'Excellent mechanical worker job.',
  'I am working in Saudi project.',
  'Good construction job consultancy.',
  'Trusted manpower recruitment.',
  'Fast processing agency.',
  'Professional overseas recruitment.',
  'Good overseas career help.',
  'I got labor job in Bahrain.',
  'Best manpower agency in Islamabad.',
  'Excellent job placement service.',
  'Good overseas employment support.',
  'Trusted recruitment firm.',
  'Helpful recruitment staff.',
  'Good communication service.',
  'I am satisfied with FALISHA manpower.',
  'Recommended agency for foreign jobs.',
  'Professional manpower consultancy.',
  'Good Gulf employment agency.',
  'Best recruitment service in Pakistan.',
  'Excellent manpower supply.',
  'Trusted overseas job agency.',
  'I got foreign employment opportunity.',
  'Good visa assistance service.',
  'Professional recruitment process.',
  'Highly recommended manpower agency.',
  'Best manpower consultant in Islamabad.',
  'Good overseas placement agency.',
  'I got job in Saudi Arabia.',
  'Excellent recruitment service.',
  'Good manpower support.',
  'Trusted overseas consultancy.',
  'Professional staff behavior.',
  'Fast visa guidance.',
  'Good job opportunity abroad.',
  'I am satisfied with their service.',
  'Best manpower recruitment.',
  'Excellent HR service.',
  'Good recruitment partner.',
  'Trusted manpower exporter.',
  'Best overseas employment service.',
  'Professional manpower team.',
  'Good technical job placement.',
  'Excellent visa processing.',
  'Highly satisfied client.',
  'Recommended consultancy.',
  'Good manpower service.',
  'Best recruitment agency.',
  'I got job visa for Turkey.',
  'Good Russia job consultancy.',
  'Best Belarus employment agency.',
  'Excellent Malaysia job service.',
  'Trusted overseas recruitment.',
  'Good foreign employment help.',
  'Professional recruitment support.',
  'Best manpower data bank.',
  'Highly recommended agency.',
  'Excellent job placement.',
  'Good Gulf manpower recruitment.',
  'Best agency for Saudi workers.',
  'Excellent overseas career service.',
  'Trusted manpower consultancy.',
  'Good HR recruitment service.',
  'Professional overseas agency.',
  'Best manpower provider.',
  'Excellent recruitment company.',
  'Highly satisfied service.',
  'Good job processing support.',
  'Best manpower recruitment in Islamabad.',
  'Excellent overseas employment help.',
  'Professional manpower exporter.',
  'Good placement service.',
  'Trusted agency for Gulf jobs.',
  'Best overseas job consultancy.',
  'Excellent recruitment management.',
  'Good worker placement service.',
  'Highly recommended consultancy.',
  'Professional recruitment firm.',
  'Good manpower supply agency.',
  'Best for skilled workers.',
  'Excellent technical recruitment.',
  'Trusted overseas job service.',
  'Good visa processing help.',
  'Professional staff.',
  'Best recruitment partner.',
  'Excellent manpower export.',
  'Highly satisfied client.',
  'Good overseas employment.',
  'I am working abroad through them.',
  'Best Gulf job agency.',
  'Good recruitment experience.',
  'Trusted consultancy.',
  'Excellent manpower service.',
  'Professional recruitment help.',
  'Best manpower agency Pakistan.',
  'Good overseas job support.',
  'Highly recommended.',
  'Excellent recruitment service.',
  'Good job opportunity abroad.',
  'Best manpower consultant.',
  'Trusted recruitment agency.',
  'Professional overseas service.',
  'Good visa guidance.',
  'Excellent placement agency.',
  'Highly satisfied experience.',
  'Best manpower exporter.',
  'Good recruitment team.',
  'Trusted manpower partner.',
  'Excellent HR recruitment.',
  'Good Gulf employment service.',
  'Best manpower agency Islamabad.',
  'Professional consultancy service.',
  'Good overseas placement.',
  'Trusted recruitment firm.',
  'Excellent manpower support.',
  'Highly recommended agency.',
  'Good recruitment help.',
  'Best manpower consultant Pakistan.',
  'Excellent overseas job agency.',
  'Good manpower recruitment.',
  'Professional staff support.',
  'Trusted overseas employment.',
  'Best recruitment service.',
  'Good visa processing.',
  'Excellent manpower exporter.',
  'Highly satisfied service.',
  'Recommended manpower agency.',
  'Good overseas consultancy.',
  'Best manpower recruitment service.',
  'Excellent job placement agency.',
  'Professional HR service.',
  'Trusted manpower consultancy.',
  'Good recruitment partner.',
  'Best overseas employment agency.',
  'Excellent manpower supply.',
  'Highly recommended service.',
  'Good Gulf recruitment.',
  'Trusted recruitment support.',
  'Best manpower exporter Pakistan.',
  'Excellent recruitment firm.',
  'Good overseas job consultant.',
  'Professional manpower service.',
  'Trusted agency.',
  'Best manpower consultancy.',
  'Excellent job help.',
  'Good recruitment experience.',
  'Highly satisfied client.',
  'Recommended agency.',
  'Excellent manpower agency.',
  'Good overseas employment.',
  'Professional recruitment team.',
  'Trusted manpower partner.',
  'Best job placement agency.',
  'Excellent visa help.',
  'Good recruitment support.',
  'Highly professional service.',
  'Best manpower consultant.',
  'Trusted overseas agency.',
  'Excellent manpower recruitment.',
  'Good job consultancy.',
  'Professional HR recruitment.',
  'Best overseas employment service.',
  'Highly satisfied.',
  'Good manpower supply.',
  'Excellent recruitment help.',
  'Trusted recruitment agency.',
  'Best manpower agency Pakistan.',
  'Highly recommended recruitment service.',
];

// ─── Analytics (fire-and-forget) ────────────────────────────────────────────
function track(event: string, extra?: Record<string, unknown>) {
  fetch(`${API_BASE}/review/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, ...extra }),
  }).catch(() => {});
}

// ─── Google How-To animated demo (mobile-first, loops forever) ──────────────
function GoogleHowToDemo() {
  const [step, setStep] = useState(0); // 0=stars · 1=textarea · 2=post · 3=done

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % 4), 2400);
    return () => clearInterval(id);
  }, []);

  // Finger position over each UI element (absolute within outer div)
  const fingerTop  = ['76px',  '134px', '198px', '198px'][step];
  const fingerLeft = ['50%',   '56%',   '74%',   '74%' ][step];

  return (
    <div style={{ position: 'relative', marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textAlign: 'center', margin: '0 0 10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        How to post on Google 👇
      </p>

      {/* ── Mock Google review card ── */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 16, padding: '14px 14px 12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', position: 'relative' }}>

        {/* Google header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#4285f4 25%,#34a853 50%,#fbbc04 75%,#ea4335)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>G</div>
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 600, flex: 1 }}>Write a review for {BUSINESS_NAME}</span>
        </div>

        {/* Stars row */}
        <div style={{ textAlign: 'center', marginBottom: 10, padding: '5px 4px 6px', borderRadius: 10, transition: 'all 0.45s ease', background: step === 0 ? '#fffbeb' : 'transparent', border: step === 0 ? '2px solid #fbbf24' : '2px solid transparent' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            {[1,2,3,4,5].map(n => (
              <span key={n} style={{ fontSize: 27, color: '#f59e0b', display: 'inline-block', transition: `transform ${n * 0.07}s ease`, transform: step === 0 ? `scale(${0.9 + n * 0.04})` : 'scale(1)' }}>★</span>
            ))}
          </div>
          {step === 0 && (
            <div style={{ fontSize: 10, color: '#b45309', fontWeight: 700, marginTop: 3, animation: 'stepFadeIn 0.3s ease' }}>Tap all 5 stars</div>
          )}
        </div>

        {/* Textarea with paste tooltip */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          {step === 1 && (
            <div style={{ position: 'absolute', top: -30, left: 8, background: '#1d4ed8', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 7, padding: '4px 10px', whiteSpace: 'nowrap', zIndex: 20, animation: 'stepFadeIn 0.3s ease', boxShadow: '0 2px 8px rgba(29,78,216,0.38)' }}>
              📋 Long-press → Paste
              <div style={{ position: 'absolute', bottom: -5, left: 14, width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1d4ed8' }} />
            </div>
          )}
          <div style={{ background: step === 1 ? '#eff6ff' : '#f9fafb', border: step === 1 ? '2px solid #3b82f6' : '1.5px solid #e5e7eb', borderRadius: 10, padding: '8px 10px', minHeight: 50, fontSize: 13, color: '#374151', transition: 'all 0.4s ease', lineHeight: 1.5 }}>
            {step >= 1 ? (
              <span style={{ color: '#111827', fontStyle: 'italic', animation: step === 1 ? 'stepFadeIn 0.35s ease' : undefined }}>
                &ldquo;Great experience finding work abroad 🌍&rdquo;
                {step === 1 && <span style={{ borderRight: '2px solid #3b82f6', marginLeft: 1, animation: 'cursorBlink 0.75s step-end infinite' }}>&nbsp;</span>}
              </span>
            ) : (
              <span style={{ color: '#9ca3af' }}>Share your experience…</span>
            )}
          </div>
        </div>

        {/* Post button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 2 }}>
          <div style={{ padding: '8px 22px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'default', transition: 'all 0.35s ease', transform: step === 2 ? 'scale(1.09)' : 'scale(1)', background: step === 2 ? '#1a73e8' : step === 3 ? '#0f9d58' : '#e8f0fe', color: step >= 2 ? '#fff' : '#1a73e8', boxShadow: step === 2 ? '0 3px 14px rgba(26,115,232,0.45)' : step === 3 ? '0 3px 10px rgba(15,157,88,0.38)' : 'none' }}>
            {step === 3 ? '✅ Posted!' : 'Post'}
          </div>
        </div>

        {/* Success overlay on done */}
        {step === 3 && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: 'rgba(16,185,129,0.10)', pointerEvents: 'none', animation: 'stepFadeIn 0.35s ease' }} />
        )}
      </div>

      {/* ── Animated 👆 finger cursor ── */}
      <div style={{ position: 'absolute', top: fingerTop, left: fingerLeft, fontSize: 22, pointerEvents: 'none', transition: 'top 0.55s cubic-bezier(0.34,1.56,0.64,1), left 0.55s cubic-bezier(0.34,1.56,0.64,1)', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.15))', zIndex: 15, animation: 'fingerTap 0.55s ease-in-out infinite' }}>
        👆
      </div>

      {/* ── Progress dots ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ height: 6, borderRadius: 3, background: i === step ? '#3b82f6' : '#e5e7eb', width: i === step ? 22 : 6, transition: 'all 0.35s ease' }} />
        ))}
      </div>

      {/* ── Step label ── */}
      <p key={step} style={{ fontSize: 12, color: '#374151', textAlign: 'center', margin: '7px 0 0', fontWeight: 700, animation: 'stepFadeIn 0.3s ease', minHeight: 18 }}>
        {step === 0 && '1️⃣  Tap ⭐⭐⭐⭐⭐ five stars'}
        {step === 1 && '2️⃣  Long-press in box → Paste'}
        {step === 2 && '3️⃣  Tap "Post" to submit'}
        {step === 3 && '🎉  Done! Your review is live'}
      </p>
    </div>
  );
}

// ─── CSS keyframe animations (injected once) ─────────────────────────────────
const STYLE_ID = 'review-page-keyframes';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
    @keyframes floatBob {
      0%, 100% { transform: translateY(0px) scale(1); }
      50%       { transform: translateY(-7px) scale(1.06); }
    }
    @keyframes popIn {
      0%   { transform: scale(0.55); opacity: 0; }
      70%  { transform: scale(1.12); opacity: 1; }
      100% { transform: scale(1);    opacity: 1; }
    }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseRing {
      0%   { transform: scale(1);   opacity: 0.45; }
      100% { transform: scale(1.7); opacity: 0; }
    }
    @keyframes checkPop {
      0%   { transform: scale(0); }
      65%  { transform: scale(1.35); }
      100% { transform: scale(1); }
    }
    @keyframes moodBounce {
      0%, 100% { transform: scale(1); }
      40%      { transform: scale(1.22) rotate(-6deg); }
      70%      { transform: scale(1.12) rotate(4deg); }
    }
    @keyframes slideInLeft {
      from { transform: translateX(-100%); opacity: 0; }
      to   { transform: translateX(0);     opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes pulseGlow {
      0%   { box-shadow: 0 0 0px rgba(22,163,74,0.0); }
      50%  { box-shadow: 0 0 18px rgba(22,163,74,0.65); }
      100% { box-shadow: 0 0 0px rgba(22,163,74,0.0); }
    }
    @keyframes instructGlow {
      0%   { box-shadow: 0 0 0px rgba(59,130,246,0.0); border-color: #bfdbfe; }
      50%  { box-shadow: 0 0 14px rgba(59,130,246,0.50); border-color: #3b82f6; }
      100% { box-shadow: 0 0 0px rgba(59,130,246,0.0); border-color: #bfdbfe; }
    }
    @keyframes cursorBlink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0; }
    }
    @keyframes fingerTap {
      0%, 100% { transform: scale(1)    rotate(-10deg); }
      40%      { transform: scale(0.85) rotate(-10deg); }
    }
    @keyframes stepFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(el);
}

// ─── Animated star ────────────────────────────────────────────────────────────
function Star({
  value,
  filled,
  hovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  value: number;
  filled: boolean;
  hovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const active = filled || hovered;
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={`${value} star${value > 1 ? 's' : ''}`}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
        transform: active ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.15s ease',
      }}
    >
      <svg
        width="54" height="54" viewBox="0 0 24 24"
        fill={active ? '#FBBF24' : '#D1D5DB'}
        stroke={active ? '#F59E0B' : '#9CA3AF'}
        strokeWidth="1.2"
        style={{
          filter: active ? 'drop-shadow(0 2px 8px rgba(251,191,36,0.6))' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    </button>
  );
}

// ─── Small inline star (read-only) ───────────────────────────────────────────
function StarSmall({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24"
      fill={filled ? '#FBBF24' : '#D1D5DB'} stroke={filled ? '#F59E0B' : '#9CA3AF'} strokeWidth="1.2">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

// ─── QR Code Share helpers ───────────────────────────────────────────────────
function ShareButton({ color, icon, label, onClick }: { color: string; icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: color, border: 'none', borderRadius: 14, padding: '10px 14px',
      cursor: 'pointer', color: '#fff', minWidth: 60,
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)', transition: 'transform 0.15s, opacity 0.15s',
    }}
      onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
      onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      <span style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.03em' }}>{label}</span>
    </button>
  );
}

function SocialActionList({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ marginTop: compact ? 18 : 24, textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        <span style={{ color: '#6b7280', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
          REVIEW AND FOLLOW
        </span>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>

      <p style={{
        color: '#6b7280',
        fontSize: compact ? 12 : 13,
        lineHeight: 1.6,
        margin: compact ? '0 0 12px' : '0 0 14px',
        textAlign: compact ? 'center' : 'left',
      }}>
        Review us on Google first, then choose any social platform below to follow {BUSINESS_NAME}.
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        {SOCIAL_ACTIONS.map((action) => (
          (() => {
            const href = action.internalHref || action.url;
            const external = !action.internalHref;

            return (
              <a
                key={action.label}
                href={href}
                target={external ? '_blank' : '_self'}
                rel={external ? 'noopener noreferrer' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: compact ? '12px 13px' : '14px 15px',
                  borderRadius: 18,
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  boxShadow: '0 8px 22px rgba(15,23,42,0.06)',
                  textDecoration: 'none',
                }}
              >
                <div style={{
                  width: compact ? 42 : 46,
                  height: compact ? 42 : 46,
                  borderRadius: 14,
                  background: action.accent,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: action.icon.length > 1 ? 16 : 22,
                  fontWeight: 800,
                  flexShrink: 0,
                  letterSpacing: action.icon.length > 1 ? '-0.04em' : undefined,
                }}>
                  {action.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#111827', fontSize: 14, fontWeight: 800, marginBottom: 2 }}>
                    {action.label}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>
                    {action.description}
                  </div>
                </div>

                <div style={{
                  background: action.accent,
                  color: '#ffffff',
                  borderRadius: 999,
                  padding: compact ? '9px 11px' : '10px 13px',
                  fontSize: 11,
                  fontWeight: 800,
                  textAlign: 'center',
                  lineHeight: 1.2,
                  flexShrink: 0,
                  minWidth: compact ? 92 : 108,
                }}>
                  {action.buttonLabel}
                </div>
              </a>
            );
          })()
        ))}
      </div>
    </div>
  );
}

// ─── QR Code Page ─────────────────────────────────────────────────────────────
function QRCodePage() {
  useEffect(() => { injectStyles(); }, []);
  const reviewUrl = `${window.location.origin}/review`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=H&data=${encodeURIComponent(reviewUrl)}`;
  const shareText = `Rate your experience with ${BUSINESS_NAME} — it only takes 30 seconds!`;
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    {
      label: 'WhatsApp',
      icon: '💬',
      color: '#25D366',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${reviewUrl}`)}`,
    },
    {
      label: 'Telegram',
      icon: '✈️',
      color: '#229ED9',
      url: `https://t.me/share/url?url=${encodeURIComponent(reviewUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      label: 'Facebook',
      icon: '👍',
      color: '#1877F2',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reviewUrl)}`,
    },
    {
      label: 'Twitter / X',
      icon: '🐦',
      color: '#000000',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(reviewUrl)}`,
    },
  ];

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: BUSINESS_NAME, text: shareText, url: reviewUrl }).catch(() => {});
    }
  };
  const handleCopy = () => {
    navigator.clipboard?.writeText(reviewUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(155deg,#f0f9ff 0%,#ffffff 48%,#f5f3ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <div style={{ maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 8px 36px rgba(0,0,0,0.10)', borderRadius: 28, padding: '36px 28px 28px', background: '#fff', border: '1px solid #f0f0f0', animation: 'fadeSlideUp 0.4s ease both' }}>

        {/* Header */}
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1e40af', marginBottom: 4 }}>{BUSINESS_NAME}</div>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Scan to rate your experience</p>

        {/* QR */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={qrSrc} alt="Review QR Code" style={{ width: 230, height: 230, borderRadius: 18, border: '1.5px solid #e5e7eb', display: 'block' }} />
        </div>
        <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 10, wordBreak: 'break-all', padding: '0 8px' }}>{reviewUrl}</p>

        {/* Print + Download */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18, marginBottom: 22 }}>
          <button onClick={() => window.print()} style={{ padding: '9px 22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 10px rgba(37,99,235,0.28)' }}>
            🖨️ Print
          </button>
          <a href={qrSrc} download="review-qr.png" style={{ padding: '9px 22px', background: '#f3f4f6', color: '#374151', borderRadius: 50, fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-block', border: '1.5px solid #e5e7eb' }}>
            ⬇️ Download
          </a>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ color: '#9ca3af', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>SHARE THIS LINK</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        {/* Social share buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          {shareLinks.map(s => (
            <ShareButton key={s.label} label={s.label} icon={s.icon} color={s.color}
              onClick={() => window.open(s.url, '_blank', 'noopener,noreferrer')} />
          ))}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <ShareButton label="More" icon="📤" color="#6366f1" onClick={handleNativeShare} />
          )}
        </div>

        {/* Copy link */}
        <button onClick={handleCopy} style={{
          width: '100%', padding: '12px', background: copied ? '#d1fae5' : '#f9fafb',
          border: `1.5px solid ${copied ? '#6ee7b7' : '#e5e7eb'}`, borderRadius: 14,
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          color: copied ? '#065f46' : '#374151', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {copied ? '✅ Link Copied!' : '🔗 Copy Review Link'}
        </button>

        <SocialActionList compact />

        <a href="/review" style={{ display: 'block', marginTop: 14, color: '#6b7280', fontSize: 12, textDecoration: 'underline' }}>← Back to Review Page</a>
      </div>
    </div>
  );
}

// ─── Main Review Page ─────────────────────────────────────────────────────────
type Screen = 'rating' | 'redirected' | 'low_form' | 'thank_you';

export function ReviewPage() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/review';
  const isQRCodeRoute = pathname === '/review/qr';
  const isGoogleReviewRoute = pathname === GOOGLE_REVIEW_FLOW_PATH;
  const isMenuRoute = pathname === '/review';

  if (isQRCodeRoute) {
    return <QRCodePage />;
  }

  useEffect(() => { injectStyles(); track('page_view'); }, []);

  // ── State ──────────────────────────────────────────────────────────────
  const [rating, setRating]               = useState(5); // default 5 stars
  const [hoverRating, setHoverRating]     = useState(0);
  const [selectedMood, setSelectedMood]   = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [comment, setComment]             = useState('');
  const [screen, setScreen]               = useState<Screen>('rating');
  const [submitting, setSubmitting]       = useState(false);
  const [submitStatus, setSubmitStatus]   = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
  const [animatingMood, setAnimatingMood] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [overlayVisible, setOverlayVisible]   = useState(false);
  const [highlightCTA, setHighlightCTA]       = useState(false);
  const [userName, setUserName]               = useState('');
  const [tickerIdx, setTickerIdx]             = useState(0);
  const textRef             = useRef<HTMLTextAreaElement>(null);
  const ctaRef              = useRef<HTMLDivElement | null>(null);
  const submittedCommentRef = useRef<string>(''); // preserve comment for redirected screen

  const displayRating = hoverRating || rating;
  const isGoodRating  = rating === 5;

  const LABELS: Record<number, string> = {
    1: 'Very Poor', 2: 'Poor', 3: 'Average', 4: 'Good', 5: 'Excellent ⭐',
  };

  // ── Handlers ────────────────────────────────────────────────────────────
  const triggerCTAHighlight = useCallback(() => {
    setHighlightCTA(false);
    // Force reflow so animation restarts even if already highlighted
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setHighlightCTA(true);
        setTimeout(() => setHighlightCTA(false), 2600); // 1.2s × 2 repeats + buffer
      });
    });
    setTimeout(() => {
      ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 180);
    if (navigator.vibrate) navigator.vibrate(40);
  }, []);

  const handleStarClick = useCallback((v: number) => {
    setRating(v);
    setHoverRating(0);
    track('star_select', { rating: v });
    if (v < 5) { setSelectedMood(null); setComment(''); }
    else triggerCTAHighlight();
  }, [triggerCTAHighlight]);

  const handleMoodClick = useCallback((idx: number) => {
    setAnimatingMood(idx);
    setTimeout(() => setAnimatingMood(null), 500);
    const deselect = selectedMood === idx;
    setSelectedMood(deselect ? null : idx);
    if (deselect) {
      setComment('');
    } else {
      const t = REVIEW_TEMPLATES[Math.floor(Math.random() * REVIEW_TEMPLATES.length)];
      setComment(t);
      track('template_select', { template_idx: idx, rating });
    }
    setTimeout(() => textRef.current?.focus(), 100);
    if (!deselect) triggerCTAHighlight();
  }, [selectedMood, rating, triggerCTAHighlight]);

  // Cycle recent-review ticker every 3.5s while on rating screen
  useEffect(() => {
    if (!isGoodRating) return;
    const id = setInterval(() => setTickerIdx(i => (i + 1) % RECENT_REVIEWS.length), 3500);
    return () => clearInterval(id);
  }, [isGoodRating]);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
        document.body.appendChild(el);
        el.focus(); el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      return true;
    } catch { return false; }
  };

  const handleSubmitGoogle = async () => {
    track('redirect_google', {
      rating,
      template_idx: selectedMood,
      country: selectedCountry !== null ? COUNTRIES[selectedCountry].name : null,
    });
    const finalComment = comment.trim();
    submittedCommentRef.current = finalComment;

    // MUST open window synchronously in the click handler — browsers block popups from async/setTimeout
    window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener,noreferrer');

    // Now copy (async is fine, Google tab is already opening in background)
    if (finalComment) {
      setSubmitStatus('copying');
      const ok = await copyToClipboard(finalComment);
      setSubmitStatus(ok ? 'copied' : 'error');
    }

    // Show instructional overlay for 1200ms, then dismiss
    setOverlayVisible(true);
    setTimeout(() => {
      setOverlayVisible(false);
      setScreen('redirected');
      setSubmitStatus('idle');
    }, 1200);
  };

  const handleFeedbackSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      track('feedback_submit', { rating });
      await fetch(`${API_BASE}/review/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, message: comment }),
      });
    } catch { /* silent */ }
    setSubmitting(false);
    setScreen('thank_you');
  }, [rating, comment]);

  const renderMenu = () => (
    <div style={{ animation: 'fadeSlideUp 0.4s ease both' }}>
      {renderHeader()}

      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', margin: '0 0 8px', lineHeight: 1.2 }}>
          Choose What You Want To Do
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
          Leave a Google review using our guided setup, or follow Falisha Manpower on your preferred platform.
        </p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg,#ecfdf5,#f0fdf4)',
        border: '1.5px solid #bbf7d0',
        borderRadius: 20,
        padding: '14px 16px',
        marginBottom: 18,
      }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#166534', margin: '0 0 5px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Recommended First
        </p>
        <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.6, margin: 0 }}>
          Tap Google Business Profile to open the old emoji-based review flow and post your review with guided steps.
        </p>
      </div>

      <SocialActionList />
    </div>
  );

  // ── Shared header ──────────────────────────────────────────────────────
  const renderHeader = () => (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      {BUSINESS_LOGO_URL ? (
        <img src={BUSINESS_LOGO_URL} alt={BUSINESS_NAME}
          style={{ height: 80, maxWidth: 220, margin: '0 auto 10px', objectFit: 'contain', display: 'block' }} />
      ) : (
        <div style={{
          width: 58, height: 58, borderRadius: 15,
          background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
          margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {BUSINESS_NAME}
      </div>
    </div>
  );

  // ── Rating screen ──────────────────────────────────────────────────────
  const renderRating = () => (
    <div style={{ animation: 'fadeSlideUp 0.4s ease both' }}>
      {renderHeader()}

      {/* Social proof anchor strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginBottom: 16, flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#fefce8', border: '1.5px solid #fde68a',
          borderRadius: 20, padding: '4px 12px',
          fontSize: 12, fontWeight: 700, color: '#92400e',
        }}>
          ⭐ 4.8 &nbsp;·&nbsp; 247+ Reviews
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: '#f0fdf4', border: '1.5px solid #bbf7d0',
          borderRadius: 20, padding: '4px 12px',
          fontSize: 12, fontWeight: 700, color: '#166534',
        }}>
          🌍 5,000+ Workers Placed
        </div>
      </div>

      {/* Reciprocity headline */}
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 5px', lineHeight: 1.25 }}>
          {userName.trim() ? `${userName.trim()}, how was your experience?` : 'How was your experience?'}
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.55 }}>
          We helped you find work abroad. 30 seconds of your time<br/>
          <strong style={{ color: '#374151' }}>helps us help thousands more.</strong>
        </p>
      </div>

      {/* Optional name field */}
      <div style={{ marginBottom: 18 }}>
        <input
          type="text"
          value={userName}
          onChange={e => setUserName(e.target.value)}
          placeholder="Your first name (optional)"
          maxLength={32}
          style={{
            width: '100%', padding: '10px 14px', boxSizing: 'border-box',
            border: '2px solid #e5e7eb', borderRadius: 14,
            fontSize: 14, color: '#111827', background: '#fafafa',
            outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#fff'; }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
        />
      </div>

      {/* Stars */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map(v => (
          <Star
            key={v} value={v}
            filled={v <= rating} hovered={v <= hoverRating}
            onClick={() => handleStarClick(v)}
            onMouseEnter={() => setHoverRating(v)}
            onMouseLeave={() => setHoverRating(0)}
          />
        ))}
      </div>

      {/* Rating badge */}
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <span key={displayRating} style={{
          display: 'inline-block', fontSize: 13, fontWeight: 700,
          color:      displayRating === 5 ? '#065f46' : displayRating >= 4 ? '#92400e' : '#991b1b',
          background: displayRating === 5 ? '#d1fae5' : displayRating >= 4 ? '#fef3c7' : '#fee2e2',
          padding: '4px 16px', borderRadius: 20, letterSpacing: '0.03em',
          animation: 'popIn 0.2s ease both',
        }}>
          {LABELS[displayRating] || 'Tap a star to rate'}
        </span>
      </div>

      {/* ── 5-star positive flow ────────────────────────────────────── */}
      {isGoodRating && (
        <div style={{ animation: 'fadeSlideUp 0.35s ease both' }}>

          {/* Mood picker */}
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10, textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            What describes your experience?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginBottom: 22 }}>
            {MOODS.map((m, idx) => {
              const active = selectedMood === idx;
              const bouncing = animatingMood === idx;
              return (
                <button key={idx} onClick={() => handleMoodClick(idx)} style={{
                  background: active ? '#eff6ff' : '#f9fafb',
                  border: `2px solid ${active ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: 16, padding: '12px 6px', cursor: 'pointer',
                  textAlign: 'center', transition: 'all 0.18s ease',
                  transform: bouncing ? 'scale(1.2)' : active ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: active ? '0 2px 14px rgba(59,130,246,0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                }}>
                  <div style={{
                    fontSize: 32, lineHeight: 1, display: 'block', marginBottom: 5,
                    animation: bouncing ? 'moodBounce 0.5s ease' : active ? 'floatBob 2.4s ease-in-out infinite' : 'none',
                  }}>
                    {m.emoji}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: active ? '#1d4ed8' : '#6b7280', letterSpacing: '0.02em' }}>
                    {m.label}
                  </div>
                  {active && (
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', background: '#3b82f6',
                      margin: '5px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      animation: 'checkPop 0.3s ease both',
                    }}>
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5">
                        <polyline points="2,6 5,9 10,3" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Comment box */}
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Add a Comment <span style={{ fontWeight: 400, color: '#9ca3af', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </p>
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <textarea
              ref={textRef}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Your comment… (auto-filled when you tap a mood above)"
              rows={3}
              style={{
                width: '100%', padding: '11px 36px 11px 13px',
                border: '2px solid #e5e7eb', borderRadius: 14,
                fontSize: 14, color: '#111827', background: '#fafafa',
                resize: 'none', outline: 'none', boxSizing: 'border-box',
                lineHeight: 1.5, fontFamily: 'inherit', transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
            />
            {comment && (
              <button onClick={() => setComment('')} style={{
                position: 'absolute', top: 9, right: 9, background: '#e5e7eb',
                border: 'none', borderRadius: '50%', width: 22, height: 22,
                cursor: 'pointer', fontSize: 14, color: '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}>×</button>
            )}
          </div>


          <div style={{
            background: '#f9fafb', border: '1.5px solid #e5e7eb',
            borderRadius: 14, padding: '9px 13px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💬</span>
            <div style={{ flex: 1, overflow: 'hidden' }} key={tickerIdx}>
              <p style={{
                fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 1px',
                animation: 'fadeSlideUp 0.4s ease both',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {RECENT_REVIEWS[tickerIdx].country} {RECENT_REVIEWS[tickerIdx].name}&nbsp;—&nbsp;
                <em style={{ fontWeight: 400 }}>"{RECENT_REVIEWS[tickerIdx].text}"</em>
              </p>
              <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, animation: 'fadeSlideUp 0.4s ease both' }}>
                ⭐⭐⭐⭐⭐ · {RECENT_REVIEWS[tickerIdx].ago}
              </p>
            </div>
          </div>

          {/* Animated how-to demo */}
          <div style={{ marginBottom: 10 }}>
            <GoogleHowToDemo />
          </div>

          {/* CTA — ref for scroll-into-view */}
          <div ref={ctaRef}>
          <button
            onClick={handleSubmitGoogle}
            disabled={submitStatus === 'copying'}
            style={{
              width: '100%', padding: '16px',
              background: submitStatus === 'copied'
                ? 'linear-gradient(135deg,#059669,#047857)'
                : submitStatus === 'error'
                  ? 'linear-gradient(135deg,#d97706,#b45309)'
                  : 'linear-gradient(135deg,#16a34a,#15803d)',
              color: '#fff', border: 'none', borderRadius: 18,
              fontSize: 16, fontWeight: 800,
              cursor: submitStatus === 'copying' ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(22,163,74,0.42)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, marginBottom: 6, letterSpacing: '0.01em',
              transition: 'all 0.2s',
              animation: highlightCTA ? 'pulseGlow 1.2s ease-in-out 2' : undefined,
            }}
          >
            {submitStatus === 'copying' && <><span style={{ fontSize: 18 }}>⏳</span> Copying…</>}
            {submitStatus === 'copied'  && <><span style={{ fontSize: 18 }}>✅</span> Copied! Opening Google…</>}
            {submitStatus === 'error'   && <><span style={{ fontSize: 18 }}>⚠️</span> Opening Google…</>}
            {submitStatus === 'idle'    && <><span style={{ fontSize: 20 }}>📋</span> Copy &amp; Post on Google</>}
          </button>
          {submitStatus === 'error' && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#b45309', margin: '4px 0 8px', fontWeight: 600 }}>
              Copy failed — paste manually in Google.
            </p>
          )}

          </div>
        </div>
      )}

      {/* ── 1–4 stars negative flow ─────────────────────────────────── */}
      {!isGoodRating && rating > 0 && (
        <div style={{ animation: 'fadeSlideUp 0.35s ease both' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 52, marginBottom: 8, animation: 'popIn 0.4s ease both' }}>😔</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 5px' }}>We're Sorry</h2>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Please tell us how we can improve.</p>
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="What went wrong? How can we improve? (optional)"
            rows={4}
            style={{
              width: '100%', padding: '12px 14px',
              border: '2px solid #e5e7eb', borderRadius: 14,
              fontSize: 14, color: '#111827', background: '#fafafa',
              resize: 'none', outline: 'none', boxSizing: 'border-box',
              lineHeight: 1.5, fontFamily: 'inherit', marginBottom: 14,
            }}
            onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
          />
          <button
            onClick={handleFeedbackSubmit}
            disabled={submitting}
            style={{
              width: '100%', padding: '15px',
              background: '#1f2937', color: '#fff',
              border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1, marginBottom: 10, transition: 'all 0.15s',
            }}
          >
            {submitting ? 'Sending…' : 'Submit Feedback'}
          </button>
          <button
            onClick={() => { setRating(5); setComment(''); }}
            style={{ width: '100%', background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: '5px 0' }}
          >
            Change my rating
          </button>
        </div>
      )}
    </div>
  );

  // ── Redirected screen ──────────────────────────────────────────────────
  const renderRedirected = () => {
    const savedComment = submittedCommentRef.current;
    const steps = [
      { num: '1', text: 'In Google: tap ⭐⭐⭐⭐⭐ (5 stars)' },
      { num: '2', text: savedComment ? 'Paste your comment (already copied ↓)' : 'Write what you liked about us' },
      { num: '3', text: 'Tap “Post” — done! 🎉' },
    ];
    return (
      <div style={{ animation: 'fadeSlideUp 0.4s ease both' }}>
        {renderHeader()}

        {/* Success icon */}
        <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 18px' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #10b981', animation: 'pulseRing 1.4s ease-out infinite' }} />
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#111827', marginBottom: 4, textAlign: 'center' }}>Google Review Page Opened!</h2>
        <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
          Follow the steps below in your Google tab:
        </p>

        {/* Animated how-to demo */}
        <GoogleHowToDemo />

        {/* Copied comment box */}
        {savedComment && (
          <div style={{
            background: submitStatus === 'copied' ? '#d1fae5' : '#fef9c3',
            border: `1.5px solid ${submitStatus === 'copied' ? '#6ee7b7' : '#fde047'}`,
            borderRadius: 16, padding: '12px 14px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: submitStatus === 'copied' ? '#065f46' : '#713f12', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {submitStatus === 'copied' ? '✅ Copied to clipboard — just paste!' : '⚠️ Copy failed — copy manually:'}
              </span>
              <button
                onClick={async () => { const ok = await copyToClipboard(savedComment); setSubmitStatus(ok ? 'copied' : 'error'); }}
                style={{
                  background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
                  padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#374151',
                }}
              >Copy again</button>
            </div>
            <p style={{
              fontSize: 13, color: '#1f2937', lineHeight: 1.6, margin: 0,
              fontStyle: 'italic', borderLeft: '3px solid #10b981', paddingLeft: 10,
            }}>
              &ldquo;{savedComment}&rdquo;
            </p>
          </div>
        )}

        {/* Re-open button */}
        <button
          onClick={() => window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener,noreferrer')}
          style={{
            width: '100%', padding: '14px', background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 18, fontWeight: 700, fontSize: 15,
            cursor: 'pointer', boxShadow: '0 3px 14px rgba(37,99,235,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          🔗 Re-open Google Review Tab
        </button>
        <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 12, textAlign: 'center' }}>
          Thank you for taking the time! 🙏
        </p>

        {/* Referral section — turn one happy customer into many */}
        <div style={{ marginTop: 16, borderTop: '1.5px solid #f3f4f6', paddingTop: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', textAlign: 'center', margin: '0 0 10px' }}>
            Know someone looking for work abroad?
          </p>
          <button
            onClick={() => window.open(
              `https://wa.me/?text=${encodeURIComponent(`I found my job through ${BUSINESS_NAME}! ⭐ They're amazing.\nCheck them out → ${window.location.origin}/review`)}`,
              '_blank', 'noopener,noreferrer'
            )}
            style={{
              width: '100%', padding: '13px',
              background: 'linear-gradient(135deg,#25D366,#128C7E)',
              color: '#fff', border: 'none', borderRadius: 16,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 3px 12px rgba(37,211,102,0.35)',
            }}
          >
            <span style={{ fontSize: 18 }}>💬</span> Share via WhatsApp
          </button>
        </div>
      </div>
    );
  };

  // ── Thank you screen ───────────────────────────────────────────────────
  const renderThankYou = () => (
    <div style={{ textAlign: 'center', animation: 'fadeSlideUp 0.4s ease both' }}>
      {renderHeader()}
      <div style={{ fontSize: 66, marginBottom: 16, animation: 'popIn 0.5s ease both' }}>🙏</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 10 }}>Thank You!</h2>
      <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, maxWidth: 280, margin: '0 auto' }}>
        We've received your feedback and will work to improve. We truly appreciate your honesty.
      </p>
    </div>
  );

  // ── Nav menu items ───────────────────────────────────────────────────────
  const NAV_ITEMS = [
    { icon: '🧭', label: 'Review Menu', href: '/review' },
    { icon: '⭐', label: 'Google Review', href: GOOGLE_REVIEW_FLOW_PATH },
    { icon: '📋', label: 'QR Code & Share', href: '/review/qr' },
    { icon: '💼', label: 'Apply for Jobs',  href: '/apply' },
    { icon: '🏢', label: 'Falisha Manpower', href: CANONICAL_FRONTEND_URL, external: true },
  ];

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const renderSidebar = () => (
    <>
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)',
            zIndex: 999, animation: 'fadeIn 0.2s ease both',
          }}
        />
      )}
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 270,
        background: '#fff', zIndex: 1000, boxShadow: '4px 0 30px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        borderRadius: '0 24px 24px 0',
      }}>
        {/* Drawer header */}
        <div style={{
          background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
          padding: '28px 20px 20px',
          borderRadius: '0 24px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '0.01em' }}>{BUSINESS_NAME}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Review Portal</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10,
            width: 34, height: 34, cursor: 'pointer', color: '#fff', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const current = !item.external && window.location.pathname === item.href;
            return (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? '_blank' : '_self'}
                rel={item.external ? 'noopener noreferrer' : undefined}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px', borderRadius: 14, marginBottom: 4,
                  background: current ? '#eff6ff' : 'transparent',
                  color: current ? '#1d4ed8' : '#374151',
                  fontWeight: current ? 700 : 500, fontSize: 15,
                  textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
                  border: `1.5px solid ${current ? '#bfdbfe' : 'transparent'}`,
                }}
                onMouseOver={e => { if (!current) { (e.currentTarget as HTMLAnchorElement).style.background = '#f9fafb'; } }}
                onMouseOut={e => { if (!current) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; } }}
              >
                <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.external && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>↗</span>}
              </a>
            );
          })}
        </nav>

        {/* Drawer footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6' }}>
          {/* Quick share review link */}
          <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Share Review Link</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'WhatsApp', icon: '💬', color: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(`Rate ${BUSINESS_NAME}: ${window.location.origin}/review`)}` },
              { label: 'Telegram', icon: '✈️', color: '#229ED9', url: `https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/review`)}&text=${encodeURIComponent(`Rate ${BUSINESS_NAME}`)}` },
              { label: 'Facebook', icon: '👍', color: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/review`)}` },
            ].map(s => (
              <button key={s.label} title={s.label}
                onClick={() => window.open(s.url, '_blank', 'noopener,noreferrer')}
                style={{
                  background: s.color, border: 'none', borderRadius: 10,
                  width: 38, height: 38, cursor: 'pointer', fontSize: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}>
                {s.icon}
              </button>
            ))}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button title="More" onClick={() => navigator.share({ title: BUSINESS_NAME, url: `${window.location.origin}/review` }).catch(() => {})}
                style={{ background: '#6366f1', border: 'none', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                📤
              </button>
            )}
          </div>
          <p style={{ fontSize: 11, color: '#d1d5db', marginTop: 14, textAlign: 'center' }}>{BUSINESS_NAME} · v2.1</p>
        </div>
      </div>
    </>
  );

  // ── Copy instruction overlay ────────────────────────────────────────────
  const renderOverlay = () => {
    if (!overlayVisible) return null;
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
        animation: 'fadeIn 0.2s ease both',
      }}>
        <div style={{
          background: '#ffffff',
          border: '2.5px solid #2563eb',
          borderRadius: 24,
          padding: '28px 26px 24px',
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          animation: 'fadeSlideUp 0.25s ease both',
        }}>
          {/* Big green check */}
          <div style={{
            width: 68, height: 68,
            background: 'linear-gradient(135deg,#16a34a,#15803d)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, margin: '0 auto 14px',
            boxShadow: '0 6px 20px rgba(22,163,74,0.40)',
          }}>
            ✅
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: '0 0 4px' }}>
            {userName.trim() ? `Thanks, ${userName.trim()}! ✅` : 'Copied! ✅'}
          </h2>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 18px', fontStyle: 'italic', lineHeight: 1.6 }}>
            You're joining <strong style={{ color: '#16a34a' }}>247+ others</strong> who rated {BUSINESS_NAME} 5 stars.<br/>
            Your review helps more people find trusted overseas jobs.
          </p>

          {/* Steps */}
          <div style={{
            background: '#f0f9ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: 16,
            padding: '14px 16px',
            textAlign: 'left',
            marginBottom: 16,
          }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#1e40af', margin: '0 0 10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              When Google opens:
            </p>
            {[
              { n: '1️⃣', text: 'Select ⭐⭐⭐⭐⭐' },
              { n: '2️⃣', text: 'Tap the text box' },
              { n: '3️⃣', text: 'Long-press → Paste' },
              { n: '4️⃣', text: 'Tap "Post"' },
            ].map(({ n, text }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                <span style={{ fontSize: 16 }}>{n}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1e3a5f' }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Auto-redirect indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10,
              background: '#16a34a', borderRadius: '50%',
              animation: 'pulseRing 1s ease infinite',
            }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>Opening Google…</span>
          </div>
        </div>
      </div>
    );
  };

  // ── Page shell ─────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(155deg,#f0f9ff 0%,#ffffff 48%,#f5f3ff 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      padding: '20px 0 64px',
    }}>
      {/* Hamburger menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 900,
          background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14,
          width: 42, height: 42, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
          boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
        }}
      >
        <span style={{ width: 18, height: 2, background: '#374151', borderRadius: 2, display: 'block' }} />
        <span style={{ width: 18, height: 2, background: '#374151', borderRadius: 2, display: 'block' }} />
        <span style={{ width: 18, height: 2, background: '#374151', borderRadius: 2, display: 'block' }} />
      </button>

      {renderSidebar()}
      {renderOverlay()}

      <div style={{ width: '100%', maxWidth: 420, padding: '0 18px' }}>
        <div style={{
          background: '#ffffff', borderRadius: 28,
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
          padding: '30px 22px 26px',
        }}>
          {isMenuRoute && renderMenu()}
          {isGoogleReviewRoute && screen === 'rating'     && renderRating()}
          {isGoogleReviewRoute && screen === 'redirected' && renderRedirected()}
          {isGoogleReviewRoute && screen === 'thank_you'  && renderThankYou()}
        </div>
      </div>
      <p style={{ position: 'fixed', bottom: 10, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: '#d1d5db' }}>
        {BUSINESS_NAME} · Review Portal
      </p>
    </div>
  );
}

