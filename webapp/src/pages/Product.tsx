// @ts-nocheck
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ArrowLeftIcon from '../assets/icons/arrow-left.svg'
import MinusIcon from '../assets/icons/minus.svg'
import PlusIcon from '../assets/icons/plus.svg'
import Edit2Icon from '../assets/icons/pen.svg'
import CheckIcon from '../assets/icons/check.svg'
import UploadIcon from '../assets/icons/upload.svg'
import ArrowRightIcon from '../assets/icons/arrow-right.svg'
import { useProductQuery, useProductsQuery } from '../api/gallery';
import { useProfileQuery } from '../api/clients';
import { useAdminUpdateProductMutation, useAdminUploadImageMutation } from '../api/admin';
import { useTelegram } from '../hooks/useTelegram';

export default function Product({ updateCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { haptic, user, showAlert } = useTelegram();
  const fileInputRef = useRef(null);

  const { data: profile } = useProfileQuery();
  const { data: product, isPending: loading } = useProductQuery(id);
  const { data: allProducts = [] } = useProductsQuery();
  const updateProductMutation = useAdminUpdateProductMutation();
  const uploadImageMutation = useAdminUploadImageMutation();

  const isOwner = [5082384607, 1005121723].includes(user?.id);
  const canEdit = isOwner || (profile?.admin_permissions?.can_edit_products || profile?.admin_permissions?.has_full_access);
  const canEditProduct = canEdit;

  const similarProducts = useMemo(
    () => (product
      ? allProducts.filter((x) => x.id !== product.id && x.category_slug === product.category_slug).slice(0, 4)
      : []),
    [allProducts, product],
  );
  const [variantIndex, setVariantIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [activeEditVariantIdx, setActiveEditVariantIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!product) return;
    const editParam = new URLSearchParams(window.location.search).get('edit');
    if (editParam === 'true') {
      setEditData({
        name: product.name, description: product.description, photo_url: product.photo_url,
        in_stock: product.in_stock,
        variants: JSON.parse(JSON.stringify(product.variants || [])),
        is_sale: product.is_sale || false, discount_percent: product.discount_percent || 0
      });
      setIsEditing(true);
    }
  }, [product, id]);

  const handleOrder = () => {
    haptic.impact('medium');
    navigate(`/checkout?ref_id=${product.id}&ref_photo=${encodeURIComponent(product.photo_url)}&ref_title=${encodeURIComponent(product.name)}`);
  };

  const toggleEdit = () => {
    if (isEditing) setIsEditing(false);
    else {
      setEditData({
        name: product.name, description: product.description, photo_url: product.photo_url,
        in_stock: product.in_stock,
        variants: JSON.parse(JSON.stringify(product.variants || [])),
        is_sale: product.is_sale || false, discount_percent: product.discount_percent || 0
      });
      setIsEditing(true); setActiveEditVariantIdx(0);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateProductMutation.mutateAsync({ id: product.id, data: editData });
      setEditData({
        name: updated.name, description: updated.description, photo_url: updated.photo_url,
        in_stock: updated.in_stock,
        variants: JSON.parse(JSON.stringify(updated.variants || [])),
        is_sale: updated.is_sale || false, discount_percent: updated.discount_percent || 0
      });
      setIsEditing(false); haptic.success();
    } catch (e) { console.error(e); haptic.error(); }
    finally { setSaving(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      setSaving(true);
      const res = await uploadImageMutation.mutateAsync(file);
      setEditData(prev => ({ ...prev, photo_url: res.url }));
      haptic.success();
    } catch (err) { console.error(err); haptic.error(); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="spinner" />;
  if (!product) return <div className="container"><p>Букет не найден</p></div>;

  const currentVariant = product.variants && product.variants[variantIndex];
  const priceStr = currentVariant ? currentVariant.price_display : product.price_display;
  const oldPriceStr = currentVariant ? currentVariant.old_price_display : product.old_price_display;

  return (
    <div className="page-transition" data-testid="product-page">
      {/* Sticky Back */}
      <div style={{ position: 'fixed', top: '14px', left: '14px', zIndex: 100 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'rgba(253, 251, 247, 0.9)', backdropFilter: 'blur(10px)' }} data-testid="back-btn">
          <ArrowLeftIcon width={18} height={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Hero image */}
      <div style={{
        width: '100%', aspectRatio: '4/5', maxHeight: '70vh',
        background: 'var(--cream)', overflow: 'hidden', position: 'relative'
      }}>
        {isEditing ? (
          <>
            {editData.photo_url && <img src={editData.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div
              style={{ position: 'absolute', inset: 0, background: 'rgba(40,35,33,0.35)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon width={30} height={30} color="var(--ivory)" strokeWidth={1.4} />
            </div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
          </>
        ) : (
          <>
            {product.photo_url
              ? <img src={product.photo_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{display:'grid', placeItems:'center', height:'100%', color:'var(--wine)', fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:'3rem'}}>f.f</div>}
            {product.is_sale && (
              <div style={{
                position: 'absolute', top: '16px', left: '16px',
                background: 'var(--wine)', color: 'var(--ivory)',
                fontFamily: 'var(--font-sans)', fontSize: '0.65rem',
                letterSpacing: '0.2em', padding: '0.4rem 0.8rem',
                borderRadius: '999px', fontWeight: 600
              }}>
                −{product.discount_percent}%
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: '16px', right: '16px',
              fontFamily: 'var(--font-display)', fontStyle: 'italic',
              color: 'var(--ivory)', fontSize: '0.85rem', letterSpacing: '0.15em',
              padding: '0.3rem 0.7rem',
              background: 'rgba(40, 35, 33, 0.35)', backdropFilter: 'blur(6px)'
            }}>
              № {String(product.id).slice(-3).padStart(3, '0')}
            </div>
          </>
        )}
      </div>

      <div className="container">
        <div style={{ paddingTop: '2rem' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <span className="eyebrow" style={{ color: 'var(--champagne-lo)' }}>Авторский букет</span>
              {isEditing ? (
                <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ marginTop: '0.4rem', fontSize: '1.4rem', fontWeight: 300, fontFamily: 'var(--font-display)', fontStyle: 'italic' }} />
              ) : (
                <h1 style={{ marginTop: '0.4rem', fontFamily: 'var(--font-display)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(1.7rem, 5vw, 2.4rem)', color: 'var(--ink)' }}>{product.name}</h1>
              )}
            </div>
            {canEditProduct && (
              <button className="icon-btn" onClick={isEditing ? handleSave : toggleEdit} disabled={saving} style={{ marginLeft: '0.8rem' }} data-testid="edit-toggle">
                {isEditing ? <CheckIcon width={16} height={16} strokeWidth={1.5} /> : <Edit2Icon width={15} height={15} strokeWidth={1.5} />}
              </button>
            )}
          </div>

          {isEditing ? (
            <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} style={{ minHeight: '110px', marginBottom: '1.5rem' }} />
          ) : (
            <p style={{ marginBottom: '2rem', whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--ink-soft)' }}>
              {product.description}
            </p>
          )}

          {/* Variants */}
          {!isEditing && product.variants && product.variants.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div className="eyebrow" style={{ color: 'var(--ink-soft)', marginBottom: '0.7rem' }}>Размер</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.variants.map((v, i) => (
                  <button key={i} type="button"
                    className={`chip ${i === variantIndex ? 'active' : ''}`}
                    onClick={() => { setVariantIndex(i); haptic.impact('light'); }}
                    data-testid={`variant-${i}`}
                  >{v.name}</button>
                ))}
              </div>
            </div>
          )}

          {isEditing && (
            <div style={{ marginBottom: '1.6rem', padding: '1.2rem', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--ivory-warm)' }}>
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--wine)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Варианты</h3>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button type="button" className="chip"
                    onClick={() => {
                      const base = (editData.variants && editData.variants[0]) || { price_usd: 10, price_idr: 160000, price_uah: 920 };
                      setEditData({ ...editData, variants: ['S', 'M', 'L'].map(name => ({ name, price_usd: base.price_usd, price_idr: base.price_idr, price_uah: base.price_uah })) });
                      setActiveEditVariantIdx(0);
                    }}>S · M · L</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
                {editData.variants && editData.variants.map((v, idx) => (
                  <button key={idx} type="button"
                    className={`chip ${idx === activeEditVariantIdx ? 'active' : ''}`}
                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.72rem' }}
                    onClick={() => setActiveEditVariantIdx(idx)}
                  >{v.name || `#${idx + 1}`}</button>
                ))}
                <button type="button" className="chip" onClick={() => {
                  const base = (editData.variants && editData.variants[0]) || { price_usd: 10, price_idr: 160000, price_uah: 920 };
                  const nv = [...(editData.variants || []), { name: '', price_usd: base.price_usd, price_idr: base.price_idr, price_uah: base.price_uah }];
                  setEditData({ ...editData, variants: nv });
                  setActiveEditVariantIdx(nv.length - 1);
                }}>+</button>
              </div>
              {editData.variants && editData.variants[activeEditVariantIdx] && (() => {
                const v = editData.variants[activeEditVariantIdx];
                const update = (key, val) => {
                  const nv = [...editData.variants]; nv[activeEditVariantIdx] = { ...nv[activeEditVariantIdx], [key]: val };
                  setEditData({ ...editData, variants: nv });
                };
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    <input placeholder="Название (S, M, L)" value={v.name || ''} onChange={e => update('name', e.target.value)} required />
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input type="number" step="0.01" placeholder="USD" value={v.price_usd || ''} onChange={e => update('price_usd', parseFloat(e.target.value) || 0)} />
                      <input type="number" placeholder="IDR" value={v.price_idr || ''} onChange={e => update('price_idr', parseInt(e.target.value) || 0)} />
                      <input type="number" placeholder="RUB" value={v.price_uah || ''} onChange={e => update('price_uah', parseInt(e.target.value) || 0)} />
                    </div>
                    {editData.variants.length > 1 && (
                      <button type="button" className="tertiary" style={{ color: 'var(--error)' }} onClick={() => {
                        const nv = editData.variants.filter((_, i) => i !== activeEditVariantIdx);
                        setEditData({ ...editData, variants: nv });
                        setActiveEditVariantIdx(Math.max(0, activeEditVariantIdx - 1));
                      }}>Удалить вариант</button>
                    )}
                  </div>
                );
              })()}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <input type="checkbox" checked={editData.in_stock || false} onChange={e => setEditData({...editData, in_stock: e.target.checked})} style={{ width: 'auto', marginBottom: 0 }} />
                <span style={{ fontSize: '0.85rem' }}>В наличии</span>
              </label>
            </div>
          )}

          {/* Price + Qty */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '1.4rem 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', marginBottom: '1.6rem' }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>Цена</div>
              {oldPriceStr && <span className="old-price" style={{ fontSize: '0.85rem' }}>{oldPriceStr}</span>}
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, color: 'var(--wine)', fontSize: '1.9rem', lineHeight: 1 }} data-testid="product-price">
                {priceStr}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', border: '1px solid var(--line)', borderRadius: '999px', padding: '0.15rem' }}>
              <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => setQty(Math.max(1, qty - 1))} data-testid="qty-minus"><MinusIcon width={13} height={13} strokeWidth={1.5} /></button>
              <span style={{ fontFamily: 'var(--font-sans)', width: 22, textAlign: 'center' }}>{qty}</span>
              <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => setQty(qty + 1)} data-testid="qty-plus"><PlusIcon width={13} height={13} strokeWidth={1.5} /></button>
            </div>
          </div>

          <button
            className="primary"
            style={{ width: '100%', padding: '1.1rem', fontSize: '0.85rem', letterSpacing: '0.22em' }}
            onClick={handleOrder}
            data-testid="order-similar-btn"
          >
            Заказать аналогичный <ArrowRightIcon width={14} height={14} strokeWidth={1.6} />
          </button>
        </div>

        {/* Similar */}
        {similarProducts.length > 0 && (
          <div style={{ marginTop: '3rem', marginBottom: '4rem' }}>
            <div className="section-heading">
              <h2>Схожие <em>работы</em></h2>
              <Link to="/catalog">весь каталог</Link>
            </div>
            <div className="responsive-products-grid" style={{ marginTop: 0 }}>
              {similarProducts.map(p => (
                <Link to={`/product/${p.id}`} key={p.id} style={{ textDecoration: 'none' }} data-testid={`similar-${p.id}`}>
                  <div className="product-card">
                    <div className="thumb">
                      {p.photo_url ? <img src={p.photo_url} alt={p.name} loading="lazy" /> : <div style={{display:'grid', placeItems:'center', width:'100%', height:'100%', color:'var(--ink-soft)', fontFamily:'var(--font-display)', fontStyle:'italic'}}>f.f</div>}
                    </div>
                    <div>
                      <div className="name">{p.name}</div>
                      <div className="price" style={{ marginTop: '0.3rem' }}>{p.price_display}</div>
                    </div>
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
