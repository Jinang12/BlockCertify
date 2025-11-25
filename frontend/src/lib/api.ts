export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function postJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail: unknown = undefined;
    try {
      detail = await res.json();
    } catch {
      // ignore
    }
    throw new Error(detail && typeof detail === 'object' && detail !== null && 'error' in detail
      ? (detail as { error: string }).error
      : `Request failed (${res.status})`);
  }

  return res.json();
}

export async function postFormData<T>(path: string, formData: FormData, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      // ignore
    }
    throw new Error(detail && typeof detail === 'object' && detail !== null && 'error' in detail
      ? (detail as { error: string }).error
      : `Request failed (${res.status})`);
  }

  return res.json();
}

export async function getJson<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      // ignore
    }
    throw new Error(detail && typeof detail === 'object' && detail !== null && 'error' in detail
      ? (detail as { error: string }).error
      : `Request failed (${res.status})`);
  }

  return res.json();
}
