import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';
import { Sparkles, ArrowRight, MessageSquare, Send, Flower, Heart } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { haptic, showAlert } = useTelegram();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Florist Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Здравствуйте! Я ваш персональный ИИ-флорист Fabrika Flo. Расскажите, для какого повода вы ищете букет, и я помогу вам определиться с составом и стилем!' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    api.getProducts()
      .then(res => setProducts(res.slice(0, 4)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || sendingMessage) return;

    const userText = inputMessage.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMessage('');
    setSendingMessage(true);
    haptic.impact('light');

    try {
      // Mock response for consultation (or we can call a backend custom AI route if available)
      setTimeout(() => {
        let aiText = '';
        const textLower = userText.toLowerCase();
        if (textLower.includes('день рождения') || textLower.includes('рождени')) {
          aiText = 'Для Дня рождения отлично подойдут яркие авторские букеты с пионовидными розами и гортензиями. Каков ваш ориентировочный бюджет? Вы можете нажать кнопку "Заказать" ниже, чтобы настроить индивидуальные параметры!';
        } else if (textLower.includes('свидание') || textLower.includes('любов') || textLower.includes('девушк')) {
          aiText = 'Для романтического свидания прекрасно подойдут нежные монобукеты из роз пудровых оттенков или весенние тюльпаны. Мы можем упаковать их в минималистичную корейскую бумагу!';
        } else {
          aiText = 'Прекрасный выбор! Наши флористы соберут для вас уникальный авторский букет из самых свежих цветов. Рекомендую нажать кнопку "Заказать букет" ниже, чтобы указать ваши точные пожелания и бюджет!';
        }
        setMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
        haptic.success();
        setSendingMessage(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      setSendingMessage(false);
    }
  };

  return (
    <div className="container page-transition" style={{ paddingBottom: '6rem' }}>
      
      {/* Hero Header */}
      <div 
        className="glass-card" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(27, 67, 50, 0.9) 0%, rgba(8, 28, 21, 0.95) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          padding: '2rem 1.5rem',
          borderRadius: '20px',
          textAlign: 'center',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '100px', height: '100px', background: 'var(--gold)', filter: 'blur(60px)', opacity: 0.15 }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '120px', height: '120px', background: 'var(--emerald)', filter: 'blur(70px)', opacity: 0.2 }}></div>

        <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.8rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
          Мастерская цветов <span style={{ color: 'var(--gold)' }}>Fabrika Flo</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: '1.5', maxWidth: '320px', margin: '0 auto 1.5rem auto' }}>
          Создаем неповторимые авторские букеты под ваш повод, пожелания и бюджет с доставкой за 2 часа.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <button 
            className="primary" 
            onClick={() => { haptic.impact('medium'); navigate('/checkout'); }}
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', color: '#0d2818', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Sparkles size={18} /> Заказать индивидуальный букет
          </button>
          <button 
            className="secondary" 
            onClick={() => { haptic.impact('light'); navigate('/catalog'); }}
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            Смотреть портфолио <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Steps Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--gold)', fontSize: '1.1rem' }}>Как мы работаем</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1rem', borderRadius: '12px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📋</div>
            <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.2rem' }}>1. Оставляете заявку</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Указываете повод, бюджет, пожелания и дату.</span>
          </div>
          <div className="glass-card" style={{ padding: '1rem', borderRadius: '12px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🌸</div>
            <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.2rem' }}>2. Собираем букет</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Флорист составляет уникальную авторскую композицию.</span>
          </div>
          <div className="glass-card" style={{ padding: '1rem', borderRadius: '12px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📸</div>
            <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.2rem' }}>3. Согласуем фото</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Пришлем фото в приложение для вашего одобрения.</span>
          </div>
          <div className="glass-card" style={{ padding: '1rem', borderRadius: '12px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚚</div>
            <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.2rem' }}>4. Быстрая доставка</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Курьер бережно привезет букет получателю.</span>
          </div>
        </div>
      </div>

      {/* Featured Portfolio Items */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>Наши последние работы</h3>
          <Link to="/catalog" style={{ color: 'var(--gold)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            Все работы <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="spinner" style={{ margin: '2rem auto' }}></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {products.map(item => (
              <div 
                key={item.id} 
                className="glass-card" 
                onClick={() => { haptic.impact('light'); navigate(`/product/${item.id}`); }}
                style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}
              >
                <div style={{ width: '100%', height: '140px', overflow: 'hidden' }}>
                  <img src={item.photo_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '0.8rem' }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Индивидуальный заказ</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom AI Florist Assistant Drawer */}
      <div className="glass-card" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1rem' }}>
        <div className="flex-between" style={{ marginBottom: '0.5rem', cursor: 'pointer' }} onClick={() => setChatOpen(!chatOpen)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#fff' }}>ИИ-Консультант</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Помогу выбрать цветы и стиль</span>
            </div>
          </div>
          <span style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>{chatOpen ? 'Свернуть' : 'Открыть'}</span>
        </div>

        {chatOpen && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.8rem' }}>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem', paddingRight: '0.2rem' }}>
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    background: m.sender === 'user' ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                    color: m.sender === 'user' ? '#000' : '#fff',
                    padding: '0.6rem 0.8rem',
                    borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    fontSize: '0.85rem',
                    maxWidth: '80%',
                    lineHeight: '1.4'
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Напишите повод или вопрос..." 
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff' }}
              />
              <button 
                type="submit" 
                className="primary" 
                style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', color: '#0d2818', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                disabled={sendingMessage}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
