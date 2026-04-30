import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../lib/apiClient';
import { useAuth, supabase } from '../lib/authContext';
import { ArrowLeft, CheckCheck, MoreVertical, Phone, Search, Send, Smile, Paperclip, Video, Smartphone, Download } from 'lucide-react';

// APK download URL — Falisha Agent Android App (built via EAS)
const AGENT_APK_URL = 'https://expo.dev/artifacts/eas/4UHM4fr7khi7epQohrvcHL.apk';

type ReplyMode = 'ai' | 'human';

type Conversation = {
  id: string;
  phone_number: string;
  display_name: string | null;
  candidate_id?: string | null;
  candidate_name?: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  reply_mode: ReplyMode;
  taken_over_by: string | null;
  taken_over_at: string | null;
  taken_over_by_name?: string | null;
};

type Message = {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound' | 'ai';
  body: string | null;
  message_type: string;
  status: string;
  created_at: string;
};

function formatListTime(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatBubbleTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function initialsFromName(value: string) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (first + second).toUpperCase();
}

async function fetchJson(url: string, options: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export function WhatsAppInbox() {
  const { session } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('en_US');

  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modeError, setModeError] = useState<string | null>(null);
  const [modeLoading, setModeLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const authHeader = useMemo(() => {
    const token = session?.access_token;
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, [session?.access_token]);

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    return conversations.find((c) => c.id === selectedConversationId) ?? null;
  }, [conversations, selectedConversationId]);

  const view = useMemo<'list' | 'chat'>(() => {
    return selectedConversationId ? 'chat' : 'list';
  }, [selectedConversationId]);

  const selectedTitle = useMemo(() => {
    if (!selectedConversation) return '';
    return selectedConversation.candidate_name || selectedConversation.display_name || selectedConversation.phone_number;
  }, [selectedConversation]);

  const isTakenOverByOther = useMemo(() => {
    if (!selectedConversation) return false;
    if (selectedConversation.reply_mode !== 'human') return false;
    if (!selectedConversation.taken_over_by) return false;
    const myUserId = session?.user?.id;
    return !!myUserId && selectedConversation.taken_over_by !== myUserId;
  }, [selectedConversation, session?.user?.id]);

  const takeoverLabel = useMemo(() => {
    if (!selectedConversation) return null;
    if (selectedConversation.reply_mode !== 'human') return null;
    if (!selectedConversation.taken_over_by) return null;
    const myUserId = session?.user?.id;
    if (myUserId && selectedConversation.taken_over_by === myUserId) return 'You';
    return selectedConversation.taken_over_by_name || 'Another admin';
  }, [selectedConversation, session?.user?.id]);

  const showTemplateComposer = useMemo(() => {
    return (sendError || '').toLowerCase().includes('template');
  }, [sendError]);

  async function loadConversations() {
    if (!authHeader) return;
    setLoadingConversations(true);
    setLoadError(null);
    try {
      const data = await fetchJson(`${API_BASE_URL}/whatsapp-inbox/conversations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
      });
      setConversations((data?.conversations ?? []) as Conversation[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoadError(msg);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadMessages(conversationId: string) {
    if (!authHeader) return;
    setLoadingMessages(true);
    setLoadError(null);
    try {
      const data = await fetchJson(`${API_BASE_URL}/whatsapp-inbox/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
      });
      setMessages((data?.messages ?? []) as Message[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoadError(msg);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function markRead(conversationId: string) {
    if (!authHeader) return;
    try {
      await fetchJson(`${API_BASE_URL}/whatsapp-inbox/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
      });
      await loadConversations();
    } catch {
      // fail-open for UI
    }
  }

  async function takeOver(conversationId: string) {
    if (!authHeader) return;
    setModeError(null);
    setModeLoading(true);
    try {
      const updated = (await fetchJson(`${API_BASE_URL}/whatsapp-inbox/conversations/${conversationId}/takeover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
      })) as Partial<Conversation>;

      setConversations((prev) => prev.map((c) => (c.id === conversationId ? ({ ...c, ...updated } as Conversation) : c)));
      await loadConversations();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setModeError(msg);
    } finally {
      setModeLoading(false);
    }
  }

  async function returnToAI(conversationId: string) {
    if (!authHeader) return;
    setModeError(null);
    setModeLoading(true);
    try {
      const updated = (await fetchJson(`${API_BASE_URL}/whatsapp-inbox/conversations/${conversationId}/return-to-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
      })) as Partial<Conversation>;

      setConversations((prev) => prev.map((c) => (c.id === conversationId ? ({ ...c, ...updated } as Conversation) : c)));
      await loadConversations();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setModeError(msg);
    } finally {
      setModeLoading(false);
    }
  }

  async function sendText(conversationId: string) {
    if (!authHeader) return;
    const text = draft.trim();
    if (!text) return;

    setSendError(null);
    setDraft('');

    try {
      await fetchJson(`${API_BASE_URL}/whatsapp-inbox/conversations/${conversationId}/send-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ text }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSendError(msg.includes('24h_window_expired') ? '24-hour window expired. Use a template message.' : msg);
      setDraft(text);
    }
  }

  async function sendTemplate(conversationId: string) {
    if (!authHeader) return;
    const name = templateName.trim();
    if (!name) {
      setSendError('Template name is required.');
      return;
    }

    setSendError(null);

    try {
      await fetchJson(`${API_BASE_URL}/whatsapp-inbox/conversations/${conversationId}/send-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ templateName: name, language: templateLanguage || 'en_US' }),
      });
      setTemplateName('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSendError(msg);
    }
  }

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeader]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
      markRead(selectedConversationId);
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedConversationId]);

  useEffect(() => {
    if (!authHeader) return;

    let refreshTimer: number | undefined;
    const scheduleRefresh = (conversationId?: string) => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        loadConversations();
        if (conversationId && selectedConversationId && conversationId === selectedConversationId) {
          loadMessages(selectedConversationId);
        }
      }, 250);
    };

    const channel = supabase
      .channel('whatsapp-inbox-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
        (payload) => {
          const newMsg = payload.new as any;
          const convId = String(newMsg?.conversation_id || '');

          // Refresh list + open thread if affected.
          scheduleRefresh(convId);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'whatsapp_messages' },
        (payload) => {
          const newMsg = payload.new as any;
          const convId = String(newMsg?.conversation_id || '');

          // Update ticks/status changes etc.
          scheduleRefresh(convId);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'whatsapp_conversations' },
        () => {
          scheduleRefresh();
        }
      )
      .subscribe((status) => {
        // Helpful when diagnosing why realtime isn't updating.
        // eslint-disable-next-line no-console
        console.log('[WhatsAppInbox] Realtime status:', status);
      });

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, authHeader]);

  return (
    <div className="rounded-xl border border-border/60 bg-background/60 dark:bg-background/40 backdrop-blur-xl overflow-hidden shadow-sm">
      <div className="h-[calc(100vh-73px-48px)] min-h-[440px] sm:min-h-[520px] flex flex-col">
        {view === 'list' ? (
          <div className="flex-1 flex flex-col bg-background/40 dark:bg-background/20">
            <div className="px-4 py-3 border-b border-border/60 bg-background/60 dark:bg-background/40 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold tracking-tight">WhatsApp Inbox</h2>
                  <p className="text-xs text-muted-foreground">Conversations</p>
                </div>
                <div className="flex items-center gap-2">
                  {loadingConversations && <span className="text-xs text-muted-foreground">Loading...</span>}
                  <button
                    type="button"
                    className="p-2.5 rounded-lg hover:bg-accent/60 transition-colors disabled:opacity-50"
                    aria-label="Search"
                    disabled
                    title="Search (not implemented)"
                  >
                    <Search className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    className="p-2.5 rounded-lg hover:bg-accent/60 transition-colors disabled:opacity-50"
                    aria-label="Menu"
                    disabled
                    title="Menu (not implemented)"
                  >
                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              {loadError && <div className="mt-2 text-xs text-destructive break-words">{loadError}</div>}

              {/* ── Agent Android App Banner ────────────────────── */}
              {AGENT_APK_URL && (
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#075E54] px-4 py-3 shadow-sm">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/20">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight">Falisha Agent App</p>
                    <p className="text-[11px] text-white/70 leading-tight">Android · manage conversations on mobile</p>
                  </div>
                  <a
                    href={AGENT_APK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12px] font-bold text-[#075E54] hover:bg-white/90 active:scale-95 transition-all duration-150 flex-shrink-0 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download App
                  </a>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              {conversations.length === 0 && !loadingConversations ? (
                <div className="p-6 text-sm text-muted-foreground">No conversations yet.</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {conversations.map((c) => {
                    const title = c.candidate_name || c.display_name || c.phone_number;
                    const avatar = initialsFromName(title);
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedConversationId(c.id)}
                        className="w-full text-left px-4 py-4 hover:bg-accent/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center text-xs font-semibold text-foreground">
                            {avatar}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-semibold text-foreground truncate">{title}</div>
                              <div className="text-xs text-muted-foreground shrink-0">{formatListTime(c.last_message_at)}</div>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <div className="min-w-0">
                                <div className="text-xs text-muted-foreground truncate">{c.last_message_preview || ''}</div>
                                {c.reply_mode === 'human' && (c.taken_over_by_name || c.taken_over_by) && (
                                  <div className="text-[11px] text-muted-foreground truncate">
                                    Taken: {c.taken_over_by_name || 'Another admin'}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {c.unread_count > 0 && (
                                  <span className="text-xs bg-primary text-primary-foreground px-2.5 py-1 rounded-full font-semibold">
                                    {c.unread_count}
                                  </span>
                                )}
                                <span
                                  className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold backdrop-blur ${
                                    c.reply_mode === 'ai'
                                      ? 'border-primary/40 bg-primary text-primary-foreground'
                                      : 'border-border/60 bg-secondary text-secondary-foreground'
                                  }`}
                                >
                                  {c.reply_mode === 'ai' ? 'AI' : 'Human'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : !selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-border/60 bg-background/60 dark:bg-background/40 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedConversationId(null)}
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background/50 hover:bg-accent/60 transition-colors flex items-center gap-2"
                  aria-label="Back"
                  title="Back"
                >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Back</span>
                </button>

                <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center text-xs font-semibold text-foreground">
                  {initialsFromName(selectedTitle)}
                </div>
                <div className="min-w-0">
                  <div className="text-base font-semibold tracking-tight truncate">{selectedTitle}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {selectedConversation.candidate_name || selectedConversation.phone_number}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold backdrop-blur ${
                        selectedConversation.reply_mode === 'ai'
                          ? 'border-primary/40 bg-primary text-primary-foreground'
                          : 'border-border/60 bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {selectedConversation.reply_mode === 'ai' ? 'AI mode' : 'Human mode'}
                    </span>
                    {selectedConversation.reply_mode === 'human' && takeoverLabel && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-accent text-accent-foreground font-medium">
                        Taken: {takeoverLabel}
                      </span>
                    )}
                    {isTakenOverByOther && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full border border-destructive/40 bg-destructive text-white font-semibold">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
                </div>

                <div className="flex items-center justify-end gap-1 flex-wrap">
                <button
                  type="button"
                    className="p-2.5 rounded-lg hover:bg-accent/60 transition-colors disabled:opacity-50"
                  aria-label="Video"
                  disabled
                  title="Video (not implemented)"
                >
                    <Video className="w-5 h-5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                    className="p-2.5 rounded-lg hover:bg-accent/60 transition-colors disabled:opacity-50"
                  aria-label="Call"
                  disabled={!selectedConversation.phone_number}
                  title={selectedConversation.phone_number ? `Call ${selectedConversation.phone_number}` : 'Call (no number)'}
                  onClick={() => {
                    const raw = selectedConversation.phone_number || '';
                    const tel = raw.replace(/[^\d+]/g, '');
                    if (!tel) return;
                    window.location.href = `tel:${tel}`;
                  }}
                >
                    <Phone className="w-5 h-5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                    className="p-2.5 rounded-lg hover:bg-accent/60 transition-colors disabled:opacity-50"
                  aria-label="Search"
                  disabled
                  title="Search (not implemented)"
                >
                    <Search className="w-5 h-5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                    className="p-2.5 rounded-lg hover:bg-accent/60 transition-colors disabled:opacity-50"
                  aria-label="Menu"
                  disabled
                  title="Menu (not implemented)"
                >
                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </button>

                <div className="hidden sm:block w-px h-6 bg-border/60 mx-1" />

                {selectedConversation.reply_mode === 'ai' ? (
                  <button
                    onClick={() => takeOver(selectedConversation.id)}
                    disabled={isTakenOverByOther || modeLoading}
                    title={isTakenOverByOther ? 'Taken over by another admin' : modeLoading ? 'Updating...' : 'Take over'}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-border/60 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                  >
                    Take Over
                  </button>
                ) : (
                  <button
                    onClick={() => returnToAI(selectedConversation.id)}
                    disabled={isTakenOverByOther || modeLoading}
                    title={isTakenOverByOther ? 'Taken over by another admin' : modeLoading ? 'Updating...' : 'Return to AI'}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-primary/40 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Return to AI
                  </button>
                )}
                </div>
              </div>
              {modeError && <div className="mt-2 text-xs text-destructive break-words">{modeError}</div>}
            </div>

            <div className="flex-1 overflow-auto p-4 bg-muted/20">
              {loadingMessages ? (
                <div className="text-sm text-muted-foreground">Loading messages...</div>
              ) : (
                <div className="space-y-2">
                  {messages.map((m) => {
                    const isInbound = m.direction === 'inbound';
                    const bubbleStyle = isInbound
                      ? 'bg-background border border-border/60 text-foreground shadow-sm'
                      : 'bg-primary/15 border border-primary/30 text-foreground shadow-sm';

                    const showTicks = !isInbound && m.direction !== 'ai';
                    const tickColor = m.status === 'read' ? 'text-primary' : 'text-muted-foreground';

                    return (
                      <div key={m.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[88%] sm:max-w-[72%] rounded-2xl px-3 py-2 text-sm shadow-sm ${bubbleStyle}`}>
                          <div className="whitespace-pre-wrap break-words leading-5">{m.body || ''}</div>
                          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                            <span>{formatBubbleTime(m.created_at)}</span>
                            {showTicks && <CheckCheck className={`w-3.5 h-3.5 ${tickColor}`} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-border/60 bg-background/60 dark:bg-background/40 backdrop-blur-xl p-3">
              {sendError && <div className="mb-2 text-xs text-destructive">{sendError}</div>}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-accent/60 transition-colors"
                  aria-label="Emoji"
                  disabled
                  title="Emoji (not implemented)"
                >
                  <Smile className="w-5 h-5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-accent/60 transition-colors"
                  aria-label="Attach"
                  disabled
                  title="Attach (not implemented)"
                >
                  <Paperclip className="w-5 h-5 text-muted-foreground" />
                </button>

                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendText(selectedConversation.id);
                    }
                  }}
                  disabled={isTakenOverByOther}
                  className="flex-1 min-w-0 bg-input-background border border-border/60 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60"
                  placeholder="Type a message"
                />

                <button
                  onClick={() => sendText(selectedConversation.id)}
                  disabled={isTakenOverByOther}
                  className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  aria-label="Send"
                  title="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {showTemplateComposer && !isTakenOverByOther && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="flex-1 bg-input-background border border-border/60 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60"
                    placeholder="Template name (approved)"
                  />
                  <input
                    value={templateLanguage}
                    onChange={(e) => setTemplateLanguage(e.target.value)}
                    className="w-full sm:w-[110px] bg-input-background border border-border/60 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60"
                    placeholder="en_US"
                  />
                  <button
                    onClick={() => sendTemplate(selectedConversation.id)}
                    className="px-4 py-2 text-sm rounded-md border border-border/60 hover:bg-accent/60 transition-colors w-full sm:w-auto"
                  >
                    Send Template
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
