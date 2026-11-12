import type { Adresse, Carnet, Passage, Profil, Tournee } from '@/types/calendriersApi';

export class ErreurCalendriers extends Error {
  constructor(message: string, public status: number, public code = '') { super(message); }
  get sessionExpiree() { return this.status === 401 || this.code === 'INVALID_CSRF'; }
}

export function normaliserUrlApi(value: string) {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('Saisissez une adresse complète de serveur HTTP ou HTTPS.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('L’adresse du serveur doit être une URL HTTP ou HTTPS sans identifiants ni paramètres.');
  }
  let pathname = url.pathname.replace(/\/+$/, '');
  if (!pathname.endsWith('/api')) pathname += '/api';
  url.pathname = pathname;
  return url.toString().replace(/\/$/, '');
}

// Le système gère le cookie HttpOnly ; la mémorisation optionnelle des identifiants est gérée séparément.
export class CalendriersApi {
  readonly base: string;
  private csrf = '';
  constructor(base: string, private transport: typeof fetch = fetch) { this.base = normaliserUrlApi(base); }
  async request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      let response: Response;
      try {
        // Le fetch du navigateur doit être appelé sans contexte CalendriersApi.
        const transport = this.transport;
        response = await transport(this.base + path, { method, credentials: 'include', signal: controller.signal,
          headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { 'X-CSRF-Token': this.csrf } : {}) },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
      } catch {
        throw new ErreurCalendriers(method === 'GET'
          ? 'Impossible de joindre le serveur. Vérifiez la connexion et l’adresse du serveur.'
          : 'La confirmation du serveur n’a pas été reçue. Actualisez la tournée avant de renouveler la saisie.', 0);
      }
      let data;
      try { data = await response.json(); } catch { throw new ErreurCalendriers('Le serveur a renvoyé une réponse invalide. Actualisez avant de réessayer.', response.status); }
      if (!response.ok) throw new ErreurCalendriers(data.error || 'La demande a échoué.', response.status, data.code);
      return data as T;
    } finally { clearTimeout(timer); }
  }
  async session(): Promise<Profil | null> {
    const data = await this.request<{ csrfToken: string; user: Profil | null }>('/session');
    this.csrf = data.csrfToken;
    return data.user;
  }
  async login(amicaleId: string, email: string, password: string) {
    await this.session();
    await this.request('/login', 'POST', { amicaleId: amicaleId.trim(), email: email.trim(), password });
    return this.session();
  }
  async logout() { await this.request('/logout', 'POST', {}); this.csrf = ''; }
  tournees() { return this.request<Tournee[]>('/mobile/tournees'); }
  tournee(id: string) { return this.request<Tournee>(`/mobile/tournees/${encodeURIComponent(id)}/adresses`); }
  async enregistrer(tourneeId: string, mode: 'existing' | 'new' | 'duplicate', adresseId: string | undefined, payload: unknown) {
    const base = `/tournees/${encodeURIComponent(tourneeId)}`;
    const path = mode === 'new' ? `${base}/adresses` : mode === 'duplicate'
      ? `${base}/adresses/${encodeURIComponent(adresseId!)}/dupliquer` : `${base}/passages/${encodeURIComponent(adresseId!)}`;
    return this.request<Adresse | Passage>(path, mode === 'existing' ? 'PUT' : 'POST', payload);
  }
  creerCarnet(id: string, payload: { numero: string; premierRecu: number; nombreRecus: number }) {
    return this.request<Carnet>(`/tournees/${encodeURIComponent(id)}/carnets`, 'POST', payload);
  }
}
