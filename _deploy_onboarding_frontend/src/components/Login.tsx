import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  TrendingUp,
  User,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { APP_CONFIG } from '../lib/constants';

const heroStats = [
  { value: '10K+', label: 'Jobs posted', Icon: TrendingUp },
  { value: '50+', label: 'Countries', Icon: Globe },
  { value: '95%', label: 'Success rate', Icon: Award },
  { value: '24/7', label: 'Support', Icon: Clock },
];

const timelineSteps = [
  { step: '1', label: 'Sign up', active: true },
  { step: '2', label: 'Apply', active: false },
  { step: '3', label: 'Relocate', active: false },
];

const countryOptions = [
  'Pakistan',
  'United Kingdom',
  'United Arab Emirates',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Bahrain',
  'Oman',
  'India',
  'Bangladesh',
  'Philippines',
  'Nepal',
];

const phoneCodeOptions = ['+92', '+44', '+971', '+966', '+974', '+965', '+973', '+968', '+91', '+880', '+63', '+977'];

type PortalType = 'individual' | 'agency';
type AuthMode = 'sign-in' | 'sign-up';

type SignUpFormState = {
  fullName: string;
  agencyName: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  phoneCode: string;
  phoneNumber: string;
  referralCode: string;
  positionRole: string;
  linkedin: string;
  businessRegistration: string;
  website: string;
  city: string;
};

const initialSignUpForm: SignUpFormState = {
  fullName: '',
  agencyName: '',
  email: '',
  password: '',
  confirmPassword: '',
  country: '',
  phoneCode: '',
  phoneNumber: '',
  referralCode: '',
  positionRole: '',
  linkedin: '',
  businessRegistration: '',
  website: '',
  city: '',
};

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

