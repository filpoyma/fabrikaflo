import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';

const scaleDisplayAmount = (displayStr, ratio) => {
  if (!displayStr) return '';
  const cleanStr = displayStr.replace(/\s/g, '');
  const match = cleanStr.match(/[\d.,]+/);
  if (!match) return displayStr;
  const numStr = match[0];
  
  let value = 0;
  if (displayStr.includes('$') || displayStr.includes('USDT')) {
    value = parseFloat(numStr.replace(/,/g, ''));
  } else {
    value = parseInt(numStr.replace(/\D/g, ''));
  }
  
  if (isNaN(value)) return displayStr;
  
  const newValue = value * ratio;
  
  let formattedNewValue = '';
  if (displayStr.includes('$') || displayStr.includes('USDT')) {
    formattedNewValue = newValue.toFixed(2);
    const parts = formattedNewValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formattedNewValue = parts.join('.');
  } else if (displayStr.includes('Rp')) {
    formattedNewValue = Math.round(newValue).toLocaleString('ru-RU').replace(/\s/g, ',');
  } else if (displayStr.includes('₫')) {
    formattedNewValue = Math.round(newValue).toLocaleString('ru-RU').replace(/\s/g, '.');
  } else {
    formattedNewValue = Math.round(newValue).toLocaleString('ru-RU');
  }
  
  return displayStr.replace(numStr, formattedNewValue);
};

