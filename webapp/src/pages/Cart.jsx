import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';

const scaleDisplayAmount = (displayStr, ratio) => {
  if (!displayStr) return '';
  const cleanStr = displayStr.replace(/\s/g, '');
  const match = cleanStr.match(/[\d.,]+/);
  if (!match) return displayStr;
  const numStr = match[0];
  let value = 0;
  if (displayStr.includes('$') || displayStr.includes('USDT')) value = parseFloat(numStr.replace(/,/g, ''));
  else value = parseInt(numStr.replace(/\D/g, ''));
  if (isNaN(value)) return displayStr;
  const newValue = value * ratio;
  let formatted = '';
  if (displayStr.includes('$') || displayStr.includes('USDT')) {
    formatted = newValue.toFixed(2);
    const p = formatted.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); formatted = p.join('.');
  } else if (displayStr.includes('Rp')) formatted = Math.round(newValue).toLocaleString('ru-RU').replace(/\s/g, ',');
  else if (displayStr.includes('₫')) formatted = Math.round(newValue).toLocaleString('ru-RU').replace(/\s/g, '.');
  else formatted = Math.round(newValue).toLocaleString('ru-RU');
  return displayStr.replace(numStr, formatted);
};

export default function Cart({ updateCart }) {
  const [cart, setCart] = useState({ items: [], subtotal_usd: 0 });
  const [loading, setLoading] = useState(true);
  const { haptic, showAlert } = useTelegram();
  const navigate = useNavigate();

  const loadCart = () => {
    setLoading(true);
    api.getCart().then(setCart).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { loadCart(); }, []);

  const handleRemove = async (product_id, variant_index) => {
    try {
      haptic.impact('light');
      setCart(prev => {
        const removed = prev.items.find(i => i.product_id === product_id && i.variant_index === variant_index);
        if (!removed) return prev;
        const rem = prev.items.filter(i => !(i.product_id === product_id && i.variant_index === variant_index));
        const removedTotal = removed.price_usd * removed.quantity;
        const oldSubtotal = prev.subtotal_usd || 0;
        const newSubtotal = Math.max(0, oldSubtotal - removedTotal);
        const discountPct = prev.discount_percent || 0;
        const newDiscount = newSubtotal * (discountPct / 100);
        const newTotal = newSubtotal - newDiscount;
        const sr = oldSubtotal > 0 ? newSubtotal / oldSubtotal : 0;
        const tr = (prev.total_usd || 0) > 0 ? newTotal / prev.total_usd : 0;
        return { ...prev, items: rem, subtotal_usd: newSubtotal, discount_usd: newDiscount, total_usd: newTotal,
          subtotal_display: scaleDisplayAmount(prev.subtotal_display, sr),
          total_display: scaleDisplayAmount(prev.total_display, tr) };
      });
      await api.removeFromCart(product_id, variant_index);
      await updateCart();
      api.getCart().then(setCart).catch(console.error);
    } catch (e) { console.error(e); api.getCart().then(setCart).catch(console.error); }
  };

  const handleQtyChange = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    try {
      haptic.impact('light');
      setCart(prev => {
        const oldQty = item.quantity;
        const priceUsd = item.price_usd;
        const deltaUsd = priceUsd * newQty - priceUsd * oldQty;
        const newSubtotal = (prev.subtotal_usd || 0) + deltaUsd;
        const discountPct = prev.discount_percent || 0;
        const newDiscount = newSubtotal * (discountPct / 100);
        const newTotal = newSubtotal - newDiscount;
        const itemRatio = newQty / oldQty;
        const sr = (prev.subtotal_usd || 0) > 0 ? newSubtotal / prev.subtotal_usd : 1;
        const tr = (prev.total_usd || 0) > 0 ? newTotal / prev.total_usd : 1;
        return { ...prev,
          items: prev.items.map(i => (i.product_id === item.product_id && i.variant_index === item.variant_index)
            ? { ...i, quantity: newQty, subtotal_display: scaleDisplayAmount(i.subtotal_display, itemRatio) } : i),
          subtotal_usd: newSubtotal, discount_usd: newDiscount, total_usd: newTotal,
          subtotal_display: scaleDisplayAmount(prev.subtotal_display, sr),
          total_display: scaleDisplayAmount(prev.total_display, tr) };
      });
      await api.updateCartItemQty(item.product_id, item.variant_index, newQty);
      await updateCart();
      api.getCart().then(setCart).catch(console.error);
    } catch (e) { console.error(e); api.getCart().then(setCart).catch(console.error); }
  };

  if (loading) return <div className="spinner" />;

  if (cart.items.length === 0) {
    return (
      <div className="container page-transition" style={{ textAlign: 'center', paddingTop: '5rem' }} data-testid="cart-empty">
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '2.4rem', color: 'var(--wine)' }}>пусто</div>
        <div style={{ width: '44px', height: '1px', background: 'var(--champagne-lo)', margin: '1rem auto' }} />
        <h2 style={{ marginTop: '0.5rem' }}>Корзина <em>пуста</em></h2>
        <p style={{ marginTop: '0.8rem', marginBottom: '2rem' }}>Перейдите в каталог, чтобы добавить букет.</p>
        <Link to="/catalog" style={{ textDecoration: 'none' }}>
          <button className="primary">В каталог <ArrowRight size={14} strokeWidth={1.6} /></button>
        </Link>
      </div>
    );
  }

  const hasOutOfStock = cart.items.some(i => i.in_stock === false);

  return (
    <div className="container page-transition" data-testid="cart-page">
      <div className="page-title">
        <div>
          <span className="eyebrow">Заказ</span>
          <h1 style={{ marginTop: '0.4rem' }}>Ваш <em>букет</em></h1>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginBottom: '2.5rem', borderTop: '1px solid var(--line)' }}>
        {cart.items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              padding: '1.4rem 0', borderBottom: '1px solid var(--line)',
              opacity: item.in_stock === false ? 0.55 : 1
            }}
            data-testid={`cart-item-${item.product_id}`}
          >
            <div style={{ flex: 1, paddingRight: '1rem' }}>
              <h3 style={{ marginBottom: '0.4rem', fontSize: '1.15rem' }}>{item.product_name}</h3>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.6rem' }}>
                {item.variant_name}
              </div>
              {item.in_stock === false
                ? <div style={{ color: 'var(--error)', fontSize: '0.8rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Нет в наличии</div>
                : <div style={{ color: 'var(--wine)', fontFamily: 'var(--font-sans)', fontWeight: 500, letterSpacing: '0.06em' }}>{item.subtotal_display}</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', border: '1px solid var(--line)', borderRadius: '999px', padding: '0.15rem' }}>
                <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => handleQtyChange(item, -1)}><Minus size={13} strokeWidth={1.5} /></button>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', width: 18, textAlign: 'center' }}>{item.quantity}</span>
                <button className="icon-btn" style={{ width: 30, height: 30 }} disabled={item.in_stock === false} onClick={() => item.in_stock !== false && handleQtyChange(item, 1)}><Plus size={13} strokeWidth={1.5} /></button>
              </div>
              <button
                className="tertiary"
                style={{ color: 'var(--error)', fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}
                onClick={() => handleRemove(item.product_id, item.variant_index)}
              >
                <Trash2 size={12} strokeWidth={1.5} /> убрать
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '1.4rem 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', marginBottom: '1.6rem' }}>
        {cart.discount_percent > 0 && (
          <>
            <div className="flex-between" style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
              <span>Сумма</span>
              <span style={{ textDecoration: 'line-through' }}>{cart.subtotal_display || `$ ${(cart.subtotal_usd || 0).toFixed(0)}`}</span>
            </div>
            <div className="flex-between" style={{ fontSize: '0.85rem', color: 'var(--wine)', marginBottom: '0.5rem' }}>
              <span>Скидка · {cart.discount_percent}%</span>
              <span>− {cart.discount_usd ? `$ ${cart.discount_usd.toFixed(0)}` : ''}</span>
            </div>
          </>
        )}
        <div className="flex-between" style={{ alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Итого без доставки</span>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, color: 'var(--wine)', fontSize: '1.8rem' }}>
            {cart.total_display || `$ ${(cart.total_usd || 0).toFixed(0)}`}
          </span>
        </div>
      </div>

      <button
        className="primary"
        style={{ width: '100%', padding: '1.05rem', fontSize: '0.85rem', letterSpacing: '0.22em' }}
        disabled={hasOutOfStock}
        onClick={() => hasOutOfStock ? showAlert('Пожалуйста, удалите из корзины товары, которых нет в наличии') : navigate('/checkout')}
        data-testid="checkout-btn"
      >
        Оформить заказ <ArrowRight size={14} strokeWidth={1.6} />
      </button>
    </div>
  );
}
