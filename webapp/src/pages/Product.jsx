import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Edit2, Check, Upload, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';

export default function Product({ updateCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { haptic, user, showAlert } = useTelegram();
  const fileInputRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [profile, setProfile] = useState(null);
  
  const isOwner = [5082384607, 1005121723].includes(user?.id);
  const canEdit = isOwner || (profile?.admin_permissions?.can_edit_products || profile?.admin_permissions?.has_full_access);
  const isLocationAllowed = !profile?.admin_permissions?.location_restriction || 
                            profile.admin_permissions.location_restriction === 'all' || 
                            product?.location === 'all' || 
                            product?.location === profile.admin_permissions.location_restriction;
  const canEditProduct = canEdit && isLocationAllowed;

  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [variantIndex, setVariantIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [crossSellProducts, setCrossSellProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [activeEditVariantIdx, setActiveEditVariantIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0); // scroll to top when id changes
    api.getProfile().then(setProfile).catch(console.error);
    api.getProduct(id)
      .then(async (p) => {
        setProduct(p);
        // Fetch products for recommendations
        try {
          const allProds = await api.getProducts();
          setSimilarProducts(allProds.filter(x => x.id !== p.id && x.category_slug === p.category_slug).slice(0, 4));
          
          let cross = [];
          if (p.category_slug === 'rape') {
            cross = allProds.filter(x => x.category_slug !== 'rape' && (x.name.toLowerCase().includes('курипи') || x.category_slug === 'accessories' || x.category_slug === 'oils'));
          } else if (p.category_slug === 'mushrooms') {
            cross = allProds.filter(x => x.category_slug !== 'mushrooms' && (x.name.toLowerCase().includes('cbd') || x.category_slug === 'oils'));
          } else {
            cross = allProds.filter(x => x.id !== p.id && (x.category_slug === 'rape' || x.category_slug === 'mushrooms'));
          }
          setCrossSellProducts(cross.slice(0, 3));
        } catch (e) {
          console.error(e);
        }
        
        // If edit=true is present in the URL parameters, start editing immediately
        const editParam = new URLSearchParams(window.location.search).get('edit');
        if (editParam === 'true') {
          setEditData({
            name: p.name,
            description: p.description,
            photo_url: p.photo_url,
            in_stock: p.in_stock,
            location: p.location || 'all',
            variants: JSON.parse(JSON.stringify(p.variants || []))
          });
          setIsEditing(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    haptic.impact('medium');
    navigate(`/checkout?ref_id=${product.id}&ref_photo=${encodeURIComponent(product.photo_url)}&ref_title=${encodeURIComponent(product.name)}`);
  };

  const handleQuickAdd = async (prodId) => {
    const targetProd = [...crossSellProducts, ...similarProducts].find(x => x.id === prodId);
    if (targetProd) {
      const userLoc = profile?.location || 'bali';
      const availableStock = userLoc === 'vietnam' ? (targetProd.stock_vietnam ?? 0) : (targetProd.stock_bali ?? 0);
      const isWeight = targetProd.is_weight_based ?? true;
      const firstVariant = targetProd.variants?.[0] || {};
      const weightQty = firstVariant.weight_qty ?? (isWeight ? (parseFloat(firstVariant.name) || 1) : 1);
      
      if (!targetProd.in_stock || availableStock < weightQty) {
        showAlert('К сожалению, этого товара сейчас нет в наличии');
        return;
      }
    }
    
    try {
      haptic.impact('medium');
      await api.addToCart(prodId, 0, 1);
      haptic.success();
      showAlert('Товар добавлен в корзину!');
      if (typeof updateCart === 'function') {
        updateCart();
      }
    } catch (e) {
      console.error(e);
      showAlert('Ошибка при добавлении товара');
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setEditData({
        name: product.name,
        description: product.description,
        photo_url: product.photo_url,
        in_stock: product.in_stock,
        location: product.location || 'all',
        variants: JSON.parse(JSON.stringify(product.variants || [])),
        is_sale: product.is_sale || false,
        discount_percent: product.discount_percent || 0
      });
      setIsEditing(true);
      setActiveEditVariantIdx(0);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await api.adminUpdateProduct(product.id, editData);
      setProduct(updated);
      setIsEditing(false);
      haptic.success();
    } catch (e) {
      console.error(e);
      haptic.error();
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSaving(true);
      const res = await api.adminUploadImage(file);
      setEditData(prev => ({ ...prev, photo_url: res.url }));
      haptic.success();
    } catch (err) {
      console.error(err);
      haptic.error();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner"></div>;
  if (!product) return <div className="container"><p>Товар не найден</p></div>;

  return (
    <div className="page-transition">
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(27, 67, 50, 0.95)',
          border: '1px solid var(--gold)',
          borderRadius: '12px',
          padding: '0.8rem 1.2rem',
          color: '#fff',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)',
          animation: 'fade-in 0.3s ease-out',
          whiteSpace: 'nowrap'
        }}>
          <span style={{ color: 'var(--gold)', fontSize: '1.2rem' }}>🌿</span>
          <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Товар добавлен в корзину!</span>
        </div>
      )}
      {/* Sticky Back Button */}
      <div style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 100 }}>
        <button 
          className="icon-btn" 
          onClick={() => navigate(-1)} 
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: 'white', border: 'none', width: '40px', height: '40px' }}
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div style={{ 
        width: '100%', height: '300px', 
        background: 'var(--green-mid)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '6rem', overflow: 'hidden', position: 'relative'
      }}>
        {isEditing ? (
          <>
            {editData.photo_url ? (
              <img src={editData.photo_url} alt="edit" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : '📦'}
            <div 
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={40} color="white" />
            </div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
          </>
        ) : (
          <>
            {product.photo_url ? (
              <img src={product.photo_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : '📦'}
            {product.is_sale && (
              <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)',
                color: '#000',
                fontWeight: '900',
                fontSize: '0.95rem',
                padding: '0.35rem 0.7rem',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 5
              }}>
                -{product.discount_percent}%
              </div>
            )}
          </>
        )}
      </div>

      <div className="container" style={{ marginTop: '-20px', position: 'relative', zIndex: 10 }}>
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '1rem' }}>
            {isEditing ? (
              <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ flex: 1, marginRight: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }} />
            ) : (
              <h1 style={{ fontSize: '1.4rem', flex: 1, marginRight: '1rem' }}>{product.name}</h1>
            )}
            
            {canEditProduct && (
              <button className="icon-btn" style={{ background: isEditing ? 'var(--gold)' : 'var(--glass)', color: isEditing ? '#000' : 'var(--text)', marginLeft: '1rem' }} onClick={isEditing ? handleSave : toggleEdit} disabled={saving}>
                {isEditing ? <Check size={18} /> : <Edit2 size={18} />}
              </button>
            )}
          </div>
          
          {isEditing ? (
             <>
               <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} style={{ minHeight: '100px', marginBottom: '1rem' }} />
               
               <div style={{ 
                 marginBottom: '1.5rem', 
                 background: 'rgba(201, 168, 76, 0.05)', 
                 border: '1px dashed var(--gold)', 
                 padding: '1rem', 
                 borderRadius: '12px',
                 display: 'flex',
                 flexDirection: 'column',
                 gap: '0.8rem'
               }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <input 
                     type="checkbox" 
                     id="prod_is_sale" 
                     checked={editData.is_sale || false} 
                     onChange={e => setEditData({ ...editData, is_sale: e.target.checked })}
                     style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                   />
                   <label htmlFor="prod_is_sale" style={{ fontSize: '0.9rem', color: 'var(--text)', cursor: 'pointer', fontWeight: 'bold' }}>
                     🏷️ Акционный товар (скидка)
                   </label>
                 </div>

                 {(editData.is_sale || false) && (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                     <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Размер скидки (%)</label>
                     <input 
                       type="number" 
                       min="1" 
                       max="99" 
                       className="input-field" 
                       value={editData.discount_percent || ''} 
                       onChange={e => setEditData({ ...editData, discount_percent: parseInt(e.target.value) || 0 })}
                       style={{ width: '100px', marginBottom: 0 }}
                     />
                   </div>
                 )}
               </div>
             </>
          ) : (
             <p style={{ marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>{product.description}</p>
          )}

          {isEditing && (
            <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--gold)', fontWeight: 'bold', marginBottom: 0 }}>Варианты (веса/объемы):</h3>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button 
                    type="button"
                    className="secondary" 
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px', marginBottom: 0 }}
                    onClick={() => {
                      const base = (editData.variants && editData.variants[0]) || { price_usd: 10, price_idr: 160000, price_uah: 920 };
                      setEditData({
                        ...editData,
                        variants: ['2 г', '5 г', '10 г'].map(name => ({
                          name,
                          price_usd: base.price_usd,
                          price_idr: base.price_idr,
                          price_uah: base.price_uah
                        }))
                      });
                      setActiveEditVariantIdx(0);
                    }}
                  >
                    ⚖️ 2г, 5г, 10г
                  </button>
                  <button 
                    type="button"
                    className="secondary" 
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px', marginBottom: 0 }}
                    onClick={() => {
                      const base = (editData.variants && editData.variants[0]) || { price_usd: 10, price_idr: 160000, price_uah: 920 };
                      setEditData({
                        ...editData,
                        variants: ['2 мл', '5 мл', '10 мл', '20 мл'].map(name => ({
                          name,
                          price_usd: base.price_usd,
                          price_idr: base.price_idr,
                          price_uah: base.price_uah
                        }))
                      });
                      setActiveEditVariantIdx(0);
                    }}
                  >
                    🧪 2мл - 20мл
                  </button>
                </div>
              </div>

              {/* Variant Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
                {editData.variants && editData.variants.map((v, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={idx === activeEditVariantIdx ? 'primary' : 'secondary'}
                    style={{ 
                      padding: '0.4rem 0.8rem', 
                      fontSize: '0.85rem', 
                      borderRadius: '8px', 
                      whiteSpace: 'nowrap',
                      marginBottom: 0,
                      border: idx === activeEditVariantIdx ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)'
                    }}
                    onClick={() => setActiveEditVariantIdx(idx)}
                  >
                    {v.name || `Вариант ${idx + 1}`}
                  </button>
                ))}
                <button
                  type="button"
                  className="secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px', marginBottom: 0 }}
                  onClick={() => {
                    const base = (editData.variants && editData.variants[0]) || { price_usd: 10, price_idr: 160000, price_uah: 920 };
                    const newVars = [...(editData.variants || []), { name: '', price_usd: base.price_usd, price_idr: base.price_idr, price_uah: base.price_uah }];
                    setEditData({ ...editData, variants: newVars });
                    setActiveEditVariantIdx(newVars.length - 1);
                  }}
                >
                  ➕
                </button>
              </div>

              {/* Selected Variant Editor */}
              {editData.variants && editData.variants[activeEditVariantIdx] && (() => {
                const v = editData.variants[activeEditVariantIdx];
                return (
                  <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Название варианта (например: 2 г, 5 мл):</label>
                      <input 
                        type="text" 
                        style={{ padding: '0.5rem', fontSize: '0.9rem', marginBottom: 0 }} 
                        placeholder="Например: 2 г" 
                        value={v.name} 
                        onChange={e => {
                          const newVars = [...editData.variants];
                          newVars[activeEditVariantIdx].name = e.target.value;
                          setEditData({...editData, variants: newVars});
                        }} 
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
                            value={v.price_usd || ''} 
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              const newVars = [...editData.variants];
                              newVars[activeEditVariantIdx].price_usd = val;
                              setEditData({...editData, variants: newVars});
                            }} 
                            placeholder="USD" 
                            style={{ padding: '0.5rem 0.4rem 0.5rem 1.2rem', fontSize: '0.85rem', marginBottom: 0 }} 
                            required 
                          />
                        </div>
                        <div style={{ flex: 1.2, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 'bold' }}>Rp</span>
                          <input 
                            type="number" 
                            value={v.price_idr || ''} 
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              const newVars = [...editData.variants];
                              newVars[activeEditVariantIdx].price_idr = val;
                              setEditData({...editData, variants: newVars});
                            }} 
                            placeholder="IDR" 
                            style={{ padding: '0.5rem 0.4rem 0.5rem 1.4rem', fontSize: '0.85rem', marginBottom: 0 }} 
                            required 
                          />
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 'bold' }}>₽</span>
                          <input 
                            type="number" 
                            value={v.price_uah || ''} 
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              const newVars = [...editData.variants];
                              newVars[activeEditVariantIdx].price_uah = val;
                              setEditData({...editData, variants: newVars});
                            }} 
                            placeholder="RUB" 
                            style={{ padding: '0.5rem 0.4rem 0.5rem 1.2rem', fontSize: '0.85rem', marginBottom: 0 }} 
                            required 
                          />
                        </div>
                      </div>
                    </div>

                    {editData.variants.length > 1 && (
                      <button 
                        type="button" 
                        className="secondary" 
                        style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', color: '#ff4d4f', borderColor: 'rgba(255,77,79,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.2rem' }} 
                        onClick={() => {
                          const newVars = editData.variants.filter((_, idx) => idx !== activeEditVariantIdx);
                          setEditData({...editData, variants: newVars});
                          setActiveEditVariantIdx(Math.max(0, activeEditVariantIdx - 1));
                        }}
                      >
                        🗑️ Удалить вариант "{v.name || activeEditVariantIdx + 1}"
                      </button>
                    )}
                  </div>
                );
              })()}
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                <input type="checkbox" checked={editData.in_stock} onChange={e => setEditData({...editData, in_stock: e.target.checked})} style={{ width: 'auto', marginBottom: 0 }} />
                <span>В наличии</span>
              </label>

              <div style={{ marginTop: '1.2rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Доступность по локациям:</label>
                <select 
                  className="input" 
                  value={editData.location || 'all'} 
                  onChange={e => setEditData({ ...editData, location: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', fontSize: '0.95rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                >
                  <option value="all">Везде (Бали и Вьетнам)</option>
                  <option value="bali">Только Бали 🌴</option>
                  <option value="vietnam">Только Вьетнам 🇻🇳</option>
                </select>
              </div>
            </div>
          )}

          {!isEditing && product.variants && product.variants.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Вариант</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.variants.map((v, i) => (
                  <button 
                    key={i} 
                    className={i === variantIndex ? 'primary' : 'secondary'}
                    onClick={() => { setVariantIndex(i); haptic.impact('light'); }}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '20px' }}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-between" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(() => {
                const currentVar = product.variants && product.variants[variantIndex] ? product.variants[variantIndex] : null;
                const displayStr = currentVar ? currentVar.price_display : product.price_display;
                const oldDisplayStr = currentVar ? currentVar.old_price_display : product.old_price_display;
                
                const formatTotal = (str, multiplier) => {
                  if (!str) return null;
                  const match = str.match(/[\d.,]+/);
                  if (match) {
                    let cleanNum;
                    if (str.includes('$')) {
                      cleanNum = parseFloat(match[0].replace(/,/g, ''));
                    } else {
                      cleanNum = parseInt(match[0].replace(/[.,]/g, ''), 10);
                    }
                    const total = cleanNum * multiplier;
                    if (str.includes('Rp')) {
                      return 'Rp ' + total.toLocaleString('id-ID').replace(/,/g, '.');
                    } else if (str.includes('₴')) {
                      return '₴ ' + total;
                    } else if (str.includes('₫')) {
                      return '₫ ' + total.toLocaleString('id-ID').replace(/,/g, '.');
                    } else if (str.includes('₽') || str.includes('RUB')) {
                      return total + ' ₽';
                    } else {
                      return '$ ' + (total % 1 === 0 ? total : total.toFixed(2));
                    }
                  }
                  return str;
                };

                const newTotal = formatTotal(displayStr, qty);
                const oldTotal = formatTotal(oldDisplayStr, qty);

                return (
                  <>
                    {oldTotal && (
                      <span style={{ textDecoration: 'line-through', fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 'normal', marginBottom: '0.1rem' }}>
                        {oldTotal}
                      </span>
                    )}
                    <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--gold)', lineHeight: 1.1 }}>
                      {newTotal}
                    </span>
                  </>
                );
              })()}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="icon-btn secondary" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{qty}</span>
              <button className="icon-btn secondary" onClick={() => setQty(qty + 1)}><Plus size={16} /></button>
            </div>
          </div>

          {(() => {
            const userLoc = profile?.location || 'bali';
            const isLocMatch = product.location === 'all' || product.location === userLoc;
            const availableStock = !isLocMatch ? 0 : (userLoc === 'vietnam' ? (product.stock_vietnam ?? 0) : (product.stock_bali ?? 0));
            const isWeight = product.is_weight_based ?? true;
            const currentVar = product.variants && product.variants[variantIndex] ? product.variants[variantIndex] : {};
            const weightQty = currentVar.weight_qty ?? (isWeight ? (parseFloat(currentVar.name) || 1) : 1);
            const totalRequired = weightQty * qty;
            const hasStock = availableStock >= totalRequired;
            const isProductAvailable = product.in_stock && isLocMatch && hasStock;

            return (
              <button 
                className="primary"
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  fontSize: '1.1rem',
                  color: '#0d2818',
                  transition: 'all 0.3s ease'
                }}
                onClick={handleAdd}
              >
                🌸 Заказать аналогичный букет
              </button>
            );
          })()}
        </div>

        {/* Cross-sell Products */}
        {crossSellProducts.length > 0 && (
          <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--gold)', fontSize: '1.1rem' }}>С этим товаром отлично сочетается</h3>
            <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {crossSellProducts.map(p => (
                <div 
                  key={p.id} 
                  className="glass-card" 
                  style={{ 
                    flex: '0 0 160px', 
                    padding: '0.6rem', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '210px'
                  }}
                >
                  <div>
                    <Link to={`/product/${p.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ 
                        background: 'var(--green-mid)', 
                        borderRadius: '8px', 
                        height: '75px', 
                        marginBottom: '0.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        {p.photo_url ? (
                          <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : <span style={{opacity: 0.5}}>📦</span>}
                      </div>
                      <h4 style={{ fontSize: '0.8rem', color: 'var(--text)', margin: '0 0 0.3rem 0', fontWeight: 'bold', lineHeight: '1.2', height: '2.4em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebKitLineClamp: 2, WebKitBoxOrient: 'vertical' }}>
                        {p.name}
                      </h4>
                    </Link>
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--gold)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>{p.price_display}</div>
                    <button 
                      className="primary" 
                      style={{ padding: '0.4rem', fontSize: '0.75rem', width: '100%', borderRadius: '6px' }}
                      onClick={() => handleQuickAdd(p.id)}
                    >
                      ➕ Добавить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div style={{ marginBottom: '6rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--gold)' }}>Похожие товары</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {similarProducts.map(p => (
                <Link to={`/product/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                  <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ 
                      background: 'var(--green-mid)', 
                      borderRadius: '12px', 
                      height: '100px', 
                      marginBottom: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem',
                      overflow: 'hidden'
                    }}>
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : <span style={{opacity: 0.5}}>📦</span>}
                    </div>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text)', flex: 1, marginBottom: '0.5rem' }}>{p.name}</h3>
                    <div style={{ fontWeight: 'bold', color: 'var(--gold)', fontSize: '1rem' }}>{p.price_display}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
