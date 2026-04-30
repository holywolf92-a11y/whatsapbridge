// Updated: Using NEW server-side CV generation system
import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  AlertCircle,
  Award,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle,
  Download,
  Eye,
  File,
  FileText,
  Grid3x3,
  Image,
  List,
  Trash2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  Share2,
  Shield,
  Sparkles,
  Star,
  Upload,
  X,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, Candidate, CandidateDashboardStats } from '../lib/apiClient';
import { formatCandidatePaymentAmount, normalizeCandidatePaymentAmount } from '../lib/candidatePayment';
import { CANDIDATE_STATUS_VALUES, type CandidateStatus, getCandidateStatusClasses, normalizeCandidateStatus } from '../lib/candidateStatus';
import { useCandidates } from '../lib/candidateContext';
import { useDebounce } from '../hooks/useDebounce';
import { CandidateDetailsModal } from './CandidateDetailsModal';
import { renderPdfFirstPageToDataUrl } from '../lib/pdfThumb';
import { analyzeDocumentHealth, getHealthBadgeInfo, analyzeDocumentError } from '../lib/documentErrorUtils';

interface CandidateManagementProps {
  initialProfessionFilter?: string;
  candidateIdToOpen?: string | null;
  candidateInitialTabToOpen?: 'details' | 'documents' | 'missing-data' | null;
  onCandidateOpened?: () => void;
}

interface FilterState {
  search: string;
  position: string;
  country: string;
  status: string;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

function getInitials(name: string) {
  const trimmed = (name || '').trim();
  if (!trimmed) return '??';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || parts[0]?.[1] || '';
  return `${first}${second}`.toUpperCase();
}

function safeJsonArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string') as string[];
  if (typeof value === 'string') {
    // First try JSON parsing
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed.filter((v) => typeof v === 'string') as string[]) : [];
    } catch {
      // If JSON parsing fails, try CSV splitting
      if (value.includes(',')) {
        return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
      // Single value
      return value.trim() ? [value.trim()] : [];
    }
  }
  return [];
}

function confidenceScore10(confidence?: Record<string, number>) {
  if (!confidence) return null;
  const values = Object.values(confidence).filter((v) => typeof v === 'number' && isFinite(v));
  if (values.length === 0) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const normalized = avg > 1 ? avg / 100 : avg;
  const score = Math.max(0, Math.min(10, normalized * 10));
  return Math.round(score * 10) / 10;
}

function parsePartnerSource(candidate: { source?: string | null; partner_id?: string | null; partner_name?: string | null; is_partner_candidate?: boolean }) {
  if (candidate.partner_id || candidate.partner_name || candidate.is_partner_candidate) {
    return {
      partnerUserId: candidate.partner_id || null,
      partnerName: candidate.partner_name || null,
      partnerCompany: null,
      label: candidate.partner_name || 'Partner',
    };
  }

  const raw = String(candidate.source || '');
  if (!raw.startsWith('Partner|')) {
    return null;
  }

  const [, partnerUserId, partnerName, partnerCompany] = raw.split('|');
  return {
    partnerUserId: partnerUserId || null,
    partnerName: partnerName || null,
    partnerCompany: partnerCompany || null,
    label: partnerName || partnerCompany || 'Partner',
  };
}

// Premium Shimmer Skeleton Component
function DocumentSkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="relative overflow-hidden bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-2 flex flex-col items-center justify-center h-16"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent transform -skew-x-12 animate-shimmer" />
      
      {/* Icon placeholder */}
      <div className="w-5 h-5 bg-gray-300 rounded mb-1 relative z-10 animate-pulse" />
      
      {/* Text placeholder */}
      <div className="w-12 h-3 bg-gray-300 rounded relative z-10 animate-pulse" />
      
      {/* Badge placeholder */}
      <div className="absolute top-1 right-1 w-4 h-4 bg-gray-300 rounded-full relative z-10 animate-pulse" />
    </div>
  );
}

// Progress Dots Component
function ProgressDots() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }} />
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.4s' }} />
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.4s' }} />
    </div>
  );
}

