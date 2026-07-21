import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProductsQuery } from '../api/gallery';
import { useTelegram } from '../hooks/useTelegram';
import ArrowRightIcon from '../assets/icons/arrow-right.svg'
import MessageSquareIcon from '../assets/icons/message-square.svg'
import SendIcon from '../assets/icons/send.svg'

const HERO_IMG = 'https://images.unsplash.com/photo-1572454591674-2739f30d8c40?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85';

export default function Home() {
  const navigate = useNavigate();
  const { haptic } = useTelegram();
  const { data: products = [], isPending: loading } = useProductsQuery();
  const featuredProducts = products.slice(0, 4);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Здравствуйте. Я — цифровой флорист fabrika.flo. Расскажите, для какого повода вы ищете букет — и я предложу композицию под ваш стиль и бюджет.' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text || sending) return;
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInputMessage('');
    setSending(true);
    haptic.impact('light');

    setTimeout(() => {
      const lc = text.toLowerCase();
      let reply;
      if (/рожден/i.test(lc)) reply = 'Для дня рождения мы часто собираем букеты на пионовидных розах и гортензии с акцентом ранункулюса. Укажите бюджет — и я подберу три варианта.';
      else if (/свидан|любов|девушк/i.test(lc)) reply = 'Для романтического повода — монобукет из бордовых роз David Austin или пудровые тюльпаны в льняной упаковке. Работа авторская.';
      else reply = 'Прекрасно. Наши флористы соберут единичный авторский букет. Нажмите «Оформить заказ» — и мы обсудим цветовую гамму и повод.';
      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      haptic.success();
      setSending(false);
    }, 900);
  };

  return (
    <div className="container page-transition" data-testid="home-page">

      {/* HERO EDITORIAL */}
      <section className="hero-editorial">
        <div className="hero-text">
          <span className="eyebrow">Атлас № 001 · Зима 2026</span>
          <h1>
            Букет как <em>жест</em>,<br/>
            а не как <em>подарок</em>.
          </h1>
          <p>
            fabrika.flo — это цветочный цех авторских, единичных букетов.
            Каждая композиция собирается вручную под ваш повод, оттенок настроения и получателя.
          </p>
          <div className="hero-cta">
            <button className="primary" onClick={() => { haptic.impact('medium'); navigate('/checkout'); }} data-testid="hero-order-btn">
              Оформить букет <ArrowRightIcon width={14} height={14} strokeWidth={1.6} />
            </button>
            <button className="secondary" onClick={() => { haptic.impact('light'); navigate('/catalog'); }} data-testid="hero-catalog-btn">
              Смотреть работы
            </button>
          </div>
        </div>
        <div className="hero-image">
          <img src={HERO_IMG} alt="Авторский букет fabrika.flo" loading="eager" />
        </div>
      </section>

      {/* NUMBERS CALLOUT */}
      <section className="callout" data-testid="callout">
        <div className="item"><span className="k">2ч</span><span className="v">Доставка</span></div>
        <div className="item"><span className="k">100%</span><span className="v">Единичные</span></div>
        <div className="item"><span className="k">7 дн.</span><span className="v">Свежесть</span></div>
        <div className="item"><span className="k">1 к 1</span><span className="v">Согласование</span></div>
      </section>

      {/* PROCESS */}
      <div className="section-heading">
        <h2>Как мы <em>работаем</em></h2>
      </div>
      <div className="process-grid">
        <div className="process-step">
          <span className="step-num">i.</span>
          <h4>Заявка</h4>
          <p>Вы описываете повод, бюджет и получателя.</p>
        </div>
        <div className="process-step">
          <span className="step-num">ii.</span>
          <h4>Композиция</h4>
          <p>Флорист собирает единичный букет вручную.</p>
        </div>
        <div className="process-step">
          <span className="step-num">iii.</span>
          <h4>Согласование</h4>
          <p>Присылаем фото готового букета до отправки.</p>
        </div>
        <div className="process-step">
          <span className="step-num">iv.</span>
          <h4>Доставка</h4>
          <p>Курьер бережно передаёт композицию получателю.</p>
        </div>
      </div>

      {/* PORTFOLIO */}
      <div className="section-heading">
        <h2>Последние <em>работы</em></h2>
        <Link to="/catalog">все работы</Link>
      </div>

      {loading ? (
        <div className="responsive-products-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ aspectRatio: '4/5' }} />
          ))}
        </div>
      ) : (
        <div className="responsive-products-grid" data-testid="portfolio-grid">
          {featuredProducts.map(item => (
            <div
              key={item.id}
              className="product-card"
              onClick={() => { haptic.impact('light'); navigate(`/product/${item.id}`); }}
              data-testid={`portfolio-item-${item.id}`}
            >
              <div className="thumb">
                {item.photo_url
                  ? <img src={item.photo_url} alt={item.name} loading="lazy" />
                  : <div style={{display:'grid', placeItems:'center', width:'100%', height:'100%', color:'var(--ink-soft)', fontFamily:'var(--font-display)', fontStyle:'italic'}}>f.f</div>}
              </div>
              <div>
                <div className="name">{item.name}</div>
                <div className="price" style={{ marginTop: '0.25rem' }}>
                  {item.price_display || 'Индивидуально'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HAIRLINE */}
      <div className="hairline" aria-hidden="true">
        <span className="dot" /> <span style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:'0.9rem', color:'var(--ink-soft)'}}>f.f</span> <span className="dot" />
      </div>

      {/* AI FLORIST */}
      <div className="ai-teaser" data-testid="ai-teaser">
        <div className="top" onClick={() => setChatOpen(!chatOpen)}>
          <div className="avatar"><MessageSquareIcon width={18} height={18} strokeWidth={1.5} /></div>
          <div style={{ flex: 1 }}>
            <h4>Цифровой флорист</h4>
            <small>Подскажу композицию по поводу и стилю</small>
          </div>
          <span style={{ color: 'var(--wine)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
            {chatOpen ? 'Свернуть' : 'Открыть'}
          </span>
        </div>

        {chatOpen && (
          <>
            <div className="msgs" data-testid="ai-messages">
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.sender}`}>{m.text}</div>
              ))}
            </div>
            <form onSubmit={handleSend} className="composer">
              <input
                type="text"
                placeholder="Опишите повод или желание…"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                data-testid="ai-input"
              />
              <button type="submit" className="primary" disabled={sending} data-testid="ai-send-btn">
                <SendIcon width={14} height={14} strokeWidth={1.6} />
              </button>
            </form>
          </>
        )}
      </div>

      <div className="hairline" aria-hidden="true"><span className="dot" /></div>

      <p style={{ textAlign: 'center', fontSize: '0.7rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--ink-soft)', padding: '0 0 3rem' }}>
        © fabrika<span style={{color:'var(--champagne-lo)'}}>.</span>flo · цветочный цех
      </p>
    </div>
  );
}