export default function Cart({ updateCart }) {
  const [cart, setCart] = useState({ items: [], subtotal_usd: 0 });
  const [loading, setLoading] = useState(true);
  const { haptic, showAlert } = useTelegram();
  const navigate = useNavigate();

  const loadCart = () => {
    setLoading(true);
    api.getCart()
      .then(setCart)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleRemove = async (product_id, variant_index) => {
    try {
      haptic.impact('light');
      
      setCart(prev => {
        const removedItem = prev.items.find(i => i.product_id === product_id && i.variant_index === variant_index);
        if (!removedItem) return prev;
        
        const remainingItems = prev.items.filter(i => !(i.product_id === product_id && i.variant_index === variant_index));
        
        const removedItemTotalUsd = removedItem.price_usd * removedItem.quantity;
        const oldSubtotalUsd = prev.subtotal_usd || 0;
        const newSubtotalUsd = Math.max(0, oldSubtotalUsd - removedItemTotalUsd);
        
        const discountPercent = prev.discount_percent || 0;
        const newDiscountUsd = newSubtotalUsd * (discountPercent / 100);
        const newTotalUsd = newSubtotalUsd - newDiscountUsd;
        
        const subtotalRatio = oldSubtotalUsd > 0 ? newSubtotalUsd / oldSubtotalUsd : 0;
        const oldTotalUsd = prev.total_usd || 0;
        const totalRatio = oldTotalUsd > 0 ? newTotalUsd / oldTotalUsd : 0;
        
        return {
          ...prev,
          items: remainingItems,
          subtotal_usd: newSubtotalUsd,
          discount_usd: newDiscountUsd,
          total_usd: newTotalUsd,
          subtotal_display: scaleDisplayAmount(prev.subtotal_display, subtotalRatio),
          total_display: scaleDisplayAmount(prev.total_display, totalRatio)
        };
      });
      
      await api.removeFromCart(product_id, variant_index);
      await updateCart();
      
      api.getCart()
        .then(setCart)
        .catch(console.error);
    } catch (e) {
      console.error(e);
      api.getCart()
        .then(setCart)
        .catch(console.error);
    }
  };

  const handleQtyChange = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    try {
      haptic.impact('light');
      
      setCart(prev => {
        const oldQty = item.quantity;
        const itemPriceUsd = item.price_usd;
        const oldItemTotalUsd = itemPriceUsd * oldQty;
        const newItemTotalUsd = itemPriceUsd * newQty;
        const deltaUsd = newItemTotalUsd - oldItemTotalUsd;
        
        const oldSubtotalUsd = prev.subtotal_usd || 0;
        const newSubtotalUsd = oldSubtotalUsd + deltaUsd;
        
        const discountPercent = prev.discount_percent || 0;
        const newDiscountUsd = newSubtotalUsd * (discountPercent / 100);
        
        const oldTotalUsd = prev.total_usd || 0;
        const newTotalUsd = newSubtotalUsd - newDiscountUsd;
        
        const itemRatio = newQty / oldQty;
        const subtotalRatio = oldSubtotalUsd > 0 ? newSubtotalUsd / oldSubtotalUsd : 1;
        const totalRatio = oldTotalUsd > 0 ? newTotalUsd / oldTotalUsd : 1;
        
        return {
          ...prev,
          items: prev.items.map(i => {
            if (i.product_id === item.product_id && i.variant_index === item.variant_index) {
              return {
                ...i,
                quantity: newQty,
                subtotal_display: scaleDisplayAmount(i.subtotal_display, itemRatio)
              };
            }
            return i;
          }),
          subtotal_usd: newSubtotalUsd,
          discount_usd: newDiscountUsd,
          total_usd: newTotalUsd,
          subtotal_display: scaleDisplayAmount(prev.subtotal_display, subtotalRatio),
          total_display: scaleDisplayAmount(prev.total_display, totalRatio)
        };
      });
      
      await api.updateCartItemQty(item.product_id, item.variant_index, newQty);
      await updateCart();
      
      api.getCart()
        .then(setCart)
        .catch(console.error);
    } catch (e) {
      console.error(e);
      api.getCart()
        .then(setCart)
        .catch(console.error);
    }
  };

  if (loading) return <div className="spinner"></div>;

  if (cart.items.length === 0) {
    return (
      <div className="container page-transition" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <span style={{ fontSize: '4rem' }}>🛒</span>
        <h2 style={{ marginTop: '1rem' }}>Корзина пуста</h2>
        <p style={{ marginBottom: '2rem' }}>Перейдите в каталог, чтобы добавить товары</p>
        <Link to="/catalog" style={{ textDecoration: 'none' }}>
          <button className="primary" style={{ width: '100%' }}>В каталог</button>
        </Link>
      </div>
    );
  }

  const hasOutOfStockItems = cart.items.some(item => item.in_stock === false);

  return (
    <div className="container page-transition">
      <h2 style={{ marginBottom: '1rem' }}>🛒 Корзина</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {cart.items.map((item, idx) => (
          <div 
            key={idx} 
            className="glass-card flex-between" 
            style={{ 
              opacity: item.in_stock === false ? 0.6 : 1, 
              border: item.in_stock === false ? '1px solid rgba(255, 77, 79, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)' 
            }}
          >
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.2rem', color: item.in_stock === false ? 'var(--text-muted)' : 'inherit' }}>{item.product_name}</h3>
              <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem', color: item.in_stock === false ? 'var(--text-muted)' : 'inherit' }}>{item.variant_name}</p>
              {item.in_stock === false ? (
                <div style={{ color: '#ff4d4f', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  ⚠️ Нет в наличии
                </div>
              ) : (
                <div style={{ color: 'var(--gold)', fontWeight: 'bold' }}>
                  {item.subtotal_display}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <button className="icon-btn secondary" style={{ padding: '0.3rem', color: '#ff4d4f' }} onClick={() => handleRemove(item.product_id, item.variant_index)}>
                <Trash2 size={16} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.2rem', borderRadius: '8px' }}>
                <button className="icon-btn" style={{ padding: '0.2rem' }} onClick={() => handleQtyChange(item, -1)}><Minus size={14} /></button>
                <span style={{ fontSize: '0.9rem', width: '16px', textAlign: 'center' }}>{item.quantity}</span>
                <button 
                  className="icon-btn" 
                  style={{ padding: '0.2rem', opacity: item.in_stock === false ? 0.3 : 1 }} 
                  onClick={() => item.in_stock !== false && handleQtyChange(item, 1)}
                  disabled={item.in_stock === false}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ marginBottom: '1rem' }}>
        {cart.discount_percent > 0 && (
          <div className="flex-between" style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span>Сумма:</span>
            <span style={{ textDecoration: 'line-through' }}>{cart.subtotal_display || `$ ${(cart.subtotal_usd || 0).toFixed(0)}`}</span>
          </div>
        )}
        {cart.discount_percent > 0 && (
          <div className="flex-between" style={{ fontSize: '1rem', color: '#ff4d4f', marginBottom: '0.5rem' }}>
            <span>Скидка ({cart.discount_percent}%):</span>
            <span>- {cart.discount_usd ? `$ ${cart.discount_usd.toFixed(0)}` : ''}</span>
          </div>
        )}
        <div className="flex-between" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          <span>Итого (без доставки):</span>
          <span style={{ color: 'var(--gold)' }}>{cart.total_display || `$ ${(cart.total_usd || 0).toFixed(0)}`}</span>
        </div>
      </div>

      <button 
        className="primary" 
        style={{ 
          width: '100%', 
          padding: '1rem', 
          fontSize: '1.1rem',
          opacity: hasOutOfStockItems ? 0.5 : 1,
          cursor: hasOutOfStockItems ? 'not-allowed' : 'pointer',
          background: hasOutOfStockItems ? 'var(--text-muted)' : 'var(--gold)',
          color: hasOutOfStockItems ? '#fff' : '#0d2818'
        }} 
        onClick={() => {
          if (hasOutOfStockItems) {
            showAlert('Пожалуйста, удалите из корзины товары, которых нет в наличии');
          } else {
            navigate('/checkout');
          }
        }}
      >
        Оформить заказ
      </button>
    </div>
  );
}
