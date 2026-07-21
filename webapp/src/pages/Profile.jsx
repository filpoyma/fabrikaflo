import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Gift, MapPin } from 'lucide-react';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

const customIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="font-size: 2rem; transform: translate(-50%, -100%); text-shadow: 0px 2px 5px rgba(0,0,0,0.5);">📍</div>',
  iconSize: [0, 0]
});

function LocationPicker({ position, onPositionChange }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (position) {
      map.setView(position);
    }
  }, [position, map]);

  return position ? <Marker position={position} icon={customIcon} /> : null;
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repeating, setRepeating] = useState(false);
  const { haptic, showAlert } = useTelegram();
  
  const [addressText, setAddressText] = useState('');
  const [mapPosition, setMapPosition] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [activeRefLevel, setActiveRefLevel] = useState('all');
  const [showRefRules, setShowRefRules] = useState(false);

  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarClick = () => {
    if (avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    haptic.impact('light');
    setUploadingAvatar(true);
    try {
      const res = await api.uploadAvatar(file);
      if (res.ok && res.url) {
        await api.updateProfile({ photo_url: res.url });
        setProfile(prev => ({ ...prev, photo_url: res.url }));
        showAlert('Аватар успешно обновлен!');
      } else {
        showAlert('Ошибка загрузки аватара');
      }
    } catch (err) {
      console.error(err);
      showAlert('Ошибка при загрузке аватара');
    } finally {
      setUploadingAvatar(false);
    }
  };


  const isAddressChanged = 
    addressText.trim() !== (profile?.address || '').trim() ||
    (mapPosition && (mapPosition.lat !== profile?.address_lat || mapPosition.lng !== profile?.address_lng));

  useEffect(() => {
    Promise.all([
      api.getProfile().then(p => {
        setProfile(p);
        setEditName(p.name || '');
        setAddressText(p.address || '');
        if (p.address_lat && p.address_lng) {
          setMapPosition({ lat: p.address_lat, lng: p.address_lng });
        } else {
          setMapPosition({ lat: -8.409518, lng: 115.188919 });
        }
      }),
      api.getOrders().then(setOrders).catch(console.error)
    ])
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const saveProfileData = async () => {
    try {
      haptic.impact('medium');
      const updatedProfile = await api.updateProfile({ name: editName });
      setProfile(updatedProfile);
      setIsEditingProfile(false);
    } catch (e) {
      console.error(e);
      alert('Ошибка сохранения данных');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'paid': return 'green';
      case 'confirmed': return 'green';
      case 'shipped': return 'gold';
      case 'done': return 'green';
      case 'cancelled': return 'red';
      default: return 'gold';
    }
  };

  const getStatusText = (status) => {
    const mapRu = {
      pending: '⏳ Ожидает оплаты',
      paid: '💰 Оплачен',
      confirmed: '✅ Подтверждён',
      shipped: '🚚 Отправлен',
      done: '🎉 Завершён',
      cancelled: '❌ Отменён'
    };
    return mapRu[status] || status;
  };

  const handlePositionChange = async (latlng) => {
    setMapPosition(latlng);
    haptic.impact('light');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddressText(data.display_name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const locateMe = () => {
    haptic.impact('medium');
    const tg = window.Telegram?.WebApp;
    if (tg?.LocationManager && typeof tg.LocationManager.init === 'function') {
      const lm = tg.LocationManager;
      
      const requestTGLocation = () => {
        lm.getLocation((data) => {
          if (data && data.latitude) {
            const latlng = { lat: data.latitude, lng: data.longitude };
            handlePositionChange(latlng);
          } else {
            fallbackGeo();
          }
        });
      };

      if (!lm.isInited) {
        lm.init(() => {
          if (lm.isLocationAvailable && lm.isAccessGranted) {
            requestTGLocation();
          } else {
            fallbackGeo();
          }
        });
        return;
      } else {
        if (lm.isLocationAvailable && lm.isAccessGranted) {
          requestTGLocation();
          return;
        }
      }
    }
    fallbackGeo();
  };

  const fallbackGeo = () => {
    if (!navigator.geolocation) {
      showAlert('Геолокация не поддерживается вашим устройством');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        handlePositionChange(latlng);
      },
      (err) => {
        console.error(err);
        showAlert('Не удалось определить местоположение. Пожалуйста, введите название отеля или улицы в строке поиска выше или выберите место на карте вручную.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSearchAddress = async (query) => {
    if (!query || !query.trim()) return;
    haptic.impact('light');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const latlng = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
        handlePositionChange(latlng);
      } else {
        showAlert('Ничего не найдено. Попробуйте ввести более точное название (например, город или отель).');
      }
    } catch (e) {
      console.error(e);
      showAlert('Ошибка при поиске адреса.');
    }
  };

  const saveAddress = async () => {
    if (!addressText.trim()) {
      showAlert('Введите адрес!');
      return;
    }
    setSavingAddress(true);
    haptic.impact('heavy');
    try {
      const payload = { address: addressText };
      if (mapPosition) {
        payload.address_lat = mapPosition.lat;
        payload.address_lng = mapPosition.lng;
      }
      await api.updateProfile(payload);
      setProfile({ ...profile, ...payload });
      showAlert('Адрес доставки сохранен!');
    } catch (e) {
      console.error(e);
      showAlert('Ошибка сохранения адреса');
    } finally {
      setSavingAddress(false);
    }
  };

  const copyRefLink = () => {
    if (!profile) return;
    const link = profile.referral_link || `https://t.me/herbalspiritasia_bot?start=${profile.referral_code}`;
    navigator.clipboard.writeText(link).then(() => {
      haptic.success();
      showAlert('Ссылка скопирована!');
    }).catch(console.error);
  };

  const handleRepeatOrder = async (orderId) => {
    try {
      setRepeating(true);
      haptic.impact('heavy');
      await api.repeatOrder(orderId);
      haptic.success();
      showAlert('Корзина успешно заполнена товарами из прошлого заказа!');
      navigate('/cart');
    } catch (e) {
      console.error(e);
      let errMsg = 'Ошибка при повторении заказа';
      try {
        const parsed = JSON.parse(e.message);
        if (parsed.detail) {
          errMsg = parsed.detail;
        }
      } catch (err) {}
      showAlert(errMsg);
    } finally {
      setRepeating(false);
    }
  };

  if (loading) return <div className="spinner"></div>;
  if (!profile) return <div className="container"><p>Ошибка загрузки профиля</p></div>;

  const lastOrder = Array.isArray(orders) ? orders.find(o => o?.status !== 'cancelled') : null;

  return (
    <div className="container page-transition" style={{ paddingBottom: '6rem' }} data-testid="profile-page">
      <div className="page-title">
        <div>
          <span className="eyebrow">Личный кабинет</span>
          <h1 style={{ marginTop: '0.4rem' }}>Ваш <em>профиль</em></h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingTop: '0.5rem' }}>
        <div 
          onClick={handleAvatarClick}
          style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', color: '#000', fontWeight: 'bold',
            overflow: 'hidden', position: 'relative', cursor: 'pointer',
            border: '2px solid var(--gold)',
            flexShrink: 0
          }}
        >
          {profile.photo_url ? (
            <img 
              src={profile.photo_url.startsWith('/') ? `${api.API_BASE.replace('/api', '')}${profile.photo_url}` : profile.photo_url} 
              alt="Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            profile.name?.charAt(0)?.toUpperCase() || '?'
          )}
          {uploadingAvatar && (
            <div style={{ 
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
              background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', fontSize: '0.65rem', color: '#fff', fontWeight: 'normal' 
            }}>
              ...
            </div>
          )}
        </div>
        <input 
          type="file" 
          ref={avatarInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          onChange={handleAvatarChange} 
        />
        {isEditingProfile ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Ваше имя"
              value={editName} 
              onChange={e => setEditName(e.target.value)} 
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', marginBottom: 0 }} 
            />
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
              <button 
                className="primary" 
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', flex: 1, marginBottom: 0 }}
                onClick={saveProfileData}
              >
                💾 Сохранить
              </button>
              <button 
                className="secondary" 
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', flex: 1, marginBottom: 0 }}
                onClick={() => {
                  setEditName(profile.name || '');
                  setIsEditingProfile(false);
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ marginBottom: '0.2rem', fontSize: '1.2rem' }}>{profile.name || 'Имя не указано'}</h2>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', padding: '0.2rem', marginBottom: '0.2rem' }}
                onClick={() => setIsEditingProfile(true)}
              >
                ✏️
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
              {profile.tgname ? `@${profile.tgname}` : 'Telegram-ник не указан'}
            </p>
            {profile.discount_percent > 0 && (
              <span className="badge" style={{ background: '#ff4d4f', color: '#fff', fontSize: '0.8rem' }}>
                Скидка {profile.discount_percent}%
              </span>
            )}
          </div>
        )}
      </div>

      {lastOrder && (
        <div className="glass-card" style={{ 
          background: 'var(--champagne-tint)',
          border: '1px solid var(--champagne)',
          marginBottom: '1.5rem',
          padding: '1.2rem',
        }}>
          <h3 style={{ color: 'var(--wine)', fontSize: '1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🔄 Быстрый повтор заказа
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.8rem' }}>
            Повторить ваш прошлый заказ #{lastOrder.id} от {new Date(lastOrder.created_at).toLocaleDateString()}:
          </p>
          <div style={{ fontSize: '0.85rem', marginBottom: '1rem', background: 'var(--ivory)', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid var(--line)' }}>
            {Array.isArray(lastOrder.items) && lastOrder.items.map((item, idx) => (
              <div key={idx} style={{ color: 'var(--ink)', marginBottom: idx < lastOrder.items.length - 1 ? '0.3rem' : 0 }}>
                • {item.qty} × {item.name} ({item.variant})
              </div>
            ))}
          </div>
          <button 
            className="primary" 
            style={{ width: '100%', padding: '0.9rem' }}
            onClick={() => handleRepeatOrder(lastOrder.id)}
            disabled={repeating}
          >
            {repeating ? 'Добавление в корзину...' : '🛒 Повторить заказ'}
          </button>
        </div>
      )}

      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={20} /> Адрес доставки
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Укажите точку на карте или впишите адрес вручную. Он будет подставляться при заказах.
        </p>


        <div style={{ width: '100%', height: '280px', borderRadius: '12px', overflow: 'hidden', marginBottom: '0.8rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          {mapPosition && (
            <MapContainer center={mapPosition} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution="&copy; OpenStreetMap"
              />
              <LocationPicker position={mapPosition} onPositionChange={handlePositionChange} />
            </MapContainer>
          )}
        </div>

        <button 
          type="button" 
          className="secondary" 
          style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '8px' }} 
          onClick={locateMe}
        >
          📍 Найти меня на карте
        </button>

        <textarea
          className="input"
          placeholder="Адрес доставки"
          value={addressText}
          onChange={e => setAddressText(e.target.value)}
          rows={3}
          style={{ width: '100%', marginBottom: '1rem' }}
        />
        
        {isAddressChanged && (
          <button 
            className="primary" 
            style={{ width: '100%', padding: '1rem' }} 
            onClick={saveAddress}
            disabled={savingAddress}
          >
            {savingAddress ? '...' : '✅ Подтвердить адрес'}
          </button>
        )}
      </div>

      <div className="glass-card" style={{ 
        background: 'var(--ivory)',
        border: '1px solid var(--champagne)',
        marginBottom: '1.5rem'
      }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--wine)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
            <Gift size={18} strokeWidth={1.5} /> Партнёрская программа
          </h3>
        </div>
        
        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', lineHeight: '1.4' }}>
          {profile?.is_partner
            ? 'Вы являетесь участником персональной партнерской программы (MLM).'
            : 'Приглашайте друзей и получайте бонусы с их покупок!'}
        </p>

        {/* Collapsible Info Accordion on Profile Page */}
        <div style={{ marginBottom: '1.2rem' }}>
          <button 
            type="button"
            className="secondary" 
            style={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '0.6rem 0.8rem', 
              borderRadius: '8px', 
              background: 'rgba(212, 175, 55, 0.08)', 
              border: '1px solid rgba(212, 175, 55, 0.25)',
              color: 'var(--gold-light)',
              fontWeight: '500',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
            onClick={() => {
              haptic.impact('light');
              setShowRefRules(!showRefRules);
            }}
          >
            <span>ℹ️ Как работают начисления?</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
              {showRefRules ? '▲ Свернуть' : '▼ Показать условия'}
            </span>
          </button>

          {showRefRules && (
            <div className="slide-up" style={{ 
              marginTop: '0.5rem', 
              padding: '0.8rem', 
              background: 'rgba(0, 0, 0, 0.25)', 
              borderRadius: '8px', 
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.75rem',
              lineHeight: '1.45',
              color: 'var(--text-muted)'
            }}>
              {profile?.is_partner ? (
                // Rules for MLM partners
                <div>
                  <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: '0.3rem' }}>
                    👑 MLM-партнерская программа (5 ступеней)
                  </strong>
                  <>
                    Вам подключена многоуровневая партнерская программа. Вы получаете бонусы со всей своей реферальной сети:
                    <ul style={{ margin: '0.3rem 0 0.5rem 1rem', padding: 0 }}>
                      <li>Бонусы выплачиваются со <strong style={{ color: 'var(--text)' }}>всех заказов пожизненно</strong> (без лимита на 3 заказа).</li>
                      <li>Начисления по 5 уровням глубины:
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem 1rem', marginTop: '0.3rem', background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: '6px' }}>
                          <div>1️⃣ Ур. (прямые): <strong>{profile?.referral_percent || 10}%</strong></div>
                          <div>2️⃣ Уровень: <strong>3%</strong></div>
                          <div>3️⃣ Уровень: <strong>2%</strong></div>
                          <div>4️⃣ Уровень: <strong>1%</strong></div>
                          <div>5️⃣ Уровень: <strong>1%</strong></div>
                        </div>
                      </li>
                    </ul>
                  </>
                </div>
              ) : (
                // Rules for regular users
                <div>
                  <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: '0.3rem' }}>
                    🌱 Стандартная реферальная программа
                  </strong>
                  <>
                    Делитесь своей реферальной ссылкой и копите бонусы:
                    <ul style={{ margin: '0.3rem 0 0 1rem', padding: 0 }}>
                      <li>Вы получаете <strong style={{ color: 'var(--text)' }}>{profile?.referral_percent || 10}%</strong> от суммы покупок приглашённых друзей.</li>
                      <li>Начисления производятся <strong style={{ color: 'var(--text)' }}>только с первых 3-х заказов</strong> каждого друга.</li>
                      <li>Накопленные бонусы можно использовать для полной или частичной оплаты ваших собственных заказов.</li>
                    </ul>
                  </>
                </div>
              )}
            </div>
          )}
        </div>

        {(() => {
          const refUser = profile?.referred_by_user;
          const refName = refUser 
            ? `${refUser.full_name}${refUser.username ? ` (@${refUser.username})` : ''}` 
            : null;
            
          if (profile?.is_partner) {
            return (
              <div style={{ 
                background: 'rgba(201,168,76,0.1)', 
                border: '1px dashed rgba(201,168,76,0.3)', 
                padding: '0.8rem 1rem', 
                borderRadius: '10px', 
                marginBottom: '1.2rem',
                fontSize: '0.8rem',
                color: 'var(--text-color)',
                lineHeight: '1.4'
              }}>
                📢 {refName
                  ? `Вас пригласил в программу: ${refName}. Администратор @Rus_Buch активировал вам персональную партнерскую программу.`
                  : 'Администратор @Rus_Buch активировал вам персональную партнерскую программу.'}
              </div>
            );
          } else if (refName) {
            return (
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px dashed rgba(255,255,255,0.1)', 
                padding: '0.8rem 1rem', 
                borderRadius: '10px', 
                marginBottom: '1.2rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                lineHeight: '1.4'
              }}>
                🤝 Вас пригласил в программу: {refName}
              </div>
            );
          }
          return null;
        })()}

        <div style={{ background: 'var(--champagne-tint)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', border: '1px solid var(--champagne)' }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>Ваш баланс:</div>
          <div style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, color: 'var(--wine)' }}>${profile.bonus_balance}</div>
        </div>

        {profile?.is_partner ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.4)', 
            padding: '0.8rem 1rem', 
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap', 
              marginRight: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              {profile?.referral_link || `https://t.me/herbalspiritasia_bot?start=${profile?.referral_code}`}
            </span>
            <button 
              onClick={copyRefLink} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--gold)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0.3rem'
              }}
            >
              <Copy size={16} />
            </button>
          </div>
        ) : (
          <button className="primary" style={{ width: '100%', padding: '1rem' }} onClick={copyRefLink}>
            <Copy size={18} /> Скопировать ссылку
          </button>
        )}

        {profile.invitees && profile.invitees.length > 0 && (() => {
          const filteredInvitees = profile.invitees.filter(friend => {
            if (!profile.is_partner) return true;
            if (activeRefLevel === 'all') return true;
            return friend.level === parseInt(activeRefLevel);
          });
          return (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.2rem' }}>
              <h4 style={{ color: 'var(--gold)', fontSize: '0.95rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                👥 {profile.is_partner ? 'Реферальная сеть' : `Приглашенные друзья (${profile.invitees.length})`}
              </h4>
              
              {profile.is_partner && (
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
                  {['all', '1', '2', '3', '4', '5'].map(lvl => {
                    const label = lvl === 'all' ? 'Все' : `Ур. ${lvl}`;
                    const count = lvl === 'all' 
                      ? profile.invitees.length 
                      : profile[`level_${lvl}_count`] || 0;
                    const isActive = activeRefLevel === lvl;
                    return (
                      <button 
                        key={lvl}
                        onClick={() => { haptic.impact('light'); setActiveRefLevel(lvl); }}
                        style={{
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.75rem',
                          borderRadius: '20px',
                          border: isActive ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                          background: isActive ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
                          color: isActive ? 'var(--gold)' : 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        {label} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredInvitees.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0', fontSize: '0.85rem' }}>
                  Нет рефералов на этом уровне
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.3rem' }}>
                  {filteredInvitees.map((friend, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      background: 'rgba(255,255,255,0.03)', 
                      padding: '0.6rem 0.8rem', 
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                          {friend.full_name} {friend.username && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>@{friend.username}</span>}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {profile.is_partner && (
                            <span style={{ 
                              fontSize: '0.65rem', 
                              padding: '0.05rem 0.35rem', 
                              borderRadius: '4px', 
                              background: 'rgba(201,168,76,0.15)', 
                              color: 'var(--gold)',
                              fontWeight: '500'
                            }}>
                              {friend.level}-й уровень
                            </span>
                          )}
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Регистрация: {friend.created_at}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 'bold' }}>+${friend.earned.toFixed(2)}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {profile.is_partner ? 'кэшбек' : `Заказов: ${friend.orders_count}/3`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {profile.transactions && profile.transactions.length > 0 && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.2rem' }}>
            <h4 style={{ color: 'var(--gold)', fontSize: '0.95rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              📜 История начислений
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.3rem' }}>
              {profile.transactions.map((tx, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: 'rgba(255,255,255,0.02)', 
                  padding: '0.5rem 0.7rem', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                      Заказ #{tx.order_id}
                      <span style={{ 
                        marginLeft: '0.4rem',
                        fontSize: '0.65rem', 
                        padding: '0.05rem 0.35rem', 
                        borderRadius: '4px', 
                        background: 'rgba(201,168,76,0.12)', 
                        color: 'var(--gold)',
                        fontWeight: '500'
                      }}>
                        {tx.level}-й уровень
                      </span>
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{tx.created_at}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 'bold' }}>+${tx.amount_usd.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', marginTop: '2rem' }}>📋 Мои заказы</h3>
      {(!Array.isArray(orders) || orders.length === 0) ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>У вас пока нет заказов</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(o => (
            <div key={o?.id || Math.random()} className="glass-card">
              <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Заказ #{o?.id}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{o?.created_at ? new Date(o.created_at).toLocaleDateString('ru-RU') : 'Дата неизвестна'}</div>
                </div>
                <div className={`badge ${getStatusColor(o?.status)}`}>
                  {getStatusText(o?.status)}
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                {Array.isArray(o?.items) ? o.items.map((item, idx) => (
                  <div key={idx} className="flex-between" style={{ marginBottom: '0.3rem' }}>
                    <span>{item?.qty} × {item?.name} ({item?.variant})</span>
                    <span>${item?.subtotal}</span>
                  </div>
                )) : null}
              </div>
              
              <div className="flex-between" style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                <span>Итого ({o?.currency ? (o.currency === 'uah' ? 'RUB' : o.currency.toUpperCase()) : 'UNKNOWN'}):</span>
                <span style={{ color: 'var(--gold)' }}>
                  {o?.currency === 'usd' || o?.currency === 'usdt' ? '$' : ''}
                  {o?.total_in_currency}
                  {o?.currency === 'uah' ? ' ₽' : ''}
                  {o?.currency === 'idr' ? ' Rp' : ''}
                  {o?.currency === 'vnd' ? ' ₫' : ''}
                </span>
              </div>
              
              {o?.status === 'pending' && (
                <button 
                  className="primary" 
                  style={{ width: '100%', marginTop: '1rem', padding: '0.5rem' }} 
                  onClick={() => {
                    showAlert(`Реквизиты для оплаты:\n\n${o?.payment_details || 'Реквизиты временно недоступны. Свяжитесь с поддержкой.'}`);
                    haptic.impact('medium');
                  }}
                >
                  💳 Показать реквизиты
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
