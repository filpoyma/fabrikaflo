import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';
import { Check, X, Upload, CreditCard } from 'lucide-react';

const STATUS_LABEL = {
  CREATED: 'Создан',
  ASSEMBLING: 'Сборка',
  ASSEMBLED: 'Согласование',
  WAITING_FOR_APPROVAL: 'Согласование',
  APPROVED: 'Одобрен',
  WAITING_FOR_PAYMENT: 'Ожидает оплаты',
  PAID: 'Оплачен',
  DELIVERING: 'В пути',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
};

const STATUS_TONE = {
  CREATED: { bg: 'var(--champagne-tint)',   fg: 'var(--wine)',      bd: 'var(--champagne)' },
  ASSEMBLING: { bg: 'var(--champagne-tint)', fg: 'var(--wine)',     bd: 'var(--champagne)' },
  ASSEMBLED: { bg: 'var(--champagne-tint)', fg: 'var(--wine)',      bd: 'var(--champagne)' },
  WAITING_FOR_APPROVAL: { bg: 'var(--champagne-tint)', fg: 'var(--wine)', bd: 'var(--champagne)' },
  APPROVED:  { bg: 'rgba(122,139,111,0.14)', fg: 'var(--sage)',     bd: 'rgba(122,139,111,0.32)' },
  WAITING_FOR_PAYMENT: { bg: 'var(--champagne-tint)', fg: 'var(--wine)', bd: 'var(--champagne)' },
  PAID:      { bg: 'rgba(122,139,111,0.14)', fg: 'var(--sage)',     bd: 'rgba(122,139,111,0.32)' },
  DELIVERING:{ bg: 'var(--ivory-warm)',      fg: 'var(--ink)',      bd: 'var(--line)' },
  DELIVERED: { bg: 'rgba(122,139,111,0.14)', fg: 'var(--sage)',     bd: 'rgba(122,139,111,0.32)' },
  CANCELLED: { bg: 'rgba(181,61,61,0.08)',   fg: 'var(--error)',    bd: 'rgba(181,61,61,0.25)' },
};

