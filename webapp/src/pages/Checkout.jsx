import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Upload, X } from 'lucide-react';

const customIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="font-size: 2rem; transform: translate(-50%, -100%); text-shadow: 0px 2px 5px rgba(0,0,0,0.5);">📍</div>',
  iconSize: [0, 0]
});

function LocationPicker({ position, onPositionChange }) {
  const map = useMap();
  
  useMapEvents({
    click: (e) => {
      onPositionChange(e.latlng);
    }
  });

  useEffect(() => {
    if (position) {
      map.setView(position, map.zoom || 11);
    }
  }, [position, map]);

  return position ? <Marker position={position} icon={customIcon} /> : null;
}

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { haptic, showAlert } = useTelegram();
  const [profile, setProfile] = useState(null);
  
  const refPhoto = searchParams.get('ref_photo');
  const refTitle = searchParams.get('ref_title');

  const [form, setForm] = useState({
    occasion: 'День рождения',
    customOccasion: '',
    budget: 4000,
    date: '',
    deliveryType: 'DELIVERY', // DELIVERY | PICKUP
    deliveryAddress: '',
    recipientPhone: '',
    postcardText: '',
    comment: '',
    examplePhotoUrl: refPhoto || ''
  });

  const [mapPosition, setMapPosition] = useState({ lat: 55.755826, lng: 37.617299 }); // Moscow default
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.getProfile().then(p => {
      setProfile(p);
      setForm(f => ({
        ...f,
        recipientPhone: p.phone || '',
        deliveryAddress: p.address || ''
      }));
      if (p.address_lat && p.address_lng) {
        setMapPosition({ lat: parseFloat(p.address_lat), lng: parseFloat(p.address_lng) });
      }
    }).catch(console.error);
  }, []);

  const handlePositionChange = async (latlng) => {
    setMapPosition(latlng);
    haptic.impact('light');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setForm(f => ({ ...f, deliveryAddress: data.display_name }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const locateMe = () => {
    haptic.impact('medium');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          handlePositionChange(latlng);
        },
        (err) => {
          console.error(err);
          showAlert('Не удалось определить положение автоматически. Выберите точку на карте.');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      showAlert('Геолокация не поддерживается вашим устройством.');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingPhoto(true);
      haptic.impact('light');
      const res = await api.uploadRequestPhoto(file);
      setForm(f => ({ ...f, examplePhotoUrl: res.url }));
      haptic.success();
      showAlert('Фото успешно загружено!');
    } catch (err) {
      console.error(err);
      haptic.error();
      showAlert('Не удалось загрузить фото.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    if (e) e.preventDefault();
    if (form.deliveryType === 'DELIVERY' && !form.deliveryAddress.trim()) {
      setShowErrors(true);
      haptic.error();
      showAlert('Пожалуйста, заполните адрес доставки.');
      return;
    }
    if (!form.recipientPhone.trim()) {
      setShowErrors(true);
      haptic.error();
      showAlert('Пожалуйста, укажите контактный телефон.');
      return;
    }

    try {
      setSubmitting(true);
      haptic.impact('medium');
      
      const finalOccasion = form.occasion === 'Другое' ? form.customOccasion : form.occasion;
      
      await api.createRequest({
        occasion: finalOccasion,
        budget: Number(form.budget),
        date: form.date || null,
        deliveryType: form.deliveryType,
        deliveryAddress: form.deliveryType === 'DELIVERY' ? form.deliveryAddress : 'Самовывоз',
        recipientPhone: form.recipientPhone,
        postcardText: form.postcardText || null,
        comment: form.comment || null,
        examplePhotoUrl: form.examplePhotoUrl || null
      });

      haptic.success();
      showAlert('Ваша заявка успешно отправлена! Мы свяжемся с вами в Telegram.');
      navigate('/orders');
    } catch (err) {
      console.error(err);
      haptic.error();
      showAlert('Ошибка при оформлении заявки.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page-transition" style={{ paddingBottom: '6rem' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        🌸 Оформление заявки
      </h2>

      {refTitle && (
        <div className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', border: '1px solid var(--gold)' }}>
          <img src={refPhoto} alt={refTitle} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--gold)', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Выбранный букет-ориентир:</span>
            <strong style={{ fontSize: '1rem', color: '#fff' }}>{refTitle}</strong>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitRequest}>
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--gold)' }}>Параметры букета</h3>
          
          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Повод для подарка</label>
          <select 
            value={form.occasion} 
            onChange={e => setForm({ ...form, occasion: e.target.value })}
            style={{ marginBottom: '1rem', width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <option value="День рождения" style={{ background: '#1b4332' }}>День рождения</option>
            <option value="Свидание" style={{ background: '#1b4332' }}>Свидание</option>
            <option value="Годовщина" style={{ background: '#1b4332' }}>Годовщина</option>
            <option value="Свадьба" style={{ background: '#1b4332' }}>Свадьба</option>
            <option value="Просто так" style={{ background: '#1b4332' }}>Просто так</option>
            <option value="Другое" style={{ background: '#1b4332' }}>Другое</option>
          </select>

          {form.occasion === 'Другое' && (
            <input 
              type="text" 
              placeholder="Укажите ваш повод" 
              value={form.customOccasion}
              onChange={e => setForm({ ...form, customOccasion: e.target.value })}
              required
              style={{ marginBottom: '1rem' }}
            />
          )}

          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
            Ориентировочный бюджет: <strong style={{ color: 'var(--gold)' }}>{form.budget} руб.</strong>
          </label>
          <input 
            type="range" 
            min="2000" 
            max="25000" 
            step="500"
            value={form.budget}
            onChange={e => { setForm({ ...form, budget: Number(e.target.value) }); haptic.impact('light'); }}
            style={{ width: '100%', marginBottom: '1.5rem', accentColor: 'var(--gold)' }}
          />

          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Желаемая дата и время доставки</label>
          <input 
            type="datetime-local" 
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            style={{ marginBottom: '1rem', width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--gold)' }}>Получение и контакты</h3>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
            <button
              type="button"
              className={form.deliveryType === 'DELIVERY' ? 'primary' : 'secondary'}
              onClick={() => { setForm({ ...form, deliveryType: 'DELIVERY' }); haptic.impact('light'); }}
              style={{ flex: 1, padding: '0.6rem 0', borderRadius: '8px', fontSize: '0.9rem' }}
            >
              🛵 Доставка
            </button>
            <button
              type="button"
              className={form.deliveryType === 'PICKUP' ? 'primary' : 'secondary'}
              onClick={() => { setForm({ ...form, deliveryType: 'PICKUP' }); haptic.impact('light'); }}
              style={{ flex: 1, padding: '0.6rem 0', borderRadius: '8px', fontSize: '0.9rem' }}
            >
              🏪 Самовывоз
            </button>
          </div>

          {form.deliveryType === 'DELIVERY' ? (
            <>
              <div style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', marginBottom: '0.8rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <MapContainer center={mapPosition} zoom={11} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution="&copy; OpenStreetMap"
                  />
                  <LocationPicker position={mapPosition} onPositionChange={handlePositionChange} />
                </MapContainer>
              </div>
              
              <button 
                type="button" 
                className="secondary" 
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '8px' }} 
                onClick={locateMe}
              >
                📍 Моя геопозиция
              </button>

              <textarea 
                placeholder="Адрес доставки (Улица, дом, квартира, подъезд...)" 
                rows="2"
                value={form.deliveryAddress}
                onChange={e => setForm({ ...form, deliveryAddress: e.target.value })}
                required={form.deliveryType === 'DELIVERY'}
                style={{ marginBottom: '1rem', border: showErrors && !form.deliveryAddress ? '1px solid red' : undefined }}
              />
            </>
          ) : (
            <div style={{ background: 'rgba(201,168,76,0.05)', border: '1px dashed var(--gold)', borderRadius: '12px', padding: '1rem', color: '#fff', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <strong>Адрес самовывоза:</strong> Москва, ул. Большая Дмитровка, д. 12
            </div>
          )}

          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Номер телефона для связи</label>
          <input 
            type="tel" 
            placeholder="+79991234567" 
            value={form.recipientPhone}
            onChange={e => setForm({ ...form, recipientPhone: e.target.value })}
            required
            style={{ marginBottom: '0', border: showErrors && !form.recipientPhone ? '1px solid red' : undefined }}
          />
        </div>

        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--gold)' }}>Пожелания и открытка</h3>

          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Текст открытки (необязательно)</label>
          <textarea 
            placeholder="Напишите текст пожелания, который мы подпишем на красивой фирменной открытке..." 
            rows="2"
            value={form.postcardText}
            onChange={e => setForm({ ...form, postcardText: e.target.value })}
            style={{ marginBottom: '1rem' }}
          />

          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Особые пожелания к букету (необязательно)</label>
          <textarea 
            placeholder="Цветовая гамма, любимые цветы получателя, стиль упаковки или любые другие пожелания..." 
            rows="3"
            value={form.comment}
            onChange={e => setForm({ ...form, comment: e.target.value })}
            style={{ marginBottom: '0' }}
          />
        </div>

        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--gold)' }}>Фото-пример / Референс</h3>
          
          {form.examplePhotoUrl ? (
            <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gold)' }}>
              <img src={form.examplePhotoUrl} alt="Example Reference" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button 
                type="button" 
                onClick={() => setForm({ ...form, examplePhotoUrl: '' })} 
                style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', height: '120px', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <Upload size={24} />
              <span style={{ fontSize: '0.85rem' }}>{uploadingPhoto ? 'Загрузка...' : 'Загрузить фото-пример'}</span>
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </div>

        <button type="submit" className="primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', color: '#0d2818' }} disabled={submitting || uploadingPhoto}>
          {submitting ? 'Отправка заявки...' : '🌸 Отправить заявку флористу'}
        </button>
      </form>
    </div>
  );
}
