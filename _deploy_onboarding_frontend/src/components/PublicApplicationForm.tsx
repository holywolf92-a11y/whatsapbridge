import { useState, type ReactNode } from 'react';
import { ArrowRight, Briefcase, Building2, ChevronDown, Globe2, Handshake, Mail, MapPin, Phone, Share2, ShieldCheck, Upload, User2, Users } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { PublicCandidatePortalResponse, PublicEmployerPortalResponse, PublicPartnerPortalResponse } from '../lib/apiClient';

type IntakeAudience = 'candidate' | 'employer' | 'partner';

type CandidateFormState = {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  countryOfInterest: string;
  position: string;
  experience: string;
  comments: string;
};

type EmployerFormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  professions: string;
  quantity: string;
  salaryRange: string;
  dutyHours: string;
  contractDuration: string;
  benefitsIncluded: string;
  comments: string;
};

type PartnerFormState = {
  applicantName: string;
  email: string;
  phone: string;
  companyName: string;
  cityCountry: string;
  district: string;
  cnic: string;
  partnerType: string;
};

const candidateDefaults: CandidateFormState = {
  fullName: '',
  email: '',
  phone: '',
  nationality: 'Pakistani',
  countryOfInterest: 'Saudi Arabia',
  position: '',
  experience: '3-5 Years',
  comments: '',
};

const employerDefaults: EmployerFormState = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  country: '',
  city: '',
  professions: '',
  quantity: '',
  salaryRange: '',
  dutyHours: '',
  contractDuration: '',
  benefitsIncluded: '',
  comments: '',
};

const partnerDefaults: PartnerFormState = {
  applicantName: '',
  email: '',
  phone: '',
  companyName: '',
  cityCountry: '',
  district: '',
  cnic: '',
  partnerType: '',
};

const NATIONALITY_OPTIONS = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Argentinian', 'Armenian', 'Australian', 'Austrian',
  'Azerbaijani', 'Bahraini', 'Bangladeshi', 'Belgian', 'Bhutanese', 'Bolivian', 'Brazilian', 'British',
  'Bulgarian', 'Cambodian', 'Cameroonian', 'Canadian', 'Chilean', 'Chinese', 'Colombian', 'Costa Rican',
  'Croatian', 'Cuban', 'Czech', 'Danish', 'Dominican', 'Egyptian', 'Emirati', 'Eritrean', 'Estonian',
  'Ethiopian', 'Filipino', 'Finnish', 'French', 'Georgian', 'German', 'Ghanaian', 'Greek', 'Guatemalan',
  'Haitian', 'Hungarian', 'Icelandic', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli',
  'Italian', 'Jamaican', 'Japanese', 'Jordanian', 'Kazakhstani', 'Kenyan', 'Kuwaiti', 'Kyrgyz',
  'Laotian', 'Latvian', 'Lebanese', 'Liberian', 'Libyan', 'Lithuanian', 'Macedonian', 'Malagasy',
  'Malawian', 'Malaysian', 'Maldivian', 'Malian', 'Maltese', 'Mauritanian', 'Mauritian', 'Mexican',
  'Moldovan', 'Mongolian', 'Moroccan', 'Mozambican', 'Myanmarese', 'Namibian', 'Nepalese',
  'New Zealander', 'Nigerian', 'Norwegian', 'Omani', 'Pakistani', 'Palestinian', 'Panamanian',
  'Peruvian', 'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Rwandan', 'Saudi',
  'Senegalese', 'Serbian', 'Singaporean', 'Slovak', 'Slovenian', 'Somali', 'South African',
  'South Korean', 'South Sudanese', 'Spanish', 'Sri Lankan', 'Sudanese', 'Swedish', 'Swiss',
  'Syrian', 'Taiwanese', 'Tajik', 'Tanzanian', 'Thai', 'Togolese', 'Trinidadian', 'Tunisian',
  'Turkish', 'Turkmen', 'Ugandan', 'Ukrainian', 'Uruguayan', 'Uzbek', 'Venezuelan', 'Vietnamese',
  'Yemeni', 'Zambian', 'Zimbabwean', 'Other',
];

const WORLD_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina',
  'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
  'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo (Brazzaville)', 'Congo (Kinshasa)', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon',
  'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
  'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria',
  'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga',
  'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

