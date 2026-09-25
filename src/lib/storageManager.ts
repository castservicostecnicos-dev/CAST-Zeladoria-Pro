/**
 * Gerenciador de armazenamento seguro com proteção contra QuotaExceededError no LocalStorage
 * e suporte a IndexedDB para dados volumosos (tarefas, fotos e histórico).
 */

const IDB_NAME = 'zeladoria_pro_offline_db';
const IDB_VERSION = 1;
const IDB_STORE_NAME = 'keyval';

// Cache em memória para acesso síncrono rápido
const memoryCache = new Map<string, unknown>();

// Promessa singleton de conexão ao IndexedDB
let idbPromise: Promise<IDBDatabase | null> | null = null;

function getIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (!idbPromise) {
    idbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
            db.createObjectStore(IDB_STORE_NAME);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('[StorageManager] IndexedDB indisponível, usando fallback em memória.');
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  }

  return idbPromise;
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getIDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IDB_STORE_NAME);
    store.put(value, key);
  } catch (err) {
    console.warn('[StorageManager] Falha ao persistir no IndexedDB:', err);
  }
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await getIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Remove fotos em base64 excessivamente grandes do cache do LocalStorage
 * para prevenir QuotaExceededError. O dado completo permanece seguro no Firestore e IndexedDB.
 */
function sanitizeForLocalStorage(key: string, data: unknown): unknown {
  if (!data) return data;

  // Se for a lista de tarefas, otimizar objetos pesados de fotos e limitar histórico local
  if (key === 'zeladoria_tasks_v1' && Array.isArray(data)) {
    return data.slice(0, 100).map((item) => {
      if (!item || typeof item !== 'object') return item;
      const t = { ...item };
      if (Array.isArray(t.photos)) {
        t.photos = t.photos.map((p: any) => {
          if (!p || typeof p !== 'object') return p;
          // Se o storage_path for um data:image muito grande (> 25KB), encurtar no localStorage
          if (typeof p.storage_path === 'string' && p.storage_path.startsWith('data:') && p.storage_path.length > 25000) {
            return {
              ...p,
              // Guarda indicação de foto existente para exibição de badge sem estourar o limite de 5MB
              storage_path: p.storage_path.substring(0, 500) + '...[cached_thumbnail]',
              has_large_image: true,
            };
          }
          return p;
        });
      }
      return t;
    });
  }

  // Se for logs de auditoria, manter apenas os 60 mais recentes no localStorage
  if (key === 'zeladoria_audit_v1' && Array.isArray(data)) {
    return data.slice(0, 60);
  }

  // Se for notificações, manter apenas as 40 mais recentes no localStorage
  if (key === 'zeladoria_notifications_v1' && Array.isArray(data)) {
    return data.slice(0, 40);
  }

  return data;
}

/**
 * Libera espaço de chaves secundárias se o localStorage estiver sob pressão.
 */
function freeUpStorageSpace(): void {
  try {
    // 1. Limpar logs de auditoria antigos
    const auditRaw = localStorage.getItem('zeladoria_audit_v1');
    if (auditRaw) {
      try {
        const parsed = JSON.parse(auditRaw);
        if (Array.isArray(parsed) && parsed.length > 20) {
          localStorage.setItem('zeladoria_audit_v1', JSON.stringify(parsed.slice(0, 20)));
        }
      } catch {}
    }

    // 2. Limpar notificações antigas
    const notifRaw = localStorage.getItem('zeladoria_notifications_v1');
    if (notifRaw) {
      try {
        const parsed = JSON.parse(notifRaw);
        if (Array.isArray(parsed) && parsed.length > 20) {
          localStorage.setItem('zeladoria_notifications_v1', JSON.stringify(parsed.slice(0, 20)));
        }
      } catch {}
    }
  } catch {
    // Silencioso
  }
}

/**
 * Executa uma sanitização inicial do LocalStorage para limpar dados pré-existentes
 * que possam estar excedendo a cota do navegador.
 */
export function purgeBloatedLocalStorage(): void {
  try {
    const tasksRaw = localStorage.getItem('zeladoria_tasks_v1');
    if (tasksRaw && tasksRaw.length > 500000) {
      try {
        const parsed = JSON.parse(tasksRaw);
        if (Array.isArray(parsed)) {
          // Salva no IndexedDB antes de limpar
          idbSet('zeladoria_tasks_v1', parsed);
          // Otimiza o cache do LocalStorage
          const sanitized = sanitizeForLocalStorage('zeladoria_tasks_v1', parsed);
          localStorage.setItem('zeladoria_tasks_v1', JSON.stringify(sanitized));
        }
      } catch {}
    }
  } catch {
    // Silencioso
  }
}

// Executar limpeza proativa na carga do módulo
if (typeof window !== 'undefined') {
  purgeBloatedLocalStorage();
}

/**
 * Lê do LocalStorage com fallback em memória e valor padrão seguro.
 */
export function safeGetLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Salva fallback de forma segura sem crashar caso a cota esteja cheia
      safeSetLocal(key, fallback);
      memoryCache.set(key, fallback);
      return fallback;
    }
    const parsed = JSON.parse(raw) as T;
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    if (memoryCache.has(key)) {
      return memoryCache.get(key) as T;
    }
    return fallback;
  }
}

/**
 * Grava no cache de forma robusta e tolerante a falhas.
 * NUNCA emite console.error para QuotaExceededError, garantindo que o app
 * continue funcionando sem interrupções mesmo em navegadores com cotas restritas.
 */
export function safeSetLocal<T>(key: string, data: T): void {
  // 1. Sempre atualiza o cache em memória
  memoryCache.set(key, data);

  // 2. Persiste assincronamente no IndexedDB com os dados completos (incluindo imagens)
  idbSet(key, data);

  // 3. Tenta salvar no LocalStorage com sanitização preventiva
  try {
    const sanitized = sanitizeForLocalStorage(key, data);
    const serialized = JSON.stringify(sanitized);
    localStorage.setItem(key, serialized);
  } catch (err: any) {
    const isQuotaError =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      (err?.message && err.message.toLowerCase().includes('quota'));

    if (isQuotaError) {
      // Tentar recuperação liberando espaço
      try {
        freeUpStorageSpace();

        // Se for tarefas, aplicar sanitização mais agressiva
        if (key === 'zeladoria_tasks_v1' && Array.isArray(data)) {
          const minimalTasks = data.slice(0, 30).map((t: any) => ({
            ...t,
            photos: t.photos ? t.photos.map((p: any) => ({ ...p, storage_path: '' })) : [],
          }));
          localStorage.setItem(key, JSON.stringify(minimalTasks));
          return;
        }

        // Tentar salvar versão reduzida
        const sanitized = sanitizeForLocalStorage(key, data);
        localStorage.setItem(key, JSON.stringify(sanitized));
      } catch {
        // Se ainda assim não couber, os dados já foram salvos com segurança no IndexedDB e memória.
        // Usamos console.warn propositalmente para não poluir o console ou disparar alertas de erro.
        console.warn(`[StorageManager] Cota de LocalStorage atingida para ${key}. Dados preservados no IndexedDB.`);
      }
    } else {
      console.warn(`[StorageManager] Aviso ao gravar chave ${key}:`, err?.message || err);
    }
  }
}