export function CandidateManagement({ initialProfessionFilter = 'all', candidateIdToOpen, candidateInitialTabToOpen, onCandidateOpened }: CandidateManagementProps) {
  // Use shared candidate context
  const { 
    candidates, 
    loading, 
    error, 
    total,
    fetchCandidates: fetchCandidatesFromContext,
    refreshCandidates 
  } = useCandidates();
  
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<CandidateStatus>('Pending');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [statusUpdatingIds, setStatusUpdatingIds] = useState<Record<string, boolean>>({});
  const [slowLoadWarning, setSlowLoadWarning] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    position: initialProfessionFilter || 'all',
    country: 'all',
    status: 'all',
  });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput.trim(), 400);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [positions, setPositions] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [dashboardStats, setDashboardStats] = useState<CandidateDashboardStats>({
    totalCandidates: 0,
    totalProfessions: 0,
    pendingReview: 0,
    deployed: 0,
    newThisWeek: 0,
  });
  // Cache of signed photo URLs fetched on-demand (id -> url)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  // Cache of rendered PDF thumbnails (id -> dataUrl)
  const [pdfThumbs, setPdfThumbs] = useState<Record<string, string>>({});
  
  // Modal states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsInitialTab, setDetailsInitialTab] = useState<'details' | 'documents' | 'missing-data'>('details');
  const [deletingCandidateId, setDeletingCandidateId] = useState<string | null>(null);
  
  // Sync profession filter when parent changes the prop (sidebar click)
  useEffect(() => {
    const next = initialProfessionFilter || 'all';
    setFilters(f => f.position === next ? f : { ...f, position: next });
    setCurrentPage(1);
  }, [initialProfessionFilter]);

  // Track if we've already processed this candidateIdToOpen to prevent reopening
  const processedCandidateIdRef = useRef<string | null>(null);
  
  // Auto-open candidate when candidateIdToOpen is provided
  useEffect(() => {
    // Only proceed if we have a candidateIdToOpen, not already showing a modal, and haven't processed this ID yet
    if (!candidateIdToOpen || showDetailsModal || processedCandidateIdRef.current === candidateIdToOpen) {
      return;
    }

    // Try to find candidate in current list first (match by id, not candidate_code)
    const candidate = candidates.find(c => c.id === candidateIdToOpen);
    
    if (candidate) {
      // Found in current list - open immediately
      processedCandidateIdRef.current = candidateIdToOpen; // Mark as processed
      setSelectedCandidate(candidate);
      setDetailsInitialTab(candidateInitialTabToOpen || 'details');
      setShowDetailsModal(true);
      // Notify parent that candidate has been opened (this clears candidateIdToOpen)
      if (onCandidateOpened) {
        onCandidateOpened();
      }
    } else if (!loading) {
      // Not found in current list - fetch it directly by ID
      processedCandidateIdRef.current = candidateIdToOpen; // Mark as processed to prevent duplicate fetches
      apiClient.getCandidate(candidateIdToOpen)
        .then((fetchedCandidate) => {
          setSelectedCandidate(fetchedCandidate);
          setDetailsInitialTab(candidateInitialTabToOpen || 'details');
          setShowDetailsModal(true);
          if (onCandidateOpened) {
            onCandidateOpened();
          }
        })
        .catch((err) => {
          console.error('Failed to load candidate:', err);
          processedCandidateIdRef.current = null; // Reset on error so it can retry
          if (onCandidateOpened) {
            onCandidateOpened();
          }
        });
    }
  }, [candidateIdToOpen, candidateInitialTabToOpen, candidates, loading, showDetailsModal, onCandidateOpened]);
  
  // Reset processed ref when candidateIdToOpen changes to a new value
  useEffect(() => {
    if (candidateIdToOpen && processedCandidateIdRef.current !== candidateIdToOpen) {
      // New candidate ID - reset the ref
      processedCandidateIdRef.current = null;
    }
  }, [candidateIdToOpen]);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [documentAction, setDocumentAction] = useState<{ candidateId: string; docType: string } | null>(null);
  const [paymentUpdatingIds, setPaymentUpdatingIds] = useState<Record<string, boolean>>({});
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, string>>({});
  
  // Document processing states
  const [processingDocuments, setProcessingDocuments] = useState<Map<string, {
    isProcessing: boolean;
    documentCount: number;
    startTime: number;
    lastUpdate: number;
  }>>(new Map());

  // Fetch signed photo URLs for candidates missing them in list response
  useEffect(() => {
    const fetchMissingPhotoUrls = async () => {
      // Backend list endpoint no longer signs URLs (for performance), so we fetch per-candidate
      const toFetch = candidates.filter(c => 
        (c.photo_received || c.profile_photo_url) && !c.profile_photo_signed_url && !photoUrls[c.id]
      );
      if (!toFetch.length) return;
      
      // Batch fetch in chunks to avoid overwhelming the backend
      const chunkSize = 10;
      for (let i = 0; i < toFetch.length; i += chunkSize) {
        const chunk = toFetch.slice(i, i + chunkSize);
        try {
          const entries = await Promise.all(
            chunk.map(async (c) => {
              try {
                const full = await apiClient.getCandidate(c.id);
                const url = (full as any).profile_photo_signed_url || full.profile_photo_url || '';
                return [c.id, url] as const;
              } catch {
                return [c.id, ''] as const;
              }
            })
          );
          setPhotoUrls((prev) => {
            const next: Record<string, string> = { ...prev };
            for (const [id, url] of entries) {
              if (url) next[id] = url;
            }
            return next;
          });
        } catch (e) {
          console.warn('Failed to fetch chunk of photo URLs', e);
        }
        // Small delay between chunks to avoid rate limits
        if (i + chunkSize < toFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    };
    fetchMissingPhotoUrls();
  }, [candidates, photoUrls]);

  // Render PDF thumbnails for photo URLs that are PDFs
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const targets = filteredCandidates
        .map((c) => {
          const url = (c.profile_photo_signed_url || photoUrls[c.id] || c.profile_photo_url || '').toString();
          return { id: c.id, url };
        })
        .filter(({ id, url }) => url && url.toLowerCase().includes('.pdf') && !pdfThumbs[id]);

      if (!targets.length) return;

      // Render a few at a time to avoid locking the UI
      const slice = targets.slice(0, 2);

      const rendered = await Promise.all(
        slice.map(async ({ id, url }) => {
          try {
            // Scan more pages because the photo is not always on page 1
            const dataUrl = await renderPdfFirstPageToDataUrl(url, { maxPagesToScan: 10 });
            return [id, dataUrl] as const;
          } catch (e) {
            console.warn('[PDF Thumb] Failed to render thumbnail', { id, url, error: e });
            return [id, ''] as const;
          }
        })
      );

      if (cancelled) return;

      setPdfThumbs((prev) => {
        const next = { ...prev };
        for (const [id, dataUrl] of rendered) {
          if (dataUrl) next[id] = dataUrl;
        }
        return next;
      });
    };

    run();
    return () => {
      cancelled = true;
    };
    }, [candidates, photoUrls, pdfThumbs]);
  
  // Fetch candidates using context
  const fetchCandidates = async () => {
    await fetchCandidatesFromContext({
      search: debouncedSearch,
      position: filters.position === 'all' ? undefined : filters.position,
      country_of_interest: filters.country === 'all' ? undefined : filters.country,
      status: filters.status === 'all' ? undefined : filters.status,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    });
  };

  // Backend-driven processing: show "Processing" only when the backend has documents
  // with verification_status === 'pending_ai' (CV from inbox, split-and-categorize, etc).
  // No loading on click — no flicker.
  const POLL_INTERVAL_MS = 15000;
  const DASHBOARD_STATS_INTERVAL_MS = 60000;
  const candidateIds = useMemo(() => candidates.map((c) => c.id), [candidates]);
  useEffect(() => {
    if (candidateIds.length === 0) return;

    const syncProcessingFromBackend = async () => {
      // Avoid background polling when tab is hidden
      if (typeof document !== 'undefined' && document.hidden) return;

      try {
        const result = await apiClient.getCandidatesProcessingStatus(candidateIds);
        const statuses = result?.statuses || {};
        const now = Date.now();

        setProcessingDocuments((prev) => {
          const next = new Map(prev);

          for (const id of candidateIds) {
            const status = statuses[id];
            const shouldShow = !!status?.isProcessing;
            const existing = next.get(id);

            if (shouldShow) {
              next.set(id, {
                isProcessing: true,
                documentCount: status.pendingCount || existing?.documentCount || 0,
                startTime: existing?.startTime || now,
                lastUpdate: now,
              });
            } else {
              next.delete(id);
            }
          }

          return next;
        });
      } catch {
        // On error: keep previous state to avoid flicker
      }
    };

    const t = setTimeout(syncProcessingFromBackend, 600);
    const interval = setInterval(syncProcessingFromBackend, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        syncProcessingFromBackend();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      clearTimeout(t);
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, [candidateIds]);

  // Fetch candidates on mount and when filters change
  useEffect(() => {
    fetchCandidates();
    
    // Add a slow-load warning if loading takes more than 15 seconds
    const warningTimer = setTimeout(() => {
      if (loading) {
        setSlowLoadWarning(true);
      }
    }, 15000);
    
    return () => {
      clearTimeout(warningTimer);
      if (!loading) setSlowLoadWarning(false); // Clear warning when loading finishes
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.position, filters.country, filters.status, currentPage, pageSize]);
  
  // Clear slow-load warning when loading finishes
  useEffect(() => {
    if (!loading) {
      setSlowLoadWarning(false);
    }
  }, [loading]);

  useEffect(() => {
    let cancelled = false;

    const loadBrowseMetadata = async () => {
      try {
        const metadata = await apiClient.getCandidateBrowseMetadata();
        if (cancelled) return;
        setPositions(metadata.professions.map((profession) => profession.name));
        setCountries(metadata.countries.map((country) => country.name));
        setStatuses(
          metadata.statuses
            .map((status) => normalizeCandidateStatus(status.name))
            .filter((status, index, values) => values.indexOf(status) === index)
        );
      } catch (err) {
        if (!cancelled) {
          console.warn('Failed to load candidate browse metadata', err);
        }
      }
    };

    void loadBrowseMetadata();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDashboardStats = async () => {
      try {
        const stats = await apiClient.getCandidateDashboardStats();
        if (!cancelled) {
          setDashboardStats(stats);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Failed to load candidate dashboard stats', err);
        }
      }
    };

    void loadDashboardStats();
    const interval = window.setInterval(() => {
      if (!document.hidden) {
        void loadDashboardStats();
      }
    }, DASHBOARD_STATS_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        void loadDashboardStats();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const filteredCandidates = useMemo(() => candidates, [candidates]);

  const positionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of candidates) {
      const key = (c.position || '').trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [candidates]);

  const allFilteredSelected = useMemo(() => {
    if (filteredCandidates.length === 0) return false;
    return filteredCandidates.every((c) => selectedIds.has(c.id));
  }, [filteredCandidates, selectedIds]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : Math.min(total, currentPage * pageSize);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedIds(new Set(filteredCandidates.map((c) => c.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function scrollToTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  async function applyBulkStatusUpdate() {
    if (selectedIds.size === 0) return;
    try {
      setBulkUpdating(true);
      const ids = Array.from(selectedIds);
      const result = await apiClient.bulkUpdateCandidateStatus(ids, bulkStatus);
      // Refresh candidates from context to get updated data
      await refreshCandidates();
      clearSelection();
    } catch (e: any) {
      alert(e?.message || 'Failed to bulk update status');
    } finally {
      setBulkUpdating(false);
    }
  }

  async function handleCandidateStatusChange(candidate: Candidate, nextStatus: CandidateStatus) {
    const currentStatus = normalizeCandidateStatus(candidate.status);
    if (currentStatus === nextStatus) {
      return;
    }

    try {
      setStatusUpdatingIds((prev) => ({ ...prev, [candidate.id]: true }));
      const updatedCandidate = await apiClient.updateCandidate(candidate.id, { status: nextStatus });
      await refreshCandidates();
      setSelectedCandidate((prev) => (prev?.id === candidate.id ? { ...prev, status: updatedCandidate.status } : prev));
      toast.success(`Candidate status updated to ${nextStatus}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update candidate status');
    } finally {
      setStatusUpdatingIds((prev) => {
        const next = { ...prev };
        delete next[candidate.id];
        return next;
      });
    }
  }

  function getPaymentDraft(candidate: Candidate) {
    return paymentDrafts[candidate.id] ?? String(normalizeCandidatePaymentAmount(candidate.payment_amount, 0));
  }

  function handlePaymentDraftChange(candidateId: string, value: string) {
    if (!/^\d*$/.test(value)) {
      return;
    }

    setPaymentDrafts((prev) => ({ ...prev, [candidateId]: value }));
  }

  async function handleCandidatePaymentSave(candidate: Candidate) {
    const draftValue = paymentDrafts[candidate.id];
    const nextAmount = normalizeCandidatePaymentAmount(draftValue ?? candidate.payment_amount, 0);
    const currentAmount = normalizeCandidatePaymentAmount(candidate.payment_amount, 0);

    if (nextAmount === currentAmount) {
      setPaymentDrafts((prev) => {
        if (!(candidate.id in prev)) {
          return prev;
        }
        const next = { ...prev };
        delete next[candidate.id];
        return next;
      });
      return;
    }

    try {
      setPaymentUpdatingIds((prev) => ({ ...prev, [candidate.id]: true }));
      const updatedCandidate = await apiClient.updateCandidate(candidate.id, { payment_amount: nextAmount });
      await refreshCandidates();
      setSelectedCandidate((prev) => (
        prev?.id === candidate.id
          ? { ...prev, payment_amount: normalizeCandidatePaymentAmount(updatedCandidate.payment_amount, nextAmount) }
          : prev
      ));
      setPaymentDrafts((prev) => {
        const next = { ...prev };
        delete next[candidate.id];
        return next;
      });
      toast.success(`Payment updated to ${formatCandidatePaymentAmount(updatedCandidate.payment_amount ?? nextAmount)}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update payment');
    } finally {
      setPaymentUpdatingIds((prev) => {
        const next = { ...prev };
        delete next[candidate.id];
        return next;
      });
    }
  }

  // Handler functions for interactive elements
  function handleViewProfile(candidate: Candidate) {
    setSelectedCandidate(candidate);
    setDetailsInitialTab('details');
    setShowDetailsModal(true);
  }

  function handleViewAllDocuments(candidate: Candidate) {
    setSelectedCandidate(candidate);
    setDetailsInitialTab('documents');
    setShowDetailsModal(true);
  }

  async function handleDeleteCandidate(candidate: Candidate) {
    const label = candidate.name || candidate.email || candidate.candidate_code || 'this candidate';
    const confirmed = window.confirm(
      `Delete ${label}?\n\nThis is mainly useful for removing test users and other unwanted records.`
    );

    if (!confirmed) return;

    try {
      setDeletingCandidateId(candidate.id);
      await apiClient.deleteCandidate(candidate.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(candidate.id);
        return next;
      });
      toast.success('Candidate deleted successfully');
      await refreshCandidates();
    } catch (error: any) {
      console.error('Failed to delete candidate:', error);
      toast.error('Failed to delete candidate', {
        description: error?.message || 'Unknown error',
      });
    } finally {
      setDeletingCandidateId(null);
    }
  }

  async function handleDownloadCV(candidate: Candidate) {
    try {
      // ✅ NEW SYSTEM: Server-side Puppeteer PDF generation (employer-safe format)
      // Replaces old getCandidateCVDownload that downloaded original uploaded CV
      const result = await apiClient.generateCandidateCV(candidate.id, 'employer-safe', true);
      
      if (result.cached) {
        console.log('Using cached CV');
      } else {
        console.log('Generated new CV');
      }
      
      // Download PDF from signed URL
      const response = await fetch(result.cv_url);
      if (!response.ok) {
        throw new Error(`Failed to download CV: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidate.name || 'Candidate'}_Employer_Safe_CV.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Employer-Safe CV downloaded successfully!');
    } catch (error: any) {
      console.error('Failed to download CV:', error);
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        alert('CV generation failed. Please ensure candidate information is complete.');
      } else if (error?.message?.includes('timeout') || error?.message?.includes('time')) {
        alert('CV generation timed out. Please try again.');
      } else {
        alert(error?.message || 'Failed to download CV. Please try again.');
      }
    }
  }

  function handlePhotoUpload(candidateId: string) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo must be smaller than 5MB');
        return;
      }

      try {
        setUploadingPhoto(candidateId);
        console.log('Uploading photo for candidate:', candidateId, 'File:', file.name, file.size, 'bytes');
        
        const result = await apiClient.uploadCandidatePhoto(candidateId, file);
        console.log('Photo upload result:', result);
        
        // Refresh candidates from context
        await refreshCandidates();
        
        alert('Photo uploaded successfully!');
      } catch (error: any) {
        console.error('Photo upload error:', error);
        alert(`Failed to upload photo: ${error?.message || 'Unknown error'}`);
      } finally {
        setUploadingPhoto(null);
      }
    };
    input.click();
  }

  async function handleDocumentClick(candidateId: string, docType: string, hasDocument: boolean) {
    if (hasDocument) {
      // View/download document
      if (docType === 'cv') {
        // Use the CV download handler which checks both candidate_documents and inbox_attachments
        handleDownloadCV(candidates.find(c => c.id === candidateId)!);
      } else {
        viewDocument(candidateId, docType);
      }
    } else {
      // For CV, try to link existing CV from inbox first
      if (docType === 'cv') {
        try {
          await apiClient.linkCandidateCV(candidateId);
          // Refresh candidates from context
          await refreshCandidates();
          // One-off sync: if backend is now processing this candidate's docs, show Processing on card
          try {
            const documents = (await apiClient.listCandidateDocumentsNew(candidateId)) as any[];
            const hasPending = documents.some(
              (d: any) =>
                d.verification_status === 'pending_ai' ||
                d.verification_status === 'pending' ||
                (typeof d.status === 'string' && (d.status === 'queued' || d.status === 'processing'))
            );
            if (hasPending) {
              setProcessingDocuments((prev) => {
                const next = new Map(prev);
                next.set(candidateId, {
                  isProcessing: true,
                  documentCount: documents.length,
                  startTime: Date.now(),
                  lastUpdate: Date.now(),
                });
                return next;
              });
            }
          } catch {
            /* ignore */
          }
          toast.success('CV linked from inbox. Processing in background.', { duration: 3000 });
        } catch (error: any) {
          // If no CV in inbox, offer to upload
          if (error?.message?.includes('404') || error?.message?.includes('not found')) {
            if (confirm('No CV found in inbox. Would you like to upload a new CV?')) {
              uploadDocument(candidateId, docType);
            }
          } else {
            alert(error?.message || 'Failed to link CV. Would you like to upload a new one?');
            if (confirm('Upload a new CV?')) {
              uploadDocument(candidateId, docType);
            }
          }
        }
      } else {
        // Upload document for other types
        uploadDocument(candidateId, docType);
      }
    }
  }

  async function viewDocument(candidateId: string, docType: string) {
    try {
      const docs = await apiClient.listCandidateDocuments(candidateId);
      const doc = docs.find(d => d.doc_type.toLowerCase() === docType.toLowerCase());
      
      if (!doc) {
        alert(`No ${docType} found`);
        return;
      }

      const downloadUrl = await apiClient.getDocumentDownloadUrl(doc.id);
      window.open(downloadUrl, '_blank');
    } catch (error: any) {
      alert(error?.message || 'Failed to view document');
    }
  }

  function uploadDocument(candidateId: string, docType: string) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = docType === 'photo' ? 'image/*' : '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        await apiClient.uploadDocument(file, candidateId, docType, false);
        await new Promise((r) => setTimeout(r, 1500));
        await refreshCandidates();
        // One-off sync: if backend now has pending_ai docs for this candidate, show Processing
        try {
          const documents = (await apiClient.listCandidateDocumentsNew(candidateId)) as any[];
          const hasPending = documents.some(
            (d) =>
              d.verification_status === 'pending_ai' ||
              d.verification_status === 'pending' ||
              (typeof d.status === 'string' && (d.status === 'queued' || d.status === 'processing'))
          );
          if (hasPending) {
            setProcessingDocuments((prev) => {
              const next = new Map(prev);
              next.set(candidateId, {
                isProcessing: true,
                documentCount: documents.length,
                startTime: Date.now(),
                lastUpdate: Date.now(),
              });
              return next;
            });
          }
        } catch {
          /* ignore */
        }
        toast.success(`${docType} uploaded. Processing in background.`, { duration: 3000 });
      } catch (error: any) {
        toast.error(`Failed to upload ${docType}`, {
          description: error?.message || 'Unknown error',
          duration: 4000,
        });
      }
    };
    input.click();
  }

  const showBlockingLoader = loading && candidates.length === 0 && !error;

  if (showBlockingLoader) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidates...</p>
          {slowLoadWarning && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md">
              <p className="text-yellow-800 text-sm">
                <strong>Still loading?</strong> The backend might be slow. Try refreshing the page or come back in a few moments.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                Refresh Now
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-lg p-6 text-center max-w-md">
          <h3 className="text-lg font-medium text-red-900 mb-2">Failed to load candidates</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Candidates</h1>
            <p className="text-gray-600 mt-1">Manage your candidate pipeline</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
          <div className="min-w-[200px] flex-1 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white shadow-lg">
            <div className="text-sm opacity-90">Total Candidates</div>
            <div className="text-3xl font-bold mt-2">{dashboardStats.totalCandidates}</div>
          </div>
          <div className="min-w-[200px] flex-1 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-5 text-white shadow-lg">
            <div className="text-sm opacity-90">Total Professions</div>
            <div className="text-3xl font-bold mt-2">{dashboardStats.totalProfessions}</div>
          </div>
          <div className="min-w-[200px] flex-1 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-5 text-white shadow-lg">
            <div className="text-sm opacity-90">Pending Review</div>
            <div className="text-3xl font-bold mt-2">{dashboardStats.pendingReview}</div>
          </div>
          <div className="min-w-[200px] flex-1 bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white shadow-lg">
            <div className="text-sm opacity-90">Deployed</div>
            <div className="text-3xl font-bold mt-2">{dashboardStats.deployed}</div>
          </div>
          <div className="min-w-[200px] flex-1 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-5 text-white shadow-lg">
            <div className="text-sm opacity-90">New This Week</div>
            <div className="text-3xl font-bold mt-2">{dashboardStats.newThisWeek}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          {/* Country Filter */}
          <select
            value={filters.country}
            onChange={(e) => {
              setCurrentPage(1);
              setFilters(prev => ({ ...prev, country: e.target.value }));
            }}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Countries</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => {
              setCurrentPage(1);
              setFilters(prev => ({ ...prev, status: e.target.value }));
            }}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Profession Filter */}
          <select
            value={filters.position}
            onChange={(e) => {
              setCurrentPage(1);
              setFilters(prev => ({ ...prev, position: e.target.value }));
            }}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Professions</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="sm:col-span-2 xl:col-span-2 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Search by name, email, phone, profession or skills..."
              value={searchInput}
              onChange={(e) => {
                setCurrentPage(1);
                setSearchInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              role="searchbox"
              aria-label="Search candidates"
              className="w-full pl-12 pr-20 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />

            {loading && !showBlockingLoader && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2 text-blue-600" aria-hidden="true">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}

            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  setSearchInput('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                aria-label="Clear search"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-1">
            <button
              onClick={() => setViewMode('card')}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                viewMode === 'card' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
              Table
            </button>
          </div>

          <div className="sm:col-span-2 xl:col-span-1 flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Rows</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option} per page</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.size} candidate{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear selection
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={bulkUpdating}
              >
                {CANDIDATE_STATUS_VALUES.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {statusOption}
                  </option>
                ))}
              </select>
              <button
                onClick={applyBulkStatusUpdate}
                disabled={bulkUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {bulkUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
          <p className="text-sm text-gray-600">
            Showing <strong>{pageStart}-{pageEnd}</strong> of <strong>{total}</strong> candidates
          </p>
          {loading && !showBlockingLoader && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating results...
            </div>
          )}
          <button
            onClick={allFilteredSelected ? clearSelection : selectAllFiltered}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            {allFilteredSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {total > 0 && (
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage(1);
                  scrollToTop();
                }}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => {
                  setCurrentPage((page) => Math.max(1, page - 1));
                  scrollToTop();
                }}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">{currentPage}</span>
              <button
                onClick={() => {
                  setCurrentPage((page) => Math.min(totalPages, page + 1));
                  scrollToTop();
                }}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => {
                  setCurrentPage(totalPages);
                  scrollToTop();
                }}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidates Display */}
      {viewMode === 'card' ? (
        filteredCandidates.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredCandidates.map((c) => {
              const skills = safeJsonArray(c.skills);
              const confidenceScore = confidenceScore10(c.extraction_confidence);
              const score = typeof c.ai_score === 'number' && isFinite(c.ai_score) ? c.ai_score : confidenceScore;
              const statusLabel = normalizeCandidateStatus(c.status);
              const partnerAttribution = parsePartnerSource(c);
              const selected = selectedIds.has(c.id);

              const cvOk = !!c.cv_received;
              const passportOk = !!c.passport_received;
              const cnicOk = !!c.cnic_received;
              const drivingLicenseOk = !!c.driving_license_received;
              const policeCharacterOk = !!c.police_character_received;
              const certificateOk = !!c.certificate_received || !!c.degree_received;
              const photoOk = !!c.photo_received;
              const medicalOk = !!c.medical_received;
              const docCount = [cvOk, passportOk, cnicOk, drivingLicenseOk, policeCharacterOk, certificateOk, photoOk, medicalOk].filter(Boolean).length;
              const allDocsOk = docCount === 8;
              const resolvedPhotoUrl = (c.profile_photo_signed_url || photoUrls[c.id] || c.profile_photo_url || '').toString();
              const isPdfPhoto = !!resolvedPhotoUrl && resolvedPhotoUrl.toLowerCase().includes('.pdf');
              const pdfThumb = pdfThumbs[c.id];

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-xl border-2 transition-all hover:shadow-2xl ${
                    selected ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                  }`}
                >
                  {/* Card Header with Profile Picture */}
                  <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 h-32 rounded-t-xl">
                    <div className="absolute -bottom-16 left-6">
                      <div className="relative">
                        <div className="w-32 h-32 bg-white rounded-full p-2 shadow-xl">
                          { resolvedPhotoUrl ? (
                            isPdfPhoto ? (
                              pdfThumb ? (
                                <img
                                  src={pdfThumb}
                                  alt={c.name}
                                  className="w-full h-full rounded-full object-cover"
                                  onClick={() => window.open(resolvedPhotoUrl, '_blank')}
                                  title="Click to open PDF"
                                />
                              ) : (
                                <div
                                  className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex flex-col items-center justify-center"
                                  onClick={() => window.open(resolvedPhotoUrl, '_blank')}
                                  title="Click to open PDF"
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div className="text-4xl font-bold text-blue-600">{getInitials(c.name)}</div>
                                  <div className="mt-1 text-[10px] px-2 py-0.5 rounded-full bg-white/70 text-gray-700">PDF</div>
                                </div>
                              )
                            ) : (
                              <img
                                src={resolvedPhotoUrl}
                                alt={c.name}
                                className="w-full h-full rounded-full object-cover"
                                onError={(e) => {
                                  // Fallback to initials if photo fails to load
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<div class=\"w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-4xl font-bold text-blue-600\">${getInitials(c.name)}</div>`;
                                  }
                                }}
                              />
                            )
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-4xl font-bold text-blue-600">
                              {getInitials(c.name)}
                            </div>
                          )}
                        </div>
                        <button className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePhotoUpload(c.id);
                          }}
                          disabled={uploadingPhoto === c.id}
                        >
                          {uploadingPhoto === c.id ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Camera className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelected(c.id)}
                        className="w-6 h-6 text-blue-600 rounded cursor-pointer bg-white border-2 border-white shadow-lg"
                      />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="pt-20 px-4 pb-4 sm:px-6 sm:pb-6">
                    {/* Name and Title */}
                    <div className="mb-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 break-words">{c.name}</h3>
                        {partnerAttribution?.label && (
                          <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">
                            Agent: {partnerAttribution.label}
                          </span>
                        )}
                        {c.needs_review && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Review
                          </span>
                        )}
                        {c.auto_extracted && !c.needs_review && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Auto
                          </span>
                        )}
                      </div>
                      <div className="flex items-start gap-2 text-gray-600 mb-1">
                        <Briefcase className="w-5 h-5" />
                        <span className="text-base sm:text-lg break-words">{c.position || '—'}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-gray-500">
                        <span className="text-sm">{c.nationality || '—'}</span>
                        <span className="text-gray-400">→</span>
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium text-blue-600">{c.country_of_interest || '—'}</span>
                      </div>
                    </div>

                    {/* Status and Score Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={statusLabel}
                          onChange={(event) => handleCandidateStatusChange(c, event.target.value as CandidateStatus)}
                          disabled={!!statusUpdatingIds[c.id]}
                          className={`rounded-lg border border-transparent px-4 py-2 text-sm font-medium ${getCandidateStatusClasses(statusLabel)} ${statusUpdatingIds[c.id] ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
                        >
                          {CANDIDATE_STATUS_VALUES.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption}
                            </option>
                          ))}
                        </select>
                        {statusUpdatingIds[c.id] && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                      </div>
                      {score != null && (
                        <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg flex-shrink-0">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <span className="text-lg font-bold text-gray-900">{score.toFixed(1)}</span>
                          <span className="text-xs text-gray-500">/10</span>
                        </div>
                      )}
                      {c.experience_years != null && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 flex-shrink-0">
                          <Briefcase className="w-4 h-4" />
                          <span className="font-medium">{c.experience_years}y exp</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Payment Received</div>
                          <div className="mt-1 text-2xl font-semibold text-emerald-900">{formatCandidatePaymentAmount(c.payment_amount)}</div>
                          <div className="text-xs text-emerald-700">Default is 0 PKR until collected.</div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <div className="flex items-center rounded-xl border border-emerald-200 bg-white shadow-sm">
                            <span className="px-3 text-sm font-semibold text-emerald-700">PKR</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={getPaymentDraft(c)}
                              onChange={(event) => handlePaymentDraftChange(c.id, event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  handleCandidatePaymentSave(c);
                                }
                              }}
                              disabled={!!paymentUpdatingIds[c.id]}
                              className="w-36 rounded-r-xl border-0 bg-transparent px-3 py-2 text-sm font-medium text-gray-900 outline-none"
                              placeholder="0"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCandidatePaymentSave(c)}
                            disabled={!!paymentUpdatingIds[c.id]}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
                          >
                            {paymentUpdatingIds[c.id] ? 'Saving...' : 'Save Payment'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                      {c.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Phone className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500">Phone</div>
                            <div className="text-gray-900 font-medium truncate">{c.phone}</div>
                          </div>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Mail className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500">Email</div>
                            <div className="text-gray-900 font-medium truncate">{c.email}</div>
                          </div>
                        </div>
                      )}
                      {c.created_at && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">Applied Date</div>
                            <div className="text-gray-900 font-medium">{new Date(c.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-semibold text-gray-700">Top Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {skills.slice(0, 4).map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200"
                            >
                              {skill}
                            </span>
                          ))}
                          {skills.length > 4 && (
                            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                              +{skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Documents - Smart Display */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-semibold text-gray-700">Document List</span>
                          {processingDocuments.get(c.id)?.isProcessing ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1.5">
                              <ProgressDots />
                              <span>Processing...</span>
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              docCount === 0 ? 'bg-red-100 text-red-700' :
                              allDocsOk ? 'bg-green-100 text-green-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {docCount} files
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleViewAllDocuments(c)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          View All →
                        </button>
                      </div>

                      {/* Error Summary Badge - Shows if there are document issues */}
                      {!processingDocuments.get(c.id)?.isProcessing && docCount > 0 && !allDocsOk && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-semibold text-red-700">Document Issues Detected</span>
                          </div>
                          <p className="text-xs text-red- 600">
                            Some documents need attention. Click "View All" to review and resolve issues.
                          </p>
                        </div>
                      )}

                      {processingDocuments.get(c.id)?.isProcessing ? (
                        // Premium Loading State with Shimmer Skeletons
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="font-medium">
                              {processingDocuments.get(c.id)?.documentCount 
                                ? `Found ${processingDocuments.get(c.id)?.documentCount} document${(processingDocuments.get(c.id)?.documentCount || 0) > 1 ? 's' : ''}...`
                                : 'Extracting documents...'}
                            </span>
                            <span className="text-gray-500">Usually takes 30-60 seconds</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <DocumentSkeletonCard delay={0} />
                            <DocumentSkeletonCard delay={100} />
                            <DocumentSkeletonCard delay={200} />
                            <DocumentSkeletonCard delay={300} />
                          </div>
                          <div className="mt-2 text-xs text-gray-500 text-center">
                            Please wait while we process your documents...
                          </div>
                        </div>
                      ) : docCount > 0 ? (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* CV */}
                        <div 
                          onClick={() => handleDocumentClick(c.id, 'cv', cvOk)}
                          className={`relative group cursor-pointer ${
                            cvOk ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
                          } border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:shadow-md hover:scale-105 animate-fade-in`}
                        >
                          <FileText className={`w-5 h-5 mb-1 ${
                            cvOk ? 'text-green-600' : 'text-red-600'
                          }`} />
                          <span className="text-xs font-semibold">CV</span>
                          {cvOk ? (
                            <CheckCircle className="w-5 h-5 text-green-600 absolute top-1 right-1" strokeWidth={2.5} />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 absolute top-1 right-1" strokeWidth={2.5} />
                          )}
                          {!cvOk && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                              <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                                Missing or invalid CV
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Passport */}
                        <div 
                          onClick={() => handleDocumentClick(c.id, 'passport', passportOk)}
                          className={`relative group cursor-pointer ${
                            passportOk ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
                          } border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:shadow-md hover:scale-105`}
                        >
                          <File className={`w-5 h-5 mb-1 ${
                            passportOk ? 'text-purple-600' : 'text-red-600'
                          }`} />
                          <span className="text-xs font-semibold">Passport</span>
                          {passportOk ? (
                            <CheckCircle className="w-5 h-5 text-green-600 absolute top-1 right-1" strokeWidth={2.5} />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 absolute top-1 right-1" strokeWidth={2.5} />
                          )}
                          {!passportOk && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                              <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                                Passport needs review
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CNIC */}
                        <div 
                          onClick={() => handleDocumentClick(c.id, 'cnic', cnicOk)}
                          className={`relative group cursor-pointer ${
                            cnicOk ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
                          } border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:shadow-md hover:scale-105`}
                        >
                          <Shield className={`w-5 h-5 mb-1 ${
                            cnicOk ? 'text-indigo-600' : 'text-red-600'
                          }`} />
                          <span className="text-xs font-semibold">CNIC</span>
                          {cnicOk ? (
                            <CheckCircle className="w-5 h-5 text-green-600 absolute top-1 right-1" strokeWidth={2.5} />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 absolute top-1 right-1" strokeWidth={2.5} />
                          )}
                          {!cnicOk && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                              <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                                CNIC needs review
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Driving License */}
                        <div 
                          onClick={() => handleDocumentClick(c.id, 'driving_license', drivingLicenseOk)}
                          className={`relative group cursor-pointer ${
                            drivingLicenseOk ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
                          } border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:shadow-md hover:scale-105`}
                        >
                          <Shield className={`w-5 h-5 mb-1 ${
                            drivingLicenseOk ? 'text-cyan-600' : 'text-red-600'
                          }`} />
                          <span className="text-xs font-semibold">License</span>
                          {drivingLicenseOk ? (
                            <CheckCircle className="w-5 h-5 text-green-600 absolute top-1 right-1" strokeWidth={2.5} />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 absolute top-1 right-1" strokeWidth={2.5} />
                          )}
                          {!drivingLicenseOk && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                              <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                                License needs review
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Police Character Certificate */}
                        <div 
                          onClick={() => handleDocumentClick(c.id, 'police_character_certificate', policeCharacterOk)}
                          className={`relative group cursor-pointer ${
                            policeCharacterOk ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
                          } border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:shadow-md hover:scale-105`}
                        >
                          <Shield className={`w-5 h-5 mb-1 ${
                            policeCharacterOk ? 'text-teal-600' : 'text-red-600'
                          }`} />
                          <span className="text-xs font-semibold">PCC</span>
                          {policeCharacterOk ? (
                            <CheckCircle className="w-5 h-5 text-green-600 absolute top-1 right-1" strokeWidth={2.5} />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 absolute top-1 right-1" strokeWidth={2.5} />
                          )}
                          {!policeCharacterOk && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                              <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                                PCC needs review
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Certificate */}
                        <div 
                          onClick={() => handleDocumentClick(c.id, 'certificate', certificateOk)}
                          className={`relative group cursor-pointer ${
                            certificateOk ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
                          } border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:shadow-md hover:scale-105`}
                        >
                          <Award className={`w-5 h-5 mb-1 ${
                            certificateOk ? 'text-blue-600' : 'text-red-600'
                          }`} />
                          <span className="text-xs font-semibold">Cert</span>
                          {certificateOk ? (
                            <CheckCircle className="w-5 h-5 text-green-600 absolute top-1 right-1" strokeWidth={2.5} />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 absolute top-1 right-1" strokeWidth={2.5} />
                          )}
                          {!certificateOk && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                              <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                                Certificate needs review
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Photo */}
                        <div 
                          onClick={() => handleDocumentClick(c.id, 'photo', photoOk)}
                          className={`relative group cursor-pointer ${
                            photoOk ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
                          } border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:shadow-md hover:scale-105`}
                        >
                          <Image className={`w-5 h-5 mb-1 ${
                            photoOk ? 'text-pink-600' : 'text-red-600'
                          }`} />
                          <span className="text-xs font-semibold">Photo</span>
                          {photoOk ? (
                            <CheckCircle className="w-5 h-5 text-green-600 absolute top-1 right-1" strokeWidth={2.5} />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 absolute top-1 right-1" strokeWidth={2.5} />
                          )}
                          {!photoOk && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                              <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                                Photo needs review
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Medical */}
                        <div 
                          onClick={() => handleDocumentClick(c.id, 'medical', medicalOk)}
                          className={`relative group cursor-pointer ${
                            medicalOk ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
                          } border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:shadow-md hover:scale-105`}
                        >
                          <File className={`w-5 h-5 mb-1 ${
                            medicalOk ? 'text-green-600' : 'text-red-600'
                          }`} />
                          <span className="text-xs font-semibold">Medical</span>
                          {medicalOk ? (
                            <CheckCircle className="w-5 h-5 text-green-600 absolute top-1 right-1" strokeWidth={2.5} />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 absolute top-1 right-1" strokeWidth={2.5} />
                          )}
                          {!medicalOk && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                              <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                                Medical needs review
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </div>
                          </div>

                          {/* Document Status Message */}
                          {!allDocsOk && (
                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3" />
                              Some documents are missing
                            </div>
                          )}
                          {allDocsOk && (
                            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 flex items-center gap-2">
                              <CheckCircle className="w-3 h-3" />
                              All documents are valid
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          No documents uploaded yet
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleViewProfile(c)}
                          className="px-5 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                        >
                          <Eye className="w-5 h-5" />
                          View Details
                        </button>
                        <button 
                          onClick={() => handleDownloadCV(c)}
                          className="px-5 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                        >
                          <Download className="w-5 h-5" />
                          Download CV
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteCandidate(c)}
                        disabled={deletingCandidateId === c.id}
                        className="w-full px-5 py-3 border border-red-200 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {deletingCandidateId === c.id ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-5 h-5" />
                            Delete Candidate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-center">Table view coming soon...</p>
        </div>
      )}

      {/* Candidate Details Modal - Portalled to document body to avoid z-index/stacking issues */}
      {showDetailsModal && selectedCandidate && createPortal(
        <CandidateDetailsModal 
          key={selectedCandidate.id}
          candidate={selectedCandidate} 
          initialTab={detailsInitialTab}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCandidate(null);
            processedCandidateIdRef.current = null; // Reset so same candidate can be opened again later
          }}
          onDocumentChange={() => {
            // Refresh candidates from context to update document flags on cards
            refreshCandidates();
          }}
        />,
        document.body
      )}
    </div>
  );
}
