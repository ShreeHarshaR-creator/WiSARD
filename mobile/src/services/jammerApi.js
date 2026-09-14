const ESP32_BASE_URL = 'http://192.168.4.1';

export const getSystemStatus = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(`${ESP32_BASE_URL}/api/status`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('[Jammer API] Status fetch failed:', error.message);
    return null;
  }
};

export const sendControlCommand = async (action, mode = null) => {
  try {
    let url = `${ESP32_BASE_URL}/api/control?action=${action}`;
    if (mode !== null) {
      url += `&mode=${mode}`;
    }
    const response = await fetch(url, { method: 'POST' });
    return await response.json();
  } catch (error) {
    console.error('[Jammer API] Control command failed:', error.message);
    return null;
  }
};

export const updateSettings = async (dwellTimeUs, paLevel) => {
  try {
    let url = `${ESP32_BASE_URL}/api/settings?dwell=${dwellTimeUs}&pa=${paLevel}`;
    const response = await fetch(url, { method: 'POST' });
    return await response.json();
  } catch (error) {
    console.error('[Jammer API] Settings update failed:', error.message);
    return null;
  }
};
