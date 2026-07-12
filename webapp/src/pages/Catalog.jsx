import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';
import { Edit2, Trash2, Plus, Eye, EyeOff } from 'lucide-react';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, haptic } = useTelegram();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const activeCategory = searchParams.get('cat');
  const isAdmin = [5082384607, 1005121723].includes(user?.id) || profile?.is_admin;

  useEffect(() => {
    api.getProfile().then(setProfile).catch(console.error);
  }, []);

  useEffect(() => {
    Promise.all([
      api.getCategories(),
      api.getProducts(activeCategory ? { category: activeCategory } : {})
    ])
      .then(([c, p]) => {
        setCategories([{ name: 'Все', slug: '' }, { name: '🏷️ Акции', slug: 'sale' }, ...c]);
        setProducts(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div className="container page-transition">
      <h2 style={{ marginBottom: '1rem' }}>📦 Каталог</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.2rem' }}>
        {categories.map(c => (
          <button
            key={c.slug || 'all'}
            className={c.slug === (activeCategory || '') ? 'primary' : 'secondary'}
            style={{ whiteSpace: 'nowrap', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}
            onClick={() => setSearchParams(c.slug ? { cat: c.slug } : {})}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="responsive-products-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-card" style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
              <div className="skeleton" style={{ height: '120px', borderRadius: '12px', marginBottom: '1rem' }}></div>
              <div className="skeleton" style={{ height: '20px', width: '80%', marginBottom: '0.5rem' }}></div>
              <div className="skeleton" style={{ height: '24px', width: '50%' }}></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <span style={{ fontSize: '3rem' }}>😔</span>
          <p style={{ marginTop: '1rem' }}>В этой категории пока нет товаров</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(
            products.reduce((acc, p) => {
              const cat = p.category_name || 'Прочее';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(p);
              return acc;
            }, {})
          ).map(([categoryName, catProducts]) => (
            <div key={categoryName}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--gold)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>{categoryName}</h3>
              <div className="responsive-products-grid" style={{ marginTop: 0 }}>
                {catProducts.map(p => (
                  <Link to={`/product/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', opacity: p.in_stock ? 1 : 0.65 }}>
                      {isAdmin && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px', zIndex: 10 }}>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                haptic.impact('medium');
                                await api.adminToggleProduct(p.id);
                                // Refresh products list
                                const updatedProducts = await api.getProducts(activeCategory ? { category: activeCategory } : {});
                                setProducts(updatedProducts);
                                haptic.success();
                              } catch (err) {
                                console.error(err);
                                alert('Ошибка при переключении видимости');
                              }
                            }}
                            style={{
                              background: p.in_stock ? 'rgba(74,117,89,0.85)' : 'rgba(255,255,255,0.08)',
                              border: p.in_stock ? '1px solid #52c41a' : '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: p.in_stock ? '#fff' : 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 0,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                            }}
                            title={p.in_stock ? 'Скрыть товар' : 'Показать товар'}
                          >
                            {p.in_stock ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              haptic.impact('medium');
                              navigate(`/product/${p.id}?edit=true`);
                            }}
                            style={{
                              background: 'rgba(27,67,50,0.85)',
                              border: '1px solid var(--gold)',
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--gold)',
                              cursor: 'pointer',
                              padding: 0,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (window.confirm('Точно удалить этот товар?')) {
                                try {
                                  haptic.impact('heavy');
                                  await api.adminDeleteProduct(p.id);
                                  // Refresh products list
                                  const updatedProducts = await api.getProducts(activeCategory ? { category: activeCategory } : {});
                                  setProducts(updatedProducts);
                                  haptic.success();
                                } catch (err) {
                                  console.error(err);
                                  alert('Ошибка при удалении товара');
                                }
                              }
                            }}
                            style={{
                              background: 'rgba(255,77,79,0.85)',
                              border: '1px solid #ff4d4f',
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              cursor: 'pointer',
                              padding: 0,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      <div style={{ 
                        background: 'var(--green-mid)', 
                        borderRadius: '12px', 
                        height: '120px', 
                        marginBottom: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '3rem',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        {p.photo_url ? (
                          <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{opacity: 0.5}}>📦</span>
                        )}
                        {p.is_sale && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)',
                            color: '#000',
                            fontWeight: '900',
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                            zIndex: 5
                          }}>
                            -{p.discount_percent}%
                          </div>
                        )}
                      </div>
                      <h3 style={{ fontSize: '0.95rem', color: 'var(--text)', flex: 1, marginBottom: '0.5rem' }}>{p.name}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {p.is_sale && p.old_price_display && (
                          <span style={{ textDecoration: 'line-through', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal', marginBottom: '0.1rem' }}>
                            {p.old_price_display}
                          </span>
                        )}
                        <div style={{ fontWeight: 'bold', color: 'var(--gold)', fontSize: '1.1rem', lineHeight: 1.1 }}>{p.price_display}</div>
                      </div>
                    </div>
                  </Link>
                ))}
                {isAdmin && (() => {
                  const catObj = categories.find(c => c.name === categoryName);
                  const catSlug = catObj ? catObj.slug : (catProducts[0]?.category_slug || 'rape');
                  return (
                    <Link 
                      to={`/admin?tab=products&add=true&cat_slug=${catSlug}&cat_name=${categoryName}`}
                      style={{ textDecoration: 'none' }}
                    >
                    <div 
                      className="glass-card" 
                      style={{ 
                        height: '100%', 
                        minHeight: '220px',
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '2px dashed var(--gold)',
                        background: 'rgba(201,168,76,0.05)',
                        cursor: 'pointer'
                      }}
                      onClick={() => haptic.impact('medium')}
                    >
                      <Plus size={32} style={{ color: 'var(--gold)', marginBottom: '0.5rem' }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 'bold' }}>
                        Добавить товар
                      </span>
                    </div>
                  </Link>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