export function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in');
  const [portalType, setPortalType] = useState<PortalType>('agency');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [signUpForm, setSignUpForm] = useState<SignUpFormState>(initialSignUpForm);
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isAgency = portalType === 'agency';
  const isSignUp = authMode === 'sign-up';
  const businessPhone = (APP_CONFIG.contact.whatsapp_chat_number || APP_CONFIG.contact.phone).replace(/\D/g, '');

  const buildWhatsAppUrl = (message: string) => {
    const directLink = APP_CONFIG.contact.whatsapp_chat_link.trim();
    if (directLink) {
      const separator = directLink.includes('?') ? '&' : '?';
      return `${directLink}${separator}text=${encodeURIComponent(message)}`;
    }

    return `https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}`;
  };

  const openWhatsApp = (message: string) => {
    const whatsappUrl = buildWhatsAppUrl(message);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const resetMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    resetMessages();
    setEmailError('');
    setPasswordError('');
    setSignUpErrors({});
  };

  const updateSignUpField = (field: keyof SignUpFormState, value: string) => {
    setSignUpForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSignUpErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const validateSignUpForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!signUpForm.fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (isAgency && !signUpForm.agencyName.trim()) nextErrors.agencyName = 'Agency name is required';
    if (!signUpForm.email.trim()) nextErrors.email = 'Email is required';

    if (!signUpForm.password.trim()) {
      nextErrors.password = 'Password is required';
    } else if (signUpForm.password.trim().length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (!signUpForm.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Please confirm your password';
    } else if (signUpForm.confirmPassword !== signUpForm.password) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (!signUpForm.country.trim()) {
      nextErrors.country = isAgency ? 'Country of operation is required' : 'Country of residence is required';
    }

    if (!signUpForm.phoneNumber.trim()) nextErrors.phoneNumber = 'Phone number is required';
    if (!isAgency && !signUpForm.phoneCode.trim()) nextErrors.phoneCode = 'Select a code';
    if (isAgency && !signUpForm.positionRole.trim()) nextErrors.positionRole = 'Position / role is required';
    if (isAgency && !signUpForm.businessRegistration.trim()) nextErrors.businessRegistration = 'Business registration number is required';
    if (isAgency && !signUpForm.city.trim()) nextErrors.city = 'City is required';

    return nextErrors;
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const nextEmailError = email.trim() ? '' : 'Email is required';
    const nextPasswordError = password.trim() ? '' : 'Password is required';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) {
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err?.message || 'Incorrect email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const nextErrors = validateSignUpForm();
    setSignUpErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const { firstName, lastName } = splitFullName(signUpForm.fullName);
    const phone = isAgency
      ? signUpForm.phoneNumber.trim()
      : `${signUpForm.phoneCode.trim()} ${signUpForm.phoneNumber.trim()}`.trim();

    setIsLoading(true);

    try {
      const result = await signUp(
        signUpForm.email.trim(),
        signUpForm.password,
        {
          role: isAgency ? 'partner' : 'candidate',
          name: signUpForm.fullName.trim(),
          full_name: signUpForm.fullName.trim(),
          firstName,
          lastName,
          phone,
          country: signUpForm.country.trim(),
          phoneCode: signUpForm.phoneCode.trim() || undefined,
          referralCode: signUpForm.referralCode.trim() || undefined,
          agencyName: isAgency ? signUpForm.agencyName.trim() : undefined,
          companyName: isAgency ? signUpForm.agencyName.trim() : undefined,
          positionRole: isAgency ? signUpForm.positionRole.trim() : undefined,
          linkedin: isAgency ? signUpForm.linkedin.trim() || undefined : undefined,
          businessRegistration: isAgency ? signUpForm.businessRegistration.trim() : undefined,
          website: isAgency ? signUpForm.website.trim() || undefined : undefined,
          city: isAgency ? signUpForm.city.trim() : undefined,
          countryType: isAgency ? 'country_of_operation' : 'country_of_residence',
        },
        window.location.origin,
      );

      const createdEmail = signUpForm.email.trim();
      setSignUpForm(initialSignUpForm);
      setSignUpErrors({});
      setEmail(createdEmail);
      setPassword('');
      setShowPassword(false);
      setAuthMode('sign-in');
      setSuccessMessage(
        result.requiresEmailConfirmation
          ? 'Account created. Check your email to verify your address before signing in.'
          : 'Account created successfully. You can sign in now.',
      );
    } catch (err: any) {
      setError(err?.message || 'Account creation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMessage('');
    setGoogleLoading(true);
    window.localStorage.setItem('falisha:portal-type-intent', portalType);

    try {
      await signInWithGoogle(window.location.origin);
    } catch (err: any) {
      setError(err?.message || 'Google sign in failed.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="falisha-auth-shell">
      <section className={`falisha-auth-form-pane ${isSignUp ? 'falisha-auth-form-pane-signup' : ''}`}>
        <div className="falisha-auth-form-inner">
          <div className="falisha-auth-logo">FALISHA JOBS</div>

          <div className="falisha-auth-heading-block">
            <h1 className="falisha-auth-heading">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
            <p className="falisha-auth-subheading">
              {isSignUp
                ? 'Start your journey to working abroad today.'
                : 'Sign in to your account and explore opportunities.'}
            </p>
          </div>

          <div className="falisha-auth-toggle-group">
            <p className="falisha-auth-toggle-label">I am {isSignUp ? 'signing up' : 'signing in'} as:</p>
            <div className="falisha-auth-toggle-row">
              <button
                type="button"
                onClick={() => {
                  setPortalType('individual');
                  resetMessages();
                }}
                className={`falisha-auth-toggle ${!isAgency ? 'falisha-auth-toggle-individual-active' : 'falisha-auth-toggle-idle'}`}
              >
                <span className="falisha-auth-toggle-content">
                  <User className="h-5 w-5" />
                  Individual
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortalType('agency');
                  resetMessages();
                }}
                className={`falisha-auth-toggle ${isAgency ? 'falisha-auth-toggle-partner-active' : 'falisha-auth-toggle-idle'}`}
              >
                <span className="falisha-auth-toggle-content">
                  <Building2 className="h-5 w-5" />
                  Partner
                </span>
              </button>
            </div>
            <p className="falisha-auth-toggle-help">Individual is for candidates. Partner is for agency and partner accounts.</p>
          </div>

          {successMessage && (
            <div className="falisha-auth-notice falisha-auth-notice-success">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="falisha-auth-notice falisha-auth-notice-error">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSignUp ? (
            <form onSubmit={handleSignUp} noValidate className="falisha-auth-form-fields">
              {isAgency && (
                <div className="falisha-auth-field">
                  <label className="falisha-auth-field-label">Agency Name <span className="text-red-500">*</span></label>
                  <div className="falisha-auth-input-wrap">
                    <Building2 className="falisha-auth-input-icon" />
                    <input type="text" value={signUpForm.agencyName} onChange={(event) => updateSignUpField('agencyName', event.target.value)} className="falisha-auth-input" placeholder="Enter your agency name" />
                  </div>
                  {signUpErrors.agencyName && <p className="mt-2 text-sm text-red-600">{signUpErrors.agencyName}</p>}
                </div>
              )}

              <div className="falisha-auth-field">
                <label className="falisha-auth-field-label">Full Name <span className="text-red-500">*</span></label>
                <div className="falisha-auth-input-wrap">
                  <User className="falisha-auth-input-icon" />
                  <input type="text" value={signUpForm.fullName} onChange={(event) => updateSignUpField('fullName', event.target.value)} className="falisha-auth-input" placeholder="John Smith" autoComplete="name" />
                </div>
                {signUpErrors.fullName && <p className="mt-2 text-sm text-red-600">{signUpErrors.fullName}</p>}
              </div>

              <div className="falisha-auth-field">
                <label className="falisha-auth-field-label">Email <span className="text-red-500">*</span></label>
                <div className="falisha-auth-input-wrap">
                  <Mail className="falisha-auth-input-icon" />
                  <input type="email" value={signUpForm.email} onChange={(event) => updateSignUpField('email', event.target.value)} className="falisha-auth-input" placeholder="your.email@example.com" autoComplete="email" />
                </div>
                {signUpErrors.email && <p className="mt-2 text-sm text-red-600">{signUpErrors.email}</p>}
              </div>

              <div className="falisha-auth-field">
                <label className="falisha-auth-field-label">Password <span className="text-red-500">*</span></label>
                <div className="falisha-auth-input-wrap">
                  <Lock className="falisha-auth-input-icon" />
                  <input type={showPassword ? 'text' : 'password'} value={signUpForm.password} onChange={(event) => updateSignUpField('password', event.target.value)} className="falisha-auth-input falisha-auth-input-password" placeholder="Create a password (min. 6 characters)" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="falisha-auth-password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {signUpErrors.password && <p className="mt-2 text-sm text-red-600">{signUpErrors.password}</p>}
              </div>

              <div className="falisha-auth-field">
                <label className="falisha-auth-field-label">Confirm Password <span className="text-red-500">*</span></label>
                <div className="falisha-auth-input-wrap">
                  <Lock className="falisha-auth-input-icon" />
                  <input type={showPassword ? 'text' : 'password'} value={signUpForm.confirmPassword} onChange={(event) => updateSignUpField('confirmPassword', event.target.value)} className="falisha-auth-input" placeholder="Confirm your password" autoComplete="new-password" />
                </div>
                {signUpErrors.confirmPassword && <p className="mt-2 text-sm text-red-600">{signUpErrors.confirmPassword}</p>}
              </div>

              {isAgency && (
                <div className="falisha-auth-field">
                  <label className="falisha-auth-field-label">Position / Role <span className="text-red-500">*</span></label>
                  <div className="falisha-auth-input-wrap">
                    <Briefcase className="falisha-auth-input-icon" />
                    <input type="text" value={signUpForm.positionRole} onChange={(event) => updateSignUpField('positionRole', event.target.value)} className="falisha-auth-input" placeholder="e.g., Director, Manager, Owner" />
                  </div>
                  {signUpErrors.positionRole && <p className="mt-2 text-sm text-red-600">{signUpErrors.positionRole}</p>}
                </div>
              )}

              <div className="falisha-auth-field">
                <label className="falisha-auth-field-label">{isAgency ? 'Country of Operation' : 'Country of Residence'} <span className="text-red-500">*</span></label>
                <div className="falisha-auth-input-wrap">
                  <MapPin className="falisha-auth-input-icon" />
                  <select value={signUpForm.country} onChange={(event) => updateSignUpField('country', event.target.value)} className="falisha-auth-input falisha-auth-select">
                    <option value="">Select your country</option>
                    {countryOptions.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                {signUpErrors.country && <p className="mt-2 text-sm text-red-600">{signUpErrors.country}</p>}
              </div>

              {!isAgency ? (
                <div className="falisha-auth-field">
                  <label className="falisha-auth-field-label">Phone Number <span className="text-red-500">*</span></label>
                  <div className="falisha-auth-inline-fields falisha-auth-inline-fields-compact">
                    <div className="falisha-auth-input-wrap">
                      <select value={signUpForm.phoneCode} onChange={(event) => updateSignUpField('phoneCode', event.target.value)} className="falisha-auth-input falisha-auth-select">
                        <option value="">Code</option>
                        {phoneCodeOptions.map((code) => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                    </div>
                    <div className="falisha-auth-input-wrap">
                      <Phone className="falisha-auth-input-icon" />
                      <input type="tel" value={signUpForm.phoneNumber} onChange={(event) => updateSignUpField('phoneNumber', event.target.value)} className="falisha-auth-input" placeholder="123 456 7890" autoComplete="tel" />
                    </div>
                  </div>
                  {(signUpErrors.phoneCode || signUpErrors.phoneNumber) && <p className="mt-2 text-sm text-red-600">{signUpErrors.phoneCode || signUpErrors.phoneNumber}</p>}
                </div>
              ) : (
                <div className="falisha-auth-field">
                  <label className="falisha-auth-field-label">Phone Number <span className="text-red-500">*</span></label>
                  <div className="falisha-auth-input-wrap">
                    <Phone className="falisha-auth-input-icon" />
                    <input type="tel" value={signUpForm.phoneNumber} onChange={(event) => updateSignUpField('phoneNumber', event.target.value)} className="falisha-auth-input" placeholder="+44 123 456 7890" autoComplete="tel" />
                  </div>
                  {signUpErrors.phoneNumber && <p className="mt-2 text-sm text-red-600">{signUpErrors.phoneNumber}</p>}
                </div>
              )}

              {!isAgency && (
                <div className="falisha-auth-field">
                  <label className="falisha-auth-field-label">Referral Code <span className="text-slate-400">(Optional)</span></label>
                  <div className="falisha-auth-input-wrap">
                    <Briefcase className="falisha-auth-input-icon" />
                    <input type="text" value={signUpForm.referralCode} onChange={(event) => updateSignUpField('referralCode', event.target.value)} className="falisha-auth-input" placeholder="Enter referral code (e.g., REF-ABC123)" />
                  </div>
                </div>
              )}

              {isAgency && (
                <>
                  <div className="falisha-auth-field">
                    <label className="falisha-auth-field-label">LinkedIn Profile <span className="text-slate-400">(Optional)</span></label>
                    <div className="falisha-auth-input-wrap">
                      <Globe className="falisha-auth-input-icon" />
                      <input type="url" value={signUpForm.linkedin} onChange={(event) => updateSignUpField('linkedin', event.target.value)} className="falisha-auth-input" placeholder="https://linkedin.com/in/yourprofile" />
                    </div>
                  </div>

                  <div className="falisha-auth-field">
                    <label className="falisha-auth-field-label">Business Registration Number / License <span className="text-red-500">*</span></label>
                    <div className="falisha-auth-input-wrap">
                      <Building2 className="falisha-auth-input-icon" />
                      <input type="text" value={signUpForm.businessRegistration} onChange={(event) => updateSignUpField('businessRegistration', event.target.value)} className="falisha-auth-input" placeholder="Enter your business registration number" />
                    </div>
                    {signUpErrors.businessRegistration && <p className="mt-2 text-sm text-red-600">{signUpErrors.businessRegistration}</p>}
                  </div>

                  <div className="falisha-auth-field">
                    <label className="falisha-auth-field-label">Website URL <span className="text-slate-400">(Optional)</span></label>
                    <div className="falisha-auth-input-wrap">
                      <Globe className="falisha-auth-input-icon" />
                      <input type="url" value={signUpForm.website} onChange={(event) => updateSignUpField('website', event.target.value)} className="falisha-auth-input" placeholder="https://youragency.com" />
                    </div>
                  </div>

                  <div className="falisha-auth-field">
                    <label className="falisha-auth-field-label">City <span className="text-red-500">*</span></label>
                    <div className="falisha-auth-input-wrap">
                      <MapPin className="falisha-auth-input-icon" />
                      <input type="text" value={signUpForm.city} onChange={(event) => updateSignUpField('city', event.target.value)} className="falisha-auth-input" placeholder="Enter your city" />
                    </div>
                    {signUpErrors.city && <p className="mt-2 text-sm text-red-600">{signUpErrors.city}</p>}
                  </div>
                </>
              )}

              <button type="submit" disabled={isLoading || googleLoading} className="falisha-auth-primary">
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} noValidate className="falisha-auth-form-fields">
              <div className="falisha-auth-field">
                <label className="falisha-auth-field-label">Email <span className="text-red-500">*</span></label>
                <div className="falisha-auth-input-wrap">
                  <Mail className="falisha-auth-input-icon" />
                  <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); if (emailError) setEmailError(''); }} className="falisha-auth-input" placeholder="your.email@example.com" autoComplete="email" />
                </div>
                {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
              </div>

              <div className="falisha-auth-field">
                <label className="falisha-auth-field-label">Password <span className="text-red-500">*</span></label>
                <div className="falisha-auth-input-wrap">
                  <Lock className="falisha-auth-input-icon" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); if (passwordError) setPasswordError(''); }} className="falisha-auth-input falisha-auth-input-password" placeholder="Enter your password" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="falisha-auth-password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
              </div>

              <div className="falisha-auth-form-options">
                <label className="falisha-auth-checkbox-row">
                  <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="falisha-auth-checkbox" />
                  Remember me
                </label>
                <button type="button" onClick={() => window.location.assign('mailto:support@falishajobs.com?subject=Forgot%20password')} className="falisha-auth-link falisha-auth-small-link">Forgot password?</button>
              </div>

              <button type="submit" disabled={isLoading || googleLoading} className="falisha-auth-primary">
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </button>
            </form>
          )}

          <div className="falisha-auth-divider">
            <div className="falisha-auth-divider-line" />
            <div className="falisha-auth-divider-text-wrap">
              <span className="falisha-auth-divider-text">or continue with</span>
            </div>
          </div>

          <button type="button" onClick={() => void handleGoogleSignIn()} disabled={googleLoading || isLoading} className="falisha-auth-google">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 flex-shrink-0">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 3.2 14.8 2.2 12 2.2 6.8 2.2 2.6 6.4 2.6 11.6S6.8 21 12 21c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.3H12Z" />
              <path fill="#4285F4" d="M3.6 7.1l3.2 2.4C7.7 7.6 9.7 6 12 6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 3.2 14.8 2.2 12 2.2c-3.6 0-6.7 2-8.4 4.9Z" />
              <path fill="#FBBC05" d="M12 21c2.7 0 5-.9 6.7-2.5l-3.1-2.6c-.8.6-1.9 1.1-3.6 1.1-3.8 0-5.2-2.5-5.5-3.8l-3.3 2.5C4.9 18.8 8.2 21 12 21Z" />
              <path fill="#34A853" d="M3.2 15.7l3.3-2.5c-.2-.6-.4-1.1-.4-1.7s.1-1.2.4-1.7L3.2 7.3c-.7 1.3-1.1 2.8-1.1 4.3s.4 3 1.1 4.1Z" />
            </svg>
            {googleLoading ? 'Redirecting to Google...' : isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
          </button>

          <p className="falisha-auth-signup-copy">
            {isSignUp ? 'Already have an account? ' : 'Don\'t have an account? '}
            <button type="button" onClick={() => switchAuthMode(isSignUp ? 'sign-in' : 'sign-up')} className="falisha-auth-link falisha-auth-medium-link falisha-auth-inline-link">
              {isSignUp ? 'Sign in' : 'Sign up for free'}
            </button>
          </p>
          <p className="falisha-auth-legal-copy">
            By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our <a href="#" className="falisha-auth-link">Terms of Service</a> and <a href="/privacy" className="falisha-auth-link">Privacy Policy</a>
          </p>

          <div className="falisha-auth-mobile-support">
            <div className="falisha-auth-mobile-support-card">
              <button type="button" onClick={() => openWhatsApp('Hi Falisha Jobs, I need help from your expert team with my account and onboarding.')} className="falisha-auth-mobile-support-chip">
                <span className="falisha-auth-mobile-support-icon">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <span className="pr-3">
                  <span className="block text-sm font-semibold text-slate-800">Chat with our experts</span>
                  <span className="block text-xs text-slate-500">Get help with onboarding</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="falisha-auth-marketing-pane">
        <div className="falisha-auth-marketing-overlay" />
        <div className="falisha-auth-marketing-image" />

        <div className="falisha-auth-marketing-inner">
          <div className="falisha-auth-marketing-top">
            <div className="falisha-auth-trust-card">
              <div className="falisha-auth-stars">
                {[...Array(5)].map((_, index) => (
                  <span key={index}>★</span>
                ))}
              </div>
              <div className="falisha-auth-trust-copy">
                <div className="falisha-auth-trust-topline">Verified</div>
                <div className="falisha-auth-trust-text">Trusted by more than</div>
                <div className="falisha-auth-trust-value">5000 expats!</div>
              </div>
            </div>

            <div className="falisha-auth-hero-copy">
              <h2 className="falisha-auth-hero-title">Your Journey Starts Here</h2>
              <p className="falisha-auth-hero-subtitle">Thousands have already achieved their dream of working abroad</p>
            </div>

            <div className="falisha-auth-browser-shell">
              <div className="falisha-auth-browser-topbar">
                <div className="falisha-auth-browser-dots">
                  <span className="falisha-auth-dot falisha-auth-dot-red" />
                  <span className="falisha-auth-dot falisha-auth-dot-yellow" />
                  <span className="falisha-auth-dot falisha-auth-dot-green" />
                </div>
                <div className="falisha-auth-browser-url">
                  <Lock className="h-3 w-3" />
                  <span>falishajobs.com</span>
                </div>
              </div>

              <div className="falisha-auth-browser-nav">
                <div className="falisha-auth-browser-brand-row">
                  <span className="falisha-auth-browser-brand">FALISHA</span>
                  <span className="falisha-auth-browser-divider">|</span>
                  <span className="falisha-auth-browser-brand-copy">FalishaJobs</span>
                  <button className="falisha-auth-relocate-pill">Relocate now</button>
                </div>
                <div className="falisha-auth-browser-avatar">
                  <User className="h-4 w-4" />
                </div>
              </div>

              <div className="falisha-auth-browser-hero">
                <div className="falisha-auth-browser-hero-title-row">
                  <span className="falisha-auth-browser-plane">✈</span>
                  <h3 className="falisha-auth-browser-hero-title">FalishaJobs → United Kingdom</h3>
                </div>
                <p className="falisha-auth-browser-hero-copy">Welcome back! Continue your relocation journey.</p>

                <div className="falisha-auth-timeline-card">
                  <div className="falisha-auth-timeline-title-row">
                    <CheckCircle2 className="h-5 w-5 text-sky-500" />
                    <span>Your visa timeline</span>
                  </div>
                </div>

                <div className="falisha-auth-timeline-row">
                  {timelineSteps.map(({ step, label, active }, index) => (
                    <div key={step} className="falisha-auth-timeline-step-wrap">
                      <div className={`falisha-auth-timeline-step ${active ? 'falisha-auth-timeline-step-active' : ''}`}>{step}</div>
                      {index < timelineSteps.length - 1 && <div className={`falisha-auth-timeline-line ${active ? 'falisha-auth-timeline-line-active' : ''}`} />}
                      <div className="falisha-auth-timeline-label">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="falisha-auth-next-card">
                  <div className="falisha-auth-next-left">
                    <div className="falisha-auth-next-icon">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="falisha-auth-next-kicker">Next step</p>
                      <p className="falisha-auth-next-title">Complete your profile</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-sky-500" />
                </div>
              </div>

              <div className="falisha-auth-bottom-actions">
                <button type="button" onClick={() => openWhatsApp('Hi Falisha Jobs, please send me the intro and onboarding details on WhatsApp.')} className="falisha-auth-watch-btn">
                  <span className="falisha-auth-play-icon">▷</span>
                  <span>Watch intro</span>
                </button>

                <button type="button" onClick={() => openWhatsApp('Hi Falisha Jobs, I want to chat with an expert on WhatsApp about jobs and onboarding.')} className="falisha-auth-consult-btn">
                  <span className="falisha-auth-consult-icon">
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="falisha-auth-consult-kicker">Free consultation</span>
                    <span className="falisha-auth-consult-title">Book now →</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="falisha-auth-stats-row">
            {heroStats.map(({ value, label, Icon }) => (
              <div key={label} className="falisha-auth-stat">
                <div className="falisha-auth-stat-icon">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="falisha-auth-stat-value">{value}</p>
                <p className="falisha-auth-stat-label">{label}</p>
              </div>
            ))}
          </div>

          <div className="falisha-auth-chat-wrap">
            <button type="button" onClick={() => openWhatsApp('Hi Falisha Jobs, I want to chat with your expert team on WhatsApp.')} className="falisha-auth-chat-chip">Chat with our experts</button>
            <button type="button" onClick={() => openWhatsApp('Hi Falisha Jobs, I need support from your expert team.')} className="falisha-auth-chat-circle">
              <MessageCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
