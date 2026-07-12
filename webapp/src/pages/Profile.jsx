import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Gift, MapPin } from 'lucide-react';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '../hooks/useLanguage';

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
  const { t, language } = useLanguage();
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
  const [editUsername, setEditUsername] = useState('');
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
        showAlert(language === 'ru' ? 'Аватар успешно обновлен!' : 'Avatar updated successfully!');
      } else {
        showAlert(language === 'ru' ? 'Ошибка загрузки аватара' : 'Failed to upload avatar');
      }
    } catch (err) {
      console.error(err);
      showAlert(language === 'ru' ? 'Ошибка при загрузке аватара' : 'Error uploading avatar');
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
        setEditName(p.full_name || '');
        setEditUsername(p.username || '');
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
      await api.updateProfile({ full_name: editName, username: editUsername });
      setProfile({ ...profile, full_name: editName, username: editUsername.replace('@', '') });
      setIsEditingProfile(false);
    } catch (e) {
      console.error(e);
      alert(language === 'ru' ? 'Ошибка сохранения данных' : 'Failed to save profile');
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
    const mapEn = {
      pending: '⏳ Pending payment',
      paid: '💰 Paid',
      confirmed: '✅ Confirmed',
      shipped: '🚚 Shipped',
      done: '🎉 Completed',
      cancelled: '❌ Cancelled'
    };
    const map = language === 'ru' ? mapRu : mapEn;
    return map[status] || status;
  };

  const updateSetting = async (key, value) => {
    try {
      haptic.impact('light');
      const newProfile = { ...profile, [key]: value };
      setProfile(newProfile);
      await api.updateProfile({ [key]: value });
    } catch (e) {
      console.error(e);
    }
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
  if (!profile) return <div className="container"><p>{language === 'ru' ? 'Ошибка загрузки профиля' : 'Failed to load profile'}</p></div>;

  const lastOrder = Array.isArray(orders) ? orders.find(o => o?.status !== 'cancelled') : null;

  return (
    <div className="container page-transition" style={{ paddingBottom: '6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
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
            profile.full_name?.charAt(0)?.toUpperCase() || '?'
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
              placeholder={language === 'ru' ? "Ваше имя" : "Your name"} 
              value={editName} 
              onChange={e => setEditName(e.target.value)} 
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', marginBottom: 0 }} 
            />
            <input 
              type="text" 
              placeholder={language === 'ru' ? "Имя пользователя @username" : "Username @username"} 
              value={editUsername} 
              onChange={e => setEditUsername(e.target.value)} 
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', marginBottom: 0 }} 
            />
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
              <button 
                className="primary" 
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', flex: 1, marginBottom: 0 }}
                onClick={saveProfileData}
              >
                💾 {language === 'ru' ? "Сохранить" : "Save"}
              </button>
              <button 
                className="secondary" 
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', flex: 1, marginBottom: 0 }}
                onClick={() => {
                  setEditName(profile.full_name || '');
                  setEditUsername(profile.username || '');
                  setIsEditingProfile(false);
                }}
              >
                {language === 'ru' ? "Отмена" : "Cancel"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ marginBottom: '0.2rem', fontSize: '1.2rem' }}>{profile.full_name || (language === 'ru' ? 'Имя не указано' : 'Name not set')}</h2>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', padding: '0.2rem', marginBottom: '0.2rem' }}
                onClick={() => setIsEditingProfile(true)}
              >
                ✏️
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
              {profile.username ? `@${profile.username}` : (language === 'ru' ? 'Логин не указан' : 'Username not set')}
            </p>
            {profile.discount_percent > 0 && (
              <span className="badge" style={{ background: '#ff4d4f', color: '#fff', fontSize: '0.8rem' }}>
                {t('profile_discount').replace('{percent}', profile.discount_percent)}
              </span>
            )}
          </div>
        )}
      </div>

      {lastOrder && (
        <div className="glass-card" style={{ 
          background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(27,67,50,0.6) 100%)',
          border: '1px solid rgba(201,168,76,0.4)',
          marginBottom: '1.5rem',
          padding: '1.2rem',
        }}>
          <h3 style={{ color: 'var(--gold)', fontSize: '1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {t('profile_quick_repeat')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
            {t('profile_repeat_desc').replace('{id}', lastOrder.id).replace('{date}', new Date(lastOrder.created_at).toLocaleDateString())}
          </p>
          <div style={{ fontSize: '0.85rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
            {Array.isArray(lastOrder.items) && lastOrder.items.map((item, idx) => (
              <div key={idx} style={{ color: 'var(--text)', marginBottom: idx < lastOrder.items.length - 1 ? '0.3rem' : 0 }}>
                • {item.qty} × {item.name} ({item.variant})
              </div>
            ))}
          </div>
          <button 
            className="primary" 
            style={{ width: '100%', padding: '0.8rem', background: 'linear-gradient(90deg, var(--gold), var(--gold-light))' }}
            onClick={() => handleRepeatOrder(lastOrder.id)}
            disabled={repeating}
          >
            {repeating ? t('profile_adding_to_cart') : t('profile_repeat_btn')}
          </button>
        </div>
      )}

      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('profile_region')}</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['bali', 'vietnam'].map(loc => (
              <button 
                key={loc}
                className={profile.location === loc ? 'primary' : 'secondary'}
                onClick={() => updateSetting('location', loc)}
                style={{ flex: 1, padding: '0.8rem' }}
              >
                {loc === 'bali' ? (language === 'ru' ? '🌴 Бали' : '🌴 Bali') : (language === 'ru' ? '🇻🇳 Вьетнам' : '🇻🇳 Vietnam')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('profile_currency')}</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(profile?.active_payment_methods?.split(',').filter(Boolean) || ['usdt', 'idr', 'uah', 'vnd'])
              .filter(curr => ['usdt', 'idr', 'uah', 'vnd'].includes(curr))
              .map(curr => (
                <button 
                  key={curr}
                  className={profile.preferred_currency === curr ? 'primary' : 'secondary'}
                  onClick={() => updateSetting('preferred_currency', curr)}
                  style={{ flex: 1, padding: '0.8rem' }}
                >
                  {curr === 'uah' ? 'RUB' : curr.toUpperCase()}
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={20} /> {t('profile_address')}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          {t('profile_address_sub')}
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
          {t('profile_locate_me')}
        </button>

        <textarea
          className="input"
          placeholder={t('profile_address')}
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
            {savingAddress ? '...' : t('profile_confirm_address')}
          </button>
        )}
      </div>

      <div className="glass-card" style={{ 
        background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%)',
        border: '1px solid rgba(201,168,76,0.3)',
        marginBottom: '1.5rem'
      }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gift size={20} /> {profile?.is_partner 
              ? (language === 'ru' ? 'Персональная партнерская программа' : 'Personal Partner Program')
              : t('profile_referral')}
          </h3>
        </div>
        
        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', lineHeight: '1.4' }}>
          {profile?.is_partner 
            ? (language === 'ru' 
                ? 'Вы являетесь участником персональной партнерской программы (MLM).' 
                : 'You are a member of the Personal Partner Program (MLM).')
            : (language === 'ru' 
                ? 'Приглашайте друзей и получайте бонусы с их покупок!' 
                : 'Invite friends and earn bonuses from their purchases!')}
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
            <span>ℹ️ {language === 'ru' ? 'Как работают начисления?' : 'How do bonuses work?'}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
              {showRefRules 
                ? (language === 'ru' ? '▲ Свернуть' : '▲ Collapse') 
                : (language === 'ru' ? '▼ Показать условия' : '▼ View terms')}
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
                  {language === 'ru' ? (
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
                  ) : (
                    <>
                      You have a multi-level affiliate program enabled. You earn bonuses from your entire referral network:
                      <ul style={{ margin: '0.3rem 0 0.5rem 1rem', padding: 0 }}>
                        <li>Bonuses are paid from <strong style={{ color: 'var(--text)' }}>all orders lifetime</strong> (no 3-order limit).</li>
                        <li>Bonuses by 5 levels deep:
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem 1rem', marginTop: '0.3rem', background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: '6px' }}>
                            <div>1️⃣ Lvl 1 (direct): <strong>{profile?.referral_percent || 10}%</strong></div>
                            <div>2️⃣ Lvl 2: <strong>3%</strong></div>
                            <div>3️⃣ Lvl 3: <strong>2%</strong></div>
                            <div>4️⃣ Lvl 4: <strong>1%</strong></div>
                            <div>5️⃣ Lvl 5: <strong>1%</strong></div>
                          </div>
                        </li>
                      </ul>
                    </>
                  )}
                </div>
              ) : (
                // Rules for regular users
                <div>
                  <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: '0.3rem' }}>
                    🌱 Стандартная реферальная программа
                  </strong>
                  {language === 'ru' ? (
                    <>
                      Делитесь своей реферальной ссылкой и копите бонусы:
                      <ul style={{ margin: '0.3rem 0 0 1rem', padding: 0 }}>
                        <li>Вы получаете <strong style={{ color: 'var(--text)' }}>{profile?.referral_percent || 10}%</strong> от суммы покупок приглашённых друзей.</li>
                        <li>Начисления производятся <strong style={{ color: 'var(--text)' }}>только с первых 3-х заказов</strong> каждого друга.</li>
                        <li>Накопленные бонусы можно использовать для полной или частичной оплаты ваших собственных заказов.</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      Share your referral link and collect bonus points:
                      <ul style={{ margin: '0.3rem 0 0 1rem', padding: 0 }}>
                        <li>You get <strong style={{ color: 'var(--text)' }}>{profile?.referral_percent || 10}%</strong> from purchases of invited friends.</li>
                        <li>Bonuses are credited <strong style={{ color: 'var(--text)' }}>only for their first 3 orders</strong>.</li>
                        <li>Accumulated bonuses can be used to pay for your own orders.</li>
                      </ul>
                    </>
                  )}
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
                📢 {refName ? (
                  language === 'ru' 
                    ? `Вас пригласил в программу: ${refName}. Администратор @Rus_Buch активировал вам персональную партнерскую программу.` 
                    : `You were invited by: ${refName}. Administrator @Rus_Buch activated your Personal Partner Program.`
                ) : (
                  language === 'ru'
                    ? 'Администратор @Rus_Buch активировал вам персональную партнерскую программу.'
                    : 'Administrator @Rus_Buch activated your Personal Partner Program.'
                )}
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
                🤝 {language === 'ru' ? `Вас пригласил в программу: ${refName}` : `You were invited by: ${refName}`}
              </div>
            );
          }
          return null;
        })()}

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{t('profile_ref_balance')}</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--gold)' }}>${profile.bonus_balance}</div>
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
            <Copy size={18} /> {t('profile_copy_ref_link')}
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
                👥 {profile.is_partner 
                  ? (language === 'ru' ? 'Реферальная сеть' : 'Referral Network')
                  : (language === 'ru' ? `Приглашенные друзья (${profile.invitees.length})` : `Invited Friends (${profile.invitees.length})`)}
              </h4>
              
              {profile.is_partner && (
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
                  {['all', '1', '2', '3', '4', '5'].map(lvl => {
                    const label = lvl === 'all' 
                      ? (language === 'ru' ? 'Все' : 'All') 
                      : `${language === 'ru' ? 'Ур.' : 'Lvl'} ${lvl}`;
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
                  {language === 'ru' ? 'Нет рефералов на этом уровне' : 'No referrals at this level'}
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
                              {language === 'ru' ? `${friend.level}-й уровень` : `Lvl ${friend.level}`}
                            </span>
                          )}
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{language === 'ru' ? 'Регистрация' : 'Registered'}: {friend.created_at}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 'bold' }}>+${friend.earned.toFixed(2)}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {profile.is_partner 
                            ? (language === 'ru' ? 'кэшбек' : 'cashback')
                            : (language === 'ru' ? `Заказов: ${friend.orders_count}/3` : `Orders: ${friend.orders_count}/3`)}
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
              📜 {language === 'ru' ? 'История начислений' : 'Earnings History'}
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
                      {language === 'ru' ? `Заказ #${tx.order_id}` : `Order #${tx.order_id}`}
                      <span style={{ 
                        marginLeft: '0.4rem',
                        fontSize: '0.65rem', 
                        padding: '0.05rem 0.35rem', 
                        borderRadius: '4px', 
                        background: 'rgba(201,168,76,0.12)', 
                        color: 'var(--gold)',
                        fontWeight: '500'
                      }}>
                        {language === 'ru' ? `${tx.level}-й уровень` : `Lvl ${tx.level}`}
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

      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', marginTop: '2rem' }}>{t('profile_my_orders')}</h3>
      {(!Array.isArray(orders) || orders.length === 0) ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>{t('profile_orders_empty')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(o => (
            <div key={o?.id || Math.random()} className="glass-card">
              <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{language === 'ru' ? 'Заказ' : 'Order'} #{o?.id}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{o?.created_at ? new Date(o.created_at).toLocaleDateString() : 'Unknown date'}</div>
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
                <span>{language === 'ru' ? 'Итого' : 'Total'} ({o?.currency ? (o.currency === 'uah' ? 'RUB' : o.currency.toUpperCase()) : 'UNKNOWN'}):</span>
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
                    showAlert(language === 'ru' 
                      ? `Реквизиты для оплаты:\n\n${o?.payment_details || 'Реквизиты временно недоступны. Свяжитесь с поддержкой.'}`
                      : `Payment Details:\n\n${o?.payment_details || 'Payment details are temporarily unavailable. Please contact support.'}`
                    );
                    haptic.impact('medium');
                  }}
                >
                  {t('profile_order_details')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
