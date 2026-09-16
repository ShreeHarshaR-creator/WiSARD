const ESP32_BASE_URL = 'http://192.168.4.1';

const readJsonSafely = async (response) => {
  const contentType = response.headers?.get?.('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const fallback = await response.text();
  return fallback ? { message: fallback } : { ok: response.ok };
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 1600) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getSystemStatus = async () => {
  try {
    const response = await fetchWithTimeout(`${ESP32_BASE_URL}/api/status`);
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    return await readJsonSafely(response);
  } catch (error) {
    console.warn('[Jammer API] Status fetch failed:', error?.message || error);
    return null;
  }
};

export const sendControlCommand = async (action, mode = null) => {
  try {
    let url = `${ESP32_BASE_URL}/api/control?action=${action}`;
    if (mode !== null) {
      url += `&mode=${mode}`;
    }

    const response = await fetchWithTimeout(url, { method: 'POST' }, 1800);
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    return await readJsonSafely(response);
  } catch (error) {
    console.error('[Jammer API] Control command failed:', error?.message || error);
    return null;
  }
};

export const updateSettings = async (dwellTimeUs, paLevel) => {
  try {
    const url = `${ESP32_BASE_URL}/api/settings?dwell=${dwellTimeUs}&pa=${paLevel}`;
    const response = await fetchWithTimeout(url, { method: 'POST' }, 1800);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    return await readJsonSafely(response);
  } catch (error) {
    console.error('[Jammer API] Settings update failed:', error?.message || error);
    return null;
  }
};