const COUNTRY_INTEREST_OPTIONS = WORLD_COUNTRIES;
const EXPERIENCE_OPTIONS = ['Fresher', '1-3 Years', '3-5 Years', '5-10 Years', '10+ Years'];
const PHONE_CODE_OPTIONS = [
  // South Asia
  { code: '+92', label: 'Pakistan (+92)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+880', label: 'Bangladesh (+880)' },
  { code: '+977', label: 'Nepal (+977)' },
  { code: '+94', label: 'Sri Lanka (+94)' },
  { code: '+93', label: 'Afghanistan (+93)' },
  { code: '+975', label: 'Bhutan (+975)' },
  { code: '+960', label: 'Maldives (+960)' },
  // Gulf / Middle East
  { code: '+971', label: 'UAE (+971)' },
  { code: '+966', label: 'Saudi Arabia (+966)' },
  { code: '+974', label: 'Qatar (+974)' },
  { code: '+968', label: 'Oman (+968)' },
  { code: '+965', label: 'Kuwait (+965)' },
  { code: '+973', label: 'Bahrain (+973)' },
  { code: '+962', label: 'Jordan (+962)' },
  { code: '+961', label: 'Lebanon (+961)' },
  { code: '+964', label: 'Iraq (+964)' },
  { code: '+972', label: 'Israel (+972)' },
  { code: '+967', label: 'Yemen (+967)' },
  { code: '+963', label: 'Syria (+963)' },
  // Europe
  { code: '+44', label: 'UK (+44)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+39', label: 'Italy (+39)' },
  { code: '+34', label: 'Spain (+34)' },
  { code: '+31', label: 'Netherlands (+31)' },
  { code: '+32', label: 'Belgium (+32)' },
  { code: '+43', label: 'Austria (+43)' },
  { code: '+41', label: 'Switzerland (+41)' },
  { code: '+46', label: 'Sweden (+46)' },
  { code: '+47', label: 'Norway (+47)' },
  { code: '+45', label: 'Denmark (+45)' },
  { code: '+358', label: 'Finland (+358)' },
  { code: '+48', label: 'Poland (+48)' },
  { code: '+351', label: 'Portugal (+351)' },
  { code: '+30', label: 'Greece (+30)' },
  { code: '+40', label: 'Romania (+40)' },
  { code: '+420', label: 'Czech Republic (+420)' },
  { code: '+36', label: 'Hungary (+36)' },
  { code: '+421', label: 'Slovakia (+421)' },
  { code: '+380', label: 'Ukraine (+380)' },
  { code: '+7', label: 'Russia (+7)' },
  { code: '+90', label: 'Turkey (+90)' },
  // North America
  { code: '+1', label: 'USA / Canada (+1)' },
  { code: '+52', label: 'Mexico (+52)' },
  // South America
  { code: '+55', label: 'Brazil (+55)' },
  { code: '+54', label: 'Argentina (+54)' },
  { code: '+57', label: 'Colombia (+57)' },
  { code: '+56', label: 'Chile (+56)' },
  { code: '+51', label: 'Peru (+51)' },
  // East Asia
  { code: '+86', label: 'China (+86)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+82', label: 'South Korea (+82)' },
  { code: '+886', label: 'Taiwan (+886)' },
  // Southeast Asia
  { code: '+60', label: 'Malaysia (+60)' },
  { code: '+63', label: 'Philippines (+63)' },
  { code: '+62', label: 'Indonesia (+62)' },
  { code: '+66', label: 'Thailand (+66)' },
  { code: '+84', label: 'Vietnam (+84)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+95', label: 'Myanmar (+95)' },
  // Africa
  { code: '+20', label: 'Egypt (+20)' },
  { code: '+27', label: 'South Africa (+27)' },
  { code: '+234', label: 'Nigeria (+234)' },
  { code: '+254', label: 'Kenya (+254)' },
  { code: '+251', label: 'Ethiopia (+251)' },
  { code: '+255', label: 'Tanzania (+255)' },
  { code: '+256', label: 'Uganda (+256)' },
  { code: '+233', label: 'Ghana (+233)' },
  { code: '+212', label: 'Morocco (+212)' },
  { code: '+216', label: 'Tunisia (+216)' },
  { code: '+213', label: 'Algeria (+213)' },
  { code: '+218', label: 'Libya (+218)' },
  { code: '+249', label: 'Sudan (+249)' },
  // Oceania
  { code: '+61', label: 'Australia (+61)' },
  { code: '+64', label: 'New Zealand (+64)' },
];

function resolveAudienceFromPath(): IntakeAudience | null {
  if (typeof window === 'undefined') {
    return 'candidate';
  }

  const normalized = window.location.pathname.replace(/\/+$/, '') || '/apply';
  if (normalized === '/apply/candidate') return 'candidate';
  if (normalized === '/apply/employer') return 'employer';
  if (normalized === '/apply/partner') return 'partner';
  return null;
}

function audiencePath(audience: IntakeAudience) {
  return `/apply/${audience}`;
}

