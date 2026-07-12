import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';
import { Plus, X, Trash2, Pen, Copy } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const getCategoryEmoji = (slug) => {
  const s = (slug || '').toLowerCase();
  if (s.includes('rape')) return '🍃';
  if (s.includes('mushroom') || s.includes('grib')) return '🍄';
  if (s.includes('oil') || s.includes('masl')) return '💧';
  if (s.includes('access') || s.includes('kuri') || s.includes('tepi')) return '🪕';
  if (s.includes('sananga')) return '👁️';
  if (s.includes('kambo')) return '🐸';
  if (s.includes('course') || s.includes('learn')) return '🎓';
  return '📦';
};

const hasEmoji = (str) => {
  if (!str) return false;
  return /\p{Emoji}/u.test(str);
};

const getCategoryNameWithEmoji = (slug, name) => {
  if (!name) return '';
  if (hasEmoji(name)) return name;
  const emoji = getCategoryEmoji(slug);
  return `${emoji} ${name}`;
};

const ProductImage = ({ src, categorySlug, name, size = '45px', fontSize = '1.4rem' }) => {
  const [error, setError] = React.useState(!src);
  
  React.useEffect(() => {
    setError(!src);
  }, [src]);

  if (error) {
    const emoji = getCategoryEmoji(categorySlug);
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '8px',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(13,40,24,0.3) 100%)',
        border: '1px solid rgba(212,175,55,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fontSize,
        flexShrink: 0
      }}>
        {emoji}
      </div>
    );
  }

  const fullSrc = src.startsWith('http') ? src : src.startsWith('/uploads') ? `/api${src}` : src;
  return (
    <img 
      src={fullSrc} 
      alt={name} 
      onError={() => setError(true)}
      style={{ width: size, height: size, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} 
    />
  );
};

