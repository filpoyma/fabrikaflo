// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Trash2Icon from '../assets/icons/trash-2.svg'
import PlusIcon from '../assets/icons/plus.svg'
import MinusIcon from '../assets/icons/minus.svg'
import ArrowRightIcon from '../assets/icons/arrow-right.svg'
import { useCartQuery, useRemoveFromCartMutation, useUpdateCartItemQtyMutation } from '../api/cart';
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
  const { data: cart = { items: [], subtotal_usd: 0 }, isPending: loading } = useCartQuery();
  const removeMutation = useRemoveFromCartMutation();
  const updateQtyMutation = useUpdateCartItemQtyMutation();
  const { haptic, showAlert } = useTelegram();
  const navigate = useNavigate();

  const handleRemove = async (product_id, variant_index) => {
    try {
      haptic.impact('light');
      await removeMutation.mutateAsync({ productId: product_id, variantIndex: variant_index });
      await updateCart?.();
    } catch (e) { console.error(e); }
  };

  const handleQtyChange = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    try {
      haptic.impact('light');
      await updateQtyMutation.mutateAsync({
        productId: item.product_id,
        variantIndex: item.variant_index,
        qty: newQty,
      });
      await updateCart?.();
    } catch (e) { console.error(e); }
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
          <button className="primary">В каталог <ArrowRightIcon width={14} height={14} strokeWidth={1.6} /></button>
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
                <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => handleQtyChange(item, -1)}><MinusIcon width={13} height={13} strokeWidth={1.5} /></button>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', width: 18, textAlign: 'center' }}>{item.quantity}</span>
                <button className="icon-btn" style={{ width: 30, height: 30 }} disabled={item.in_stock === false} onClick={() => item.in_stock !== false && handleQtyChange(item, 1)}><PlusIcon width={13} height={13} strokeWidth={1.5} /></button>
              </div>
              <button
                className="tertiary"
                style={{ color: 'var(--error)', fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}
                onClick={() => handleRemove(item.product_id, item.variant_index)}
              >
                <Trash2Icon width={12} height={12} strokeWidth={1.5} /> убрать
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
        Оформить заказ <ArrowRightIcon width={14} height={14} strokeWidth={1.6} />
      </button>
    </div>
  );
}