export function PublicApplicationForm() {
  const directAudience = resolveAudienceFromPath();
  const [selectedAudience, setSelectedAudience] = useState<IntakeAudience>(directAudience || 'candidate');
  const [candidateForm, setCandidateForm] = useState(candidateDefaults);
  const [candidatePhoneCode, setCandidatePhoneCode] = useState('+92');
  const [candidatePhoneNumber, setCandidatePhoneNumber] = useState('');
  const [candidateCv, setCandidateCv] = useState<File | null>(null);
  const [employerForm, setEmployerForm] = useState(employerDefaults);
  const [employerPhoneCode, setEmployerPhoneCode] = useState('+92');
  const [employerPhoneNumber, setEmployerPhoneNumber] = useState('');
  const [partnerForm, setPartnerForm] = useState(partnerDefaults);
  const [partnerPhoneCode, setPartnerPhoneCode] = useState('+92');
  const [partnerPhoneNumber, setPartnerPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedAudience, setSubmittedAudience] = useState<IntakeAudience | null>(null);
  const [candidateResult, setCandidateResult] = useState<PublicCandidatePortalResponse | null>(null);
  const [employerResult, setEmployerResult] = useState<PublicEmployerPortalResponse | null>(null);
  const [partnerResult, setPartnerResult] = useState<PublicPartnerPortalResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const activeAudience = directAudience || selectedAudience;

  function copyField(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {});
  }

  const handleCandidateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = new FormData();
      const phone = `${candidatePhoneCode} ${candidatePhoneNumber}`.trim();
      const submission: CandidateFormState = {
        ...candidateForm,
        phone,
      };

      Object.entries(submission).forEach(([key, value]) => payload.append(key, value));
      if (candidateCv) {
        payload.append('cv', candidateCv);
      }

      const result = await apiClient.submitCandidatePortal(payload);
      setCandidateResult(result);
      setCandidateForm(candidateDefaults);
      setCandidatePhoneCode('+92');
      setCandidatePhoneNumber('');
      setCandidateCv(null);
      setSubmittedAudience('candidate');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || 'Failed to submit candidate intake.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmployerSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await apiClient.submitEmployerPortal({
        ...employerForm,
        phone: `${employerPhoneCode} ${employerPhoneNumber}`.trim(),
      });
      setEmployerResult(result);
      setEmployerForm(employerDefaults);
      setEmployerPhoneCode('+92');
      setEmployerPhoneNumber('');
      setSubmittedAudience('employer');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || 'Failed to submit employer intake.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePartnerSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await apiClient.submitPartnerPortal({
        ...partnerForm,
        phone: `${partnerPhoneCode} ${partnerPhoneNumber}`.trim(),
      });
      setPartnerResult(result);
      setPartnerForm(partnerDefaults);
      setPartnerPhoneCode('+92');
      setPartnerPhoneNumber('');
      setSubmittedAudience('partner');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || 'Failed to submit partner intake.');
    } finally {
      setSubmitting(false);
    }
  };

  // ──────────────────── SUCCESS SCREENS ────────────────────

  if (submittedAudience === 'candidate') {
    return (
      <div className="falisha-auth-shell falisha-auth-form-pane" style={{ fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif' }}>
        <div className="falisha-auth-form-inner" style={{ textAlign: 'center' }}>
          <div className="mb-8 flex flex-col items-center">
            <img src="/logo.png" alt="Falisha" className="h-16 w-16 object-contain" />
          </div>

          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <ShieldCheck style={{ width: '36px', height: '36px', color: '#10b981' }} />
          </div>

          <h1 className="falisha-auth-heading" style={{ marginBottom: '0.5rem' }}>Application Received!</h1>
          <p className="falisha-auth-subheading" style={{ marginBottom: '1.25rem' }}>
            Your profile has been saved. We will review and match you with the right opportunity abroad.
          </p>

          {candidateResult?.whatsappNotified ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '12px', padding: '0.55rem 1rem', fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Profile link sent to your WhatsApp
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '0.55rem 1rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>
              Our team will contact you within 48 hours
            </div>
          )}

          {candidateResult?.onboardingLink && (
            <div style={{ marginTop: '1.75rem' }}>
              <a
                href={candidateResult.onboardingLink}
                target="_blank"
                rel="noreferrer"
                className="falisha-auth-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0 1.5rem', textDecoration: 'none', marginBottom: '0.9rem' }}
              >
                View &amp; Complete Your Profile
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '0.6rem 0.9rem', fontSize: '0.8rem', color: '#6b7280' }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{candidateResult.onboardingLink}</span>
                <button type="button" onClick={() => copyField(candidateResult!.onboardingLink!, 'profile')} style={{ flexShrink: 0, fontSize: '0.78rem', fontWeight: 600, color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {copied === 'profile' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          <p style={{ marginTop: '2.5rem', fontSize: '0.82rem', color: '#9ca3af' }}>© 2024 Falisha Jobs</p>
        </div>
      </div>
    );
  }

  if (submittedAudience === 'employer') {
    return (
      <div className="falisha-auth-shell falisha-auth-form-pane" style={{ fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '28rem', textAlign: 'center' }}>
          <div className="mb-8 flex flex-col items-center">
            <img src="/logo.png" alt="Falisha" className="h-16 w-16 object-contain" />
          </div>

          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '2px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <ShieldCheck style={{ width: '36px', height: '36px', color: '#06b6d4' }} />
          </div>

          <h1 className="falisha-auth-heading" style={{ marginBottom: '0.5rem' }}>Portal Access Ready!</h1>
          <p className="falisha-auth-subheading" style={{ marginBottom: '1.25rem' }}>
            Your employer portal has been created. Log in to track your hiring requirement.
          </p>

          {employerResult?.whatsappNotified ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '12px', padding: '0.55rem 1rem', fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Credentials sent to your WhatsApp
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '0.55rem 1rem', fontSize: '0.82rem', color: '#c2410c', fontWeight: 500 }}>
              Save your credentials below
            </div>
          )}

          <div style={{ marginTop: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '1rem', overflow: 'hidden', textAlign: 'left' }}>
            <div style={{ background: '#f9fafb', padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Your Login Credentials</div>
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Login Email</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.95rem', color: '#111827', wordBreak: 'break-all' }}>{employerResult?.email}</span>
                <button type="button" onClick={() => copyField(employerResult?.email || '', 'emp-email')} style={{ flexShrink: 0, fontSize: '0.78rem', fontWeight: 600, color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>
                  {copied === 'emp-email' ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
            {employerResult?.password ? (
              <div style={{ padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Temporary Password</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.95rem', color: '#111827', letterSpacing: '0.05em' }}>{employerResult.password}</span>
                  <button type="button" onClick={() => copyField(employerResult!.password || '', 'emp-password')} style={{ flexShrink: 0, fontSize: '0.78rem', fontWeight: 600, color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>
                    {copied === 'emp-password' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>Use your existing password to log in.</div>
            )}
          </div>

          <a
            href={employerResult?.dashboardUrl || '/employer/dashboard'}
            target="_blank"
            rel="noreferrer"
            className="falisha-auth-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', textDecoration: 'none' }}
          >
            Go to Employer Dashboard
            <ArrowRight style={{ width: '16px', height: '16px' }} />
          </a>

          <p style={{ marginTop: '1.75rem', fontSize: '0.82rem', color: '#9ca3af' }}>© 2024 Falisha Jobs</p>
        </div>
      </div>
    );
  }

  if (submittedAudience === 'partner') {
    return (
      <div className="falisha-auth-shell falisha-auth-form-pane" style={{ fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '28rem', textAlign: 'center' }}>
          <div className="mb-8 flex flex-col items-center">
            <img src="/logo.png" alt="Falisha" className="h-16 w-16 object-contain" />
          </div>

          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '2px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <ShieldCheck style={{ width: '36px', height: '36px', color: '#06b6d4' }} />
          </div>

          <h1 className="falisha-auth-heading" style={{ marginBottom: '0.5rem' }}>Welcome to the Network!</h1>
          <p className="falisha-auth-subheading" style={{ marginBottom: '1.25rem' }}>
            Your partner portal is ready. Log in to start referring candidates and earning commissions.
          </p>

          {partnerResult?.whatsappNotified ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '12px', padding: '0.55rem 1rem', fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Credentials sent to your WhatsApp
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '0.55rem 1rem', fontSize: '0.82rem', color: '#c2410c', fontWeight: 500 }}>
              Save your credentials below
            </div>
          )}

          <div style={{ marginTop: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '1rem', overflow: 'hidden', textAlign: 'left' }}>
            <div style={{ background: '#f9fafb', padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Your Login Credentials</div>
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Login Email</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.95rem', color: '#111827', wordBreak: 'break-all' }}>{partnerResult?.email}</span>
                <button type="button" onClick={() => copyField(partnerResult?.email || '', 'par-email')} style={{ flexShrink: 0, fontSize: '0.78rem', fontWeight: 600, color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>
                  {copied === 'par-email' ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
            {partnerResult?.password ? (
              <div style={{ padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Temporary Password</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.95rem', color: '#111827', letterSpacing: '0.05em' }}>{partnerResult.password}</span>
                  <button type="button" onClick={() => copyField(partnerResult!.password || '', 'par-password')} style={{ flexShrink: 0, fontSize: '0.78rem', fontWeight: 600, color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>
                    {copied === 'par-password' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>Use your existing password to log in.</div>
            )}
          </div>

          <a
            href={partnerResult?.dashboardUrl || '/partner/dashboard'}
            target="_blank"
            rel="noreferrer"
            className="falisha-auth-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', textDecoration: 'none' }}
          >
            Go to Partner Dashboard
            <ArrowRight style={{ width: '16px', height: '16px' }} />
          </a>

          <p style={{ marginTop: '1.75rem', fontSize: '0.82rem', color: '#9ca3af' }}>© 2024 Falisha Jobs</p>
        </div>
      </div>
    );
  }

  // ──────────────────── FORMS ────────────────────

  if (activeAudience === 'candidate') {
    return (
      <div
        className="falisha-auth-shell falisha-auth-form-pane"
        style={{ fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif' }}
      >
        <div className="falisha-auth-form-inner">

          <div className="mb-8 flex flex-col items-center">
            <img src="/logo.png" alt="Falisha" className="h-16 w-16 object-contain" />
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
              Bridging Talent to Opportunities
            </p>
          </div>

          <div className="falisha-auth-heading-block">
            <h1 className="falisha-auth-heading">Apply Now</h1>
            <p className="falisha-auth-subheading">Our consultants will review your profile within 48 hours.</p>
          </div>

          <form className="falisha-auth-form-fields" onSubmit={handleCandidateSubmit}>

            {/* Full Name */}
            <div className="falisha-auth-field">
              <label className="falisha-auth-field-label">Full Name <span className="text-red-500">*</span></label>
              <div className="falisha-auth-input-wrap">
                <User2 className="falisha-auth-input-icon" />
                <input type="text" value={candidateForm.fullName} onChange={(e) => setCandidateForm((c) => ({ ...c, fullName: e.target.value }))} className="falisha-auth-input" placeholder="Muhammad Ahmed" required />
              </div>
            </div>

            {/* Email */}
            <div className="falisha-auth-field">
              <label className="falisha-auth-field-label">Email Address <span className="text-red-500">*</span></label>
              <div className="falisha-auth-input-wrap">
                <Mail className="falisha-auth-input-icon" />
                <input type="email" value={candidateForm.email} onChange={(e) => setCandidateForm((c) => ({ ...c, email: e.target.value }))} className="falisha-auth-input" placeholder="ahmed@example.com" required />
              </div>
            </div>

            {/* Phone */}
            <div className="falisha-auth-field">
              <label className="falisha-auth-field-label">Phone / WhatsApp <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className="falisha-auth-input-wrap w-44 shrink-0">
                  <select value={candidatePhoneCode} onChange={(e) => setCandidatePhoneCode(e.target.value)} className="falisha-auth-input falisha-auth-select" style={{ paddingLeft: '0.75rem' }}>
                    {PHONE_CODE_OPTIONS.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
                  </select>
                </div>
                <div className="falisha-auth-input-wrap flex-1">
                  <Phone className="falisha-auth-input-icon" />
                  <input type="tel" value={candidatePhoneNumber} onChange={(e) => setCandidatePhoneNumber(e.target.value)} className="falisha-auth-input" placeholder="300 1234567" required />
                </div>
              </div>
            </div>

            {/* Nationality + Country */}
            <div className="grid grid-cols-2 gap-3">
              <div className="falisha-auth-field">
                <label className="falisha-auth-field-label">Nationality</label>
                <div className="falisha-auth-input-wrap">
                  <Globe2 className="falisha-auth-input-icon" />
                  <select value={candidateForm.nationality} onChange={(e) => setCandidateForm((c) => ({ ...c, nationality: e.target.value }))} className="falisha-auth-input falisha-auth-select">
                    {NATIONALITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="falisha-auth-field">
                <label className="falisha-auth-field-label">Country of Interest</label>
                <div className="falisha-auth-input-wrap">
                  <MapPin className="falisha-auth-input-icon" />
                  <select value={candidateForm.countryOfInterest} onChange={(e) => setCandidateForm((c) => ({ ...c, countryOfInterest: e.target.value }))} className="falisha-auth-input falisha-auth-select">
                    {COUNTRY_INTEREST_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Preferred Role */}
            <div className="falisha-auth-field">
              <label className="falisha-auth-field-label">Preferred Role <span className="text-red-500">*</span></label>
              <div className="falisha-auth-input-wrap">
                <Briefcase className="falisha-auth-input-icon" />
                <input type="text" value={candidateForm.position} onChange={(e) => setCandidateForm((c) => ({ ...c, position: e.target.value }))} className="falisha-auth-input" placeholder="e.g. Civil Engineer, HVAC Tech" required />
              </div>
            </div>

            {/* Experience chips */}
            <ChoiceChips label="Years of Experience" value={candidateForm.experience} options={EXPERIENCE_OPTIONS} onChange={(v) => setCandidateForm((c) => ({ ...c, experience: v }))} />

            {/* CV Upload */}
            <CandidateUploadField fileName={candidateCv?.name || null} onFileChange={(f) => setCandidateCv(f)} />

            <TextAreaField
              label="Comments"
              value={candidateForm.comments}
              onChange={(v) => setCandidateForm((c) => ({ ...c, comments: v }))}
              placeholder="Add any notes or comments about your application"
            />

            {/* Submit */}
            <button type="submit" disabled={submitting} className="falisha-auth-primary flex items-center justify-center gap-2">
              {submitting ? 'Submitting…' : 'Submit Application'}
              <ArrowRight className="h-4 w-4" />
            </button>

            {error && (
              <div className="falisha-auth-notice falisha-auth-notice-error">
                <span>{error}</span>
              </div>
            )}
          </form>

          <p className="mt-6 text-center" style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
            © 2024 Falisha Jobs ·{' '}
            <a className="falisha-auth-link" href="/privacy-policy">Privacy</a> ·{' '}
            <a className="falisha-auth-link" href="#">Terms</a>
          </p>
        </div>
      </div>
    );
  }

  // ── EMPLOYER ──
  if (activeAudience === 'employer') {
    return (
      <div className="falisha-auth-shell falisha-auth-form-pane falisha-auth-form-pane-signup" style={{ fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '36rem' }}>

          <div className="mb-8 flex flex-col items-center">
            <img src="/logo.png" alt="Falisha" className="h-16 w-16 object-contain" />
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Pakistan's #1 Overseas Recruitment Company</p>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: '999px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', padding: '0.3rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, color: '#0891b2', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
              <span style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', background: '#06b6d4', display: 'inline-block' }} />
              Pakistan's #1 Overseas Recruitment
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: '999px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.28)', padding: '0.3rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>
              <span style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Fast · Verified · Compliant
            </span>
          </div>

          <div className="falisha-auth-heading-block">
            <h1 className="falisha-auth-heading">Post a Requirement</h1>
            <p className="falisha-auth-subheading">Tell us what you need — we'll source, screen and deliver.</p>
          </div>

          {submittedAudience === 'employer' && (
            <div className="falisha-auth-notice falisha-auth-notice-success mb-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>Requirement submitted! Our team will be in touch within 24 hours.</span>
            </div>
          )}

          <form className="falisha-auth-form-fields" onSubmit={handleEmployerSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Company Name" value={employerForm.companyName} onChange={(v) => setEmployerForm((c) => ({ ...c, companyName: v }))} required icon={Building2} />
              <InputField label="Contact Name" value={employerForm.contactName} onChange={(v) => setEmployerForm((c) => ({ ...c, contactName: v }))} required icon={User2} />
              <div className="sm:col-span-2">
                <InputField label="Email" type="email" value={employerForm.email} onChange={(v) => setEmployerForm((c) => ({ ...c, email: v }))} required icon={Mail} />
              </div>
              <div className="sm:col-span-2 falisha-auth-field">
                <label className="falisha-auth-field-label">Phone / WhatsApp <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <div className="falisha-auth-input-wrap w-44 shrink-0">
                    <select value={employerPhoneCode} onChange={(e) => setEmployerPhoneCode(e.target.value)} className="falisha-auth-input falisha-auth-select" style={{ paddingLeft: '0.75rem' }}>
                      {PHONE_CODE_OPTIONS.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="falisha-auth-input-wrap flex-1">
                    <Phone className="falisha-auth-input-icon" />
                    <input type="tel" value={employerPhoneNumber} onChange={(e) => setEmployerPhoneNumber(e.target.value)} className="falisha-auth-input" placeholder="300 1234567" required />
                  </div>
                </div>
              </div>
              <div className="falisha-auth-field">
                <label className="falisha-auth-field-label">Country</label>
                <div className="falisha-auth-input-wrap">
                  <Globe2 className="falisha-auth-input-icon" />
                  <select value={employerForm.country} onChange={(e) => setEmployerForm((c) => ({ ...c, country: e.target.value }))} className="falisha-auth-input falisha-auth-select">
                    <option value="">Select country…</option>
                    {WORLD_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <InputField label="City" value={employerForm.city} onChange={(v) => setEmployerForm((c) => ({ ...c, city: v }))} icon={MapPin} />
              <InputField label="Professions Required" value={employerForm.professions} onChange={(v) => setEmployerForm((c) => ({ ...c, professions: v }))} icon={Briefcase} />
              <InputField label="Quantity Needed" value={employerForm.quantity} onChange={(v) => setEmployerForm((c) => ({ ...c, quantity: v }))} icon={Users} />
              <InputField label="Salary Range" value={employerForm.salaryRange} onChange={(v) => setEmployerForm((c) => ({ ...c, salaryRange: v }))} icon={Briefcase} />
              <InputField label="Duty Hours" value={employerForm.dutyHours} onChange={(v) => setEmployerForm((c) => ({ ...c, dutyHours: v }))} icon={Users} />
              <InputField label="Contract Duration" value={employerForm.contractDuration} onChange={(v) => setEmployerForm((c) => ({ ...c, contractDuration: v }))} icon={Briefcase} />
              <InputField label="Benefits Included" value={employerForm.benefitsIncluded} onChange={(v) => setEmployerForm((c) => ({ ...c, benefitsIncluded: v }))} icon={Users} />
            </div>
            <TextAreaField label="Comments" value={employerForm.comments} onChange={(v) => setEmployerForm((c) => ({ ...c, comments: v }))} placeholder="Add any extra hiring details" />
            <button type="submit" disabled={submitting} className="falisha-auth-primary flex items-center justify-center gap-2">
              {submitting ? 'Submitting…' : 'Submit Requirement'}
              <ArrowRight className="h-4 w-4" />
            </button>
            {error && <div className="falisha-auth-notice falisha-auth-notice-error"><span>{error}</span></div>}
          </form>

          <p className="mt-6 text-center" style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
            © 2024 Falisha Jobs ·{' '}
            <a className="falisha-auth-link" href="/privacy-policy">Privacy</a> ·{' '}
            <a className="falisha-auth-link" href="#">Terms</a>
          </p>
        </div>
      </div>
    );
  }

  // ── PARTNER ──
  return (
    <div className="falisha-auth-shell falisha-auth-form-pane falisha-auth-form-pane-signup" style={{ fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '36rem' }}>

        <div className="mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="Falisha" className="h-16 w-16 object-contain" />
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Pakistan's #1 Overseas Recruitment Company</p>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: '999px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', padding: '0.3rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, color: '#0891b2', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
            <span style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', background: '#06b6d4', display: 'inline-block' }} />
            Pakistan's #1 Overseas Recruitment
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: '999px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.28)', padding: '0.3rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>
            <span style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Earn · Grow · Scale
          </span>
        </div>

        <div className="falisha-auth-heading-block">
          <h1 className="falisha-auth-heading">Become a Partner</h1>
          <p className="falisha-auth-subheading">Join our network of agents and grow your recruitment business with us.</p>
        </div>

        {submittedAudience === 'partner' && (
          <div className="falisha-auth-notice falisha-auth-notice-success mb-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <span>Registration submitted! We'll contact you shortly to get started.</span>
          </div>
        )}

        <form className="falisha-auth-form-fields" onSubmit={handlePartnerSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Applicant Name" value={partnerForm.applicantName} onChange={(v) => setPartnerForm((c) => ({ ...c, applicantName: v }))} required icon={User2} />
            <InputField label="Company / Agency Name" value={partnerForm.companyName} onChange={(v) => setPartnerForm((c) => ({ ...c, companyName: v }))} icon={Building2} />
            <div className="sm:col-span-2">
              <InputField label="Email" type="email" value={partnerForm.email} onChange={(v) => setPartnerForm((c) => ({ ...c, email: v }))} required icon={Mail} />
            </div>
            <div className="sm:col-span-2 falisha-auth-field">
              <label className="falisha-auth-field-label">Phone / WhatsApp <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className="falisha-auth-input-wrap w-44 shrink-0">
                  <select value={partnerPhoneCode} onChange={(e) => setPartnerPhoneCode(e.target.value)} className="falisha-auth-input falisha-auth-select" style={{ paddingLeft: '0.75rem' }}>
                    {PHONE_CODE_OPTIONS.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
                  </select>
                </div>
                <div className="falisha-auth-input-wrap flex-1">
                  <Phone className="falisha-auth-input-icon" />
                  <input type="tel" value={partnerPhoneNumber} onChange={(e) => setPartnerPhoneNumber(e.target.value)} className="falisha-auth-input" placeholder="300 1234567" required />
                </div>
              </div>
            </div>
            <InputField label="City / Country" value={partnerForm.cityCountry} onChange={(v) => setPartnerForm((c) => ({ ...c, cityCountry: v }))} icon={MapPin} />
            <InputField label="District" value={partnerForm.district} onChange={(v) => setPartnerForm((c) => ({ ...c, district: v }))} icon={MapPin} />
            <InputField label="CNIC" value={partnerForm.cnic} onChange={(v) => setPartnerForm((c) => ({ ...c, cnic: v }))} icon={User2} />
            <InputField label="Partner Type" value={partnerForm.partnerType} onChange={(v) => setPartnerForm((c) => ({ ...c, partnerType: v }))} icon={Handshake} />
          </div>
          <button type="submit" disabled={submitting} className="falisha-auth-primary flex items-center justify-center gap-2">
            {submitting ? 'Submitting…' : 'Submit Registration'}
            <ArrowRight className="h-4 w-4" />
          </button>
          {error && <div className="falisha-auth-notice falisha-auth-notice-error"><span>{error}</span></div>}
        </form>

        <p className="mt-6 text-center" style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
          © 2024 Falisha Jobs ·{' '}
          <a className="falisha-auth-link" href="/privacy-policy">Privacy</a> ·{' '}
          <a className="falisha-auth-link" href="#">Terms</a>
        </p>
      </div>
    </div>
  );
}

function TrustBadge({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_12px_32px_rgba(0,52,97,0.08)]">
      {icon}
      <div>
        <p className="text-xs font-bold uppercase text-[#003461]">{title}</p>
        <p className="text-[10px] text-[#424750]">{subtitle}</p>
      </div>
    </div>
  );
}

// PremiumInput kept for backward compat but unused now
function PremiumInput({ label, value, onChange, placeholder, type = 'text', required }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean }) {
  return (
    <div className="falisha-auth-field">
      <label className="falisha-auth-field-label">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className="falisha-auth-input" style={{ paddingLeft: '1rem' }} />
    </div>
  );
}

// PremiumSelect kept for backward compat but unused now
function PremiumSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <div className="falisha-auth-field">
      <label className="falisha-auth-field-label">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="falisha-auth-input falisha-auth-select" style={{ paddingLeft: '1rem' }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// CandidatePhoneField rendered inline in main form now; keeping stub to avoid errors
function CandidatePhoneField({ code, number, onCodeChange, onNumberChange }: { code: string; number: string; onCodeChange: (value: string) => void; onNumberChange: (value: string) => void }) {
  return (
    <div className="falisha-auth-field">
      <label className="falisha-auth-field-label">Phone / WhatsApp</label>
      <div className="flex gap-2">
        <select value={code} onChange={(e) => onCodeChange(e.target.value)} className="falisha-auth-input falisha-auth-select" style={{ width: '11rem', flexShrink: 0, paddingLeft: '0.75rem' }}>
          {PHONE_CODE_OPTIONS.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
        </select>
        <div className="falisha-auth-input-wrap flex-1">
          <Phone className="falisha-auth-input-icon" />
          <input type="tel" value={number} onChange={(e) => onNumberChange(e.target.value)} required placeholder="300 1234567" className="falisha-auth-input" />
        </div>
      </div>
    </div>
  );
}

function CandidateUploadField({ fileName, onFileChange }: { fileName: string | null; onFileChange: (file: File | null) => void }) {
  return (
    <div className="falisha-auth-field">
      <label className="falisha-auth-field-label">Upload CV</label>
      <label
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '7rem',
          width: '100%',
          cursor: 'pointer',
          borderRadius: '0.85rem',
          border: '2px dashed #d1d5db',
          background: '#f9fafb',
          transition: 'border-color 160ms ease, background 160ms ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#06b6d4'; (e.currentTarget as HTMLElement).style.background = '#f0fdfe'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db'; (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
      >
        <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => onFileChange(e.target.files?.[0] || null)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
        <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '2.2rem', width: '2.2rem', borderRadius: '0.6rem', background: 'rgba(6,182,212,0.1)' }}>
          <Upload style={{ height: '1rem', width: '1rem', color: '#06b6d4' }} />
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>{fileName || 'Drop file here or click to browse'}</p>
        <p style={{ marginTop: '0.15rem', fontSize: '0.78rem', color: '#9ca3af' }}>PDF, DOC, DOCX · Max 30MB</p>
      </label>
    </div>
  );
}

function InputField({ label, value, onChange, required, type = 'text', icon: Icon, placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; icon: typeof Briefcase; placeholder?: string }) {
  return (
    <div className="falisha-auth-field">
      <label className="falisha-auth-field-label">{label}{required ? <span className="text-red-500"> *</span> : ''}</label>
      <div className="falisha-auth-input-wrap">
        <Icon className="falisha-auth-input-icon" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder ?? label} className="falisha-auth-input" />
      </div>
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="falisha-auth-field">
      <label className="falisha-auth-field-label">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={placeholder}
        style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.85rem', background: '#fff', padding: '0.75rem 1rem', fontSize: '1rem', color: '#111827', resize: 'vertical', outline: 'none', transition: 'border-color 160ms ease, box-shadow 160ms ease' }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(34,211,238,0.15)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

function ChoiceChips({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="falisha-auth-field">
      <label className="falisha-auth-field-label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              style={{
                borderRadius: '999px',
                border: active ? '2px solid #06b6d4' : '2px solid #e5e7eb',
                background: active ? '#06b6d4' : '#ffffff',
                color: active ? '#ffffff' : '#4b5563',
                padding: '0.35rem 1rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 160ms ease',
                boxShadow: active ? '0 8px 20px rgba(6,182,212,0.28)' : 'none',
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003461_0%,#004b87_100%)] px-10 py-4 font-semibold tracking-wide text-white shadow-[0_12px_32px_rgba(0,52,97,0.08)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
    >
      {submitting ? 'Submitting...' : label}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function SubmitRow({ submitting, error, buttonLabel }: { submitting: boolean; error: string | null; buttonLabel: string }) {
  return (
    <div className="space-y-3 pt-2">
      {error && <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? 'Submitting...' : buttonLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