function StatusPill({ status }) {
  const t = STATUS_TONE[status] || STATUS_TONE.CREATED;
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.32rem 0.75rem',
      borderRadius: '999px',
      background: t.bg,
      color: t.fg,
      border: `1px solid ${t.bd}`,
      fontFamily: 'var(--font-sans)',
      fontSize: '0.6rem',
      fontWeight: 600,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap'
    }} data-testid={`order-status-${status}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export default function Orders() {
  const { haptic, showAlert } = useTelegram();
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

  useEffect(() => { loadOrders(); }, []);

  const handleApprove = async (id) => {
    try {
      setSubmittingId(id);
      haptic.impact('medium');
      await api.approveOrder(id);
      haptic.success();
      showAlert('Букет одобрен. Флорист сформирует реквизиты для оплаты.');
      loadOrders();
    } catch (e) {
      console.error(e); haptic.error();
      showAlert('Ошибка при одобрении букета.');
    } finally { setSubmittingId(null); }
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
      showAlert('Ваши правки переданы флористу.');
      setFeedbackTexts(prev => ({ ...prev, [id]: '' }));
      setShowFeedbackInput(prev => ({ ...prev, [id]: false }));
      loadOrders();
    } catch (e) {
      console.error(e); haptic.error();
      showAlert('Ошибка при отправке правок.');
    } finally { setSubmittingId(null); }
  };

  const handleReceiptUpload = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSubmittingId(id);
      haptic.impact('light');
      await api.uploadReceipt(id, file);
      haptic.success();
      showAlert('Чек загружен. Статус заказа обновится в ближайшее время.');
      loadOrders();
    } catch (err) {
      console.error(err); haptic.error();
      showAlert('Ошибка при загрузке чека.');
    } finally { setSubmittingId(null); }
  };

  if (loading) return <div className="spinner" />;

  if (orders.length === 0) {
    return (
      <div className="container page-transition" style={{ textAlign: 'center', paddingTop: '5rem' }} data-testid="orders-empty">
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '2.4rem', color: 'var(--wine)' }}>пусто</div>
        <div style={{ width: '44px', height: '1px', background: 'var(--champagne-lo)', margin: '1rem auto' }} />
        <h2 style={{ marginTop: '0.5rem' }}>Пока нет <em>заказов</em></h2>
        <p style={{ marginTop: '0.8rem' }}>Здесь появится история ваших букетов, статусы согласования и оплаты.</p>
      </div>
    );
  }

  return (
    <div className="container page-transition" style={{ paddingBottom: '6rem' }} data-testid="orders-page">
      <div className="page-title">
        <div>
          <span className="eyebrow">История</span>
          <h1 style={{ marginTop: '0.4rem' }}>Мои <em>заказы</em></h1>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', borderTop: '1px solid var(--line)' }}>
        {orders.map(o => {
          const lastPhoto = o.photos && o.photos.length > 0 ? o.photos[o.photos.length - 1].photoUrl : null;
          const isWaitingApproval = o.status === 'WAITING_FOR_APPROVAL' || o.status === 'ASSEMBLED';
          const isWaitingPayment  = o.status === 'WAITING_FOR_PAYMENT'  || o.status === 'APPROVED';

          return (
            <article key={o.id} style={{ padding: '2rem 0', borderBottom: '1px solid var(--line)' }} data-testid={`order-${o.id}`}>

              {/* Header row */}
              <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div className="eyebrow" style={{ color: 'var(--champagne-lo)' }}>Заказ № {String(o.id).slice(-6)}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.6rem', fontWeight: 300, color: 'var(--wine)', marginTop: '0.3rem', lineHeight: 1 }}>
                    {o.budget ? `${Number(o.budget).toLocaleString('ru-RU')} ₽` : '—'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '0.4rem' }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''}
                  </div>
                </div>
                <StatusPill status={o.status} />
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--ink)', marginBottom: lastPhoto ? '1.25rem' : '0.5rem' }}>
                {o.wishes && (
                  <div>
                    <span style={{ color: 'var(--ink-soft)', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginRight: '0.5rem' }}>Пожелания</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>«{o.wishes}»</span>
                  </div>
                )}
                {o.recipientPhone && (
                  <div>
                    <span style={{ color: 'var(--ink-soft)', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginRight: '0.5rem' }}>Телефон</span>
                    {o.recipientPhone}
                  </div>
                )}
                {o.deliveryAddress && o.deliveryAddress !== 'Самовывоз' && (
                  <div>
                    <span style={{ color: 'var(--ink-soft)', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginRight: '0.5rem' }}>Адрес</span>
                    {o.deliveryAddress}
                  </div>
                )}
                {o.postcardText && (
                  <div style={{ marginTop: '0.5rem', padding: '0.85rem 1rem', background: 'var(--champagne-tint)', border: '1px solid var(--champagne)' }}>
                    <div className="eyebrow" style={{ color: 'var(--wine)', marginBottom: '0.3rem' }}>Открытка</div>
                    <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink)' }}>«{o.postcardText}»</span>
                  </div>
                )}
              </div>

              {/* Bouquet photo */}
              {lastPhoto && (
                <div style={{ marginBottom: '1.2rem' }}>
                  <div className="eyebrow" style={{ color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>Фото букета от флориста</div>
                  <div style={{ width: '100%', maxHeight: '360px', overflow: 'hidden', background: 'var(--cream)', border: '1px solid var(--line)' }}>
                    <img src={lastPhoto} alt="Готовый букет" style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }} data-testid={`order-photo-${o.id}`} />
                  </div>
                </div>
              )}

              {/* Approve / disapprove */}
              {isWaitingApproval && lastPhoto && (
                <div>
                  {showFeedbackInput[o.id] ? (
                    <div>
                      <label className="eyebrow" style={{ color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem' }}>Что доработать</label>
                      <textarea
                        placeholder="Например: добавьте больше зелени, замените ленту"
                        rows={2}
                        value={feedbackTexts[o.id] || ''}
                        onChange={e => setFeedbackTexts(prev => ({ ...prev, [o.id]: e.target.value }))}
                        style={{ marginBottom: '0.6rem' }}
                        data-testid={`feedback-input-${o.id}`}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setShowFeedbackInput(prev => ({ ...prev, [o.id]: false }))}
                          style={{ padding: '0.7rem 1rem', fontSize: '0.72rem', letterSpacing: '0.2em' }}
                          disabled={submittingId === o.id}
                        >Отмена</button>
                        <button
                          type="button"
                          className="primary"
                          onClick={() => handleDisapprove(o.id)}
                          style={{ flex: 1, padding: '0.7rem', fontSize: '0.72rem', letterSpacing: '0.22em' }}
                          disabled={submittingId === o.id}
                          data-testid={`submit-feedback-${o.id}`}
                        >Отправить правки</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setShowFeedbackInput(prev => ({ ...prev, [o.id]: true }))}
                        style={{ flex: 1, padding: '0.85rem 0', fontSize: '0.72rem', letterSpacing: '0.2em' }}
                        disabled={submittingId === o.id}
                        data-testid={`disapprove-btn-${o.id}`}
                      >
                        <X size={13} strokeWidth={1.5} /> Правки
                      </button>
                      <button
                        type="button"
                        className="primary"
                        onClick={() => handleApprove(o.id)}
                        style={{ flex: 1, padding: '0.85rem 0', fontSize: '0.72rem', letterSpacing: '0.2em' }}
                        disabled={submittingId === o.id}
                        data-testid={`approve-btn-${o.id}`}
                      >
                        <Check size={13} strokeWidth={1.5} /> Одобрить
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Payment section */}
              {isWaitingPayment && (
                <div style={{ marginTop: '1.4rem', paddingTop: '1.4rem', borderTop: '1px solid var(--line)' }}>
                  {o.paymentLink ? (
                    <a
                      href={o.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="primary"
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textAlign: 'center', padding: '0.95rem', fontSize: '0.78rem', letterSpacing: '0.22em', marginBottom: '0.7rem' }}
                      data-testid={`pay-link-${o.id}`}
                    >
                      <CreditCard size={13} strokeWidth={1.5} /> Перейти к оплате
                    </a>
                  ) : (
                    <div style={{ padding: '0.85rem 1rem', background: 'var(--champagne-tint)', border: '1px solid var(--champagne)', fontSize: '0.82rem', color: 'var(--ink)', marginBottom: '0.7rem' }}>
                      <div className="eyebrow" style={{ color: 'var(--wine)', marginBottom: '0.3rem' }}>Ожидание</div>
                      Флорист готовит реквизиты для оплаты. Уведомим в Telegram.
                    </div>
                  )}

                  <button
                    type="button"
                    className="secondary"
                    onClick={() => fileInputRefs.current[o.id]?.click()}
                    style={{ width: '100%', padding: '0.85rem', fontSize: '0.72rem', letterSpacing: '0.2em' }}
                    disabled={submittingId === o.id}
                    data-testid={`upload-receipt-btn-${o.id}`}
                  >
                    <Upload size={13} strokeWidth={1.5} /> Загрузить чек
                  </button>
                  <input
                    type="file"
                    ref={el => (fileInputRefs.current[o.id] = el)}
                    onChange={(e) => handleReceiptUpload(o.id, e)}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              )}

              {/* Feedback status */}
              {o.clientFeedback && o.status === 'ASSEMBLING' && (
                <div style={{ marginTop: '1rem', background: 'var(--champagne-tint)', border: '1px solid var(--champagne)', padding: '0.85rem 1rem' }}>
                  <div className="eyebrow" style={{ color: 'var(--wine)', marginBottom: '0.3rem' }}>Ваши правки в работе</div>
                  <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>«{o.clientFeedback}»</span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
