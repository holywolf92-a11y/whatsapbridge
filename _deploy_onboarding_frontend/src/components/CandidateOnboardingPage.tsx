import { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  Briefcase,
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleAlert,
  FileBadge2,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRoundCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Candidate, apiClient, OnboardingPayload } from '../lib/apiClient';
import { useAuth } from '../lib/authContext';

type FormState = {
  name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  address: string;
};

type UploadState = 'idle' | 'uploading' | 'success';

const EDIT_INTENT_KEY = 'falisha:onboarding-edit-intent';

function formatDisplayValue(value?: string | null) {
  if (!value || !String(value).trim()) {
    return 'Not provided';
  }
  return value;
}

function formatDateValue(value?: string | null) {
  if (!value) {
    return 'Not provided';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getFirstName(value?: string | null) {
  if (!value || !value.trim()) {
    return 'The candidate';
  }

  return value.trim().split(/\s+/)[0];
}

function getShortLocation(value?: string | null) {
  if (!value || !value.trim()) {
    return '';
  }

  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
  }

  return parts[0] || '';
}

function getGoogleAuthErrorMessage(error: any) {
  const message = String(error?.message || error?.error_description || error?.msg || 'Google sign-in could not be started.');

  if (/not enabled/i.test(message) || /unsupported provider/i.test(message)) {
    return 'Google sign-in is not enabled for this production environment yet. Enable the Google provider in Supabase Auth to use profile editing.';
  }

  return message;
}

function createInitialForm(candidate: Candidate): FormState {
  return {
    name: candidate.name || '',
    phone: candidate.phone || '',
    email: candidate.email || '',
    date_of_birth: candidate.date_of_birth || '',
    address: candidate.address || '',
  };
}

export function CandidateOnboardingPage() {
  const { session, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [token, setToken] = useState('');
  const [data, setData] = useState<OnboardingPayload | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Record<string, File | null>>({});
  const [documentStates, setDocumentStates] = useState<Record<string, UploadState>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoState, setPhotoState] = useState<UploadState>('idle');
  const [mismatchWarning, setMismatchWarning] = useState<{ candidateEmail?: string | null; googleEmail?: string | null } | null>(null);
  const [mismatchAction, setMismatchAction] = useState<'save' | 'photo' | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const documentInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const currentToken = new URLSearchParams(window.location.search).get('token')?.trim() || '';
    setToken(currentToken);

    if (!currentToken) {
      setError('This onboarding link is missing its token.');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const onboardingData = await apiClient.getOnboardingProfile(currentToken);
        setData(onboardingData);
        setForm(createInitialForm(onboardingData.candidate));
        setError(null);
      } catch (err: any) {
        setError(err?.message || 'Failed to load onboarding profile.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!session || !token) {
      return;
    }

    const intendedToken = window.localStorage.getItem(EDIT_INTENT_KEY);
    if (intendedToken === token) {
      setEditing(true);
      window.localStorage.removeItem(EDIT_INTENT_KEY);
    }
  }, [session, token]);

  const signedInEmail = session?.user?.email?.trim().toLowerCase() || '';
  const candidateEmail = data?.candidate.email?.trim().toLowerCase() || '';
  const emailMismatch = Boolean(
    session &&
      signedInEmail &&
      candidateEmail &&
      signedInEmail !== candidateEmail &&
      data?.candidate.user_id !== session.user.id
  );

  async function beginEditing() {
    if (authLoading) {
      return;
    }

    if (!session) {
      try {
        window.localStorage.setItem(EDIT_INTENT_KEY, token);
        await signInWithGoogle(window.location.href);
      } catch (err: any) {
        window.localStorage.removeItem(EDIT_INTENT_KEY);
        toast.error(getGoogleAuthErrorMessage(err));
      }
      return;
    }

    setEditing(true);
  }

  function updateFormField(field: keyof FormState, value: string) {
    setForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function handleSave(confirmMismatch: boolean = false) {
    if (!session?.access_token || !form) {
      await beginEditing();
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.updateOnboardingProfile(
        token,
        {
          ...form,
          confirm_email_mismatch: confirmMismatch,
        },
        session.access_token
      );

      setData(response);
      setForm(createInitialForm(response.candidate));
      setEditing(false);
      setMismatchWarning(null);
      setMismatchAction(null);
      setPendingPhotoFile(null);
      toast.success('Profile updated successfully.');
    } catch (err: any) {
      if (err?.status === 409 && err?.body?.code === 'GOOGLE_EMAIL_MISMATCH') {
        setMismatchWarning({
          candidateEmail: err.body?.candidate_email,
          googleEmail: err.body?.google_email,
        });
        setMismatchAction('save');
        return;
      }
      toast.error(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDocumentUpload(documentType: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedDocuments((current) => ({
      ...current,
      [documentType]: file,
    }));
    setDocumentStates((current) => ({
      ...current,
      [documentType]: 'idle',
    }));
  }

  function clearDocumentState(documentType: string) {
    setSelectedDocuments((current) => ({
      ...current,
      [documentType]: null,
    }));
    setDocumentStates((current) => ({
      ...current,
      [documentType]: 'idle',
    }));
    if (documentInputRefs.current[documentType]) {
      documentInputRefs.current[documentType]!.value = '';
    }
  }

  function markDocumentUploadSuccess(documentType: string) {
    setDocumentStates((current) => ({
      ...current,
      [documentType]: 'success',
    }));
    window.setTimeout(() => {
      setDocumentStates((current) => ({
        ...current,
        [documentType]: 'idle',
      }));
    }, 2400);
  }

  async function submitDocumentUpload(documentType: string) {
    const file = selectedDocuments[documentType];

    if (!file) {
      toast.error('Choose a file before uploading.');
      return;
    }

    try {
      setUploadingDocument(documentType);
      setDocumentStates((current) => ({
        ...current,
        [documentType]: 'uploading',
      }));
      const response = await apiClient.uploadOnboardingDocument(token, file, documentType);
      setData(response.onboarding);
      setForm(createInitialForm(response.onboarding.candidate));
      clearDocumentState(documentType);
      markDocumentUploadSuccess(documentType);
      toast.success('Document uploaded successfully.');
    } catch (err: any) {
      setDocumentStates((current) => ({
        ...current,
        [documentType]: 'idle',
      }));
      toast.error(err?.message || 'Failed to upload document.');
    } finally {
      setUploadingDocument(null);
    }
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>, confirmMismatch: boolean = false) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedPhotoFile(file);
    setPhotoState('idle');

    if (confirmMismatch) {
      await uploadPhotoFile(file, true);
    }
  }

  function clearPhotoSelection() {
    setSelectedPhotoFile(null);
    setPhotoState('idle');
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  }

  async function submitPhotoUpload(confirmMismatch: boolean = false) {
    if (!selectedPhotoFile) {
      toast.error('Choose a profile photo before uploading.');
      return;
    }

    await uploadPhotoFile(selectedPhotoFile, confirmMismatch);
  }

  async function uploadPhotoFile(file: File, confirmMismatch: boolean = false) {
    if (!file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profile photo must be 2MB or smaller.');
      return;
    }

    if (!session?.access_token) {
      setPendingPhotoFile(file);
      await beginEditing();
      return;
    }

    try {
      setUploadingPhoto(true);
      setPhotoState('uploading');
      const response = await apiClient.uploadOnboardingPhoto(token, file, session.access_token, confirmMismatch);
      setData(response);
      setForm(createInitialForm(response.candidate));
      setMismatchWarning(null);
      setMismatchAction(null);
      setPendingPhotoFile(null);
      clearPhotoSelection();
      setPhotoState('success');
      window.setTimeout(() => setPhotoState('idle'), 2400);
      toast.success('Profile photo updated.');
    } catch (err: any) {
      if (err?.status === 409 && err?.body?.code === 'GOOGLE_EMAIL_MISMATCH') {
        setMismatchWarning({
          candidateEmail: err.body?.candidate_email,
          googleEmail: err.body?.google_email,
        });
        setMismatchAction('photo');
        setPendingPhotoFile(file);
        return;
      }
      setPhotoState('idle');
      toast.error(err?.message || 'Failed to upload profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function confirmMismatchAndContinue() {
    if (mismatchAction === 'photo' && pendingPhotoFile) {
      await uploadPhotoFile(pendingPhotoFile, true);
      return;
    }

    await handleSave(true);
  }

  async function handleGoogleLogin() {
    try {
      window.localStorage.setItem(EDIT_INTENT_KEY, token);
      await signInWithGoogle(window.location.href);
    } catch (err: any) {
      window.localStorage.removeItem(EDIT_INTENT_KEY);
      toast.error(getGoogleAuthErrorMessage(err));
    }
  }

  async function handleGoogleSignOut() {
    try {
      await signOut();
      setEditing(false);
      toast.success('Signed out successfully.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to sign out.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f2ef] flex items-center justify-center px-6" style={{ fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif' }}>
        <div className="rounded-[28px] border border-white/70 bg-white px-8 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-sky-700" />
          <p className="text-sm font-semibold tracking-[0.18em] text-slate-500 uppercase">Loading onboarding profile</p>
        </div>
      </div>
    );
  }

  if (error || !data || !form) {
    return (
      <div className="min-h-screen bg-[#f3f2ef] flex items-center justify-center px-6" style={{ fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif' }}>
        <div className="max-w-lg rounded-[28px] border border-red-100 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <CircleAlert className="mb-5 h-11 w-11 text-rose-500" />
          <h1 className="mb-3 text-3xl text-slate-900" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>Onboarding unavailable</h1>
          <p className="text-base text-slate-600">{error || 'This onboarding link is not valid anymore.'}</p>
        </div>
      </div>
    );
  }

  const profileFields = [
    { label: 'Email', value: formatDisplayValue(data.candidate.email), icon: Mail },
    { label: 'Phone', value: formatDisplayValue(data.candidate.phone), icon: Phone },
    { label: 'DOB', value: formatDateValue(data.candidate.date_of_birth), icon: CalendarDays },
    { label: 'Address', value: formatDisplayValue(data.candidate.address), icon: MapPin },
  ];

  const completionItems = [
    ['Profile', data.completion.profile],
    ['Documents', data.completion.documents],
    ['Overall', data.completion.overall],
  ] as const;

  const candidateFirstName = getFirstName(data.candidate.name);
  const candidateLocation = getShortLocation(data.candidate.address);
  const pendingDocumentCount = data.missing_documents.length;
  const aboutNarrative = `${candidateFirstName} is currently moving through onboarding for the ${data.candidate.position || 'assigned'} role${candidateLocation ? ` in ${candidateLocation}` : ''}. This profile keeps the recruitment file current so contact details, documents, and final review status stay aligned in one place.`;

  const aboutItems = [
    {
      label: 'Role track',
      value: data.candidate.position ? `${data.candidate.position} candidate` : 'Role assignment is being finalized by the recruitment team.',
    },
    {
      label: 'File status',
      value:
        pendingDocumentCount > 0
          ? `${pendingDocumentCount} document${pendingDocumentCount === 1 ? '' : 's'} still need to be uploaded before the file is ready for final review.`
          : 'All requested documents are already on file and ready for final screening.',
    },
    {
      label: 'Recruitment access',
      value: session ? 'Profile edits and photo updates are unlocked for this signed-in session.' : 'Sign in with Gmail to unlock profile edits and photo updates for this record.',
    },
  ];

  const primaryButtonClass =
    'onboarding-button onboarding-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60';
  const secondaryButtonClass =
    'onboarding-button onboarding-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60';
  const darkButtonClass =
    'onboarding-button onboarding-button-dark inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60';
  const compactButtonClass =
    'onboarding-button onboarding-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60';
  const compactPrimaryButtonClass =
    'onboarding-button onboarding-button-primary inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60';
  const sectionCardClass =
    'onboarding-card rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,248,252,0.98))] p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)]';
  const infoCardClass =
    'onboarding-card rounded-[26px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] p-5 shadow-[0_14px_32px_rgba(15,23,42,0.06)]';

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#eef2f7_0%,#f7f9fc_32%,#edf2f7_100%)] text-slate-900" style={{ fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif' }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(8,76,147,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(71,85,105,0.12),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.76),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute left-[-120px] top-[180px] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(8,76,147,0.12),rgba(8,76,147,0))] blur-2xl" />
      <div className="pointer-events-none absolute right-[-80px] top-[460px] h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle,rgba(148,163,184,0.14),rgba(148,163,184,0))] blur-2xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 lg:py-5">
        <div className="sticky top-3 z-20 mb-4 rounded-[22px] border border-white/70 bg-white/84 px-4 py-2.5 shadow-[0_14px_35px_rgba(15,23,42,0.07)] backdrop-blur xl:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0a66c2] text-white shadow-[0_10px_22px_rgba(10,102,194,0.20)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0a66c2]">Falisha Jobs</p>
                <p className="text-[15px] font-semibold text-slate-900">Candidate profile</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0a66c2]" />
              Secure profile access
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[34px] border border-white/80 bg-white/68 shadow-[0_30px_90px_rgba(15,23,42,0.14)] backdrop-blur-sm">
          <div className="relative h-40 bg-[linear-gradient(135deg,#0a66c2_0%,#0c4a8a_28%,#0f172a_100%)] sm:h-52">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.22),transparent_36%,rgba(14,165,233,0.08)_72%,rgba(255,255,255,0.06))]" />
            <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),rgba(255,255,255,0))] lg:block" />
            <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-white uppercase backdrop-blur sm:left-6 sm:top-6">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified profile access
            </div>
          </div>

          <div className="px-5 pb-8 sm:px-8 lg:px-10 lg:pb-10">
            <div className="-mt-14 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div
                  className="relative shrink-0 overflow-hidden rounded-[30px] border-[6px] border-white bg-slate-200 shadow-[0_22px_50px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/50"
                  style={{ width: '9rem', height: '9rem', minWidth: '9rem', minHeight: '9rem' }}
                >
                  {data.candidate.profile_photo_signed_url ? (
                    <img src={data.candidate.profile_photo_signed_url} alt={data.candidate.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#dbeafe,#eff6ff_40%,#ffffff)] text-5xl font-bold text-[#0a66c2]">
                      {data.candidate.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                <div className="space-y-4 pb-1">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.22em] text-[#0a66c2] uppercase">Candidate profile</p>
                    <h1 className="mt-2 text-4xl leading-tight text-slate-900 sm:text-[3.1rem]" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>
                      {data.candidate.name || 'Candidate profile'}
                    </h1>
                    <p className="mt-2 text-lg font-semibold text-slate-700">
                      {data.candidate.position || 'Candidate'}
                    </p>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
                      Review your record, submit required documents, and keep your information current in one secure profile.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 shadow-sm">
                      <ShieldCheck className="h-4 w-4" />
                      Secure document updates
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm">
                      <Briefcase className="h-4 w-4 text-[#0a66c2]" />
                      Candidate record
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[280px] lg:items-end">
                <div className="w-full rounded-[24px] border border-slate-200 bg-white/88 p-3 shadow-[0_14px_32px_rgba(15,23,42,0.06)] backdrop-blur lg:min-w-[280px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Profile access</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Login with Gmail to unlock profile access and secure editing.</p>
                  {session ? (
                    <div className={`mt-3 rounded-2xl border px-3 py-2 text-sm ${emailMismatch ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                      <p className="font-semibold">Gmail connected</p>
                      <p className="mt-1 break-all text-xs leading-5">{session.user.email || 'Google user'}</p>
                    </div>
                  ) : null}
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row lg:flex-col">
                  {!session ? (
                    <button
                      onClick={handleGoogleLogin}
                      disabled={authLoading}
                      className={`${secondaryButtonClass} w-full lg:min-w-[280px]`}
                    >
                      {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 text-rose-500" />}
                      Login with Gmail
                    </button>
                  ) : null}
                  {!editing ? (
                    <button
                      onClick={beginEditing}
                      disabled={authLoading}
                      className={`${primaryButtonClass} w-full lg:min-w-[280px]`}
                    >
                      {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setForm(createInitialForm(data.candidate));
                          setMismatchWarning(null);
                        }}
                        className={`${secondaryButtonClass} w-full lg:min-w-[280px]`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className={`${darkButtonClass} w-full lg:min-w-[280px]`}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundCheck className="h-4 w-4" />}
                        Save Changes
                      </button>
                    </>
                  )}
                  {session && !editing ? (
                    <button
                      onClick={handleGoogleSignOut}
                      className={`${secondaryButtonClass} w-full lg:min-w-[280px]`}
                    >
                      Sign Out
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {mismatchWarning && (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Google account confirmation required</p>
                    <p className="mt-1 text-sm text-amber-800">
                      Candidate email: {mismatchWarning.candidateEmail || 'Not provided'} | Google email: {mismatchWarning.googleEmail || 'Unknown'}
                    </p>
                    <p className="mt-1 text-sm text-amber-700">If this is the correct candidate, you can confirm and continue with this Google account.</p>
                  </div>
                  <button
                    onClick={confirmMismatchAndContinue}
                    disabled={saving}
                    className={primaryButtonClass}
                  >
                    Confirm And Save
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.95fr)]">
              <div className="space-y-6">
                <section className={sectionCardClass}>
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">Professional summary</p>
                      <h2 className="mt-2 text-2xl text-slate-900" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>
                        {editing ? 'Edit your profile' : 'Your profile at a glance'}
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {editing ? 'Edit mode' : 'Read only'}
                    </span>
                  </div>

                  {!editing ? (
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
                      <article className={`${infoCardClass} bg-[linear-gradient(140deg,#f8fbff,#eef3f8_52%,#ffffff)]`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#084c93]">About</p>
                        <h3 className="mt-3 text-[2rem] leading-tight text-slate-950" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>
                          {formatDisplayValue(data.candidate.name)}
                        </h3>
                        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-[15px]">
                          {aboutNarrative}
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                          {aboutItems.map((item) => (
                            <div key={item.label} className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm ring-1 ring-white/60">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                              <p className="mt-1.5 text-sm leading-6 text-slate-700">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </article>

                      <article className={infoCardClass}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Contact</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Professional contact details</h3>
                          </div>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                            Candidate record
                          </span>
                        </div>

                        <div className="mt-5 space-y-3">
                          {profileFields.map((field) => {
                            const Icon = field.icon;
                            return (
                              <div key={field.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 transition hover:border-[#bfdbfe] hover:bg-white">
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 rounded-xl bg-[#e8f1fb] p-2 text-[#0a66c2]">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{field.label}</p>
                                    <p className="mt-1 break-words text-sm font-medium leading-6 text-slate-800">{field.value}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 transition hover:border-[#bfdbfe] hover:bg-white">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Candidate code</p>
                            <p className="mt-1 text-sm font-medium text-slate-800">{data.candidate.candidate_code || 'Not assigned'}</p>
                          </div>
                        </div>
                      </article>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Name</span>
                        <input value={form.name} onChange={(event) => updateFormField('name', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone</span>
                        <input value={form.phone} onChange={(event) => updateFormField('phone', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</span>
                        <input type="email" value={form.email} onChange={(event) => updateFormField('email', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date of birth</span>
                        <input type="date" value={form.date_of_birth} onChange={(event) => updateFormField('date_of_birth', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Address</span>
                        <textarea value={form.address} onChange={(event) => updateFormField('address', event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
                      </label>
                    </div>
                  )}
                </section>

                <section className={sectionCardClass}>
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">Document center</p>
                      <h2 className="mt-2 text-2xl text-slate-900" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>Upload only what is still missing</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Compact upload cards keep the file checklist visible while preserving clear selection and status feedback.</p>
                    </div>
                    <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#0c4a8a]">
                      {data.missing_documents.length} pending
                    </span>
                  </div>

                  {data.missing_documents.length === 0 ? (
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5" />
                        <p className="font-medium">All required documents currently on file.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 xl:grid-cols-2">
                      {data.missing_documents.map((document) => {
                        const selectedFile = selectedDocuments[document.document_type];
                        const uploadState = documentStates[document.document_type] || 'idle';

                        return (
                        <div key={document.key} className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,247,251,0.96))] p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#bfdbfe] hover:shadow-[0_16px_28px_rgba(8,76,147,0.08)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[15px] font-semibold text-slate-900">{document.label}</p>
                              <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">PDF, JPG, PNG, WEBP, DOC, DOCX</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                              Pending
                            </span>
                          </div>
                          <div className="mt-3 flex min-h-[42px] items-center justify-between gap-3 rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-slate-200/70">
                            <p className="min-w-0 flex-1 truncate text-sm text-slate-600">
                              {selectedFile ? selectedFile.name : 'No file selected yet'}
                            </p>
                            {selectedFile ? (
                              <button
                                type="button"
                                onClick={() => clearDocumentState(document.document_type)}
                                disabled={uploadState === 'uploading'}
                                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Clear
                              </button>
                            ) : null}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => documentInputRefs.current[document.document_type]?.click()}
                                disabled={uploadState === 'uploading'}
                                className={compactButtonClass}
                              >
                                <Upload className="h-4 w-4 text-sky-700" />
                                Choose File
                              </button>
                              <button
                                type="button"
                                onClick={() => submitDocumentUpload(document.document_type)}
                                disabled={!selectedFile || uploadState === 'uploading' || uploadingDocument === document.document_type}
                                className={compactPrimaryButtonClass}
                              >
                                {uploadState === 'uploading' ? <Loader2 className="h-4 w-4 animate-spin" /> : uploadState === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                                {uploadState === 'uploading' ? 'Uploading...' : uploadState === 'success' ? 'Uploaded' : 'Upload Now'}
                              </button>
                              <input
                                ref={(element) => {
                                  documentInputRefs.current[document.document_type] = element;
                                }}
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
                                onChange={(event) => handleDocumentUpload(document.document_type, event)}
                                disabled={uploadState === 'uploading'}
                              />
                          </div>
                          <div className="mt-2.5 flex min-h-[28px] items-center justify-end gap-2">
                              {uploadState === 'success' ? (
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Upload successful
                                </span>
                              ) : null}
                          </div>
                        </div>
                      )})}
                    </div>
                  )}
                </section>

                <section className={sectionCardClass}>
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">Verified records</p>
                      <h2 className="mt-2 text-2xl text-slate-900" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>What we already have</h2>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 shadow-sm">
                      {data.documents.length} uploaded
                    </span>
                  </div>

                  <div className="space-y-3">
                    {data.documents.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No documents uploaded yet.</div>
                    ) : (
                      data.documents.map((document) => (
                        <div key={document.id} className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-[#bfdbfe] hover:shadow-[0_14px_28px_rgba(10,102,194,0.08)] sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{document.file_name || 'Document'}</p>
                            <p className="mt-1 text-sm text-slate-600">{document.category || document.document_type || 'Other document'}</p>
                          </div>
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                            <FileBadge2 className="h-4 w-4 text-sky-700" />
                            {String(document.verification_status || 'uploaded').replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                <section className={`${sectionCardClass} onboarding-fade-up`}>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-2xl bg-[#e8f1fb] p-3 text-[#0a66c2]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">Completion</p>
                      <h3 className="mt-1 text-xl font-semibold text-slate-900">Profile progress</h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {completionItems.map(([label, value]) => (
                      <div key={label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{label}</span>
                          <span className="font-semibold text-slate-900">{value}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100">
                          <div className="h-3 rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-slate-900" style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`${sectionCardClass} onboarding-fade-up`}>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">Profile photo</p>
                      <h3 className="mt-1 text-xl font-semibold text-slate-900">Keep this card up to date</h3>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-[linear-gradient(180deg,#f8fafc,#eef4f9)] p-5 ring-1 ring-slate-200/70">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="h-20 w-20 overflow-hidden rounded-3xl bg-slate-200">
                        {data.candidate.profile_photo_signed_url ? (
                          <img src={data.candidate.profile_photo_signed_url} alt={data.candidate.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-500">
                            {data.candidate.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">LinkedIn-style profile photo</p>
                        <p className="mt-1 text-sm text-slate-600">JPG, PNG, or WEBP. Max 2MB. Editing requires Google Sign-In.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <input
                        ref={photoInputRef}
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => handlePhotoUpload(event, false)}
                        disabled={uploadingPhoto}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className={`${compactButtonClass} flex-1`}
                        >
                          <Camera className="h-4 w-4 text-sky-700" />
                          Choose Photo
                        </button>
                        {session ? (
                          <button
                            type="button"
                            onClick={() => submitPhotoUpload(false)}
                            disabled={!selectedPhotoFile || uploadingPhoto}
                            className={`${darkButtonClass} flex-1 px-4`}
                          >
                            {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : photoState === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                            {uploadingPhoto ? 'Uploading...' : photoState === 'success' ? 'Uploaded' : 'Upload Photo'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={authLoading}
                            className={`${primaryButtonClass} flex-1 px-4`}
                          >
                            {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 text-rose-300" />}
                            Login with Gmail
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-600">
                          {selectedPhotoFile ? `Selected: ${selectedPhotoFile.name}` : 'No photo selected yet.'}
                        </p>
                        <div className="flex items-center gap-2">
                          {photoState === 'success' ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" />
                              Upload successful
                            </span>
                          ) : null}
                          {selectedPhotoFile ? (
                            <button
                              type="button"
                              onClick={clearPhotoSelection}
                              disabled={uploadingPhoto}
                              className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Clear
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={`${sectionCardClass} onboarding-fade-up`}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">Access rules</p>
                      <h3 className="mt-1 text-xl font-semibold text-slate-900">How this page works</h3>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="rounded-2xl bg-slate-50 p-4">This secure token lets you view your profile and upload missing documents.</div>
                    <div className="rounded-2xl bg-slate-50 p-4">Editing profile details and updating your photo requires Google authentication.</div>
                    <div className="rounded-2xl bg-slate-50 p-4">All changes are written back to the candidate record so the admin team sees the latest information.</div>
                    {session ? (
                      <div className={`rounded-2xl p-4 ${emailMismatch ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                        <p className="font-semibold">Gmail connected</p>
                        <p className="mt-1 break-all">Signed in as {session.user.email || 'Google user'}.</p>
                      </div>
                    ) : (
                      <button onClick={handleGoogleLogin} className="onboarding-button onboarding-button-secondary inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 font-semibold text-slate-700">
                        <Mail className="h-4 w-4 text-rose-500" />
                        Login With Gmail
                      </button>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}