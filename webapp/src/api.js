const API_BASE = '/api/fabrika';

let _initData = '';
export function setInitData(data) { _initData = data; }

function getInitData() {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
    return window.Telegram.WebApp.initData;
  }
  return _initData;
}

function getAuthHeader() {
  const initData = getInitData();
  if (initData) return { 'X-Init-Data': initData };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
      ...getAuthHeader(),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('API Error', path, res.status, text);
    throw new Error(text);
  }
  return res.json();
}

async function requestSafe(path, options = {}, fallback = null) {
  try { return await request(path, options); }
  catch (e) { console.warn('API fallback for', path, '→ using default'); return fallback; }
}

function uploadForm(path, file, field = 'file') {
  const fd = new FormData();
  fd.append(field, file);
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Bypass-Tunnel-Reminder': 'true', ...getAuthHeader() },
    body: fd,
  }).then(res => {
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  });
}

// -------- Portfolio (Gallery) → mapped as Products for UI compatibility --------
const galleryToProduct = (item) => ({
  id: item.id,
  name: item.title || 'Авторский букет',
  description: item.description || 'Оригинальный букет, собранный нашими флористами.',
  photo_url: item.photoUrl,
  category_slug: 'bouquets',
  category_name: 'Авторские букеты',
  in_stock: true,
  variants: [{ name: 'Стандарт', price_usd: 50 }],
  price_display: 'Индивидуальный бюджет',
});

