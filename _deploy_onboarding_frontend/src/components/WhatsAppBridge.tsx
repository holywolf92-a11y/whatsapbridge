import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../lib/apiClient';
import { useAuth } from '../lib/authContext';
import { Loader2, Play, QrCode, RefreshCw, ShieldAlert, Smartphone } from 'lucide-react';

type BridgeSession = {
  accountId: string;
  displayName: string;
  owner: string | null;
  rolloutWave: string | null;
  status: 'idle' | 'needs_qr' | 'connecting' | 'connected' | 'degraded' | 'paused';
  lastEventAt: string | null;
  lastError: string | null;
  hasQrCode: boolean;
  pairingCode: string | null;
  pairingCodeGeneratedAt: string | null;
};

type BridgeStatusResponse = {
  ok: boolean;
  bridgeMode: string;
  sessions: BridgeSession[];
};

type BridgeQrResponse = {
  ok: boolean;
  accountId: string;
  qrCode: string;
  qrImageDataUrl: string;
};

type BridgePairingCodeResponse = {
  ok: boolean;
  accountId: string;
  pairingCode: string;
  generatedAt: string;
};

type AuthMethod = 'qr' | 'pairing';

function formatDateTime(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusClasses(status: BridgeSession['status']) {
  switch (status) {
    case 'connected':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'needs_qr':
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    case 'connecting':
      return 'bg-sky-50 text-sky-700 ring-sky-200';
    case 'paused':
    case 'idle':
      return 'bg-slate-100 text-slate-700 ring-slate-200';
    case 'degraded':
    default:
      return 'bg-rose-50 text-rose-700 ring-rose-200';
  }
}

function connectionState(status: BridgeSession['status']) {
  if (status === 'connected') {
    return {
      label: 'Online',
      classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      dot: 'bg-emerald-500',
    };
  }

  return {
    label: 'Offline',
    classes: 'bg-slate-100 text-slate-700 ring-slate-200',
    dot: 'bg-slate-400',
  };
}

function statusLabel(status: BridgeSession['status']) {
  return status.replace('_', ' ');
}

function statusGuidance(session: BridgeSession | null) {
  if (!session) {
    return 'Pick an account first. Then choose whether you want to link it with QR or with a phone-number code.';
  }

  switch (session.status) {
    case 'connected':
      return 'This account is already linked. You only need to reconnect it if WhatsApp drops the session.';
    case 'connecting':
      return 'WhatsApp is still authenticating this session. Wait a few seconds before requesting a new code.';
    case 'paused':
      return 'This account is paused. You can still inspect it, but it will not process incoming bridge traffic.';
    case 'idle':
      return 'This account has not been started yet. Click Connect to initialise it and get a QR or phone-number code.';
    case 'degraded':
      return 'This account needs attention. Use one login method below to relink it, then refresh status.';
    case 'needs_qr':
    default:
      return 'This account is waiting for login. Choose one method below and complete the steps in order.';
  }
}

async function fetchJson<T>(url: string, options: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export function WhatsAppBridge() {
  const { session } = useAuth();
  const [sessions, setSessions] = useState<BridgeSession[]>([]);
  const [bridgeMode, setBridgeMode] = useState<string>('meta-forward');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('qr');
  const [qrImageDataUrl, setQrImageDataUrl] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [loadingPairing, setLoadingPairing] = useState(false);
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [loadingRestart, setLoadingRestart] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrWaiting, setQrWaiting] = useState(false); // true = waiting for bridge to generate QR
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [pairingPhoneNumber, setPairingPhoneNumber] = useState('');
  const qrWaitIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const STATUS_POLL_INTERVAL_MS = 60000;
  const QR_WAIT_INTERVAL_MS = 5000;

  const authHeader = useMemo(() => {
    const token = session?.access_token;
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, [session?.access_token]);

  const selectedSession = useMemo(() => {
    if (!selectedAccountId) return null;
    return sessions.find((entry) => entry.accountId === selectedAccountId) ?? null;
  }, [selectedAccountId, sessions]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedAccountId = params.get('account');
    if (requestedAccountId) {
      setSelectedAccountId(requestedAccountId);
    }
  }, []);

  async function loadStatus() {
    if (!authHeader) return;
    setLoadingStatus(true);
    setStatusError(null);

    try {
      const data = await fetchJson<BridgeStatusResponse>(`${API_BASE_URL}/whatsapp-bridge/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
      });

      const nextSessions = Array.isArray(data.sessions) ? data.sessions : [];
      setSessions(nextSessions);
      setBridgeMode(data.bridgeMode || 'meta-forward');
      setSelectedAccountId((current) => {
        if (current && nextSessions.some((entry) => entry.accountId === current)) {
          return current;
        }

        const qrPending = nextSessions.find((entry) => entry.status === 'needs_qr' && entry.hasQrCode);
        return qrPending?.accountId || nextSessions[0]?.accountId || null;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusError(message);
      setSessions([]);
    } finally {
      setLoadingStatus(false);
    }
  }

  function stopQrWait() {
    if (qrWaitIntervalRef.current !== null) {
      window.clearInterval(qrWaitIntervalRef.current);
      qrWaitIntervalRef.current = null;
    }
    setQrWaiting(false);
  }

  async function loadQr(accountId: string) {
    if (!authHeader) return;
    setLoadingQr(true);
    setQrError(null);
    setQrWaiting(false);
    stopQrWait();

    try {
      const data = await fetchJson<BridgeQrResponse>(`${API_BASE_URL}/whatsapp-bridge/sessions/${encodeURIComponent(accountId)}/qr`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
      });
      setQrImageDataUrl(data.qrImageDataUrl || null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setQrImageDataUrl(null);
      // If QR not ready yet, auto-poll every 3s until bridge generates it
      if (message.includes('qr_not_available') || message.includes('404')) {
        setQrWaiting(true);
        setQrError(null);
        qrWaitIntervalRef.current = window.setInterval(async () => {
          if (typeof document !== 'undefined' && document.hidden) {
            return;
          }
          if (!authHeader) return;
          try {
            const retryData = await fetchJson<BridgeQrResponse>(`${API_BASE_URL}/whatsapp-bridge/sessions/${encodeURIComponent(accountId)}/qr`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json', ...authHeader },
            });
            if (retryData.qrImageDataUrl) {
              stopQrWait();
              setQrImageDataUrl(retryData.qrImageDataUrl);
            }
          } catch {
            // still not ready — keep waiting
          }
        }, QR_WAIT_INTERVAL_MS);
      } else {
        setQrError(message);
      }
    } finally {
      setLoadingQr(false);
    }
  }

  async function connectAccount(accountId: string) {
    if (!authHeader) return;
    setLoadingConnect(true);

    try {
      await fetchJson<{ ok: boolean }>(`${API_BASE_URL}/whatsapp-bridge/sessions/${encodeURIComponent(accountId)}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
      });
      // Refresh status after a short delay to let the client spin up
      setTimeout(() => void loadStatus(), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusError(message);
    } finally {
      setLoadingConnect(false);
    }
  }

  async function forceRestart(accountId: string) {
    if (!authHeader) return;
    setLoadingRestart(true);
    stopQrWait();
    setQrImageDataUrl(null);
    setQrError(null);
    try {
      await fetchJson<{ ok: boolean }>(`${API_BASE_URL}/whatsapp-bridge/sessions/${encodeURIComponent(accountId)}/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
      });
      // Give bridge ~5s to reinit, then auto-load QR
      setTimeout(() => { void loadStatus(); void loadQr(accountId); }, 5000);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusError(message);
    } finally {
      setLoadingRestart(false);
    }
  }

  async function cancelSession(accountId: string) {
    if (!authHeader) return;
    stopQrWait();
    setQrImageDataUrl(null);
    setQrError(null);
    try {
      await fetchJson<{ ok: boolean }>(`${API_BASE_URL}/whatsapp-bridge/sessions/${encodeURIComponent(accountId)}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
      });
      setTimeout(() => void loadStatus(), 1500);
    } catch {
      // best-effort — still clear local state
    }
  }

  async function requestPairingCode(accountId: string) {
    if (!authHeader) return;

    if (!pairingPhoneNumber.trim()) {
      setPairingError('Enter the phone number in international format, without spaces or symbols if possible.');
      return;
    }

    setLoadingPairing(true);
    setPairingError(null);

    try {
      const data = await fetchJson<BridgePairingCodeResponse>(`${API_BASE_URL}/whatsapp-bridge/sessions/${encodeURIComponent(accountId)}/pairing-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ phoneNumber: pairingPhoneNumber }),
      });

      setSessions((current) => current.map((entry) => (
        entry.accountId === accountId
          ? {
              ...entry,
              pairingCode: data.pairingCode,
              pairingCodeGeneratedAt: data.generatedAt,
              hasQrCode: false,
            }
          : entry
      )));
      setQrImageDataUrl(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPairingError(message);
    } finally {
      setLoadingPairing(false);
    }
  }

  useEffect(() => {
    if (!authHeader) return;
    void loadStatus();

    const intervalId = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }
      void loadStatus();
    }, STATUS_POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        void loadStatus();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [authHeader]);

  useEffect(() => {
    if (!selectedSession) {
      setQrImageDataUrl(null);
      setQrError(null);
      stopQrWait();
      setPairingError(null);
      return;
    }

    if (!selectedSession.hasQrCode) {
      setQrImageDataUrl(null);
      setQrError(null);
      // Don't stop qrWait here — we may be actively polling for it
      return;
    }

    // QR is ready — stop any wait loop and load it
    stopQrWait();
    void loadQr(selectedSession.accountId);
  }, [selectedSession?.accountId, selectedSession?.hasQrCode]);

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    if (selectedSession.pairingCode) {
      setAuthMethod('pairing');
      return;
    }

    if (selectedSession.hasQrCode) {
      setAuthMethod('qr');
    }
  }, [selectedSession?.accountId, selectedSession?.hasQrCode, selectedSession?.pairingCode]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedAccountId) {
      url.searchParams.set('account', selectedAccountId);
    } else {
      url.searchParams.delete('account');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedAccountId]);

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <Smartphone className="h-3.5 w-3.5" />
              WhatsApp Bridge
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Bridge Session Monitor</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Connect and monitor multiple WhatsApp bridge accounts here, while the existing Meta WhatsApp pipeline continues processing inbound CVs.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Mode</div>
              <div className="mt-1 font-medium text-slate-900">{bridgeMode}</div>
            </div>
            <button
              type="button"
              onClick={() => void loadStatus()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={loadingStatus || !authHeader}
            >
              <RefreshCw className={`h-4 w-4 ${loadingStatus ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {statusError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Failed to load bridge status: {statusError}
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Accounts</h3>
              <p className="mt-2 text-sm text-slate-600">
                Each WhatsApp slot has its own focused page below. Choose one account to open only its QR, status, and login actions.
              </p>
            </div>
            <div className="text-xs text-slate-500">Open one account at a time to keep the screen clean.</div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {sessions.map((entry) => {
              const liveState = connectionState(entry.status);
              const isActive = selectedAccountId === entry.accountId;

              return (
                <button
                  key={entry.accountId}
                  type="button"
                  onClick={() => setSelectedAccountId(entry.accountId)}
                  className={`rounded-3xl border p-4 text-left transition ${isActive ? 'border-emerald-300 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-slate-900">{entry.displayName}</div>
                      <div className="mt-1 text-xs text-slate-500">{entry.accountId}</div>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${liveState.classes}`}>
                      <span className={`h-2 w-2 rounded-full ${liveState.dot}`} />
                      {liveState.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold" style={{
                      color: entry.status === 'connected' ? '#16a34a'
                           : entry.status === 'needs_qr' || entry.status === 'connecting' ? '#d97706'
                           : entry.status === 'degraded' ? '#dc2626'
                           : '#64748b'
                    }}>
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{
                        backgroundColor: entry.status === 'connected' ? '#16a34a'
                                        : entry.status === 'needs_qr' || entry.status === 'connecting' ? '#d97706'
                                        : entry.status === 'degraded' ? '#dc2626'
                                        : '#94a3b8'
                      }} />
                      {statusLabel(entry.status)}
                    </span>
                    <span className="text-slate-500">{entry.hasQrCode ? 'QR ready' : 'No QR'}</span>
                  </div>

                  {entry.status === 'idle' ? (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm" style={{ backgroundColor: '#16a34a', color: '#ffffff' }}>
                        <Play className="h-3.5 w-3.5" />
                        Connect below
                      </span>
                    </div>
                  ) : null}

                  <div className="mt-3 text-xs text-slate-500">
                    Last event: {formatDateTime(entry.lastEventAt)}
                  </div>
                </button>
              );
            })}

            {!loadingStatus && sessions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                No bridge sessions configured.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Account Page</div>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {selectedSession ? selectedSession.displayName : 'Choose an account'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedSession ? `Account ID: ${selectedSession.accountId}` : 'Pick one WhatsApp account above to open its dedicated view.'}
                </p>
              </div>
              {selectedSession ? (
                <div className="flex flex-row flex-wrap items-center gap-2 sm:justify-end">
                  <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${connectionState(selectedSession.status).classes}`}>
                    <span className={`h-2 w-2 rounded-full ${connectionState(selectedSession.status).dot}`} />
                    {connectionState(selectedSession.status).label}
                  </span>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(selectedSession.status)}`}>
                    {statusLabel(selectedSession.status)}
                  </span>
                  {selectedSession.status === 'idle' ? (
                    <button
                      type="button"
                      onClick={() => void connectAccount(selectedSession.accountId)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                      disabled={loadingConnect}
                    >
                      {loadingConnect ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      Connect
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">{statusGuidance(selectedSession)}</p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {selectedSession?.status === 'idle' ? (
                <button
                  type="button"
                  onClick={() => selectedSession && void connectAccount(selectedSession.accountId)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-md transition-all duration-150 hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-60 sm:w-auto"
                  style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                  disabled={loadingConnect}
                >
                  {loadingConnect ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Connect Account
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('qr')}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition sm:w-auto ${authMethod === 'qr' ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900'}`}
                    disabled={!selectedSession}
                  >
                    <QrCode className="h-4 w-4" />
                    Use QR Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('pairing')}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition sm:w-auto ${authMethod === 'pairing' ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900'}`}
                    disabled={!selectedSession}
                  >
                    <Smartphone className="h-4 w-4" />
                    Use Phone Number
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => selectedSession && void loadStatus()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-60 sm:w-auto"
                disabled={!selectedSession || loadingStatus}
              >
                <RefreshCw className={`h-4 w-4 ${loadingStatus ? 'animate-spin' : ''}`} />
                Refresh status
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Step 1</div>
                <h4 className="mt-1 text-base font-semibold text-slate-900">
                  {authMethod === 'qr' ? 'Open a QR for scanning' : 'Generate a phone-number code'}
                </h4>
              </div>
              {authMethod === 'qr' && selectedSession && selectedSession.status !== 'idle' && selectedSession.status !== 'connected' ? (
                <button
                  type="button"
                  onClick={() => void loadQr(selectedSession.accountId)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-60 sm:w-auto"
                  disabled={loadingQr}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingQr ? 'animate-spin' : ''}`} />
                  {selectedSession.hasQrCode ? 'Reload QR' : 'Request QR'}
                </button>
              ) : null}
            </div>

            {authMethod === 'qr' ? (
              <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
                {loadingQr ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-slate-500">
                    <Loader2 className="h-7 w-7 animate-spin" />
                    <p className="text-sm">Loading QR code...</p>
                  </div>
                ) : qrImageDataUrl ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      <div className="mx-auto flex h-[200px] w-[200px] flex-none items-center justify-center rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:h-[240px] sm:w-[240px]">
                        <img
                          src={qrImageDataUrl}
                          alt="WhatsApp Bridge QR"
                          className="h-full w-full rounded-2xl object-contain"
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <div className="font-semibold text-slate-900">Scan flow</div>
                          <ol className="mt-2 space-y-2 text-xs leading-5 text-slate-600">
                            <li>1. Open WhatsApp on the phone.</li>
                            <li>2. Go to Linked Devices.</li>
                            <li>3. Tap Link a device and scan this QR within a few seconds.</li>
                          </ol>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
                          WhatsApp does not publish an official QR pixel size. This page now uses a fixed scan box of about 240 x 240 so every account opens inside the same stable frame.
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <a
                            href={qrImageDataUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 sm:w-auto"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            Open large QR
                          </a>
                          <button
                            type="button"
                            onClick={() => setAuthMethod('pairing')}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 sm:w-auto"
                          >
                            <Smartphone className="h-3.5 w-3.5" />
                            Switch to phone code
                          </button>
                          <button
                            type="button"
                            onClick={() => { selectedSession && void cancelSession(selectedSession.accountId); setQrError(null); setQrImageDataUrl(null); }}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition hover:border-red-400 hover:text-red-800 sm:w-auto"
                          >
                            Cancel &amp; go idle
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs leading-5 text-slate-500">
                      If WhatsApp says “try again later”, reload the QR and scan the fresh one immediately.
                    </p>
                  </div>
                ) : qrWaiting ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center text-slate-500">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                    <p className="text-sm font-medium text-slate-700">Waiting for bridge to generate QR…</p>
                    <p className="text-xs text-slate-400">This usually takes 5–10 seconds. Will appear automatically.</p>
                    <div className="flex flex-col gap-2">
                      {selectedSession && (
                        <button
                          type="button"
                          onClick={() => selectedSession && void forceRestart(selectedSession.accountId)}
                          disabled={loadingRestart}
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow transition-all hover:scale-105 hover:shadow-md active:scale-95 disabled:opacity-60"
                          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                        >
                          {loadingRestart ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                          {loadingRestart ? 'Restarting…' : 'Force Restart'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { selectedSession && void cancelSession(selectedSession.accountId); setQrError(null); }}
                        className="text-xs text-slate-400 underline hover:text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center text-slate-500">
                    <QrCode className="h-10 w-10" />
                    <p className="text-sm font-medium text-slate-700">
                      {selectedSession?.status === 'connected'
                        ? 'This session is already connected.'
                        : selectedSession?.status === 'idle'
                          ? 'This account has not been started. Click Connect above to initialise it.'
                          : 'Click "Request QR" above to fetch the QR code for this session.'}
                    </p>
                    {selectedSession && selectedSession.status !== 'idle' && selectedSession.status !== 'connected' ? (
                      <button
                        type="button"
                        onClick={() => void loadQr(selectedSession.accountId)}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-md transition-all duration-150 hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-60"
                        style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                        disabled={loadingQr}
                      >
                        {loadingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                        {loadingQr ? 'Loading...' : 'Request QR'}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">Phone-number flow</div>
                  <ol className="mt-2 space-y-2 text-xs leading-5 text-slate-600">
                    <li>1. Enter the phone number of the WhatsApp device you want to link.</li>
                    <li>2. Tap Generate code.</li>
                    <li>3. On the phone, open Linked Devices and choose Link with phone number.</li>
                  </ol>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Primary WhatsApp Number
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="923001234567"
                      value={pairingPhoneNumber}
                      onChange={(event) => setPairingPhoneNumber(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      disabled={!selectedSession || loadingPairing || selectedSession.status === 'connected'}
                    />
                    <button
                      type="button"
                      onClick={() => selectedSession && void requestPairingCode(selectedSession.accountId)}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!selectedSession || loadingPairing || selectedSession.status === 'connected'}
                    >
                      {loadingPairing ? 'Generating...' : 'Generate code'}
                    </button>
                  </div>
                </div>

                {selectedSession?.pairingCode ? (
                  <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Step 2: Enter this code on the phone</div>
                    <div className="mt-2 break-all text-3xl font-semibold tracking-[0.22em] text-slate-900 sm:text-4xl">
                      {selectedSession.pairingCode}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      On the phone, open Linked Devices, choose Link with phone number, then enter this code.
                      {selectedSession.pairingCodeGeneratedAt ? ` Generated ${formatDateTime(selectedSession.pairingCodeGeneratedAt)}.` : ''}
                    </p>
                  </div>
                ) : null}

                {pairingError ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Pairing code is not currently available: {pairingError}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {selectedSession?.lastError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <div className="mb-1 inline-flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4 w-4" />
                Session Error
              </div>
              <div>{selectedSession.lastError}</div>
            </div>
          ) : null}

          {qrError ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              QR is not currently available: {qrError}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}