export default function Admin({ profile }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'orders'); // orders | products | stats | settings
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState(null);
  const [statsPeriod, setStatsPeriod] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [productLocationFilter, setProductLocationFilter] = useState('all'); // all | bali | vietnam
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(searchParams.get('add') === 'true');
  const [categories, setCategories] = useState([]);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '' });
  const [tempCategory, setTempCategory] = useState({ name: '', slug: '' });
  const [activeNewProductVariantIdx, setActiveNewProductVariantIdx] = useState(0);
  const [referralsData, setReferralsData] = useState(null);
  const [foundUserLink, setFoundUserLink] = useState('');
  const [foundUserName, setFoundUserName] = useState('');
  const [foundUserStats, setFoundUserStats] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [expandedReferrers, setExpandedReferrers] = useState({});
  const [referrerFilter, setReferrerFilter] = useState('all'); // all | standard | mlm
  const [customMethodForm, setCustomMethodForm] = useState({ slug: '', title: '', rate: '', details: '' });
  const [editingMethods, setEditingMethods] = useState({});
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClientOrders, setSelectedClientOrders] = useState([]);
  const [loadingClientOrders, setLoadingClientOrders] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('');
  const [stockLocationFilter, setStockLocationFilter] = useState('all');
  const [expandedStockId, setExpandedStockId] = useState(null);
  const [savingStockId, setSavingStockId] = useState(null);
  const [editingStockData, setEditingStockData] = useState(null);
  const { haptic, user } = useTelegram();

  const [newProduct, setNewProduct] = useState({
    category_slug: searchParams.get('cat_slug') || 'rape', 
    category_name: searchParams.get('cat_name') || 'Рапэ', 
    name: '', 
    description: '', 
    photo_url: '', 
    location: 'all', 
    variants: [
      { name: 'Стандарт', price_usd: 10, price_idr: 160000, price_uah: 920 }
    ],
    is_sale: false,
    discount_percent: 0
  });

  const loadData = () => {
    setLoading(true);
    if (activeTab === 'orders') {
      api.adminGetOrders(selectedOrderStatus || undefined).then(setOrders).catch(console.error).finally(() => setLoading(false));
    } else if (activeTab === 'products') {
      Promise.all([
        api.adminGetProducts(),
        api.getCategories()
      ]).then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      }).catch(console.error).finally(() => setLoading(false));
    } else if (activeTab === 'settings') {
      api.adminGetSettings().then(setSettings).catch(console.error).finally(() => setLoading(false));
    } else if (activeTab === 'referrals') {
      api.adminGetReferrals().then(data => {
        setReferralsData(data);
        setSettings(prev => ({ ...prev, referral_percent: data.referral_percent }));
      }).catch(console.error).finally(() => setLoading(false));
    } else if (activeTab === 'stats') {
      api.adminGetStats(statsPeriod, customStart, customEnd).then(setStats).catch(console.error).finally(() => setLoading(false));
    } else if (activeTab === 'users') {
      const isOwner = [5082384607, 1005121723].includes(user?.id) || profile?.admin_permissions?.is_owner;
      if (isOwner) {
        api.adminGetTeamMembers().then(setTeamMembers).catch(console.error).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else if (activeTab === 'stock') {
      Promise.all([
        api.adminGetProducts(),
        api.getCategories()
      ]).then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      }).catch(console.error).finally(() => setLoading(false));
    } else if (activeTab === 'audit') {
      setLoadingLogs(true);
      api.adminGetAuditLogs().then(setAuditLogs).catch(console.error).finally(() => {
        setLoading(false);
        setLoadingLogs(false);
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, statsPeriod, customStart, customEnd, selectedOrderStatus]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }

    const addParam = searchParams.get('add') === 'true';
    if (addParam) {
      setShowAddForm(true);
      const catSlug = searchParams.get('cat_slug');
      const catName = searchParams.get('cat_name');
      if (catSlug && catName) {
        setNewProduct(prev => ({
          ...prev,
          category_slug: catSlug,
          category_name: catName
        }));
      }
    } else {
      setShowAddForm(false);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    haptic.impact('light');
    setActiveTab(tab);
    setSearchParams({ tab });
    setFoundUserLink('');
    setFoundUserName('');
    setFoundUserStats(null);
  };

  const closeAddForm = () => {
    setShowAddForm(false);
    setSearchParams({ tab: activeTab });
  };

  const addVariant = () => {
    haptic.impact('light');
    setNewProduct(prev => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        { name: '', price_usd: 10, price_idr: 160000, price_uah: 920 }
      ]
    }));
  };

  const removeVariant = (index) => {
    haptic.impact('light');
    setNewProduct(prev => ({
      ...prev,
      variants: (prev.variants || []).filter((_, idx) => idx !== index)
    }));
  };

  const updateVariantField = (index, field, value) => {
    setNewProduct(prev => ({
      ...prev,
      variants: (prev.variants || []).map((v, idx) => idx === index ? { ...v, [field]: value } : v)
    }));
  };

  const applyVariantTemplate = (names) => {
    haptic.impact('medium');
    const base = (newProduct.variants && newProduct.variants[0]) || { price_usd: 10, price_idr: 160000, price_uah: 920 };
    setNewProduct(prev => ({
      ...prev,
      variants: names.map(name => ({
        name,
        price_usd: base.price_usd,
        price_idr: base.price_idr,
        price_uah: base.price_uah
      }))
    }));
  };

  const updateOrderStatus = async (id, status) => {
    try {
      haptic.impact('medium');
      await api.adminUpdateOrder(id, status);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenClientCard = async (u) => {
    try {
      haptic.impact('light');
      setSelectedClient(u);
      setLoadingClientOrders(true);
      const clientOrders = await api.adminGetOrders(undefined, u.id);
      setSelectedClientOrders(clientOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClientOrders(false);
    }
  };

  const toggleProduct = async (id) => {
    try {
      haptic.impact('light');
      await api.adminToggleProduct(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Точно удалить?')) return;
    try {
      haptic.impact('heavy');
      await api.adminDeleteProduct(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      haptic.impact('medium');
      await api.adminCreateCategory(newCategory);
      setNewCategory({ name: '', slug: '' });
      setShowAddCategoryForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Ошибка при добавлении категории: ' + err.message);
    }
  };

  const handleDeleteCategory = async (slug) => {
    if (!window.confirm(`Вы уверены, что хотите удалить категорию "${slug}"?`)) return;
    try {
      haptic.impact('heavy');
      await api.adminDeleteCategory(slug);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Ошибка при удалении категории: ' + err.message);
    }
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const res = await api.adminUploadImage(file);
      if (res.ok) {
        // Assume API_BASE is the domain if needed, but since it's the same domain we can just use the relative URL returned, or prepend API_BASE
        // For local development it uses localhost:8000, for prod it uses relative /api which Nginx proxies
        const fullUrl = import.meta.env.DEV ? `http://localhost:8000${res.url}` : `/api${res.url}`;
        setNewProduct({...newProduct, photo_url: fullUrl});
        haptic.success();
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при загрузке картинки');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      haptic.impact('medium');
      await api.adminCreateProduct(newProduct);
      closeAddForm();
      setNewProduct({
        category_slug: newProduct.category_slug,
        category_name: newProduct.category_name,
        name: '',
        description: '',
        photo_url: '',
        location: 'all',
        variants: [
          { name: 'Стандарт', price_usd: 10, price_idr: 160000, price_uah: 920 }
        ],
        is_sale: false,
        discount_percent: 0
      });
      loadData();
    } catch (err) {
      console.error(err);
      alert('Ошибка при добавлении товара');
    }
  };

  return (
    <div className="container page-transition" style={{ position: 'relative' }}>
      <h2 style={{ marginBottom: '1rem', color: '#ff4d4f' }}>🛡️ Админ-панель</h2>

      {(() => {
        const isOwner = [5082384607, 1005121723].includes(user?.id) || profile?.admin_permissions?.is_owner;
        const hasFullAccess = isOwner || profile?.admin_permissions?.has_full_access;

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button className={activeTab === 'orders' ? 'primary' : 'secondary'} style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }} onClick={() => handleTabChange('orders')}>Заказы</button>
            <button className={activeTab === 'products' ? 'primary' : 'secondary'} style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }} onClick={() => handleTabChange('products')}>Товары</button>
            <button className={activeTab === 'stock' ? 'primary' : 'secondary'} style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }} onClick={() => handleTabChange('stock')}>Склад</button>
            {hasFullAccess && <button className={activeTab === 'stats' ? 'primary' : 'secondary'} style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }} onClick={() => handleTabChange('stats')}>Аналитика</button>}
            {hasFullAccess && <button className={activeTab === 'users' ? 'primary' : 'secondary'} style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }} onClick={() => handleTabChange('users')}>Пользователи</button>}
            {hasFullAccess && <button className={activeTab === 'referrals' ? 'primary' : 'secondary'} style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }} onClick={() => handleTabChange('referrals')}>Рефералы</button>}
            {hasFullAccess && <button className={activeTab === 'audit' ? 'primary' : 'secondary'} style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }} onClick={() => handleTabChange('audit')}>Логи</button>}
            {isOwner && <button className={activeTab === 'settings' ? 'primary' : 'secondary'} style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }} onClick={() => handleTabChange('settings')}>Оплата</button>}
          </div>
        );
      })()}

      {loading && <div className="spinner"></div>}
      
      {!loading && activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '7rem' }}>
          {/* Status Filter Row */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.8rem', marginBottom: '0.5rem', width: '100%', scrollbarWidth: 'none' }} className="hide-scrollbar">
            {[
              { name: 'Все', value: '' },
              { name: '⏳ Ожидают', value: 'pending' },
              { name: '💰 Оплачены', value: 'paid' },
              { name: '✅ Приняты', value: 'confirmed' },
              { name: '🚚 Отправлены', value: 'shipped' },
              { name: '🎉 Завершены', value: 'done' },
              { name: '❌ Отменены', value: 'cancelled' }
            ].map(status => (
              <button 
                key={status.value} 
                className={selectedOrderStatus === status.value ? 'primary' : 'secondary'} 
                onClick={() => { setSelectedOrderStatus(status.value); haptic.impact('light'); }}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', whiteSpace: 'nowrap', borderRadius: '16px' }}
              >
                {status.name}
              </button>
            ))}
          </div>

          {/* Orders Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Заказы не найдены</div>
            ) : (
              orders.map(o => (
                <div 
                  key={o.id} 
                  className="glass-card page-transition" 
                  style={{ 
                    borderLeft: o.status === 'pending' ? '4px solid orange' : 
                               o.status === 'paid' ? '4px solid gold' :
                               o.status === 'confirmed' ? '4px solid #38bdf8' :
                               o.status === 'shipped' ? '4px solid #a855f7' :
                               o.status === 'done' ? '4px solid #22c55e' : '4px solid #ef4444',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onClick={() => { setSelectedOrder(o); haptic.impact('light'); }}
                >
                  <div className="flex-between">
                    <b>Заказ #{o.id}</b>
                    <span className="badge" style={{ 
                      background: o.status === 'pending' ? 'rgba(249,115,22,0.15)' : 
                                  o.status === 'paid' ? 'rgba(234,179,8,0.15)' :
                                  o.status === 'confirmed' ? 'rgba(56,189,248,0.15)' :
                                  o.status === 'shipped' ? 'rgba(168,85,247,0.15)' :
                                  o.status === 'done' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: o.status === 'pending' ? '#f97316' : 
                             o.status === 'paid' ? '#eab308' :
                             o.status === 'confirmed' ? '#38bdf8' :
                             o.status === 'shipped' ? '#a855f7' :
                             o.status === 'done' ? '#22c55e' : '#ef4444',
                      border: '1px solid currentColor',
                      fontSize: '0.75rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '6px'
                    }}>
                      {o.status_display}
                    </span>
                  </div>
                  <div style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {o.customer || `ID ${o.user_id}`} • {o.currency.toUpperCase()} {o.total_in_currency}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Details Modal will be rendered globally at the bottom of the page */}
        </div>
      )}

      {!loading && activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '7rem' }}>
            {!showAddForm && (
              <div 
                className="glass-card" 
                style={{ 
                  display: 'flex', justifyContent: 'center', alignItems: 'center', 
                  padding: '1.5rem', cursor: 'pointer', border: '2px dashed var(--gold)',
                  background: 'rgba(212,175,55,0.05)'
                }}
                onClick={() => setShowAddForm(true)}
              >
                <Plus size={32} color="var(--gold)" />
                <span style={{ marginLeft: '0.5rem', color: 'var(--gold)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  Добавить товар
                </span>
              </div>
            )}

            {showAddForm && (
              <div className="glass-card slide-up" style={{ border: '1px solid var(--gold)' }}>
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--gold)' }}>Новый товар</h3>
                  <button className="icon-btn secondary" onClick={closeAddForm}><X size={20}/></button>
                </div>
                <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <input className="input" placeholder="Название товара" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
                  <textarea className="input" placeholder="Описание" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                  
                  <div style={{ 
                    background: 'rgba(201, 168, 76, 0.05)', 
                    border: '1px dashed var(--gold)', 
                    padding: '0.8rem', 
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={newProduct.is_sale || false} 
                        onChange={e => setNewProduct({...newProduct, is_sale: e.target.checked})} 
                        style={{ width: 'auto', marginBottom: 0 }} 
                      />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 'bold' }}>🏷️ Акционный товар (скидка)</span>
                    </label>
                    
                    {newProduct.is_sale && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Процент скидки (%)</span>
                        <input 
                          type="number" 
                          min="1" 
                          max="99" 
                          className="input" 
                          placeholder="Например: 15" 
                          value={newProduct.discount_percent || ''} 
                          onChange={e => setNewProduct({...newProduct, discount_percent: parseInt(e.target.value) || 0})} 
                          style={{ width: '100px', marginBottom: 0 }} 
                        />
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input className="input" style={{ flex: 1 }} placeholder="URL картинки (http...)" value={newProduct.photo_url} onChange={e => setNewProduct({...newProduct, photo_url: e.target.value})} />
                    <label className="secondary" style={{ padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {uploadingImage ? 'Загрузка...' : '📁 Загрузить'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Категория товара:</span>
                    <select 
                      className="input" 
                      value={newProduct.category_slug} 
                      onChange={e => {
                        const selectedSlug = e.target.value;
                        if (selectedSlug === 'CREATE_NEW_CATEGORY') {
                          setNewProduct({
                            ...newProduct,
                            category_slug: 'CREATE_NEW_CATEGORY',
                            category_name: ''
                          });
                          return;
                        }
                        const selectedCat = categories.find(c => c.slug === selectedSlug);
                        setNewProduct({
                          ...newProduct, 
                          category_slug: selectedSlug, 
                          category_name: selectedCat ? selectedCat.name : ''
                        });
                      }}
                      required
                    >
                      <option value="" disabled>Выберите категорию...</option>
                      {categories.map(c => (
                        <option key={c.slug} value={c.slug}>{getCategoryNameWithEmoji(c.slug, c.name)}</option>
                      ))}
                      <option value="CREATE_NEW_CATEGORY">➕ Создать категорию...</option>
                    </select>
                  </div>

                  {newProduct.category_slug === 'CREATE_NEW_CATEGORY' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', border: '1px dashed var(--gold)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 'bold' }}>Создание новой категории:</span>
                      <input 
                        className="input" 
                        placeholder="Название (например: 🌿 Смеси Рапе)" 
                        value={tempCategory.name} 
                        onChange={e => setTempCategory({...tempCategory, name: e.target.value})} 
                        required
                      />
                      <input 
                        className="input" 
                        placeholder="Slug (например: rape)" 
                        value={tempCategory.slug} 
                        onChange={e => setTempCategory({...tempCategory, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '')})} 
                        required
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          type="button" 
                          className="primary" 
                          style={{ padding: '0.4rem', fontSize: '0.85rem', flex: 1, marginBottom: 0 }}
                          onClick={async () => {
                            if (!tempCategory.name || !tempCategory.slug) {
                              alert('Заполните название и slug!');
                              return;
                            }
                            try {
                              haptic.impact('medium');
                              await api.adminCreateCategory(tempCategory);
                              const updatedCats = await api.getCategories();
                              setCategories(updatedCats);
                              setNewProduct({
                                ...newProduct,
                                category_slug: tempCategory.slug,
                                category_name: tempCategory.name
                              });
                              setTempCategory({ name: '', slug: '' });
                            } catch (err) {
                              alert('Ошибка при создании категории: ' + err.message);
                            }
                          }}
                        >
                          Создать и выбрать
                        </button>
                        <button 
                          type="button" 
                          className="secondary" 
                          style={{ padding: '0.4rem', fontSize: '0.85rem', width: 'auto', marginBottom: 0 }}
                          onClick={() => {
                            setNewProduct({
                              ...newProduct,
                              category_slug: categories[0]?.slug || '',
                              category_name: categories[0]?.name || ''
                            });
                          }}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="glass-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--gold)' }}>Варианты (веса/объемы):</span>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                          type="button"
                          className="secondary" 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', marginBottom: 0 }}
                          onClick={() => {
                            applyVariantTemplate(['2 г', '5 г', '10 г']);
                            setActiveNewProductVariantIdx(0);
                          }}
                        >
                          ⚖️ 2г, 5г, 10г
                        </button>
                        <button 
                          type="button"
                          className="secondary" 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', marginBottom: 0 }}
                          onClick={() => {
                            applyVariantTemplate(['2 мл', '5 мл', '10 мл', '20 мл']);
                            setActiveNewProductVariantIdx(0);
                          }}
                        >
                          🧪 2мл - 20мл
                        </button>
                      </div>
                    </div>

                    {/* Variant Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
                      {newProduct.variants && newProduct.variants.map((v, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={idx === activeNewProductVariantIdx ? 'primary' : 'secondary'}
                          style={{ 
                            padding: '0.4rem 0.8rem', 
                            fontSize: '0.85rem', 
                            borderRadius: '8px', 
                            whiteSpace: 'nowrap',
                            marginBottom: 0,
                            border: idx === activeNewProductVariantIdx ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)'
                          }}
                          onClick={() => setActiveNewProductVariantIdx(idx)}
                        >
                          {v.name || `Вариант ${idx + 1}`}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px', marginBottom: 0 }}
                        onClick={() => {
                          addVariant();
                          setActiveNewProductVariantIdx((newProduct.variants || []).length);
                        }}
                      >
                        ➕
                      </button>
                    </div>

                    {/* Selected Variant Editor */}
                    {newProduct.variants && newProduct.variants[activeNewProductVariantIdx] && (() => {
                      const v = newProduct.variants[activeNewProductVariantIdx];
                      return (
                        <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Название варианта (например: 2 г, 5 мл):</label>
                            <input 
                              type="text" 
                              className="input" 
                              style={{ padding: '0.5rem', fontSize: '0.9rem' }} 
                              placeholder="Например: 2 г" 
                              value={v.name} 
                              onChange={e => updateVariantField(activeNewProductVariantIdx, 'name', e.target.value)} 
                              required 
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Цены для этого варианта:</label>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <div style={{ flex: 1, position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 'bold' }}>$</span>
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  className="input" 
                                  style={{ padding: '0.5rem 0.4rem 0.5rem 1.2rem', fontSize: '0.85rem' }} 
                                  placeholder="USD" 
                                  value={v.price_usd} 
                                  onChange={e => updateVariantField(activeNewProductVariantIdx, 'price_usd', parseFloat(e.target.value) || 0)} 
                                  required 
                                />
                              </div>
                              <div style={{ flex: 1.2, position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 'bold' }}>Rp</span>
                                <input 
                                  type="number" 
                                  className="input" 
                                  style={{ padding: '0.5rem 0.4rem 0.5rem 1.4rem', fontSize: '0.85rem' }} 
                                  placeholder="IDR" 
                                  value={v.price_idr} 
                                  onChange={e => updateVariantField(activeNewProductVariantIdx, 'price_idr', parseInt(e.target.value) || 0)} 
                                  required 
                                />
                              </div>
                              <div style={{ flex: 1, position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 'bold' }}>₽</span>
                                <input 
                                  type="number" 
                                  className="input" 
                                  style={{ padding: '0.5rem 0.4rem 0.5rem 1.2rem', fontSize: '0.85rem' }} 
                                  placeholder="RUB" 
                                  value={v.price_uah} 
                                  onChange={e => updateVariantField(activeNewProductVariantIdx, 'price_uah', parseInt(e.target.value) || 0)} 
                                  required 
                                />
                              </div>
                            </div>
                          </div>

                          {newProduct.variants.length > 1 && (
                            <button 
                              type="button" 
                              className="secondary" 
                              style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', color: '#ff4d4f', borderColor: 'rgba(255,77,79,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.2rem' }} 
                              onClick={() => {
                                removeVariant(activeNewProductVariantIdx);
                                setActiveNewProductVariantIdx(Math.max(0, activeNewProductVariantIdx - 1));
                              }}
                            >
                              🗑️ Удалить вариант "{v.name || activeNewProductVariantIdx + 1}"
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <select className="input" value={newProduct.location} onChange={e => setNewProduct({...newProduct, location: e.target.value})}>
                    <option value="all">Все локации</option>
                    <option value="bali">Только Бали</option>
                    <option value="vietnam">Только Вьетнам</option>
                  </select>
                  
                  <button type="submit" className="primary" style={{ marginTop: '0.5rem' }}>Сохранить товар</button>
                </form>
              </div>
            )}

            {/* Фильтр по локациям */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              <button 
                className={productLocationFilter === 'all' ? 'primary' : 'secondary'} 
                style={{ padding: '0.3rem 0.8rem', whiteSpace: 'nowrap', fontSize: '0.85rem' }} 
                onClick={() => { haptic.impact('light'); setProductLocationFilter('all'); }}
              >
                Все ({products.length})
              </button>
              <button 
                className={productLocationFilter === 'bali' ? 'primary' : 'secondary'} 
                style={{ padding: '0.3rem 0.8rem', whiteSpace: 'nowrap', fontSize: '0.85rem' }} 
                onClick={() => { haptic.impact('light'); setProductLocationFilter('bali'); }}
              >
                Бали 🌴 ({products.filter(p => p.location === 'bali' || p.location === 'all').length})
              </button>
              <button 
                className={productLocationFilter === 'vietnam' ? 'primary' : 'secondary'} 
                style={{ padding: '0.3rem 0.8rem', whiteSpace: 'nowrap', fontSize: '0.85rem' }} 
                onClick={() => { haptic.impact('light'); setProductLocationFilter('vietnam'); }}
              >
                Вьетнам 🇻🇳 ({products.filter(p => p.location === 'vietnam' || p.location === 'all').length})
              </button>
            </div>

            {products
              .filter(p => {
                if (productLocationFilter === 'all') return true;
                return p.location === productLocationFilter || p.location === 'all';
              })
              .map(p => (
                <div key={p.id} className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem', padding: '0.8rem' }}>
                  <Link to={`/product/${p.id}?edit=true`} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, textDecoration: 'none', color: 'inherit' }}>
                    <ProductImage src={p.photo_url} categorySlug={p.category_slug} name={p.name} size="60px" />
                    <div style={{ flex: 1 }}>
                      <b style={{ color: '#fff', fontSize: '0.95rem' }}>{p.name}</b>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getCategoryNameWithEmoji(p.category_slug, p.category_name)}</span>
                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--gold)', fontWeight: 'bold' }}>
                          {p.location === 'all' ? 'Везде' : p.location === 'bali' ? 'Бали 🌴' : 'Вьетнам 🇻🇳'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', marginTop: '0.3rem', color: 'var(--gold)' }}>
                        ${p.price_usd} / Rp {p.price_idr} / {p.price_uah} ₽ / ₫ {p.price_vnd}
                      </div>
                    </div>
                  </Link>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      className={p.in_stock ? "primary" : "secondary"} 
                      style={{ 
                        padding: '0.35rem 0.7rem', 
                        fontSize: '0.75rem', 
                        width: 'auto', 
                        height: '32px',
                        marginBottom: 0, 
                        background: p.in_stock ? 'rgba(74,117,89,0.3)' : 'rgba(255,255,255,0.05)',
                        border: p.in_stock ? '1px solid rgba(74,117,89,0.6)' : '1px solid rgba(255,255,255,0.15)',
                        color: p.in_stock ? '#52c41a' : 'var(--text-muted)'
                      }} 
                      onClick={() => toggleProduct(p.id)}
                    >
                      {p.in_stock ? '👁️ В наличии' : '👁️‍🗨️ Скрыт'}
                    </button>
                    <button 
                      className="icon-btn-delete" 
                      style={{ width: '32px', height: '32px', padding: 0 }}
                      onClick={() => deleteProduct(p.id)}
                      title="Удалить товар"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}

            <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)', margin: '2rem 0' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'var(--gold)', margin: 0 }}>📁 Категории товаров</h3>
              {!showAddCategoryForm && (
                <button 
                  className="primary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto', marginBottom: 0 }} 
                  onClick={() => setShowAddCategoryForm(true)}
                >
                  <Plus size={16} style={{ marginRight: '0.2rem', verticalAlign: 'middle' }} /> Добавить категорию
                </button>
              )}
            </div>

            {showAddCategoryForm && (
              <div className="glass-card slide-up" style={{ border: '1px solid var(--gold)', marginBottom: '1.5rem', padding: '1rem' }}>
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: 'var(--gold)', margin: 0 }}>Новая категория</h4>
                  <button className="icon-btn secondary" onClick={() => setShowAddCategoryForm(false)}><X size={18}/></button>
                </div>
                <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <input 
                    className="input" 
                    placeholder="Название (например: 🌿 Смеси Рапе)" 
                    value={newCategory.name} 
                    onChange={e => setNewCategory({...newCategory, name: e.target.value})} 
                    required 
                  />
                  <input 
                    className="input" 
                    placeholder="Slug (например: rape)" 
                    value={newCategory.slug} 
                    onChange={e => setNewCategory({...newCategory, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '')})} 
                    required 
                  />
                  <button type="submit" className="primary" style={{ padding: '0.6rem' }}>Сохранить категорию</button>
                </form>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {categories.map(c => (
                <div key={c.slug} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem' }}>
                  <div>
                    <span style={{ fontWeight: '500', color: '#fff' }}>{c.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({c.slug})</span>
                  </div>
                  <button 
                    className="icon-btn-delete" 
                    style={{ width: '32px', height: '32px', padding: 0 }} 
                    onClick={() => handleDeleteCategory(c.slug)}
                    title="Удалить категорию"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
      )}

      {!loading && activeTab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '7rem' }}>
          
          {/* Summary Card */}
          <div className="glass-card" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <h3 style={{ color: 'var(--gold)', fontSize: '1.1rem', marginBottom: '0.6rem', marginTop: 0 }}>📊 Сводка запасов</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Рапэ (Бали):</span>{' '}
                <b style={{ color: '#fff' }}>
                  {products
                    .filter(p => p.category_slug === 'rape')
                    .reduce((sum, p) => sum + (p.stock_bali || 0), 0)
                    .toFixed(0)} г
                </b>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Рапэ (Вьетнам):</span>{' '}
                <b style={{ color: '#fff' }}>
                  {products
                    .filter(p => p.category_slug === 'rape')
                    .reduce((sum, p) => sum + (p.stock_vietnam || 0), 0)
                    .toFixed(0)} г
                </b>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input 
              className="input" 
              placeholder="🔍 Поиск по названию..." 
              value={stockSearchQuery} 
              onChange={e => setStockSearchQuery(e.target.value)} 
              style={{ flex: 1, minWidth: '150px' }}
            />
            <select 
              className="input" 
              value={stockCategoryFilter} 
              onChange={e => setStockCategoryFilter(e.target.value)}
              style={{ flex: '0 0 150px' }}
            >
              <option value="">Все категории</option>
              {categories.map(c => (
                <option key={c.slug} value={c.slug}>{getCategoryNameWithEmoji(c.slug, c.name)}</option>
              ))}
            </select>
            <select 
              className="input" 
              value={stockLocationFilter} 
              onChange={e => setStockLocationFilter(e.target.value)}
              style={{ flex: '0 0 130px' }}
            >
              <option value="all">📍 Все локации</option>
              <option value="bali">🌴 Бали</option>
              <option value="vietnam">🇻🇳 Вьетнам</option>
            </select>
          </div>

          {/* Products List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {products
              .filter(p => {
                const matchSearch = p.name.toLowerCase().includes(stockSearchQuery.toLowerCase());
                const matchCategory = !stockCategoryFilter || p.category_slug === stockCategoryFilter;
                const matchLocation = stockLocationFilter === 'all' || p.location === 'all' || p.location === stockLocationFilter;
                return matchSearch && matchCategory && matchLocation;
              })
              .map(p => {
                const isExpanded = expandedStockId === p.id;
                const isEditingThis = editingStockData && editingStockData.id === p.id;

                const currentBali = isEditingThis ? editingStockData.stock_bali : (p.stock_bali ?? 0);
                const currentVietnam = isEditingThis ? editingStockData.stock_vietnam : (p.stock_vietnam ?? 0);
                const isWeightBased = isEditingThis ? editingStockData.is_weight_based : (p.is_weight_based ?? true);
                const currentVariants = isEditingThis ? editingStockData.variants : (p.variants || []);

                const currentUnit = !isWeightBased
                  ? 'шт'
                  : ((currentVariants || []).some(v => v.name.toLowerCase().includes('мл') || v.name.toLowerCase().includes('ml')) || p.category_slug === 'oils')
                    ? 'мл'
                    : 'г';

                const isWeight = currentUnit !== 'шт';

                const handleQuickAdjust = (loc, amount) => {
                  haptic.impact('light');
                  if (isEditingThis) {
                    setEditingStockData(prev => {
                      const updated = { ...prev };
                      if (loc === 'bali') {
                        updated.stock_bali = Math.max(0, (prev.stock_bali || 0) + amount);
                      } else {
                        updated.stock_vietnam = Math.max(0, (prev.stock_vietnam || 0) + amount);
                      }
                      return updated;
                    });
                  }
                };

                const handleSetUnit = (newUnit) => {
                  haptic.impact('medium');
                  if (isEditingThis) {
                    const isWeightBasedNew = newUnit !== 'шт';
                    const updatedVariants = (editingStockData.variants || []).map(v => {
                      let name = v.name || '';
                      if (name.toLowerCase() === 'стандарт') return v;
                      if (newUnit === 'шт') {
                        name = name.replace(/(г|гр|мл|ml)/g, 'шт');
                        if (!name.includes('шт')) name += ' шт';
                      } else if (newUnit === 'мл') {
                        name = name.replace(/(г|гр|шт)/g, 'мл');
                        if (!name.includes('мл')) name += ' мл';
                      } else if (newUnit === 'г') {
                        name = name.replace(/(мл|ml|шт)/g, 'г');
                        if (!name.includes('г') && !name.includes('гр')) name += ' г';
                      }
                      return { ...v, name };
                    });
                    setEditingStockData(prev => ({
                      ...prev,
                      is_weight_based: isWeightBasedNew,
                      variants: updatedVariants
                    }));
                  }
                };

                const handleUpdateManualStock = (loc, value) => {
                  const num = parseFloat(value) || 0;
                  if (isEditingThis) {
                    setEditingStockData(prev => ({
                      ...prev,
                      [loc === 'bali' ? 'stock_bali' : 'stock_vietnam']: num
                    }));
                  }
                };

                const handleUpdateVariantWeight = (vIndex, value) => {
                  const num = parseFloat(value) || 0;
                  if (isEditingThis) {
                    setEditingStockData(prev => {
                      const updatedVariants = (prev.variants || []).map((v, idx) => idx === vIndex ? { ...v, weight_qty: num } : v);
                      return { ...prev, variants: updatedVariants };
                    });
                  }
                };

                const handleSaveChanges = async () => {
                  haptic.impact('medium');
                  setSavingStockId(p.id);
                  try {
                    await api.adminUpdateProductStock(p.id, {
                      stock_bali: editingStockData.stock_bali,
                      stock_vietnam: editingStockData.stock_vietnam,
                      is_weight_based: editingStockData.is_weight_based,
                      variants: editingStockData.variants
                    });
                    setProducts(prev => prev.map(prod => prod.id === p.id ? { 
                      ...prod, 
                      stock_bali: editingStockData.stock_bali,
                      stock_vietnam: editingStockData.stock_vietnam,
                      is_weight_based: editingStockData.is_weight_based,
                      variants: editingStockData.variants 
                    } : prod));
                    haptic.success();
                    setExpandedStockId(null);
                    setEditingStockData(null);
                  } catch (err) {
                    console.error(err);
                    alert('Ошибка сохранения остатков');
                  } finally {
                    setSavingStockId(null);
                  }
                };

                const baliQty = p.stock_bali ?? 0;
                const vietnamQty = p.stock_vietnam ?? 0;
                const displayUnit = !(p.is_weight_based ?? true)
                  ? 'шт'
                  : ((p.variants || []).some(v => v.name.toLowerCase().includes('мл') || v.name.toLowerCase().includes('ml')) || p.category_slug === 'oils')
                    ? 'мл'
                    : 'г';

                let qtyString = '';
                if (stockLocationFilter === 'bali') {
                  qtyString = `🌴 ${baliQty} ${displayUnit}`;
                } else if (stockLocationFilter === 'vietnam') {
                  qtyString = `🇻🇳 ${vietnamQty} ${displayUnit}`;
                } else {
                  qtyString = `🌴 ${baliQty} | 🇻🇳 ${vietnamQty} ${displayUnit}`;
                }

                return (
                  <div key={p.id} className="glass-card page-transition" style={{ position: 'relative', padding: '1rem' }}>
                    {savingStockId === p.id && (
                      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }} className="spinner-small"></div>
                    )}
                    
                    {/* Header Row (Always visible, triggers accordion toggling) */}
                    <div 
                      style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => {
                        haptic.impact('light');
                        if (isExpanded) {
                          setExpandedStockId(null);
                          setEditingStockData(null);
                        } else {
                          setExpandedStockId(p.id);
                          setEditingStockData({
                            id: p.id,
                            stock_bali: p.stock_bali ?? 0,
                            stock_vietnam: p.stock_vietnam ?? 0,
                            is_weight_based: p.is_weight_based ?? true,
                            variants: JSON.parse(JSON.stringify(p.variants || []))
                          });
                        }
                      }}
                    >
                      <ProductImage src={p.photo_url} categorySlug={p.category_slug} name={p.name} size="45px" />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <b style={{ color: '#fff', fontSize: '0.95rem' }}>{p.name}</b>
                          <span style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 'bold', marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>
                            {qtyString}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>
                            Категория: {getCategoryNameWithEmoji(p.category_slug, p.category_name)}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            {isExpanded ? '▲ свернуть' : '▼ настроить'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Adjustments Panel (Visible only when expanded) */}
                    {isExpanded && isEditingThis && (
                      <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                        {/* Stock Settings */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.8rem' }}>
                          
                          {/* Type toggle */}
                          <div className="flex-between" style={{ fontSize: '0.85rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Тип учета:</span>
                            <div style={{ display: 'flex', gap: '0.2rem' }}>
                              <button 
                                className={currentUnit === 'г' ? 'primary' : 'secondary'} 
                                style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', marginBottom: 0, borderRadius: '4px' }}
                                onClick={() => handleSetUnit('г')}
                              >
                                ⚖️ г
                              </button>
                              <button 
                                className={currentUnit === 'мл' ? 'primary' : 'secondary'} 
                                style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', marginBottom: 0, borderRadius: '4px' }}
                                onClick={() => handleSetUnit('мл')}
                              >
                                🧪 мл
                              </button>
                              <button 
                                className={currentUnit === 'шт' ? 'primary' : 'secondary'} 
                                style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', marginBottom: 0, borderRadius: '4px' }}
                                onClick={() => handleSetUnit('шт')}
                              >
                                📦 шт
                              </button>
                            </div>
                          </div>

                          {/* Bali stock */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🌴 Бали:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <input 
                                type="number"
                                className="input"
                                value={currentBali}
                                onChange={e => handleUpdateManualStock('bali', e.target.value)}
                                style={{ width: '70px', padding: '0.2rem 0.4rem', textAlign: 'center', height: '30px' }}
                              />
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '20px' }}>{currentUnit}</span>
                              
                              <button 
                                className="secondary" 
                                style={{ padding: '0.2rem 0.4rem', height: '30px', fontSize: '0.75rem' }}
                                onClick={() => handleQuickAdjust('bali', isWeight ? 100 : 5)}
                              >
                                +{isWeight ? 100 : 5}
                              </button>
                              <button 
                                className="secondary" 
                                style={{ padding: '0.2rem 0.4rem', height: '30px', fontSize: '0.75rem' }}
                                onClick={() => handleQuickAdjust('bali', isWeight ? 500 : 10)}
                              >
                                +{isWeight ? 500 : 10}
                              </button>
                            </div>
                          </div>

                          {/* Vietnam stock */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🇻🇳 Вьетнам:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <input 
                                type="number"
                                className="input"
                                value={currentVietnam}
                                onChange={e => handleUpdateManualStock('vietnam', e.target.value)}
                                style={{ width: '70px', padding: '0.2rem 0.4rem', textAlign: 'center', height: '30px' }}
                              />
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '20px' }}>{currentUnit}</span>
                              
                              <button 
                                className="secondary" 
                                style={{ padding: '0.2rem 0.4rem', height: '30px', fontSize: '0.75rem' }}
                                onClick={() => handleQuickAdjust('vietnam', isWeight ? 100 : 5)}
                              >
                                +{isWeight ? 100 : 5}
                              </button>
                              <button 
                                className="secondary" 
                                style={{ padding: '0.2rem 0.4rem', height: '30px', fontSize: '0.75rem' }}
                                onClick={() => handleQuickAdjust('vietnam', isWeight ? 500 : 10)}
                              >
                                +{isWeight ? 500 : 10}
                              </button>
                            </div>
                          </div>

                        </div>

                        {/* Variant Weights Settings */}
                        {currentVariants && currentVariants.length > 0 && (
                          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '0.8rem' }}>
                            <div style={{ color: 'var(--gold)', fontWeight: 'bold', marginBottom: '0.4rem' }}>Списание при покупке фасовок:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {currentVariants.map((v, vIdx) => (
                                <div key={vIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>{v.name || 'Стандарт'} (${v.price_usd})</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <span>списывать:</span>
                                    <input 
                                      type="number"
                                      className="input"
                                      value={v.weight_qty ?? (isWeight ? (parseFloat(v.name) || 1) : 1)}
                                      onChange={e => handleUpdateVariantWeight(vIdx, e.target.value)}
                                      style={{ width: '55px', padding: '0.1rem 0.3rem', textAlign: 'center', height: '24px', fontSize: '0.75rem' }}
                                    />
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{currentUnit}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Explicit Save Button */}
                        <button 
                          className="primary" 
                          style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: 0 }}
                          onClick={handleSaveChanges}
                        >
                          💾 Сохранить изменения
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}
          </div>

        </div>
      )}

      {!loading && activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '7rem' }}>
          
          <h3 style={{ color: 'var(--gold)', fontSize: '1.2rem', marginBottom: '0.5rem', marginTop: 0 }}>
            📝 Журнал действий персонала
          </h3>

          {loadingLogs ? (
            <div className="spinner" style={{ margin: '2rem auto' }}></div>
          ) : auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Логи отсутствуют</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {auditLogs.map(log => {
                let pillColor = 'rgba(255,255,255,0.1)';
                let pillText = log.action;
                
                if (log.action === 'изменение_статуса_заказа') {
                  pillColor = 'rgba(249,115,22,0.15)';
                  pillText = '📦 Статус заказа';
                } else if (log.action === 'создание_товара') {
                  pillColor = 'rgba(34,197,94,0.15)';
                  pillText = '➕ Добавлен товар';
                } else if (log.action === 'редактирование_товара') {
                  pillColor = 'rgba(56,189,248,0.15)';
                  pillText = '✏️ Редакт. товара';
                } else if (log.action === 'переключение_видимости_товара') {
                  pillColor = 'rgba(168,85,247,0.15)';
                  pillText = '👁️ Видимость';
                } else if (log.action === 'удаление_товара' || log.action === 'удаление_сотрудника') {
                  pillColor = 'rgba(239,68,68,0.15)';
                  pillText = '❌ Удаление';
                } else if (log.action === 'изменение_склада') {
                  pillColor = 'rgba(234,179,8,0.15)';
                  pillText = '⚖️ Склад (Сток)';
                } else if (log.action === 'добавление_сотрудника') {
                  pillColor = 'rgba(22,163,74,0.15)';
                  pillText = '👤 Новый персонал';
                } else if (log.action === 'установка_скидки') {
                  pillColor = 'rgba(236,72,153,0.15)';
                  pillText = '🏷️ Скидка';
                } else if (log.action === 'изменение_настроек') {
                  pillColor = 'rgba(99,102,241,0.15)';
                  pillText = '⚙️ Настройки';
                }

                return (
                  <div key={log.id} className="glass-card page-transition" style={{ borderLeft: '3px solid var(--gold)', padding: '1rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 'bold', color: '#fff' }}>{log.admin_name}</span>
                      <span className="badge" style={{ background: pillColor, fontSize: '0.75rem', padding: '0.15rem 0.4rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {pillText}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '0.4rem' }}>
                      {log.details}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>
                      {new Date(log.created_at).toLocaleString('ru-RU')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {!loading && activeTab === 'stats' && stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              <button className={statsPeriod === 'today' ? 'primary' : 'secondary'} style={{ padding: '0.3rem 0.8rem', whiteSpace: 'nowrap', fontSize: '0.9rem' }} onClick={() => { setStatsPeriod('today'); setCustomStart(''); setCustomEnd(''); }}>Сегодня</button>
              <button className={statsPeriod === 'week' ? 'primary' : 'secondary'} style={{ padding: '0.3rem 0.8rem', whiteSpace: 'nowrap', fontSize: '0.9rem' }} onClick={() => { setStatsPeriod('week'); setCustomStart(''); setCustomEnd(''); }}>Неделя</button>
              <button className={statsPeriod === 'month' ? 'primary' : 'secondary'} style={{ padding: '0.3rem 0.8rem', whiteSpace: 'nowrap', fontSize: '0.9rem' }} onClick={() => { setStatsPeriod('month'); setCustomStart(''); setCustomEnd(''); }}>Месяц</button>
              <button className={statsPeriod === 'all' ? 'primary' : 'secondary'} style={{ padding: '0.3rem 0.8rem', whiteSpace: 'nowrap', fontSize: '0.9rem' }} onClick={() => { setStatsPeriod('all'); setCustomStart(''); setCustomEnd(''); }}>Всё время</button>
              <button className={statsPeriod === 'custom' ? 'primary' : 'secondary'} style={{ padding: '0.3rem 0.8rem', whiteSpace: 'nowrap', fontSize: '0.9rem' }} onClick={() => setStatsPeriod('custom')}>Период</button>
            </div>

            {statsPeriod === 'custom' && (
              <div className="glass-card" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.8rem', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>С даты:</span>
                  <input type="date" className="input" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ width: '100%', padding: '0.4rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>По дату:</span>
                  <input type="date" className="input" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ width: '100%', padding: '0.4rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                </div>
              </div>
            )}

            <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: '1 1 40%' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Выручка</div>
                <div style={{ fontSize: '1.5rem', color: 'var(--gold)' }}>$ {stats.total_revenue.toFixed(0)}</div>
              </div>
              <div style={{ flex: '1 1 40%' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Всего заказов</div>
                <div style={{ fontSize: '1.5rem' }}>{stats.total_orders}</div>
              </div>
              <div style={{ flex: '1 1 40%' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ожидают оплаты</div>
                <div style={{ fontSize: '1.5rem', color: 'orange' }}>{stats.pending_orders}</div>
              </div>
              <div style={{ flex: '1 1 40%' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Всего клиентов</div>
                <div style={{ fontSize: '1.5rem' }}>{stats.total_users}</div>
              </div>
            </div>

            {/* Infographics Line/Area Chart */}
            {(() => {
              const trend = stats.sales_trend || [];
              if (trend.length > 0) {
                const maxVal = Math.max(...trend.map(t => t.total), 100);
                const width = 500;
                const height = 150;
                const padding = 25;
                
                const points = trend.map((t, idx) => {
                  const x = padding + (idx / (trend.length - 1 || 1)) * (width - 2 * padding);
                  const y = height - padding - (t.total / maxVal) * (height - 2 * padding);
                  return { x, y, day: t.day, total: t.total };
                });

                const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const areaData = points.length > 0 
                  ? `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
                  : '';

                return (
                  <div className="glass-card" style={{ padding: '1rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--gold)', fontSize: '1rem' }}>График продаж (USD)</h3>
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '320px' }}>
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        
                        {areaData && <path d={areaData} fill="url(#chartGradient)" />}
                        {pathData && <path d={pathData} fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                        
                        {points.map((p, idx) => (
                          <g key={idx}>
                            <circle cx={p.x} cy={p.y} r="3.5" fill="#0D2818" stroke="var(--gold)" strokeWidth="1.5" />
                            {p.total > 0 && (
                              <text x={p.x} y={p.y - 8} textAnchor="middle" fill="var(--text)" fontSize="8" fontWeight="bold">
                                ${p.total}
                              </text>
                            )}
                            {idx % Math.ceil(trend.length / 5) === 0 && (
                              <text x={p.x} y={height - 5} textAnchor="middle" fill="var(--text-muted)" fontSize="8">
                                {p.day.substring(5)}
                              </text>
                            )}
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Popular Products Infographic Bar Chart */}
            {(() => {
              const products = stats.top_products || [];
              if (products.length > 0) {
                const maxQty = Math.max(...products.map(p => p.qty), 1);
                return (
                  <div className="glass-card" style={{ padding: '1rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--gold)', fontSize: '1rem' }}>Популярные товары (Инфографика)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {products.slice(0, 5).map((p, idx) => {
                        const pct = (p.qty / maxQty) * 100;
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                              <span style={{ color: 'var(--text)' }}>{p.name}</span>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>{p.qty} шт</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--green-accent), var(--gold))', borderRadius: '4px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="glass-card">
              <h3 style={{ marginBottom: '1rem', color: 'var(--gold)' }}>Продажи товаров</h3>
              {stats.top_products && stats.top_products.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {stats.top_products.map((p, i) => (
                    <div key={i} className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                      <span>{p.name}</span>
                      <b>{p.qty} шт</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Нет данных о продажах</p>
              )}
            </div>

            <div className="glass-card">
              <h3 style={{ marginBottom: '1rem', color: 'var(--gold)' }}>Рейтинг клиентов</h3>
              {stats.top_users && stats.top_users.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {stats.top_users.map((u, i) => (
                    <div 
                      key={i} 
                      className="flex-between page-transition" 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.1)', 
                        paddingBottom: '0.5rem', 
                        cursor: 'pointer',
                        transition: 'opacity 0.2s' 
                      }}
                      onClick={() => handleOpenClientCard(u)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>#{i+1}</span>
                        <span>{u.name} {u.username ? `(@${u.username})` : ''}</span>
                      </div>
                      <b style={{ color: 'var(--gold)' }}>$ {u.total.toFixed(0)}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Нет данных о клиентах</p>
              )}
            </div>
          </div>
      )}

      {!loading && activeTab === 'users' && (() => {
        const isOwner = [5082384607, 1005121723].includes(user?.id) || profile?.admin_permissions?.is_owner;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card">
              <h3 style={{ marginBottom: '1rem', color: 'var(--gold)' }}>Персональные скидки</h3>
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Укажите username пользователя (без @) и размер скидки. Скидка будет применяться ко всем его заказам.
              </p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const username = e.target.elements.username.value;
                const percent = parseInt(e.target.elements.percent.value) || 0;
                try {
                  const res = await api.adminSetDiscount(username, percent);
                  if (res.ok) {
                    alert(`Скидка ${percent}% успешно установлена для пользователя!`);
                    e.target.reset();
                  } else {
                    alert('Ошибка установки скидки');
                  }
                } catch (err) {
                  alert('Пользователь не найден или произошла ошибка');
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <input name="username" className="input" placeholder="Telegram Username (напр. ivan_ivanov)" required />
                <input name="percent" type="number" min="0" max="100" className="input" placeholder="Процент скидки (0 - 100)" required />
                <button type="submit" className="primary" style={{ marginTop: '0.5rem' }}>Сохранить скидку</button>
              </form>
            </div>

            <div className="glass-card">
              <h3 style={{ marginBottom: '1rem', color: 'var(--gold)' }}>Персональная партнерская программа (MLM)</h3>
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Укажите username пользователя (без @) и включите или отключите статус MLM-партнера. MLM-партнеры имеют 5 уровней реферальных начислений пожизненно.
              </p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const username = e.target.elements.partner_username.value;
                const isPartner = e.target.elements.is_partner_toggle.value === 'true';
                try {
                  const res = await api.adminSetPartner(username, isPartner);
                  if (res.ok) {
                    alert(`Статус MLM-партнера успешно ${isPartner ? 'включен' : 'выключен'} для пользователя!`);
                    e.target.reset();
                  } else {
                    alert('Ошибка установки статуса партнера');
                  }
                } catch (err) {
                  alert('Пользователь не найден или произошла ошибка');
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <input name="partner_username" className="input" placeholder="Telegram Username (напр. ivan_ivanov)" required />
                <select name="is_partner_toggle" className="input" required style={{ background: '#1c1c1e', color: 'var(--text-color)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '12px' }}>
                  <option value="true">Включить статус MLM-партнера</option>
                  <option value="false">Отключить статус MLM-партнера</option>
                </select>
                <button type="submit" className="primary" style={{ marginTop: '0.5rem' }}>Сохранить статус партнера</button>
              </form>
            </div>

            {isOwner && (
              <div className="glass-card">
                <h3 style={{ marginBottom: '1rem', color: 'var(--gold)' }}>Управление командой</h3>
                
                {/* List of members */}
                {teamMembers.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                    {teamMembers.map(m => (
                      <div key={m.id} className="flex-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.8rem 1rem', borderRadius: '12px' }}>
                        <div>
                          <b style={{ color: 'var(--gold)' }}>@{m.username}</b>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                            <span>Локация: {m.location_restriction === 'all' ? 'Все' : m.location_restriction === 'bali' ? 'Бали 🌴' : 'Вьетнам 🇻🇳'}</span>
                            •
                            <span>Редактирование: {m.can_edit_products ? 'Да' : 'Нет'}</span>
                            •
                            <span>Полный доступ: {m.has_full_access ? 'Да' : 'Нет'}</span>
                          </div>
                        </div>
                        <button 
                          className="icon-btn-delete" 
                          style={{ width: '32px', height: '32px', padding: 0 }} 
                          onClick={async () => {
                            if (!window.confirm(`Удалить @${m.username} из команды?`)) return;
                            try {
                              haptic.impact('medium');
                              await api.adminDeleteTeamMember(m.id);
                              loadData();
                              haptic.success();
                            } catch (err) {
                              console.error(err);
                              alert('Ошибка удаления участника');
                            }
                          }}
                          title="Удалить участника"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>В команде пока нет участников</p>
                )}

                {/* Add member form */}
                <h4 style={{ marginBottom: '0.8rem', fontSize: '1rem' }}>Добавить участника</h4>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const username = e.target.elements.member_username.value.trim().replace('@', '');
                  const loc = e.target.elements.member_location.value;
                  const canEdit = e.target.elements.member_can_edit.checked;
                  const fullAccess = e.target.elements.member_full_access.checked;

                  if (!username) return;

                  try {
                    haptic.impact('heavy');
                    await api.adminAddTeamMember({
                      username,
                      location_restriction: loc,
                      can_edit_products: canEdit,
                      has_full_access: fullAccess
                    });
                    e.target.reset();
                    loadData();
                    haptic.success();
                  } catch (err) {
                    console.error(err);
                    alert('Ошибка добавления участника');
                  }
                }} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <input name="member_username" className="input" placeholder="Telegram Username (напр. ivan_ivanov)" required />
                  
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Ограничение по локации:</label>
                    <select name="member_location" className="input" style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                      <option value="all">Все локации (Бали и Вьетнам)</option>
                      <option value="bali">Только Бали 🌴</option>
                      <option value="vietnam">Только Вьетнам 🇻🇳</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <input name="member_can_edit" type="checkbox" style={{ width: 'auto', marginBottom: 0 }} />
                      <span>Редактирование карточек</span>
                    </label>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <input name="member_full_access" type="checkbox" style={{ width: 'auto', marginBottom: 0 }} />
                      <span>Полный доступ</span>
                    </label>
                  </div>

                  <button type="submit" className="primary" style={{ marginTop: '0.5rem' }}>➕ Добавить в команду</button>
                </form>
              </div>
            )}
          </div>
        );
      })()}

      {!loading && activeTab === 'settings' && (() => {
          const activeStr = settings.active_payment_methods || 'usdt,idr,uah,vnd';
          const activeMethods = activeStr.split(',').filter(Boolean);
          const allMethods = ['usdt', 'idr', 'uah', 'vnd'];
          const inactiveMethods = allMethods.filter(m => !activeMethods.includes(m));

          const removeMethod = (m) => setSettings({ ...settings, active_payment_methods: activeMethods.filter(x => x !== m).join(',') });
          const addMethod = (m) => setSettings({ ...settings, active_payment_methods: [...activeMethods, m].join(',') });
          
          const toggleEdit = (m) => setEditingMethods(prev => ({ ...prev, [m]: !prev[m] }));
          
          const handleCopy = (text) => {
            if (!text) {
              alert('Нет реквизитов для копирования!');
              return;
            }
            navigator.clipboard.writeText(text).then(() => {
              haptic.success();
              alert('Скопировано в буфер обмена: ' + text);
            }).catch(e => {
              console.error(e);
              alert('Не удалось скопировать.');
            });
          };

          const handleSave = async (m) => {
            try {
              haptic.impact('heavy');
              await api.adminUpdateSettings(settings);
              alert('Настройки успешно сохранены!');
              if (m) {
                setEditingMethods(prev => ({ ...prev, [m]: false }));
              }
            } catch (e) {
              console.error(e);
              alert('Ошибка при сохранении настроек: ' + e.message);
            }
          };

          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '3rem' }}>
            {activeMethods.includes('idr') && (() => {
              const isEditing = !!editingMethods['idr'];
              return (
                <div className="glass-card" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                    {isEditing ? (
                      <input 
                        type="text" 
                        className="input-field" 
                        value={settings.idr_title || 'IDR (Индонезийская рупия)'} 
                        onChange={e => setSettings({...settings, idr_title: e.target.value})} 
                        style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold)', borderBottom: '1px solid var(--gold)', borderRadius: 0, padding: '0.2rem 0', background: 'transparent', margin: 0, flex: 1, minWidth: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', boxShadow: 'none' }} 
                      />
                    ) : (
                      <h3 style={{ margin: 0 }}>{settings.idr_title || 'IDR (Индонезийская рупия)'}</h3>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <button className="icon-btn-copy" onClick={() => handleCopy(settings.idr_account)} title="Копировать номер счета"><Copy size={14}/></button>
                      <button className="icon-btn-edit" onClick={() => toggleEdit('idr')} title="Редактировать" style={{ border: isEditing ? '2px solid var(--gold)' : '1px solid var(--gold)' }}><Pen size={14}/></button>
                      <button className="icon-btn-delete" onClick={() => removeMethod('idr')} title="Удалить"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <input type="text" className="input-field" placeholder="Название банка" value={settings.idr_bank || ''} onChange={e => setSettings({...settings, idr_bank: e.target.value})} disabled={!isEditing} style={{ marginBottom: '0.5rem', opacity: isEditing ? 1 : 0.8 }} />
                  <input type="text" className="input-field" placeholder="Номер счета" value={settings.idr_account || ''} onChange={e => setSettings({...settings, idr_account: e.target.value})} disabled={!isEditing} style={{ marginBottom: '0.5rem', opacity: isEditing ? 1 : 0.8 }} />
                  <input type="text" className="input-field" placeholder="Получатель" value={settings.idr_holder || ''} onChange={e => setSettings({...settings, idr_holder: e.target.value})} disabled={!isEditing} style={{ marginBottom: isEditing ? '0.8rem' : 0, opacity: isEditing ? 1 : 0.8 }} />
                  {isEditing && (
                    <button className="primary" onClick={() => handleSave('idr')} style={{ width: 'auto', padding: '0.5rem 1.5rem', fontSize: '0.9rem', marginBottom: 0 }}>
                      Сохранить
                    </button>
                  )}
                </div>
              );
            })()}

            {activeMethods.includes('usdt') && (() => {
              const isEditing = !!editingMethods['usdt'];
              return (
                <div className="glass-card" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                    {isEditing ? (
                      <input 
                        type="text" 
                        className="input-field" 
                        value={settings.usdt_title || 'USDT (Криптовалюта)'} 
                        onChange={e => setSettings({...settings, usdt_title: e.target.value})} 
                        style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold)', borderBottom: '1px solid var(--gold)', borderRadius: 0, padding: '0.2rem 0', background: 'transparent', margin: 0, flex: 1, minWidth: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', boxShadow: 'none' }} 
                      />
                    ) : (
                      <h3 style={{ margin: 0 }}>{settings.usdt_title || 'USDT (Криптовалюта)'}</h3>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <button className="icon-btn-copy" onClick={() => handleCopy(settings.usdt_address)} title="Копировать адрес"><Copy size={14}/></button>
                      <button className="icon-btn-edit" onClick={() => toggleEdit('usdt')} title="Редактировать" style={{ border: isEditing ? '2px solid var(--gold)' : '1px solid var(--gold)' }}><Pen size={14}/></button>
                      <button className="icon-btn-delete" onClick={() => removeMethod('usdt')} title="Удалить"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <input type="text" className="input-field" placeholder="Сеть (например, TRC-20)" value={settings.usdt_network || ''} onChange={e => setSettings({...settings, usdt_network: e.target.value})} disabled={!isEditing} style={{ marginBottom: '0.5rem', opacity: isEditing ? 1 : 0.8 }} />
                  <input type="text" className="input-field" placeholder="Адрес кошелька" value={settings.usdt_address || ''} onChange={e => setSettings({...settings, usdt_address: e.target.value})} disabled={!isEditing} style={{ marginBottom: isEditing ? '0.8rem' : 0, opacity: isEditing ? 1 : 0.8 }} />
                  {isEditing && (
                    <button className="primary" onClick={() => handleSave('usdt')} style={{ width: 'auto', padding: '0.5rem 1.5rem', fontSize: '0.9rem', marginBottom: 0 }}>
                      Сохранить
                    </button>
                  )}
                </div>
              );
            })()}

            {activeMethods.includes('uah') && (() => {
              const isEditing = !!editingMethods['uah'];
              return (
                <div className="glass-card" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                    {isEditing ? (
                      <input 
                        type="text" 
                        className="input-field" 
                        value={settings.uah_title || 'RUB (Российский рубль)'} 
                        onChange={e => setSettings({...settings, uah_title: e.target.value})} 
                        style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold)', borderBottom: '1px solid var(--gold)', borderRadius: 0, padding: '0.2rem 0', background: 'transparent', margin: 0, flex: 1, minWidth: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', boxShadow: 'none' }} 
                      />
                    ) : (
                      <h3 style={{ margin: 0 }}>{settings.uah_title || 'RUB (Российский рубль)'}</h3>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <button className="icon-btn-copy" onClick={() => handleCopy(settings.uah_card)} title="Копировать номер карты"><Copy size={14}/></button>
                      <button className="icon-btn-edit" onClick={() => toggleEdit('uah')} title="Редактировать" style={{ border: isEditing ? '2px solid var(--gold)' : '1px solid var(--gold)' }}><Pen size={14}/></button>
                      <button className="icon-btn-delete" onClick={() => removeMethod('uah')} title="Удалить"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <input type="text" className="input-field" placeholder="Реквизиты/Банк/СБП" value={settings.uah_bank || ''} onChange={e => setSettings({...settings, uah_bank: e.target.value})} disabled={!isEditing} style={{ marginBottom: '0.5rem', opacity: isEditing ? 1 : 0.8 }} />
                  <input type="text" className="input-field" placeholder="Номер карты/телефона" value={settings.uah_card || ''} onChange={e => setSettings({...settings, uah_card: e.target.value})} disabled={!isEditing} style={{ marginBottom: '0.5rem', opacity: isEditing ? 1 : 0.8 }} />
                  <input type="text" className="input-field" placeholder="Получатель" value={settings.uah_holder || ''} onChange={e => setSettings({...settings, uah_holder: e.target.value})} disabled={!isEditing} style={{ marginBottom: isEditing ? '0.8rem' : 0, opacity: isEditing ? 1 : 0.8 }} />
                  {isEditing && (
                    <button className="primary" onClick={() => handleSave('uah')} style={{ width: 'auto', padding: '0.5rem 1.5rem', fontSize: '0.9rem', marginBottom: 0 }}>
                      Сохранить
                    </button>
                  )}
                </div>
              );
            })()}

            {activeMethods.includes('vnd') && (() => {
              const isEditing = !!editingMethods['vnd'];
              return (
                <div className="glass-card" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                    {isEditing ? (
                      <input 
                        type="text" 
                        className="input-field" 
                        value={settings.vnd_title || 'VND (Вьетнамский донг)'} 
                        onChange={e => setSettings({...settings, vnd_title: e.target.value})} 
                        style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold)', borderBottom: '1px solid var(--gold)', borderRadius: 0, padding: '0.2rem 0', background: 'transparent', margin: 0, flex: 1, minWidth: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', boxShadow: 'none' }} 
                      />
                    ) : (
                      <h3 style={{ margin: 0 }}>{settings.vnd_title || 'VND (Вьетнамский донг)'}</h3>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <button className="icon-btn-copy" onClick={() => handleCopy(settings.vnd_account)} title="Копировать номер счета"><Copy size={14}/></button>
                      <button className="icon-btn-edit" onClick={() => toggleEdit('vnd')} title="Редактировать" style={{ border: isEditing ? '2px solid var(--gold)' : '1px solid var(--gold)' }}><Pen size={14}/></button>
                      <button className="icon-btn-delete" onClick={() => removeMethod('vnd')} title="Удалить"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <input type="text" className="input-field" placeholder="Способ перевода (WeChat/Alipay/Bank)" value={settings.vnd_method || ''} onChange={e => setSettings({...settings, vnd_method: e.target.value})} disabled={!isEditing} style={{ marginBottom: '0.5rem', opacity: isEditing ? 1 : 0.8 }} />
                  <input type="text" className="input-field" placeholder="Номер счета / ID" value={settings.vnd_account || ''} onChange={e => setSettings({...settings, vnd_account: e.target.value})} disabled={!isEditing} style={{ marginBottom: '0.5rem', opacity: isEditing ? 1 : 0.8 }} />
                  <input type="text" className="input-field" placeholder="Получатель" value={settings.vnd_holder || ''} onChange={e => setSettings({...settings, vnd_holder: e.target.value})} disabled={!isEditing} style={{ marginBottom: isEditing ? '0.8rem' : 0, opacity: isEditing ? 1 : 0.8 }} />
                  {isEditing && (
                    <button className="primary" onClick={() => handleSave('vnd')} style={{ width: 'auto', padding: '0.5rem 1.5rem', fontSize: '0.9rem', marginBottom: 0 }}>
                      Сохранить
                    </button>
                  )}
                </div>
              );
            })()}

            {activeMethods.map(m => {
              if (['idr', 'usdt', 'uah', 'vnd'].includes(m)) return null;
              const customTitleKey = `custom_method_${m}_title`;
              const customBankKey = `custom_method_${m}_bank`;
              const customNumberKey = `custom_method_${m}_number`;
              const customHolderKey = `custom_method_${m}_holder`;
              const isEditing = !!editingMethods[m];
              
              return (
                <div key={m} className="glass-card" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                    {isEditing ? (
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Название валюты/метода (например: BTC, EUR, Гривна)" 
                        value={settings[customTitleKey] || ''} 
                        onChange={e => setSettings({...settings, [customTitleKey]: e.target.value})} 
                        style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold)', borderBottom: '1px solid var(--gold)', borderRadius: 0, padding: '0.2rem 0', background: 'transparent', margin: 0, flex: 1, minWidth: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', boxShadow: 'none' }} 
                      />
                    ) : (
                      <h3 style={{ margin: 0, color: 'var(--gold)' }}>{settings[customTitleKey] || 'Метод оплаты'}</h3>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <button className="icon-btn-copy" onClick={() => handleCopy(settings[customNumberKey])} title="Копировать реквизиты"><Copy size={14}/></button>
                      <button className="icon-btn-edit" onClick={() => toggleEdit(m)} title="Редактировать" style={{ border: isEditing ? '2px solid var(--gold)' : '1px solid var(--gold)' }}><Pen size={14}/></button>
                      <button className="icon-btn-delete" onClick={() => removeMethod(m)} title="Удалить"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Платежная система или банк" 
                    value={settings[customBankKey] || ''} 
                    onChange={e => setSettings({...settings, [customBankKey]: e.target.value})} 
                    disabled={!isEditing}
                    style={{ marginBottom: '0.5rem', opacity: isEditing ? 1 : 0.8 }} 
                  />
                  
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Номер счета или адрес кошелька" 
                    value={settings[customNumberKey] || ''} 
                    onChange={e => setSettings({...settings, [customNumberKey]: e.target.value})} 
                    disabled={!isEditing}
                    style={{ marginBottom: '0.5rem', opacity: isEditing ? 1 : 0.8 }} 
                  />

                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Получатель" 
                    value={settings[customHolderKey] || ''} 
                    onChange={e => setSettings({...settings, [customHolderKey]: e.target.value})} 
                    disabled={!isEditing}
                    style={{ marginBottom: isEditing ? '0.8rem' : 0, opacity: isEditing ? 1 : 0.8 }}
                  />
                  
                  {isEditing && (
                    <button className="primary" onClick={() => handleSave(m)} style={{ width: 'auto', padding: '0.5rem 1.5rem', fontSize: '0.9rem', marginBottom: 0 }}>
                      Сохранить
                    </button>
                  )}
                </div>
              );
            })}

            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {inactiveMethods.map(m => (
                  <button key={m} className="secondary" onClick={() => addMethod(m)} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                    <Plus size={16} /> {m.toUpperCase()}
                  </button>
                ))}
                <button 
                  className="secondary" 
                  onClick={() => {
                    haptic.impact('light');
                    const uniqueId = 'c_' + Date.now().toString(36).slice(-4);
                    const updatedMethods = [...activeMethods, uniqueId].join(',');
                    setSettings(prev => ({
                      ...prev,
                      active_payment_methods: updatedMethods,
                      [`custom_method_${uniqueId}_title`]: 'Метод оплаты',
                      [`custom_method_${uniqueId}_bank`]: '',
                      [`custom_method_${uniqueId}_number`]: '',
                      [`custom_method_${uniqueId}_holder`]: ''
                    }));
                    setEditingMethods(prev => ({ ...prev, [uniqueId]: true }));
                  }} 
                  style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}
                >
                  <Plus size={16} /> Добавить метод оплаты
                </button>
              </div>
            </div>

            <button className="primary" style={{ marginTop: '1.5rem' }} onClick={() => handleSave()}>
              💾 Сохранить реквизиты
            </button>
          </div>
          );
      })()}

      {!loading && activeTab === 'referrals' && referralsData && (() => {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
            <div className="glass-card" style={{ border: '1px solid var(--glass-border)', padding: '1.2rem', borderRadius: '16px' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--gold)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                👥 Реферальная программа
              </h3>

              {/* Информационный блок с правилами */}
              <div style={{ marginBottom: '1.5rem' }}>
                <button 
                  type="button"
                  className="secondary" 
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.8rem 1rem', 
                    borderRadius: '12px', 
                    background: 'rgba(212, 175, 55, 0.08)', 
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: 'var(--gold-light)',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    haptic.impact('light');
                    setShowRules(!showRules);
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    ℹ️ Правила реферальной и MLM систем
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    {showRules ? '▲ Свернуть' : '▼ Подробнее о ступенях'}
                  </span>
                </button>

                {showRules && (
                  <div className="slide-up" style={{ 
                    marginTop: '0.6rem', 
                    padding: '1rem', 
                    background: 'rgba(0, 0, 0, 0.25)', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.8rem',
                    lineHeight: '1.5',
                    color: 'var(--text-muted)'
                  }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                        🌱 Обычная реферальная программа
                      </strong>
                      Применяется ко всем стандартным пользователям по умолчанию:
                      <ul style={{ margin: '0.3rem 0 0 1.2rem', padding: 0 }}>
                        <li>Начисление: <strong style={{ color: 'var(--text)' }}>{settings.referral_percent || '10'}%</strong> от суммы заказа.</li>
                        <li>Ограничение: бонусы выплачиваются <strong style={{ color: 'var(--text)' }}>только с первых 3-х заказов</strong> приглашенного друга.</li>
                        <li>Глубина сети: <strong style={{ color: 'var(--text)' }}>1-й уровень</strong> (только прямые рефералы).</li>
                      </ul>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.8rem' }}>
                      <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                        👑 MLM-партнерская программа (5 уровней)
                      </strong>
                      Включается для выбранных пользователей (статус «MLM Партнер» задается во вкладке «Пользователи»):
                      <ul style={{ margin: '0.3rem 0 0.5rem 1.2rem', padding: 0 }}>
                        <li>Начисления производятся со <strong style={{ color: 'var(--text)' }}>всех заказов пожизненно</strong> (без лимита на 3 заказа).</li>
                        <li>Распределение бонусов по <strong style={{ color: 'var(--text)' }}>5 уровням (ступеням) глубины</strong>:
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div>1️⃣ Уровень (прямые): <strong style={{ color: 'var(--gold)' }}>{settings.referral_percent || '10'}%</strong></div>
                            <div>2️⃣ Уровень: <strong style={{ color: 'var(--gold)' }}>3%</strong></div>
                            <div>3️⃣ Уровень: <strong style={{ color: 'var(--gold)' }}>2%</strong></div>
                            <div>4️⃣ Уровень: <strong style={{ color: 'var(--gold)' }}>1%</strong></div>
                            <div>5️⃣ Уровень: <strong style={{ color: 'var(--gold)' }}>1%</strong></div>
                          </div>
                        </li>
                      </ul>
                      <span style={{ fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                        * Для начисления бонусов со 2-5 уровней вышестоящие рефереры по цепочке также должны иметь статус MLM-партнера.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Настройки кэшбека */}
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Процент кэшбека пригласившему (%):</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input 
                        type="number" 
                        className="input-field" 
                        placeholder="Например: 10" 
                        value={settings.referral_percent || '10'} 
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setSettings({...settings, referral_percent: val});
                        }} 
                        style={{ marginBottom: 0, width: '90px', textAlign: 'center', fontWeight: 'bold' }} 
                      />
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold)' }}>%</span>
                    </div>
                    <button className="primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', marginLeft: 'auto', marginBottom: 0 }} onClick={async () => {
                      try {
                        haptic.impact('heavy');
                        await api.adminUpdateSettings({ referral_percent: settings.referral_percent });
                        alert('Процент реферального кэшбека сохранен!');
                      } catch (e) {
                        console.error(e);
                        alert('Ошибка сохранения');
                      }
                    }}>
                      💾 Сохранить
                    </button>
                  </div>
                </div>
              </div>

              {/* Настройки ИИ-Проводника */}
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--gold)', fontSize: '0.95rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🧠 Инструкции и обучение ИИ-Проводника
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Голос озвучки ответов (OpenAI TTS Voice):
                    </label>
                    <select 
                      className="input-field" 
                      value={settings.ai_voice || 'nova'} 
                      onChange={e => setSettings({...settings, ai_voice: e.target.value})}
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.5rem', width: '100%', color: 'var(--text)', outline: 'none' }}
                    >
                      <option value="nova">Nova (Женский, энергичный - Рекомендуется)</option>
                      <option value="shimmer">Shimmer (Женский, мягкий)</option>
                      <option value="alloy">Alloy (Нейтральный)</option>
                      <option value="echo">Echo (Мужской, мягкий)</option>
                      <option value="fable">Fable (Нейтральный, выразительный)</option>
                      <option value="onyx">Onyx (Мужской, глубокий)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Дополнительные инструкции и правила для обучения ИИ (Prompts):
                    </label>
                    <textarea 
                      className="input-field" 
                      rows="6" 
                      placeholder="Например: Отвечай только на русском языке. Всегда предлагай чай Рапэ Самаума в конце разговора. Упоминай, что доставка по Бали бесплатная..."
                      value={settings.ai_custom_instructions || ''} 
                      onChange={e => setSettings({...settings, ai_custom_instructions: e.target.value})}
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.6rem', width: '100%', outline: 'none', color: 'var(--text)', fontFamily: 'inherit' }}
                    />
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0', fontStyle: 'italic' }}>
                      ИИ также автоматически считывает все активные товары из каталога и ваши статьи/инструкции!
                    </p>
                  </div>

                  <button className="primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', width: '100%', marginBottom: 0 }} onClick={async () => {
                    try {
                      haptic.impact('heavy');
                      await api.adminUpdateSettings({ 
                        ai_custom_instructions: settings.ai_custom_instructions || '',
                        ai_voice: settings.ai_voice || 'nova'
                      });
                      alert('Настройки ИИ успешно сохранены и применены!');
                    } catch (e) {
                      console.error(e);
                      alert('Ошибка при сохранении настроек ИИ');
                    }
                  }}>
                    💾 Сохранить и обучить ИИ
                  </button>
                </div>
              </div>

              {/* Поиск ссылки пользователя */}
              <div>
                <h4 style={{ color: 'var(--gold)', fontSize: '0.95rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🔗 Ссылка и статистика пользователя
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.4' }}>
                  Введите юзернейм Telegram (без @), чтобы получить реферальную ссылку и подробную историю приглашений.
                </p>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const username = e.target.elements.username.value;
                  try {
                    const res = await api.adminGetUserReferral(username);
                    if (res.ok) {
                      setFoundUserLink(res.referral_link);
                      setFoundUserName(res.full_name || res.username);
                      
                      // Находим этого пользователя в общем списке статистики для отображения расширенных данных
                      const refStats = referralsData.referrers?.find(r => r.id === res.user_id) || {
                        invitees_count: 0,
                        total_earned: 0.0,
                        bonus_balance: 0.0,
                        invitees: []
                      };
                      setFoundUserStats(refStats);
                    } else {
                      alert('Пользователь не найден');
                    }
                  } catch (err) {
                    alert('Пользователь не найден или произошла ошибка');
                  }
                }} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input name="username" className="input" placeholder="Telegram Username (напр. ivan_ivanov)" required style={{ marginBottom: 0, flex: 1 }} />
                  <button type="submit" className="primary" style={{ marginBottom: 0, padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>🔍 Получить</button>
                </form>

                {foundUserLink && (
                  <div style={{ marginTop: '1.2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.6rem' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{foundUserName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Реферальная ссылка:</div>
                      </div>
                      <button 
                        className="secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginBottom: 0 }} 
                        onClick={() => {
                          navigator.clipboard.writeText(foundUserLink);
                          haptic.impact('medium');
                          alert('Ссылка скопирована!');
                        }}
                      >
                        📋 Копировать
                      </button>
                    </div>
                    <div style={{ wordBreak: 'break-all', fontSize: '0.8rem', color: 'var(--gold)', marginBottom: '1rem', fontWeight: '500' }}>
                      {foundUserLink}
                    </div>

                    {foundUserStats && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.8rem' }}>
                          <div>Приглашено: <strong style={{ color: 'var(--text)' }}>{foundUserStats.invitees_count} чел.</strong></div>
                          <div>Бонусы: <strong style={{ color: 'var(--gold)' }}>${foundUserStats.bonus_balance.toFixed(2)}</strong></div>
                          <div>Заработано: <strong style={{ color: 'var(--gold)' }}>${foundUserStats.total_earned.toFixed(2)}</strong></div>
                        </div>

                        {foundUserStats.invitees && foundUserStats.invitees.length > 0 && (
                          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '500' }}>Приглашенные друзья:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto' }}>
                              {foundUserStats.invitees.map(inv => (
                                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)' }}>
                                  <span>{inv.full_name} {inv.username && `@${inv.username}`}</span>
                                  <span style={{ color: 'var(--text-muted)' }}>
                                    {inv.created_at} | <span style={{ color: 'var(--gold)' }}>+${inv.earned.toFixed(2)}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.2rem', borderRadius: '16px' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--gold)', fontSize: '1.1rem' }}>
                📊 Активные пригласители ({referralsData.referrers?.length || 0})
              </h3>
              {(() => {
                const referrers = referralsData.referrers || [];
                const totalCount = referrers.length;
                const standardCount = referrers.filter(r => !r.is_partner).length;
                const mlmCount = referrers.filter(r => r.is_partner).length;

                const filteredReferrers = referrers.filter(ref => {
                  if (referrerFilter === 'standard') return !ref.is_partner;
                  if (referrerFilter === 'mlm') return ref.is_partner;
                  return true;
                });

                if (totalCount === 0) {
                  return <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Пока нет пользователей с приглашениями.</p>;
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => { haptic.impact('light'); setReferrerFilter('all'); }} 
                        className={referrerFilter === 'all' ? 'primary' : 'secondary'}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '20px', marginBottom: 0 }}
                      >
                        Все ({totalCount})
                      </button>
                      <button 
                        onClick={() => { haptic.impact('light'); setReferrerFilter('standard'); }} 
                        className={referrerFilter === 'standard' ? 'primary' : 'secondary'}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '20px', marginBottom: 0 }}
                      >
                        🌱 Стандартная ({standardCount})
                      </button>
                      <button 
                        onClick={() => { haptic.impact('light'); setReferrerFilter('mlm'); }} 
                        className={referrerFilter === 'mlm' ? 'primary' : 'secondary'}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '20px', marginBottom: 0 }}
                      >
                        👑 MLM Партнеры ({mlmCount})
                      </button>
                    </div>

                    {filteredReferrers.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Пользователей не найдено.</p>
                    ) : (
                      filteredReferrers.map((ref, idx) => (
                        <div key={ref.id} style={{ 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid var(--glass-border)', 
                          borderRadius: '12px', 
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.8rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', color: 'var(--text)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {ref.full_name} {ref.username && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@{ref.username}</span>}
                                {ref.is_partner ? (
                                  <span style={{ 
                                    fontSize: '0.65rem', 
                                    padding: '0.05rem 0.35rem', 
                                    borderRadius: '4px', 
                                    background: 'rgba(201,168,76,0.15)', 
                                    color: 'var(--gold)',
                                    fontWeight: '500'
                                  }}>
                                    👑 MLM Партнер
                                  </span>
                                ) : (
                                  <span style={{ 
                                    fontSize: '0.65rem', 
                                    padding: '0.05rem 0.35rem', 
                                    borderRadius: '4px', 
                                    background: 'rgba(64,145,108,0.15)', 
                                    color: '#40916c',
                                    fontWeight: '500'
                                  }}>
                                    🌱 Стандартная
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                Код: <code>{ref.referral_code}</code> | ID: {ref.id}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.95rem', color: 'var(--gold)', fontWeight: 'bold' }}>${ref.total_earned.toFixed(2)}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>заработано</div>
                            </div>
                          </div>

                          <div 
                            onClick={() => {
                              haptic.impact('light');
                              setExpandedReferrers(prev => ({ ...prev, [ref.id]: !prev[ref.id] }));
                            }}
                            style={{ 
                              display: 'flex', 
                              gap: '1rem', 
                              borderTop: '1px solid rgba(255,255,255,0.05)', 
                              paddingTop: '0.6rem', 
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Приглашено:</span>{' '}
                              <strong style={{ color: 'var(--text)' }}>{ref.invitees_count} чел.</strong>
                              {ref.invitees && ref.invitees.length > 0 && (
                                <span style={{ color: 'var(--gold)', fontSize: '0.75rem', marginLeft: '0.4rem', fontWeight: 'bold' }}>
                                  {expandedReferrers[ref.id] ? '▲' : '▼'}
                                </span>
                              )}
                            </div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Баланс бонусов:</span>{' '}
                              <strong style={{ color: 'var(--gold)' }}>${ref.bonus_balance.toFixed(2)}</strong>
                            </div>
                          </div>

                          {ref.invitees && ref.invitees.length > 0 && expandedReferrers[ref.id] && (
                            <div className="slide-up" style={{ background: 'rgba(0,0,0,0.15)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                              <div style={{ color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '500' }}>Приглашенные друзья:</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {ref.invitees.map(inv => (
                                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)' }}>
                                    <span>
                                      {inv.full_name} {inv.username && `@${inv.username}`}
                                      {ref.is_partner && inv.level && (
                                        <span style={{ 
                                          fontSize: '0.65rem', 
                                          padding: '0.05rem 0.2rem', 
                                          borderRadius: '3px', 
                                          background: 'rgba(201,168,76,0.1)', 
                                          color: 'var(--gold)',
                                          marginLeft: '0.4rem'
                                        }}>
                                          L{inv.level}
                                        </span>
                                      )}
                                      {!ref.is_partner && (
                                        <span style={{ 
                                          fontSize: '0.65rem', 
                                          padding: '0.05rem 0.2rem', 
                                          borderRadius: '3px', 
                                          background: 'rgba(64,145,108,0.1)', 
                                          color: '#40916c',
                                          marginLeft: '0.4rem'
                                        }}>
                                          Заказов: {inv.orders_count}/3
                                        </span>
                                      )}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)' }}>
                                      {inv.created_at} | <span style={{ color: 'var(--gold)' }}>+${inv.earned.toFixed(2)}</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* Global Order Details Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem 1rem',
          overflowY: 'auto'
        }} onClick={() => setSelectedOrder(null)}>
          <div className="glass-card slide-up" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '1.5rem',
            border: '1px solid var(--gold)',
            position: 'relative',
            marginBottom: '2rem'
          }} onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button className="icon-btn secondary" style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={() => setSelectedOrder(null)}>
              <X size={20} />
            </button>

            {/* Header */}
            <h3 style={{ color: 'var(--gold)', fontSize: '1.25rem', marginBottom: '1.2rem', marginTop: 0 }}>
              Детали заказа #{selectedOrder.id}
            </h3>

            {/* General Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Статус:</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: selectedOrder.status === 'pending' ? '#f97316' : 
                         selectedOrder.status === 'paid' ? '#eab308' :
                         selectedOrder.status === 'confirmed' ? '#38bdf8' :
                         selectedOrder.status === 'shipped' ? '#a855f7' :
                         selectedOrder.status === 'done' ? '#22c55e' : '#ef4444'
                }}>
                  {selectedOrder.status_display}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Локация:</span>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>
                  {selectedOrder.location === 'bali' ? '🌴 Бали' : selectedOrder.location === 'vietnam' ? '🇻🇳 Вьетнам' : 'Везде'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Дата:</span>
                <span style={{ color: '#fff' }}>
                  {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('ru-RU') : '—'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Сумма к оплате:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--gold)' }}>
                  {selectedOrder.currency.toUpperCase()} {selectedOrder.total_in_currency}
                </span>
              </div>
            </div>

            {/* Customer Details Block */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1.2rem' }}>
              <h4 style={{ color: 'var(--gold)', fontSize: '0.9rem', marginTop: 0, marginBottom: '0.8rem' }}>Данные клиента</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Получатель:</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedOrder.recipient_name || '—'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Telegram-профиль:</span>
                  {selectedOrder.customer_details?.username ? (
                    <a 
                      href={`https://t.me/${selectedOrder.customer_details.username}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: '#38bdf8', textDecoration: 'underline' }}
                    >
                      @{selectedOrder.customer_details.username}
                    </a>
                  ) : (
                    <span style={{ color: '#fff' }}>{selectedOrder.customer_details?.full_name || '—'}</span>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Telegram ID:</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fff' }}>
                    {selectedOrder.customer_details?.id || selectedOrder.user_id}
                    <button 
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.customer_details?.id || selectedOrder.user_id);
                        haptic.notification('success');
                        alert('Telegram ID скопирован в буфер обмена');
                      }}
                    >
                      <Copy size={12} color="var(--gold)" />
                    </button>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Телефон:</span>
                  {selectedOrder.phone ? (
                    <a href={`tel:${selectedOrder.phone}`} style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                      {selectedOrder.phone}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>не указан</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Адрес доставки:</span>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px' }}>
                    <span style={{ color: '#fff', fontSize: '0.8rem', flex: 1, wordBreak: 'break-word' }}>
                      {selectedOrder.address || 'Самовывоз / Не указан'}
                    </span>
                    {selectedOrder.address && (
                      <button 
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOrder.address);
                          haptic.notification('success');
                          alert('Адрес доставки скопирован');
                        }}
                      >
                        <Copy size={12} color="var(--gold)" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1.2rem' }}>
              <h4 style={{ color: 'var(--gold)', fontSize: '0.9rem', marginTop: 0, marginBottom: '0.8rem' }}>Состав заказа</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {selectedOrder.items && selectedOrder.items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: index < selectedOrder.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1, marginRight: '0.5rem' }}>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>{item.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Вариант: {item.variant || 'Стандарт'}</span>
                    </div>
                    <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{item.qty} шт. × </span>
                      <span style={{ color: 'var(--gold)' }}>${parseFloat(item.price_usd).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.8rem', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <span style={{ color: 'var(--text-muted)' }}>Итого в USD:</span>
                <span style={{ color: 'var(--gold)' }}>${parseFloat(selectedOrder.total_usd).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions / Status changes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Изменить статус заказа:</span>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {selectedOrder.status !== 'pending' && (
                  <button 
                    className="secondary" 
                    style={{ flex: '1 1 45%', padding: '0.5rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }} 
                    onClick={async () => {
                      await updateOrderStatus(selectedOrder.id, 'pending');
                      setSelectedOrder(prev => ({ ...prev, status: 'pending', status_display: '⏳ Ожидает оплаты' }));
                    }}
                  >
                    ⏳ Ожидает
                  </button>
                )}
                {selectedOrder.status !== 'paid' && (
                  <button 
                    className="secondary" 
                    style={{ flex: '1 1 45%', padding: '0.5rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }} 
                    onClick={async () => {
                      await updateOrderStatus(selectedOrder.id, 'paid');
                      setSelectedOrder(prev => ({ ...prev, status: 'paid', status_display: '💰 Оплата получена' }));
                    }}
                  >
                    💰 Оплачен
                  </button>
                )}
                {selectedOrder.status !== 'confirmed' && (
                  <button 
                    className="secondary" 
                    style={{ flex: '1 1 45%', padding: '0.5rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }} 
                    onClick={async () => {
                      await updateOrderStatus(selectedOrder.id, 'confirmed');
                      setSelectedOrder(prev => ({ ...prev, status: 'confirmed', status_display: '✅ Подтверждён' }));
                    }}
                  >
                    ✅ Принят
                  </button>
                )}
                {selectedOrder.status !== 'shipped' && (
                  <button 
                    className="secondary" 
                    style={{ flex: '1 1 45%', padding: '0.5rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }} 
                    onClick={async () => {
                      await updateOrderStatus(selectedOrder.id, 'shipped');
                      setSelectedOrder(prev => ({ ...prev, status: 'shipped', status_display: '🚚 Отправлен' }));
                    }}
                  >
                    🚚 Отправлен
                  </button>
                )}
                {selectedOrder.status !== 'done' && (
                  <button 
                    className="primary" 
                    style={{ flex: '1 1 45%', padding: '0.5rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }} 
                    onClick={async () => {
                      await updateOrderStatus(selectedOrder.id, 'done');
                      setSelectedOrder(prev => ({ ...prev, status: 'done', status_display: '🎉 Завершён' }));
                    }}
                  >
                    🎉 Выполнен
                  </button>
                )}
                {selectedOrder.status !== 'cancelled' && (
                  <button 
                    className="secondary" 
                    style={{ flex: '1 1 45%', padding: '0.5rem', fontSize: '0.8rem', color: '#ff4d4f', borderColor: 'rgba(255,77,79,0.2)', whiteSpace: 'nowrap' }} 
                    onClick={async () => {
                      if (window.confirm('Точно отменить этот заказ?')) {
                        await updateOrderStatus(selectedOrder.id, 'cancelled');
                        setSelectedOrder(prev => ({ ...prev, status: 'cancelled', status_display: '❌ Отменён' }));
                      }
                    }}
                  >
                    ❌ Отменить
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Client Card Modal */}
      {selectedClient && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 9998,
          padding: '2rem 1rem',
          overflowY: 'auto'
        }} onClick={() => setSelectedClient(null)}>
          <div className="glass-card slide-up" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '1.5rem',
            border: '1px solid var(--gold)',
            position: 'relative',
            marginBottom: '2rem'
          }} onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button className="icon-btn secondary" style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={() => setSelectedClient(null)}>
              <X size={20} />
            </button>

            {/* Header */}
            <h3 style={{ color: 'var(--gold)', fontSize: '1.25rem', marginBottom: '1.2rem', marginTop: 0 }}>
              Карточка клиента
            </h3>

            {/* Client Info Block */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1.2rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Имя:</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedClient.name}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Telegram-профиль:</span>
                  {selectedClient.username ? (
                    <a 
                      href={`https://t.me/${selectedClient.username}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: '#38bdf8', textDecoration: 'underline' }}
                    >
                      @{selectedClient.username}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>нет username</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Telegram ID:</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fff' }}>
                    {selectedClient.id}
                    <button 
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => {
                        navigator.clipboard.writeText(selectedClient.id);
                        haptic.notification('success');
                        alert('Telegram ID скопирован');
                      }}
                    >
                      <Copy size={12} color="var(--gold)" />
                    </button>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Всего покупок:</span>
                  <b style={{ color: 'var(--gold)' }}>$ {selectedClient.total.toFixed(0)}</b>
                </div>
              </div>
            </div>

            {/* History of Orders Block */}
            <h4 style={{ color: 'var(--gold)', fontSize: '0.95rem', marginTop: 0, marginBottom: '0.8rem' }}>История заказов</h4>
            
            {loadingClientOrders ? (
              <div className="spinner" style={{ margin: '1rem auto' }}></div>
            ) : selectedClientOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Заказы отсутствуют</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {selectedClientOrders.map(o => (
                  <div 
                    key={o.id} 
                    className="glass-card page-transition" 
                    style={{ 
                      padding: '0.8rem',
                      borderLeft: o.status === 'pending' ? '3px solid orange' : 
                                 o.status === 'paid' ? '3px solid gold' :
                                 o.status === 'confirmed' ? '3px solid #38bdf8' :
                                 o.status === 'shipped' ? '3px solid #a855f7' :
                                 o.status === 'done' ? '3px solid #22c55e' : '3px solid #ef4444',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                    onClick={() => { setSelectedOrder(o); haptic.impact('light'); }}
                  >
                    <div className="flex-between" style={{ marginBottom: '0.3rem' }}>
                      <b>Заказ #{o.id}</b>
                      <span style={{ 
                        color: o.status === 'pending' ? '#f97316' : 
                               o.status === 'paid' ? '#eab308' :
                               o.status === 'confirmed' ? '#38bdf8' :
                               o.status === 'shipped' ? '#a855f7' :
                               o.status === 'done' ? '#22c55e' : '#ef4444'
                      }}>
                        {o.status_display}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('ru-RU') : '—'} • {o.currency.toUpperCase()} {o.total_in_currency} (${o.total_usd})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
