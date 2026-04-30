import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Clock3,
  FileCheck,
  FileText,
  Globe2,
  IdCard,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCircle2,
  type LucideIcon,
} from 'lucide-react';
import { apiClient, type PortalProfileResponse } from '../lib/apiClient';

type CandidatePortalDashboardProps = {
  accessToken: string;
  user: {
    name: string;
    email: string;
    roleLabel: string;
  };
  portalProfile: PortalProfileResponse | null;
  loading: boolean;
  error?: string | null;
  onSignOut: () => void;
  onRefreshPortalProfile: () => Promise<PortalProfileResponse | null>;
};

type CandidateDocumentItem = {
  id: string;
  file_name?: string | null;
  document_type?: string | null;
  category?: string | null;
  verification_status?: string | null;
  created_at?: string | null;
  received_at?: string | null;
};

type MissingFieldInfo = {
  field: string;
  label: string;
  source: string | null;
  canBeManuallyUpdated: boolean;
  hint: string;
};

type RequiredDocument = {
  key: string;
  label: string;
  description: string;
  candidateFlag: 'cv_received' | 'passport_received' | 'cnic_received' | 'photo_received' | 'degree_received' | 'medical_received' | 'visa_received';
};

const REQUIRED_DOCUMENTS: RequiredDocument[] = [
  { key: 'cv', label: 'CV / Resume', description: 'Upload your latest CV first so the portal can identify missing details and supporting documents.', candidateFlag: 'cv_received' },
  { key: 'passport', label: 'Passport', description: 'Clear color scan of your passport biodata page.', candidateFlag: 'passport_received' },
  { key: 'cnic', label: 'CNIC', description: 'Front and back image or PDF of your national ID.', candidateFlag: 'cnic_received' },
  { key: 'photo', label: 'Passport photo', description: 'Recent formal passport-style photo.', candidateFlag: 'photo_received' },
  { key: 'degree', label: 'Degree / Certificate', description: 'Your latest relevant education document.', candidateFlag: 'degree_received' },
  { key: 'medical', label: 'Medical', description: 'Medical certificate if already available.', candidateFlag: 'medical_received' },
  { key: 'visa', label: 'Visa', description: 'Upload your visa document if it has already been issued.', candidateFlag: 'visa_received' },
];

function formatDate(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function normalizeDocumentKey(value?: string | null) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes('resume') || normalized === 'cv') return 'cv';
  if (normalized.includes('passport')) return 'passport';
  if (normalized.includes('cnic') || normalized.includes('id card') || normalized === 'id') return 'cnic';
  if (normalized.includes('photo') || normalized.includes('picture')) return 'photo';
  if (normalized.includes('degree') || normalized.includes('certificate') || normalized.includes('education')) return 'degree';
  if (normalized.includes('medical')) return 'medical';
  if (normalized.includes('visa')) return 'visa';

  return normalized;
}

function getDocumentKey(document: CandidateDocumentItem) {
  return normalizeDocumentKey(document.document_type) || normalizeDocumentKey(document.category) || normalizeDocumentKey(document.file_name);
}

function formatCandidateHandle(candidateId?: string | null) {
  if (!candidateId) {
    return 'candidate-new';
  }

  return `${candidateId.slice(0, 8)}...${candidateId.slice(-4)}`;
}

function getDocumentStatusTone(status?: string | null) {
  const normalized = String(status || '').trim().toLowerCase();

  if (normalized === 'verified') {
    return {
      badge: 'bg-emerald-100 text-emerald-700',
      rail: 'bg-emerald-500',
      label: 'Verified',
    };
  }

  if (normalized === 'rejected') {
    return {
      badge: 'bg-rose-100 text-rose-700',
      rail: 'bg-rose-500',
      label: 'Needs replacement',
    };
  }

  return {
    badge: 'bg-amber-100 text-amber-800',
    rail: 'bg-amber-500',
    label: normalized || 'pending',
  };
}

function getCandidateStatusLabel(hasCv: boolean, missingDocuments: number, missingFields: number) {
  if (!hasCv) {
    return 'Awaiting CV';
  }

  if (missingDocuments === 0 && missingFields === 0) {
    return 'Ready for review';
  }

  return 'Profile in progress';
}

