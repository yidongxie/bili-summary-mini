/**
 * API client — mirrors web/src/lib/api.ts types.
 * Uses Taro.request() for HTTP calls with session cookie support.
 */
import Taro from '@tarojs/taro';

const BASE_URL = 'https://xydong.site';

// Re-export all types from web project
export type CurrentUser = { id: number; email: string; display_name?: string; created_at?: string; is_admin?: number; };

export type AppConfig = {
  api_key_set?: boolean; whisper_api_key_set?: boolean; yt_dlp_cookies_set?: boolean;
  deepseek_model?: string; deepseek_base_url?: string; whisper_base_url?: string; whisper_model?: string;
  default_category?: string; obsidian_vault_name?: string; obsidian_folder?: string;
  api_key?: string; whisper_api_key?: string; yt_dlp_cookies?: string;
};

export type VideoMeta = { title: string; author: string; duration: number; bvid: string; link: string; pic?: string; };
export type SubtitleSegment = { from: number; to: number; content: string; };

export type SummaryResult = {
  type?: string; video?: VideoMeta;
  summary: string; transcript?: string; subtitle_count?: number;
  subtitle_segments?: SubtitleSegment[]; mode?: string;
  suggested_tags?: string[]; transcript_source?: string;
};

export type LibraryItem = {
  id: string; created_at: string; updated_at?: string; title: string; author: string;
  duration?: number; bvid?: string; link?: string; summary: string; transcript?: string;
  subtitle_count?: number; category?: string; tags?: string[]; notes?: string; mode?: string; pic?: string;
};

export type TagInfo = { name: string; count: number; color?: string; description?: string; };
export type Snippet = { id: string; library_item_id: string; content: string; source_text?: string; timestamp_sec?: number | null; tags?: string[]; created_at: string; updated_at?: string; };
export type LearningPath = { id: string; title: string; description?: string; items?: Array<{ library_item_id: string; title?: string; author?: string; completed_at?: string | null }>; total?: number; completed?: number; };

export class ApiError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status; } }

// ── HTTP helpers ──────────────────────────────────────────────────────

async function request<T = any>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const resp = await Taro.request({
    url: BASE_URL + path,
    method: (init.method || 'GET') as any,
    data: init.body,
    header: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      cookie: Taro.getStorageSync('session-cookie') || '',
    },
  });
  if (resp.statusCode >= 400) {
    const data = resp.data as any;
    throw new ApiError(data?.error || `HTTP ${resp.statusCode}`, resp.statusCode);
  }
  // Store cookie for session persistence
  const setCookie = resp.header?.['Set-Cookie'] || resp.header?.['set-cookie'];
  if (setCookie) Taro.setStorageSync('session-cookie', String(setCookie));
  return resp.data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────

export function getMe() { return request<{ authenticated: boolean; user?: CurrentUser }>('/api/auth/me'); }
export function login(email: string, password: string) { return request<{ user: CurrentUser }>('/api/auth/login', { method: 'POST', body: { email, password } }); }
export function register(email: string, password: string, display_name?: string) { return request('/api/auth/register', { method: 'POST', body: { email, password, display_name } }); }
export function logout() { return request('/api/auth/logout', { method: 'POST' }); }

// ── WeChat login ──────────────────────────────────────────────────────

export function wechatLogin(code: string, displayName?: string) {
  return request<{ user: CurrentUser }>('/api/auth/wechat', { method: 'POST', body: { code, display_name: displayName } });
}

// ── Config ────────────────────────────────────────────────────────────

export function getConfig() { return request<{ config: AppConfig }>('/api/config'); }
export function saveConfig(payload: Partial<AppConfig>) { return request<{ config: AppConfig }>('/api/config', { method: 'POST', body: payload }); }
export function testDeepSeekConfig(payload: { api_key?: string; base_url?: string; model?: string }) { return request<{ success: boolean; error?: string }>('/api/config/test-deepseek', { method: 'POST', body: payload }); }

// ── Summarize ─────────────────────────────────────────────────────────

export type SummarizePayload = { url: string; mode: string; api_key?: string; model?: string; base_url?: string; };
export function createSummarizeTask(payload: SummarizePayload) { return request<{ success: boolean; task_id?: string; error?: string }>('/api/tasks/summarize', { method: 'POST', body: payload }); }

// Polling-based progress (Taro doesn't support SSE)
export function pollTaskProgress(taskId: string) {
  return request<SummaryResult & { status?: string; progress?: string; error?: string }>(`/api/tasks/${taskId}/poll`);
}

// ── Library ───────────────────────────────────────────────────────────

export function getLibrary(params: { q?: string; category?: string; tag?: string; page?: number; page_size?: number; sort?: string } = {}) {
  const qs = Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
  return request<{ items: LibraryItem[]; categories?: string[]; tags?: string[]; total?: number; page?: number; page_size?: number }>('/api/library' + (qs ? '?' + qs : ''));
}
export function checkLibraryByBvid(bvid: string) { return request<{ saved: boolean }>('/api/library/check/' + encodeURIComponent(bvid)); }
export function getLibraryItem(id: string) { return request<{ item: LibraryItem }>('/api/library/' + encodeURIComponent(id)); }
export function saveLibrary(payload: { video: VideoMeta; summary: string; transcript?: string; subtitle_count?: number; mode?: string; category: string; tags: string[]; notes?: string; }) {
  return request<{ item: LibraryItem }>('/api/library', { method: 'POST', body: payload });
}
export function deleteLibrary(id: string) { return request('/api/library/' + encodeURIComponent(id), { method: 'DELETE' }); }

// ── Tags ──────────────────────────────────────────────────────────────

export function getTags() { return request<{ tags: TagInfo[] }>('/api/tags'); }
export function suggestTags(payload: { title: string; author: string; summary: string }) { return request<{ tags: string[] }>('/api/suggest-tags', { method: 'POST', body: payload }); }
export function bulkAddTags(payload: { ids: string[]; tags: string[] }) { return request('/api/library/bulk/tags/add', { method: 'POST', body: payload }); }

// ── Learning ──────────────────────────────────────────────────────────

export function getPaths() { return request<{ paths: LearningPath[] }>('/api/paths'); }
export function createPathApi(payload: { title: string; description?: string }) { return request('/api/paths', { method: 'POST', body: payload }); }

// ── Chat ──────────────────────────────────────────────────────────────

export function chatApi(payload: { question: string; summary: string; transcript?: string; segments?: SubtitleSegment[] }) {
  return request<{ answer: string; citations?: Array<{ time: number; text: string }> }>('/api/llm/chat', { method: 'POST', body: payload });
}
export function rewriteApi(payload: { platform: string; summary: string; keyPoints?: string[] }) {
  return request<{ text: string }>('/api/llm/rewrite', { method: 'POST', body: payload });
}

export default { BASE_URL };
