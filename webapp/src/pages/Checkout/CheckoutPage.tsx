import L from 'leaflet';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './CheckoutPage.module.css';

import { useProfileQuery } from '../../api/clients';
import { useCreateRequestMutation, useUploadRequestPhotoMutation } from '../../api/requests';
import ArrowRightIcon from '../../assets/icons/arrow-right.svg';
import MapPinIcon from '../../assets/icons/map-pin.svg';
import UploadIcon from '../../assets/icons/upload.svg';
import XIcon from '../../assets/icons/x.svg';
import { useTelegram } from '../../hooks/useTelegram';
import { formatDeliveryDateTime } from '../../shared/order/deliveryDateTime';
import { Button, Chip, cx, IconButton, PageTitle } from '../../shared/ui';
import type { ICheckoutLocationState, LatLng } from '../../types/pages.ts';
import type {
  ICheckoutFormState,
  ILocationPickerProps,
  INominatimReverseResponse,
} from '../../types/ui.ts';
import { CheckoutSection } from './components/CheckoutSection';

const customIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="width:14px;height:14px;background:#6A1A2B;border:2px solid #FDFBF7;border-radius:50%;box-shadow:0 4px 12px rgba(40,35,33,0.35);transform:translate(-50%,-50%);"></div>',
  iconSize: [0, 0],
});

function LocationPicker({ position, onPositionChange }: ILocationPickerProps) {
  const map = useMap();
  useMapEvents({ click: (e) => onPositionChange(e.latlng) });
  useEffect(() => {
    if (position) map.setView(position, map.getZoom() || 11);
  }, [position, map]);
  return position ? <Marker position={position} icon={customIcon} /> : null;
}

