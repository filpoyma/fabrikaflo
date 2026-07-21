// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProfileQuery } from '../api/clients';
import { useCreateRequestMutation, useUploadRequestPhotoMutation } from '../api/requests';
import { useTelegram } from '../hooks/useTelegram';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import UploadIcon from '../assets/icons/upload.svg'
import XIcon from '../assets/icons/x.svg'
import MapPinIcon from '../assets/icons/map-pin.svg'
import CheckIcon from '../assets/icons/check.svg'
import ArrowRightIcon from '../assets/icons/arrow-right.svg'

const customIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="width:14px;height:14px;background:#6A1A2B;border:2px solid #FDFBF7;border-radius:50%;box-shadow:0 4px 12px rgba(40,35,33,0.35);transform:translate(-50%,-50%);"></div>',
  iconSize: [0, 0]
});

function LocationPicker({ position, onPositionChange }) {
  const map = useMap();
  useMapEvents({ click: (e) => onPositionChange(e.latlng) });
  useEffect(() => { if (position) map.setView(position, map.zoom || 11); }, [position, map]);
  return position ? <Marker position={position} icon={customIcon} /> : null;
}

const OCCASIONS = [
  { value: 'День рождения', label: 'День рождения' },
  { value: 'Свидание',      label: 'Свидание' },
  { value: 'Годовщина',     label: 'Годовщина' },
  { value: 'Свадьба',       label: 'Свадьба' },
  { value: 'Просто так',    label: 'Просто так' },
  { value: 'Другое',        label: 'Другое' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { haptic, showAlert } = useTelegram();
  const { data: profile } = useProfileQuery();
  const createRequestMutation = useCreateRequestMutation();
  const uploadPhotoMutation = useUploadRequestPhotoMutation();

  const refPhoto = searchParams.get('ref_photo');
  const refTitle = searchParams.get('ref_title');

  const [form, setForm] = useState({
    occasion: 'День рождения',
    customOccasion: '',
    budget: 4000,
    date: '',
    deliveryType: 'DELIVERY',
    deliveryAddress: '',
    recipientPhone: '',
    postcardText: '',
    comment: '',
    examplePhotoUrl: refPhoto || ''
  });

  const [mapPosition, setMapPosition] = useState({ lat: 55.755826, lng: 37.617299 });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      recipientPhone: profile.phone || '',
      deliveryAddress: profile.address || '',
    }));
    if (profile.address_lat && profile.address_lng) {
      setMapPosition({ lat: parseFloat(profile.address_lat), lng: parseFloat(profile.address_lng) });
    }
  }, [profile]);

  const handlePositionChange = async (latlng) => {
    setMapPosition(latlng); haptic.impact('light');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await res.json();
      if (data && data.display_name) setForm(f => ({ ...f, deliveryAddress: data.display_name }));
    } catch (e) { console.error(e); }
  };

  const locateMe = () => {
    haptic.impact('medium');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => handlePositionChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => showAlert('Не удалось определить положение автоматически. Выберите точку на карте.'),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else showAlert('Геолокация не поддерживается вашим устройством.');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      setUploadingPhoto(true); haptic.impact('light');
      const res = await uploadPhotoMutation.mutateAsync(file);
      setForm(f => ({ ...f, examplePhotoUrl: res.url }));
      haptic.success();
    } catch (err) { console.error(err); haptic.error(); showAlert('Не удалось загрузить фото.'); }
    finally { setUploadingPhoto(false); }
  };

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (form.deliveryType === 'DELIVERY' && !form.deliveryAddress.trim()) {
      setShowErrors(true); haptic.error();
      showAlert('Пожалуйста, заполните адрес доставки.'); return;
    }
    if (!form.recipientPhone.trim()) {
      setShowErrors(true); haptic.error();
      showAlert('Пожалуйста, укажите контактный телефон.'); return;
    }
    try {
      setSubmitting(true); haptic.impact('medium');
      const finalOccasion = form.occasion === 'Другое' ? form.customOccasion : form.occasion;
      await createRequestMutation.mutateAsync({
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
      showAlert('Ваша заявка отправлена. Мы свяжемся с вами в Telegram.');
      navigate('/orders');
    } catch (err) { console.error(err); haptic.error(); showAlert('Ошибка при оформлении заявки.'); }
    finally { setSubmitting(false); }
  };

  const Section = ({ eyebrow, title, children }) => (
    <section style={{ padding: '2rem 0', borderTop: '1px solid var(--line)' }}>
      <div style={{ marginBottom: '1.4rem' }}>
        <span className="eyebrow" style={{ color: 'var(--champagne-lo)' }}>{eyebrow}</span>
        <h2 style={{ marginTop: '0.35rem', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '1.75rem', color: 'var(--ink)' }}>{title}</h2>
      </div>
      {children}
    </section>
  );

  return (
    <div className="container page-transition" data-testid="checkout-page">
      <div className="page-title">
        <div>
          <span className="eyebrow">Заявка</span>
          <h1 style={{ marginTop: '0.4rem' }}>Оформление <em>букета</em></h1>
        </div>
      </div>

      {refTitle && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', border: '1px solid var(--champagne)', background: 'var(--champagne-tint)', marginBottom: '1.5rem' }} data-testid="ref-bouquet">
          <img src={refPhoto} alt={refTitle} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '2px' }} />
          <div>
            <div className="eyebrow" style={{ color: 'var(--wine)' }}>Ориентир</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink)', marginTop: '0.15rem' }}>{refTitle}</div>
          </div>
        </div>
      )}

      <form onSubmit={submit}>
        <Section eyebrow="Параметры" title="О букете">
          <label className="eyebrow" style={{ color: 'var(--ink-soft)', display: 'block', marginBottom: '0.6rem' }}>Повод</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.4rem' }}>
            {OCCASIONS.map(o => (
              <button
                key={o.value}
                type="button"
                className={`chip ${form.occasion === o.value ? 'active' : ''}`}
                onClick={() => { haptic.impact('light'); setForm({ ...form, occasion: o.value }); }}
                data-testid={`occasion-${o.value}`}
              >{o.label}</button>
            ))}
          </div>

          {form.occasion === 'Другое' && (
            <input
              type="text" placeholder="Свой повод"
              value={form.customOccasion}
              onChange={e => setForm({ ...form, customOccasion: e.target.value })}
              required
              data-testid="custom-occasion-input"
            />
          )}

          <label className="eyebrow" style={{ color: 'var(--ink-soft)', display: 'block', marginBottom: '0.6rem', marginTop: '0.8rem' }}>
            Бюджет · <span style={{ color: 'var(--wine)', letterSpacing: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.15rem', fontWeight: 300, textTransform: 'none' }}>{form.budget.toLocaleString('ru-RU')} ₽</span>
          </label>
          <input
            type="range" min="2000" max="25000" step="500"
            value={form.budget}
            onChange={e => { setForm({ ...form, budget: Number(e.target.value) }); haptic.impact('light'); }}
            style={{ width: '100%', marginBottom: '1.5rem', accentColor: 'var(--wine)' }}
            data-testid="budget-slider"
          />

          <label className="eyebrow" style={{ color: 'var(--ink-soft)', display: 'block', marginBottom: '0.6rem' }}>Дата и время доставки</label>
          <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} data-testid="date-input" />
        </Section>

        <Section eyebrow="Получение" title="Куда доставить">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              className={`chip ${form.deliveryType === 'DELIVERY' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}
              onClick={() => { setForm({ ...form, deliveryType: 'DELIVERY' }); haptic.impact('light'); }}
              data-testid="delivery-option"
            >Доставка</button>
            <button
              type="button"
              className={`chip ${form.deliveryType === 'PICKUP' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}
              onClick={() => { setForm({ ...form, deliveryType: 'PICKUP' }); haptic.impact('light'); }}
              data-testid="pickup-option"
            >Самовывоз</button>
          </div>

          {form.deliveryType === 'DELIVERY' ? (
            <>
              <div style={{ width: '100%', height: '240px', overflow: 'hidden', marginBottom: '0.8rem', border: '1px solid var(--line)' }}>
                <MapContainer center={mapPosition} zoom={11} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap" />
                  <LocationPicker position={mapPosition} onPositionChange={handlePositionChange} />
                </MapContainer>
              </div>
              <button type="button" className="secondary" style={{ width: '100%', padding: '0.7rem', fontSize: '0.75rem', letterSpacing: '0.2em', marginBottom: '1rem' }} onClick={locateMe}>
                <MapPinIcon width={14} height={14} strokeWidth={1.5} /> Моя геопозиция
              </button>
              <textarea
                placeholder="Улица, дом, квартира, подъезд"
                rows={2}
                value={form.deliveryAddress}
                onChange={e => setForm({ ...form, deliveryAddress: e.target.value })}
                required
                style={{ borderBottomColor: showErrors && !form.deliveryAddress ? 'var(--error)' : undefined }}
                data-testid="address-input"
              />
            </>
          ) : (
            <div style={{ background: 'var(--champagne-tint)', border: '1px solid var(--champagne)', padding: '1rem', marginBottom: '1rem' }}>
              <div className="eyebrow" style={{ color: 'var(--wine)', marginBottom: '0.4rem' }}>Адрес самовывоза</div>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--ink)' }}>
                Москва, ул. Большая Дмитровка, 12
              </div>
            </div>
          )}

          <label className="eyebrow" style={{ color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', marginTop: '0.6rem' }}>Телефон для связи</label>
          <input
            type="tel" placeholder="+7 999 123 45 67"
            value={form.recipientPhone}
            onChange={e => setForm({ ...form, recipientPhone: e.target.value })}
            required
            style={{ borderBottomColor: showErrors && !form.recipientPhone ? 'var(--error)' : undefined }}
            data-testid="phone-input"
          />
        </Section>

        <Section eyebrow="Пожелания" title="Открытка и детали">
          <label className="eyebrow" style={{ color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem' }}>Текст открытки</label>
          <textarea
            placeholder="Напишите пожелание — мы подпишем открытку рукой флориста"
            rows={2}
            value={form.postcardText}
            onChange={e => setForm({ ...form, postcardText: e.target.value })}
            style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1rem' }}
            data-testid="postcard-input"
          />

          <label className="eyebrow" style={{ color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', marginTop: '0.4rem' }}>Особые пожелания</label>
          <textarea
            placeholder="Цветовая гамма, любимые цветы получателя, упаковка"
            rows={3}
            value={form.comment}
            onChange={e => setForm({ ...form, comment: e.target.value })}
            data-testid="comment-input"
          />
        </Section>

        <Section eyebrow="Референс" title="Пример букета">
          {form.examplePhotoUrl ? (
            <div style={{ position: 'relative', width: '140px', aspectRatio: '4/5', border: '1px solid var(--champagne)' }}>
              <img src={form.examplePhotoUrl} alt="Пример" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => setForm({ ...form, examplePhotoUrl: '' })}
                style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--ivory)', border: '1px solid var(--line)', color: 'var(--ink)', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 }}
              ><XIcon width={12} height={12} strokeWidth={1.6} /></button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '140px', aspectRatio: '4/5', border: '1px dashed var(--champagne)', background: 'var(--champagne-tint)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', cursor: 'pointer', color: 'var(--wine)' }}
              data-testid="upload-example-box"
            >
              <UploadIcon width={20} height={20} strokeWidth={1.4} />
              <span style={{ fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, textAlign: 'center', padding: '0 0.4rem' }}>
                {uploadingPhoto ? 'Загрузка…' : 'Загрузить фото'}
              </span>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
        </Section>

        <div style={{ padding: '2rem 0', borderTop: '1px solid var(--line)' }}>
          <button type="submit" className="primary" style={{ width: '100%', padding: '1.1rem', fontSize: '0.85rem', letterSpacing: '0.22em' }} disabled={submitting || uploadingPhoto} data-testid="submit-request">
            {submitting ? 'Отправка…' : <>Отправить флористу <ArrowRightIcon width={14} height={14} strokeWidth={1.6} /></>}
          </button>
          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.72rem', letterSpacing: '0.16em', color: 'var(--ink-soft)' }}>
            Флорист свяжется с вами в Telegram в течение 15 минут
          </p>
        </div>
      </form>
    </div>
  );
}
