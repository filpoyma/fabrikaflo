const API_BASE = import.meta.env.DEV ? 'http://localhost:3000/api/fabrika' : '/api/fabrika';

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
  if (initData) {
    return { 'X-Init-Data': initData };
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
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
      console.error("API Error", text);
      throw new Error(text);
  }
  return res.json();
}

export const api = {
  API_BASE,
  
  // Authentication
  login: (login, checkPass) => request('/auth/login', { method: 'POST', body: JSON.stringify({ login, checkPass }) }),
  getMe: () => request('/auth/me'),

  // Portfolio Items (Mapped as Products for compatibility)
  getProducts: () => request('/gallery').then(res => {
    return (res.data || []).map(item => ({
      id: item.id,
      name: item.title || 'Авторский букет',
      description: item.description || 'Оригинальный букет собранный нашими лучшими флористами.',
      photo_url: item.photoUrl,
      category_slug: 'bouquets',
      category_name: '💐 Авторские букеты',
      in_stock: true,
      variants: [
        { name: 'Стандарт', price_usd: 50 }
      ],
      price_display: 'Индивидуальный бюджет'
    }));
  }),
  
  getProduct: async (id) => {
    const products = await api.getProducts();
    const found = products.find(p => p.id === id);
    if (!found) throw new Error('Portfolio item not found');
    return found;
  },

  getCategories: () => Promise.resolve([
    { name: '💐 Авторские букеты', slug: 'bouquets' }
  ]),

  // Requests (Creating bouquet requests)
  createRequest: (data) => request('/requests', { method: 'POST', body: JSON.stringify(data) }),
  uploadRequestPhoto: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/requests/upload`, {
      method: 'POST',
      headers: {
        'Bypass-Tunnel-Reminder': 'true',
        ...getAuthHeader(),
      },
      body: formData
    }).then(res => {
      if (!res.ok) throw new Error('Failed to upload photo');
      return res.json();
    });
  },

  // Orders
  getOrders: () => request('/orders/my').then(res => res.data || []),
  getOrder: (id) => request(`/orders/my/${id}`).then(res => res.data),
  
  // Bouquet Approval
  approveOrder: (id) => request(`/orders/my/${id}/approve`, { method: 'POST' }),
  disapproveOrder: (id, feedback) => request(`/orders/my/${id}/disapprove`, { method: 'POST', body: JSON.stringify({ feedback }) }),

  // Receipt Upload
  uploadReceipt: (orderId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/orders/my/${orderId}/receipt`, {
      method: 'POST',
      headers: {
        'Bypass-Tunnel-Reminder': 'true',
        ...getAuthHeader(),
      },
      body: formData
    }).then(res => {
      if (!res.ok) throw new Error('Failed to upload receipt');
      return res.json();
    });
  },
  
  // Profile
  getProfile: () => request('/clients/profile').then(res => res.data),
  updateProfile: (data) => request('/clients/profile', { method: 'PATCH', body: JSON.stringify(data) }).then(res => res.data),
  
  // Admin Operations (CRM compatibility)
  adminGetOrders: (status) => {
    const qs = status ? `?status=${status}` : '';
    return request(`/orders${qs}`).then(res => res.data || []);
  },
  adminUpdateOrder: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  adminGetRequests: () => request('/requests').then(res => res.data || []),
  adminConvertRequest: (id, data) => request(`/requests/${id}/convert`, { method: 'POST', body: JSON.stringify(data) }),
};