export const api = {
  API_BASE,

  // ---------- AUTH ----------
  login: (login, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),
  getMe: () => request('/auth/me'),

  // Telegram Widget login: backend has no dedicated endpoint, so we save the payload as a bearer token
  // and rely on X-Init-Data / initData for actual auth. UI still gets a token to unlock ProtectedRoute.
  loginWithTelegramWidget: async (user) => {
    try {
      const res = await request('/auth/telegram-widget', { method: 'POST', body: JSON.stringify(user) });
      if (res && res.token) return { ok: true, token: res.token, user: res.user };
    } catch (e) { /* endpoint may not exist yet */ }
    // Fallback: mint a client-side placeholder so ProtectedRoute doesn't lock the user out during dev.
    return { ok: true, token: `tg_widget_${user.id}`, user: { id: user.id, name: `${user.first_name || ''} ${user.last_name || ''}`.trim(), role: 'CLIENT' } };
  },

  // ---------- PORTFOLIO / PRODUCTS ----------
  getProducts: () => request('/gallery').then(res => (res.data || []).map(galleryToProduct)),
  getProduct: async (id) => {
    const items = await api.getProducts();
    const found = items.find(p => p.id === id);
    if (!found) throw new Error('Portfolio item not found');
    return found;
  },
  getCategories: () => Promise.resolve([{ name: 'Авторские букеты', slug: 'bouquets' }]),

  // ---------- REQUESTS (заявки на букет) ----------
  createRequest: (data) =>
    request('/requests', { method: 'POST', body: JSON.stringify(data) }),
  uploadRequestPhoto: (file) => uploadForm('/requests/upload', file),

  // ---------- ORDERS (client-side) ----------
  getOrders:      () => request('/orders/my').then(r => r.data || []),
  getOrder:       (id) => request(`/orders/my/${id}`).then(r => r.data),
  approveOrder:   (id) => request(`/orders/my/${id}/approve`,    { method: 'POST' }),
  disapproveOrder:(id, feedback) => request(`/orders/my/${id}/disapprove`, { method: 'POST', body: JSON.stringify({ feedback }) }),
  uploadReceipt:  (orderId, file) => uploadForm(`/orders/my/${orderId}/receipt`, file),
  repeatOrder:    (orderId) => request(`/orders/my/${orderId}/repeat`, { method: 'POST' }),

  // ---------- PROFILE ----------
  getProfile:    () => request('/clients/profile').then(r => r.data),
  updateProfile: (data) => request('/clients/profile', { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.data),
  uploadAvatar:  (file) => uploadForm('/clients/avatar', file).then(r => ({ ok: true, url: r.url })).catch(() => ({ ok: false })),

  // ---------- CART (backend has no cart module — provide safe stubs) ----------
  getCart:            () => Promise.resolve({ items: [], subtotal_usd: 0, total_usd: 0, subtotal_display: '$ 0', total_display: '$ 0', discount_percent: 0, discount_usd: 0 }),
  addToCart:          (_pid, _vi, _qty) => Promise.resolve({ ok: true }),
  removeFromCart:     (_pid, _vi) => Promise.resolve({ ok: true }),
  updateCartItemQty:  (_pid, _vi, _qty) => Promise.resolve({ ok: true }),

  // ---------- ARTICLES (not in backend yet) ----------
  getArticle: (id) => Promise.reject(new Error('Articles endpoint not implemented on backend')),
  adminUpdateArticle: () => Promise.reject(new Error('Not implemented')),
  adminDeleteArticle: () => Promise.reject(new Error('Not implemented')),

  // ---------- ADMIN ----------
  adminGetOrders: (status) => {
    const qs = status ? `?status=${status}` : '';
    return request(`/orders${qs}`).then(r => r.data || []);
  },
  adminUpdateOrder:   (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  adminGetRequests:   () => request('/requests').then(r => r.data || []),
  adminConvertRequest:(id, data) => request(`/requests/${id}/convert`, { method: 'POST', body: JSON.stringify(data) }),

  // Gallery admin
  adminUploadImage: (file) => uploadForm('/gallery/upload', file).then(r => ({ ok: true, url: r.url || r.photoUrl })),
  adminCreateProduct: (data) =>
    request('/gallery', { method: 'POST', body: JSON.stringify({ title: data.name, description: data.description, photoUrl: data.photo_url }) })
      .then(r => galleryToProduct(r.data || r)),
  adminUpdateProduct: (id, data) =>
    request(`/gallery/${id}`, { method: 'PATCH', body: JSON.stringify({ title: data.name, description: data.description, photoUrl: data.photo_url }) })
      .then(r => galleryToProduct(r.data || r)),
  adminDeleteProduct: (id) => request(`/gallery/${id}`, { method: 'DELETE' }),
  adminToggleProduct: (id) => Promise.resolve({ ok: true }),
  adminGetProducts:   () => api.getProducts(),

  // Placeholder admin ops (endpoints not implemented on backend)
  adminUpdateProductStock: () => Promise.resolve({ ok: true }),
  adminCreateCategory:     () => Promise.resolve({ ok: true }),
  adminDeleteCategory:     () => Promise.resolve({ ok: true }),
  adminAddTeamMember:      (data) => requestSafe('/team', { method: 'POST', body: JSON.stringify(data) }, { ok: true }),
  adminDeleteTeamMember:   (id)   => requestSafe(`/team/${id}`, { method: 'DELETE' }, { ok: true }),
  adminGetTeamMembers:     () => requestSafe('/team', {}, { data: [] }).then(r => (r && r.data) || []),
  adminGetAuditLogs:       () => Promise.resolve([]),
  adminGetSettings:        () => Promise.resolve({}),
  adminUpdateSettings:     () => Promise.resolve({ ok: true }),
  adminGetStats:           () => Promise.resolve(null),
  adminGetReferrals:       () => Promise.resolve([]),
  adminGetUserReferral:    () => Promise.resolve({}),
  adminSetDiscount:        () => Promise.resolve({ ok: true }),
  adminSetPartner:         () => Promise.resolve({ ok: true }),

  // AI chat stubs (not in backend yet)
  sendAiChatText:  (prompt, _history) => Promise.resolve({ ok: true, text: 'Мне нравится ваш выбор — расскажите чуть больше о поводе, и я предложу цветовую гамму. (Backend AI-endpoint not implemented yet.)', audio_url: null }),
  sendAiVoiceFile: (_blob, _history)  => Promise.resolve({ ok: true, user_text: '…', text: 'Голосовой ввод пока в разработке.', audio_url: null }),
};