export function CandidatePortalDashboard({
  accessToken,
  user,
  portalProfile,
  loading,
  error,
  onSignOut,
  onRefreshPortalProfile,
}: CandidatePortalDashboardProps) {
  const candidate = portalProfile?.profile.linkedCandidate as Record<string, any> | null;
  const candidateId = portalProfile?.linkedCandidateId || candidate?.id || null;
  const [documents, setDocuments] = useState<CandidateDocumentItem[]>([]);
  const [missingFields, setMissingFields] = useState<MissingFieldInfo[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [bootstrapAttempted, setBootstrapAttempted] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (candidateId) {
      setBootstrapAttempted(false);
      setBootstrapLoading(false);
      setBootstrapError(null);
    }
  }, [candidateId]);

  useEffect(() => {
    if (candidateId || !accessToken || loading || bootstrapAttempted) {
      return;
    }

    let isMounted = true;
    setBootstrapAttempted(true);
    setBootstrapLoading(true);
    setBootstrapError(null);

    apiClient
      .bootstrapCandidatePortalProfile(accessToken)
      .then(() => onRefreshPortalProfile())
      .catch((bootstrapFailure: any) => {
        if (!isMounted) {
          return;
        }
        setBootstrapError(bootstrapFailure?.message || 'Failed to prepare your candidate workspace');
      })
      .finally(() => {
        if (isMounted) {
          setBootstrapLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, bootstrapAttempted, candidateId, loading, onRefreshPortalProfile]);

  useEffect(() => {
    if (!candidateId) {
      setDocuments([]);
      setMissingFields([]);
      return;
    }

    let isMounted = true;
    setDataLoading(true);

    Promise.all([
      apiClient.listCandidateDocumentsNew(candidateId),
      apiClient.getMissingFields(candidateId),
    ])
      .then(([documentResponse, missingFieldsResponse]) => {
        if (!isMounted) {
          return;
        }
        setDocuments(documentResponse || []);
        setMissingFields(missingFieldsResponse.missing_fields_with_info || []);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setDocuments([]);
        setMissingFields([]);
      })
      .finally(() => {
        if (isMounted) {
          setDataLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [candidateId]);

  const uploadedDocumentKeys = useMemo(() => {
    const keys = new Set<string>();
    documents.forEach((document) => {
      const key = getDocumentKey(document);
      if (key) {
        keys.add(key);
      }
    });
    return keys;
  }, [documents]);

  const hasDocument = (item: RequiredDocument) => uploadedDocumentKeys.has(item.key) || Boolean(candidate?.[item.candidateFlag]);
  const hasCv = hasDocument(REQUIRED_DOCUMENTS[0]);
  const missingDocuments = REQUIRED_DOCUMENTS.filter((item) => !hasDocument(item));
  const missingUploads = missingDocuments.filter((item) => item.key !== 'cv');

  const stats = useMemo(() => {
    const verifiedDocs = documents.filter((document) => String(document.verification_status || '').toLowerCase() === 'verified').length;
    const pendingDocs = documents.filter((document) => {
      const status = String(document.verification_status || '').toLowerCase();
      return status && status !== 'verified';
    }).length;

    return {
      totalDocuments: documents.length,
      verifiedDocs,
      pendingDocs,
      missingFields: missingFields.length,
      missingDocuments: missingDocuments.length,
    };
  }, [documents, missingDocuments.length, missingFields.length]);

  const receivedFlags = REQUIRED_DOCUMENTS.filter((item) => Boolean(candidate?.[item.candidateFlag])).length;
  const checklistCompleted = REQUIRED_DOCUMENTS.length - missingDocuments.length;
  const readinessDenominator = REQUIRED_DOCUMENTS.length + Math.max(missingFields.length, 1);
  const readinessNumerator = checklistCompleted + Math.max(0, 1 - Math.min(missingFields.length, 1));
  const readinessPercent = Math.max(8, Math.min(100, Math.round((readinessNumerator / readinessDenominator) * 100)));
  const statusLabel = getCandidateStatusLabel(hasCv, missingUploads.length, missingFields.length);
  const candidateDisplayName = candidate?.name || user.name;
  const firstName = candidateDisplayName.split(/\s+/)[0] || 'Candidate';
  const locationLabel = candidate?.address || candidate?.country_of_interest || candidate?.nationality || 'Location not yet added';
  const candidateHandle = formatCandidateHandle(candidateId);

  const journeySteps: Array<{ title: string; detail: string; done: boolean; icon: LucideIcon }> = [
    {
      title: 'Account linked',
      detail: 'Your login is attached to your personal candidate route.',
      done: Boolean(candidateId),
      icon: ShieldCheck,
    },
    {
      title: 'CV received',
      detail: hasCv ? 'Your CV is in the system and the rest of the checklist is unlocked.' : 'Upload your CV to unlock the full checklist.',
      done: hasCv,
      icon: FileText,
    },
    {
      title: 'Documents complete',
      detail: missingUploads.length === 0 ? 'All required uploads currently on file.' : `${missingUploads.length} required uploads still need attention.`,
      done: missingUploads.length === 0,
      icon: FileCheck,
    },
    {
      title: 'Profile details ready',
      detail: missingFields.length === 0 ? 'No missing profile fields are currently flagged.' : `${missingFields.length} profile details still need follow-up.`,
      done: missingFields.length === 0,
      icon: IdCard,
    },
  ];

  const handleFileSelection = (documentKey: string, event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null;
    setSelectedFiles((current) => ({ ...current, [documentKey]: nextFile }));
    setUploadError(null);
  };

  const refreshWorkspace = async () => {
    if (!candidateId) {
      return;
    }

    const [documentResponse, missingFieldsResponse] = await Promise.all([
      apiClient.listCandidateDocumentsNew(candidateId),
      apiClient.getMissingFields(candidateId),
      onRefreshPortalProfile(),
    ]);

    setDocuments(documentResponse || []);
    setMissingFields(missingFieldsResponse.missing_fields_with_info || []);
  };

  const handleUpload = async (documentKey: string) => {
    const file = selectedFiles[documentKey];
    if (!candidateId || !file) {
      return;
    }

    setUploadingKey(documentKey);
    setUploadError(null);

    try {
      await apiClient.uploadCandidateDocument(file, candidateId, 'candidate-portal', documentKey);
      await apiClient.updateCandidateDocumentFlags(candidateId);
      await refreshWorkspace();
      setSelectedFiles((current) => ({ ...current, [documentKey]: null }));
    } catch (uploadFailure: any) {
      setUploadError(uploadFailure?.message || 'Failed to upload document');
    } finally {
      setUploadingKey(null);
    }
  };

  const renderUploadCard = (item: RequiredDocument, emphasized?: boolean) => {
    const file = selectedFiles[item.key];
    const isUploading = uploadingKey === item.key;

    return (
      <div
        key={item.key}
        className={`candidate-portal-upload-card onboarding-card ${emphasized ? 'border-amber-200 bg-white/96 shadow-[0_26px_70px_rgba(217,119,6,0.14)]' : 'border-white/70 bg-white/92'}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="candidate-portal-pill inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-slate-600">
              <Upload className="h-3.5 w-3.5" />
              {item.key === 'cv' ? 'First step' : 'Required upload'}
            </div>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              {item.key === 'cv' ? 'Start with your CV' : item.label}
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{item.description}</p>
          </div>
          <div className={`rounded-2xl border p-3 ${emphasized ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
            <Upload className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50/90 p-4">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            onChange={(event) => handleFileSelection(item.key, event)}
            className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
          />
          <p className="mt-3 text-xs tracking-[0.08em] text-slate-500">
            {file ? `Selected file: ${file.name}` : 'Supported formats: PDF, JPG, PNG, WEBP, DOC, DOCX'}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            This file will be attached to {candidateHandle}
          </div>
          <button
            onClick={() => handleUpload(item.key)}
            disabled={!file || isUploading}
            className="onboarding-button onboarding-button-dark inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white"
          >
            {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? 'Uploading...' : `Upload ${item.label}`}
          </button>
        </div>
      </div>
    );
  };

  if (!candidateId && (loading || bootstrapLoading)) {
    return (
      <div className="candidate-portal-shell min-h-screen px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="candidate-portal-hero onboarding-fade-up rounded-[36px] px-6 py-8 text-white sm:px-8 sm:py-10">
            <div className="max-w-2xl">
              <div className="candidate-portal-badge">Candidate workspace</div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">We are preparing your personal route.</h1>
              <p className="mt-4 text-sm leading-7 text-white/78 sm:text-base">
                Your Gmail is being matched to an existing candidate record if one already exists. If not, we create a fresh candidate workspace and bring you in through the CV-first flow automatically.
              </p>
            </div>
          </section>

          <div className="candidate-portal-panel onboarding-fade-up rounded-[30px] p-8" style={{ animationDelay: '80ms' }}>
            <div className="flex items-center gap-3 text-slate-700">
              <LoaderCircle className="h-5 w-5 animate-spin text-amber-600" />
              <span className="text-sm font-semibold tracking-[0.08em]">Setting up your candidate portal and secure URL...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!candidateId) {
    return (
      <div className="candidate-portal-shell min-h-screen px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="candidate-portal-hero onboarding-fade-up rounded-[36px] px-6 py-8 text-white sm:px-8 sm:py-10">
            <div className="max-w-2xl">
              <div className="candidate-portal-badge">Candidate workspace</div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">We could not finish your workspace yet.</h1>
              <p className="mt-4 text-sm leading-7 text-white/78 sm:text-base">
                Sign in again or retry the setup. Once the profile is ready, the portal moves you into your own candidate URL and starts with the document intake flow.
              </p>
            </div>
          </section>

          <div className="candidate-portal-panel rounded-[30px] border border-rose-200/80 p-6">
            <p className="text-sm font-medium text-rose-700">{bootstrapError || error || 'Unable to prepare candidate workspace'}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setBootstrapAttempted(false);
                  setBootstrapError(null);
                }}
                className="onboarding-button onboarding-button-dark inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Retry setup
              </button>
              <button
                onClick={onSignOut}
                className="onboarding-button onboarding-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-slate-700"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-portal-shell min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6 lg:space-y-8">
        <section className="candidate-portal-hero onboarding-fade-up rounded-[38px] px-6 py-7 text-white sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_360px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="candidate-portal-badge">Candidate workspace</span>
                <span className="candidate-portal-badge bg-white/12 text-white/82">Secure route {candidateHandle}</span>
                <span className="candidate-portal-badge bg-amber-300/18 text-amber-100">{statusLabel}</span>
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.6rem]">
                {hasCv ? `Welcome back, ${firstName}. Let’s finish the last pieces of your profile.` : `Welcome, ${firstName}. Start here and build your candidate profile the right way.`}
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/78 sm:text-base sm:leading-8">
                This is your personal candidate route, linked directly to your profile. Upload documents, track review status, and complete the remaining details without bouncing through generic pages.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => window.location.assign(`/profile/${candidateId}`)}
                  className="onboarding-button inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_32px_rgba(255,255,255,0.18)] transition hover:bg-slate-100"
                >
                  View public profile
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={onSignOut}
                  className="onboarding-button inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>

            <div className="candidate-portal-panel-dark rounded-[32px] p-6 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/56">Readiness</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">{readinessPercent}%</h2>
                </div>
                <div className="candidate-portal-meter">
                  <div className="candidate-portal-meter-inner">{readinessPercent}%</div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/58">
                    <span>Checklist progress</span>
                    <span>{checklistCompleted}/{REQUIRED_DOCUMENTS.length} docs</span>
                  </div>
                  <div className="candidate-portal-progress">
                    <div className="candidate-portal-progress-bar" style={{ width: `${Math.max((checklistCompleted / REQUIRED_DOCUMENTS.length) * 100, 8)}%` }} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/56">Role</p>
                    <p className="mt-2 text-lg font-semibold">{user.roleLabel}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/56">Current location</p>
                    <p className="mt-2 text-lg font-semibold">{locationLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {(loading || dataLoading) && (
          <div className="candidate-portal-panel rounded-[28px] p-5 text-sm font-medium text-slate-600">
            Loading the latest candidate workspace data...
          </div>
        )}

        {error && (
          <div className="candidate-portal-panel rounded-[28px] border border-rose-200/80 p-5 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {uploadError && (
          <div className="candidate-portal-panel rounded-[28px] border border-rose-200/80 p-5 text-sm font-medium text-rose-700">
            {uploadError}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="candidate-portal-stat onboarding-card rounded-[28px] p-5 xl:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Profile owner</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{candidateDisplayName}</h2>
                <p className="mt-3 text-sm text-slate-600">{candidate?.position || 'Position not set yet'} • {statusLabel}</p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-white p-3 text-slate-700">
                <UserCircle2 className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="candidate-portal-contact-row">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{candidate?.email || portalProfile?.profile.user?.email || user.email}</span>
              </div>
              <div className="candidate-portal-contact-row">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{candidate?.phone || portalProfile?.profile.user?.phone || 'Phone not set'}</span>
              </div>
            </div>
          </div>

          <div className="candidate-portal-stat onboarding-card rounded-[28px] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Documents received</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{Math.max(receivedFlags, stats.totalDocuments)}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{stats.verifiedDocs} verified and {stats.pendingDocs} still under review.</p>
          </div>

          <div className="candidate-portal-stat onboarding-card rounded-[28px] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Still needed</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{hasCv ? stats.missingDocuments + stats.missingFields : 1}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{hasCv ? `${missingUploads.length} uploads and ${stats.missingFields} profile fields remain.` : 'Your CV unlocks the rest of the checklist.'}</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <div className="space-y-6">
            <div className="candidate-portal-panel rounded-[32px] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Journey board</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">What happens next</h2>
                </div>
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {journeySteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className={`rounded-[26px] border p-5 ${step.done ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-slate-50/85'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{step.done ? 'Completed' : 'Pending'}</p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-950">{step.title}</h3>
                        </div>
                        <div className={`rounded-2xl p-3 ${step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600">{step.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="candidate-portal-panel rounded-[32px] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Profile snapshot</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Live candidate record</h2>
                </div>
                <BadgeCheck className="h-6 w-6 text-slate-400" />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="candidate-portal-field-card">
                  <p className="candidate-portal-field-label">Status</p>
                  <p className="candidate-portal-field-value">{candidate?.status || statusLabel}</p>
                </div>
                <div className="candidate-portal-field-card">
                  <p className="candidate-portal-field-label">Country of interest</p>
                  <p className="candidate-portal-field-value">{candidate?.country_of_interest || 'Not set'}</p>
                </div>
                <div className="candidate-portal-field-card">
                  <p className="candidate-portal-field-label">Experience</p>
                  <p className="candidate-portal-field-value">{candidate?.experience_years != null ? `${candidate.experience_years} years` : 'Not set'}</p>
                </div>
                <div className="candidate-portal-field-card">
                  <p className="candidate-portal-field-label">Candidate route</p>
                  <p className="candidate-portal-field-value break-all">{candidateId}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="candidate-portal-contact-row">
                  <Globe2 className="h-4 w-4 text-slate-400" />
                  <span>{candidate?.nationality || 'Nationality not set'}</span>
                </div>
                <div className="candidate-portal-contact-row">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{candidate?.address || 'Address not set'}</span>
                </div>
              </div>
            </div>

            <div className="candidate-portal-panel rounded-[32px] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Document activity</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Recent uploads and review state</h2>
                </div>
                <ScanSearch className="h-6 w-6 text-slate-400" />
              </div>

              <div className="mt-6 space-y-3">
                {documents.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/90 px-5 py-8 text-sm leading-7 text-slate-500">
                    No uploaded documents are visible yet for this candidate account.
                  </div>
                ) : (
                  documents.slice(0, 8).map((document) => {
                    const tone = getDocumentStatusTone(document.verification_status);
                    return (
                      <div key={document.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                        <div className={`h-1.5 w-full ${tone.rail}`} />
                        <div className="flex items-center justify-between gap-4 px-5 py-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{document.file_name || document.document_type || document.category || 'Document'}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                              {document.document_type || document.category || 'Uncategorized'} • {formatDate(document.created_at || document.received_at)}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${tone.badge}`}>
                            {tone.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {!hasCv ? (
              renderUploadCard(REQUIRED_DOCUMENTS[0], true)
            ) : (
              <div className="candidate-portal-panel rounded-[32px] p-6 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Required uploads</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Finish your document kit</h2>
                  </div>
                  <FileCheck className="h-6 w-6 text-amber-500" />
                </div>

                <div className="mt-6 space-y-4">
                  {missingUploads.length === 0 ? (
                    <div className="rounded-[26px] border border-emerald-200 bg-emerald-50/80 p-5 text-sm leading-7 text-emerald-700">
                      Your document checklist is currently complete based on the files already uploaded to your candidate profile.
                    </div>
                  ) : (
                    missingUploads.map((item) => renderUploadCard(item))
                  )}
                </div>
              </div>
            )}

            <div className="candidate-portal-panel rounded-[32px] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Missing details</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Profile follow-up queue</h2>
                </div>
                <CircleAlert className="h-6 w-6 text-slate-400" />
              </div>

              <div className="mt-6 space-y-3">
                {missingFields.length === 0 ? (
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-5 text-sm leading-7 text-emerald-700">
                    No missing profile fields are currently flagged for this candidate profile.
                  </div>
                ) : (
                  missingFields.slice(0, 8).map((field) => (
                    <div key={field.field} className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{field.label}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">Source: {field.source || 'Not yet provided'}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${field.canBeManuallyUpdated ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          {field.canBeManuallyUpdated ? 'Can update' : 'Needs review'}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600">{field.hint}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="candidate-portal-panel rounded-[32px] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Quick actions</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Keep moving</h2>
                </div>
                <Clock3 className="h-6 w-6 text-slate-400" />
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-700">
                <button
                  onClick={() => window.location.assign('/apply')}
                  className="candidate-portal-action"
                >
                  <div>
                    <p className="font-semibold text-slate-950">Review the public application form</p>
                    <p className="mt-1 text-sm text-slate-600">Check how your information appears in the main application flow.</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
                <button
                  onClick={() => window.location.assign(`/profile/${candidateId}`)}
                  className="candidate-portal-action"
                >
                  <div>
                    <p className="font-semibold text-slate-950">Open your public profile</p>
                    <p className="mt-1 text-sm text-slate-600">Review the candidate-facing profile generated from this linked record.</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}