const OCCASIONS = [
  { value: 'День рождения', label: 'День рождения' },
  { value: 'Свидание', label: 'Свидание' },
  { value: 'Годовщина', label: 'Годовщина' },
  { value: 'Свадьба', label: 'Свадьба' },
  { value: 'Просто так', label: 'Просто так' },
  { value: 'Другое', label: 'Другое' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { haptic, showAlert } = useTelegram();
  const { data: profile } = useProfileQuery();
  const createRequestMutation = useCreateRequestMutation();
  const uploadPhotoMutation = useUploadRequestPhotoMutation();

  const refPhoto = searchParams.get('ref_photo');
  const refTitle = searchParams.get('ref_title');

  const [form, setForm] = useState<ICheckoutFormState>({
    occasion: 'День рождения',
    customOccasion: '',
    budget: 4000,
    deliveryDate: '',
    deliveryTime: '',
    deliveryType: 'DELIVERY',
    deliveryAddress: '',
    recipientPhone: '',
    postcardText: '',
    comment: '',
    examplePhotoUrl: refPhoto || '',
  });

  const [mapPosition, setMapPosition] = useState<LatLng>({
    lat: 55.755826,
    lng: 37.617299,
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [appliedProfileKey, setAppliedProfileKey] = useState('');
  const [appliedRepeatKey, setAppliedRepeatKey] = useState('');

  const repeatPrefill = (location.state as ICheckoutLocationState | null)?.repeatOrder;

  if (repeatPrefill && appliedRepeatKey !== 'repeat') {
    setAppliedRepeatKey('repeat');
    setForm((f) => ({
      ...f,
      ...repeatPrefill,
      deliveryDate: '',
      deliveryTime: '',
      examplePhotoUrl: f.examplePhotoUrl || refPhoto || '',
    }));
  }

  const profileKey = profile
    ? `${profile.phone ?? ''}-${profile.address ?? ''}-${profile.address_lat ?? ''}-${profile.address_lng ?? ''}`
    : '';

  if (profile && profileKey !== appliedProfileKey) {
    setAppliedProfileKey(profileKey);
    setForm((f) => ({
      ...f,
      recipientPhone: f.recipientPhone || profile.phone || '',
      deliveryAddress: f.deliveryAddress || profile.address || '',
    }));
    if (profile.address_lat && profile.address_lng) {
      setMapPosition({
        lat: Number(profile.address_lat),
        lng: Number(profile.address_lng),
      });
    }
  }

  const handlePositionChange = async (latlng: LatLng) => {
    setMapPosition(latlng);
    haptic.impact('light');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = (await res.json()) as INominatimReverseResponse;
      if (data.display_name) {
        setForm((f) => ({ ...f, deliveryAddress: data.display_name ?? f.deliveryAddress }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const locateMe = () => {
    haptic.impact('medium');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          handlePositionChange({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => showAlert('Не удалось определить положение автоматически. Выберите точку на карте.'),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else showAlert('Геолокация не поддерживается вашим устройством.');
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPhoto(true);
      haptic.impact('light');
      const res = await uploadPhotoMutation.mutateAsync(file);
      setForm((f) => ({ ...f, examplePhotoUrl: res.url }));
      haptic.success();
    } catch (err) {
      console.error(err);
      haptic.error();
      showAlert('Не удалось загрузить фото.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submit = async (e?: FormEvent) => {
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
      await createRequestMutation.mutateAsync({
        occasion: finalOccasion,
        budget: Number(form.budget),
        date: formatDeliveryDateTime(form.deliveryDate, form.deliveryTime),
        deliveryType: form.deliveryType,
        deliveryAddress: form.deliveryType === 'DELIVERY' ? form.deliveryAddress : 'Самовывоз',
        recipientPhone: form.recipientPhone,
        postcardText: form.postcardText || null,
        comment: form.comment || null,
        examplePhotoUrl: form.examplePhotoUrl || null,
      });
      haptic.success();
      showAlert('Ваша заявка отправлена. Мы свяжемся с вами в Telegram.');
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
    <div className="container page-transition" data-testid="checkout-page">
      <PageTitle eyebrow="Заявка">
        Оформление <em>букета</em>
      </PageTitle>

      {refTitle && (
        <div className={styles.refBouquet} data-testid="ref-bouquet">
          <img src={refPhoto ?? ''} alt={refTitle ?? ''} className={styles.refImage} />
          <div>
            <div className={cx('eyebrow', styles.refEyebrow)}>Ориентир</div>
            <div className={styles.refTitle}>{refTitle}</div>
          </div>
        </div>
      )}

      <form onSubmit={submit}>
        <CheckoutSection eyebrow="Параметры" title="О букете">
          <label className={cx('eyebrow', styles.fieldLabel)}>Повод</label>
          <div className={styles.chipGroup}>
            {OCCASIONS.map((o) => (
              <Chip
                key={o.value}
                active={form.occasion === o.value}
                onClick={() => {
                  haptic.impact('light');
                  setForm({ ...form, occasion: o.value });
                }}
                data-testid={`occasion-${o.value}`}
              >
                {o.label}
              </Chip>
            ))}
          </div>

          {form.occasion === 'Другое' && (
            <input
              type="text"
              placeholder="Свой повод"
              value={form.customOccasion}
              onChange={(e) => setForm({ ...form, customOccasion: e.target.value })}
              required
              data-testid="custom-occasion-input"
            />
          )}

          <label className={cx('eyebrow', styles.fieldLabel, styles.fieldLabelSpaced)}>
            Бюджет ·{' '}
            <span className={styles.budgetValue}>{form.budget.toLocaleString('ru-RU')} ₽</span>
          </label>
          <input
            type="range"
            min="2000"
            max="25000"
            step="500"
            value={form.budget}
            onChange={(e) => {
              setForm({ ...form, budget: Number(e.target.value) });
              haptic.impact('light');
            }}
            className={styles.budgetSlider}
            data-testid="budget-slider"
          />

          <label className={cx('eyebrow', styles.fieldLabel)}>Дата доставки</label>
          <div className={styles.dateTimeRow}>
            <input
              type="date"
              value={form.deliveryDate}
              onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
              data-testid="delivery-date-input"
            />
            <input
              type="time"
              value={form.deliveryTime}
              onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
              data-testid="delivery-time-input"
            />
          </div>
        </CheckoutSection>

        <CheckoutSection eyebrow="Получение" title="Куда доставить">
          <div className={styles.deliveryOptions}>
            <Chip
              active={form.deliveryType === 'DELIVERY'}
              className={styles.deliveryChip}
              onClick={() => {
                setForm({ ...form, deliveryType: 'DELIVERY' });
                haptic.impact('light');
              }}
              data-testid="delivery-option"
            >
              Доставка
            </Chip>
            <Chip
              active={form.deliveryType === 'PICKUP'}
              className={styles.deliveryChip}
              onClick={() => {
                setForm({ ...form, deliveryType: 'PICKUP' });
                haptic.impact('light');
              }}
              data-testid="pickup-option"
            >
              Самовывоз
            </Chip>
          </div>

          {form.deliveryType === 'DELIVERY' ? (
            <>
              <div className={styles.mapWrap}>
                <MapContainer
                  center={mapPosition}
                  zoom={11}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution="&copy; OpenStreetMap"
                  />
                  <LocationPicker position={mapPosition} onPositionChange={handlePositionChange} />
                </MapContainer>
              </div>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={locateMe}
                className={styles.locateBtn}
              >
                <MapPinIcon width={14} height={14} strokeWidth={1.5} /> Моя геопозиция
              </Button>
              <textarea
                placeholder="Улица, дом, квартира, подъезд"
                rows={2}
                value={form.deliveryAddress}
                onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                required
                className={showErrors && !form.deliveryAddress ? styles.inputError : undefined}
                data-testid="address-input"
              />
            </>
          ) : (
            <div className={styles.pickupBox}>
              <div className={cx('eyebrow', styles.pickupEyebrow)}>Адрес самовывоза</div>
              <div className={styles.pickupAddress}>Сергиев Посад, ул. Вифанская, 29</div>
            </div>
          )}

          <label
            className={cx(
              'eyebrow',
              styles.fieldLabel,
              styles.fieldLabelTight,
              styles.fieldLabelPhone
            )}
          >
            Телефон для связи
          </label>
          <input
            type="tel"
            placeholder="+7 999 123 45 67"
            value={form.recipientPhone}
            onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
            required
            className={showErrors && !form.recipientPhone ? styles.inputError : undefined}
            data-testid="phone-input"
          />
        </CheckoutSection>

        <CheckoutSection eyebrow="Пожелания" title="Открытка и детали">
          <label className={cx('eyebrow', styles.fieldLabel, styles.fieldLabelTight)}>
            Текст открытки
          </label>
          <textarea
            placeholder="Напишите пожелание — мы подпишем открытку рукой флориста"
            rows={2}
            value={form.postcardText}
            onChange={(e) => setForm({ ...form, postcardText: e.target.value })}
            className={styles.postcardInput}
            data-testid="postcard-input"
          />

          <label
            className={cx(
              'eyebrow',
              styles.fieldLabel,
              styles.fieldLabelTight,
              styles.fieldLabelPhone
            )}
          >
            Особые пожелания
          </label>
          <textarea
            placeholder="Цветовая гамма, любимые цветы получателя, упаковка"
            rows={3}
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            data-testid="comment-input"
          />
        </CheckoutSection>

        <CheckoutSection eyebrow="Референс" title="Пример букета">
          {form.examplePhotoUrl ? (
            <div className={styles.photoPreview}>
              <img src={form.examplePhotoUrl} alt="Пример" className={styles.photoImage} />
              <IconButton
                size="sm"
                onClick={() => setForm({ ...form, examplePhotoUrl: '' })}
                aria-label="Удалить фото"
                className={styles.removePhotoBtn}
              >
                <XIcon width={12} height={12} strokeWidth={1.6} />
              </IconButton>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={styles.uploadBox}
              data-testid="upload-example-box"
            >
              <UploadIcon width={20} height={20} strokeWidth={1.4} />
              <span className={styles.uploadLabel}>
                {uploadingPhoto ? 'Загрузка…' : 'Загрузить фото'}
              </span>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className={styles.hiddenInput}
          />
        </CheckoutSection>

        <div className={styles.submitSection}>
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={submitting || uploadingPhoto}
            data-testid="submit-request"
          >
            {submitting ? (
              'Отправка…'
            ) : (
              <>
                Отправить флористу <ArrowRightIcon width={14} height={14} strokeWidth={1.6} />
              </>
            )}
          </Button>
          <p className={styles.submitNote}>Флорист свяжется с вами в Telegram в течение 15 минут</p>
        </div>
      </form>
    </div>
  );
}
