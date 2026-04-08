export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string) {
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data.message || 'Falha na requisicao.';
    throw new Error(message);
  }

  return data as T;
}
