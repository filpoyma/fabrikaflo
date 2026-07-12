import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';
import { Check, X, Upload } from 'lucide-react';

export default function Orders() {
  const { haptic, showAlert, showConfirm } = useTelegram();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [feedbackTexts, setFeedbackTexts] = useState({});
  const [showFeedbackInput, setShowFeedbackInput] = useState({});
  const fileInputRefs = useRef({});

  const loadOrders = () => {
    setLoading(true);
    api.getOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'CREATED':
      case 'ASSEMBLING':
        return 'orange';
      case 'ASSEMBLED':
      case 'WAITING_FOR_APPROVAL':
        return 'gold';
      case 'APPROVED':
      case 'WAITING_FOR_PAYMENT':
        return 'orange';
      case 'PAID':
        return 'green';
      case 'DELIVERING':
        return 'blue';
      case 'DELIVERED':
        return 'green';
      case 'CANCELLED':
        return 'red';
      default:
        return 'gold';
    }
  };

  const getStatusText = (status) => {
    const map = {
      CREATED: '⏳ Создан',
      ASSEMBLING: '🌸 Сборка букета',
      ASSEMBLED: '✨ Готов (На согласовании)',
      WAITING_FOR_APPROVAL: '✨ Согласование по фото',
      APPROVED: '✅ Одобрен',
      WAITING_FOR_PAYMENT: '💳 Ожидает оплаты',
      PAID: '💰 Оплачен',
      DELIVERING: '🚚 В пути',
      DELIVERED: '🎉 Доставлен',
      CANCELLED: '❌ Отменён'
    };
    return map[status] || status;
  };

  const handleApprove = async (id) => {
    try {
      setSubmittingId(id);
      haptic.impact('medium');
      await api.approveOrder(id);
      haptic.success();
      showAlert('Букет одобрен! Администратор сформирует ссылку на оплату.');
      loadOrders();
    } catch (e) {
      console.error(e);
      haptic.error();
      showAlert('Ошибка при одобрении букета.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDisapprove = async (id) => {
    const text = feedbackTexts[id] || '';
    if (!text.trim()) {
      showAlert('Пожалуйста, напишите, что именно нужно исправить.');
      return;
    }
    try {
      setSubmittingId(id);
      haptic.impact('medium');
      await api.disapproveOrder(id, text);
      haptic.success();
      showAlert('Ваши правки переданы флористу!');
      // Clear input state
      setFeedbackTexts(prev => ({ ...prev, [id]: '' }));
      setShowFeedbackInput(prev => ({ ...prev, [id]: false }));
      loadOrders();
    } catch (e) {
      console.error(e);
      haptic.error();
      showAlert('Ошибка при отправке правок.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReceiptUpload = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSubmittingId(id);
      haptic.impact('light');
      await api.uploadReceipt(id, file);
      haptic.success();
      showAlert('Чек успешно загружен! Статус заказа обновится в ближайшее время.');
      loadOrders();
    } catch (err) {
      console.error(err);
      haptic.error();
      showAlert('Ошибка при загрузке чека.');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <div className="spinner" style={{ margin: '4rem auto' }}></div>;

  if (orders.length === 0) {
    return (
      <div className="container page-transition" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
        <h2 style={{ marginBottom: '0.5rem' }}>Нет заказов</h2>
        <p style={{ color: 'var(--text-muted)' }}>Здесь будет отображаться история ваших заказов</p>
      </div>
    );
  }

  return (
    <div className="container page-transition" style={{ paddingBottom: '6rem' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📋 Мои заказы
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {orders.map(o => {
          const lastPhoto = o.photos && o.photos.length > 0 ? o.photos[o.photos.length - 1].photoUrl : null;
          const isWaitingApproval = o.status === 'WAITING_FOR_APPROVAL' || o.status === 'ASSEMBLED';
          const isWaitingPayment = o.status === 'WAITING_FOR_PAYMENT' || o.status === 'APPROVED';

          return (
            <div key={o.id} className="glass-card" style={{ border: isWaitingApproval ? '1px solid var(--gold)' : undefined }}>
              
              {/* Header */}
              <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>Заказ на {o.budget} руб.</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}
                  </div>
                </div>
                <span className={`badge ${getStatusColor(o.status)}`} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                  {getStatusText(o.status)}
                </span>
              </div>

              {/* Order Info */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                {o.wishes && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Пожелания: </span>
                    <span style={{ fontStyle: 'italic' }}>"{o.wishes}"</span>
                  </div>
                )}
                {o.recipientPhone && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Телефон: </span>
                    <strong>{o.recipientPhone}</strong>
                  </div>
                )}
                {o.deliveryAddress && o.deliveryAddress !== 'Самовывоз' && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Адрес: </span>
                    <span>{o.deliveryAddress}</span>
                  </div>
                )}
                {o.postcardText && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '6px', borderLeft: '2px solid var(--gold)', marginTop: '0.4rem' }}>
                    <span style={{ color: 'var(--gold)', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Текст в открытке:</span>
                    <span>{o.postcardText}</span>
                  </div>
                )}
              </div>

              {/* Florist Assembled Bouquet Photo */}
              {lastPhoto && (
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Фото готового букета от флориста:</span>
                  <div style={{ width: '100%', maxHeight: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={lastPhoto} alt="Assembled Bouquet" style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }} />
                  </div>
                </div>
              )}

              {/* Client Actions: Approve / Disapprove */}
              {isWaitingApproval && lastPhoto && (
                <div style={{ marginTop: '1rem' }}>
                  {showFeedbackInput[o.id] ? (
                    <div>
                      <textarea
                        placeholder="Напишите, что именно нужно доработать флористу (например: добавьте больше зелени, перевяжите ленту...)"
                        rows="2"
                        value={feedbackTexts[o.id] || ''}
                        onChange={e => setFeedbackTexts(prev => ({ ...prev, [o.id]: e.target.value }))}
                        style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="secondary" 
                          onClick={() => setShowFeedbackInput(prev => ({ ...prev, [o.id]: false }))}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          disabled={submittingId === o.id}
                        >
                          Отмена
                        </button>
                        <button 
                          className="primary" 
                          onClick={() => handleDisapprove(o.id)}
                          style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: '#d4af37', color: '#000' }}
                          disabled={submittingId === o.id}
                        >
                          Отправить правки
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="secondary" 
                        onClick={() => setShowFeedbackInput(prev => ({ ...prev, [o.id]: true }))}
                        style={{ flex: 1, padding: '0.6rem 0', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                        disabled={submittingId === o.id}
                      >
                        <X size={16} /> Внести правки
                      </button>
                      <button 
                        className="primary" 
                        onClick={() => handleApprove(o.id)}
                        style={{ flex: 1, padding: '0.6rem 0', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: '#0d2818' }}
                        disabled={submittingId === o.id}
                      >
                        <Check size={16} /> Одобрить букет
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Client Actions: Payment & Upload Receipt */}
              {isWaitingPayment && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                  {o.paymentLink ? (
                    <a 
                      href={o.paymentLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="primary"
                      style={{ textDecoration: 'none', display: 'block', textAlign: 'center', padding: '0.6rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '0.8rem', color: '#0d2818' }}
                    >
                      💳 Перейти к оплате
                    </a>
                  ) : (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem', borderLeft: '3px solid var(--gold)' }}>
                      Администратор проверяет ваш заказ. Реквизиты для оплаты придут в ближайшее время.
                    </div>
                  )}

                  {/* Upload Receipt */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => fileInputRefs.current[o.id]?.click()}
                      style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '8px' }}
                      disabled={submittingId === o.id}
                    >
                      <Upload size={16} /> Загрузить чек об оплате
                    </button>
                    <input 
                      type="file" 
                      ref={el => fileInputRefs.current[o.id] = el}
                      onChange={(e) => handleReceiptUpload(o.id, e)}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              )}

              {/* Client Feedback Status */}
              {o.clientFeedback && o.status === 'ASSEMBLING' && (
                <div style={{ marginTop: '1rem', background: 'rgba(201,168,76,0.05)', padding: '0.8rem', borderRadius: '8px', borderLeft: '3px solid var(--gold)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 'bold', display: 'block', marginBottom: '0.2rem' }}>Ваши правки в работе:</span>
                  <span style={{ fontStyle: 'italic' }}>"{o.clientFeedback}"</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
