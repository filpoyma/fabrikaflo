import { useState } from 'react';
import styles from './ProfileAddressSection.module.css';

import {
  isValidRuPhone,
  RU_PHONE_INVALID_MESSAGE,
} from '../../../../../../../../../webapp/src/shared/utils/phnum.utils.ts';
import { useUpdateProfileMutation } from '../../../../api/clients';
import MapPinIcon from '../../../../assets/icons/map-pin.svg';
import { useTelegram } from '../../../../hooks/useTelegram';
import { Button, cx } from '../../../../shared/ui';
import type { IClientProfile } from '../../../../types';

export interface IProfileAddressSectionProps {
  profile: IClientProfile;
  haptic: ReturnType<typeof useTelegram>['haptic'];
  showAlert: ReturnType<typeof useTelegram>['showAlert'];
  updateProfileMutation: ReturnType<typeof useUpdateProfileMutation>;
}

export function ProfileAddressSection({
  profile,
  haptic,
  showAlert,
  updateProfileMutation,
}: IProfileAddressSectionProps) {
  const [addressText, setAddressText] = useState(() => profile.address || '');
  const [phone, setPhone] = useState(() => profile.phone || '');
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  const isChanged =
    addressText.trim() !== (profile.address || '').trim() ||
    phone.trim() !== (profile.phone || '').trim();

  const saveProfileDelivery = async () => {
    if (!addressText.trim()) {
      showAlert('Введите адрес доставки');
      return;
    }
    if (!phone.trim()) {
      setPhoneError(true);
      showAlert('Введите телефон');
      return;
    }
    if (!isValidRuPhone(phone)) {
      setPhoneError(true);
      showAlert(RU_PHONE_INVALID_MESSAGE);
      return;
    }

    setSaving(true);
    haptic.impact('heavy');
    try {
      await updateProfileMutation.mutateAsync({
        address: addressText.trim(),
        phone: phone.trim(),
      });
      showAlert('Данные сохранены');
    } catch (e) {
      console.error(e);
      showAlert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`glass-card ${styles.card}`}>
      <h3 className={styles.title}>
        <MapPinIcon width={20} height={20} /> Данные для доставки
      </h3>
      <p className={styles.description}>Адрес и телефон для оформления заказов.</p>

      <label className={styles.fieldLabel}>Адрес</label>
      <textarea
        className={`input ${styles.field}`}
        placeholder="Город, улица, дом, квартира, подъезд"
        value={addressText}
        onChange={(e) => setAddressText(e.target.value)}
        rows={3}
        data-testid="profile-address-input"
      />

      <label className={styles.fieldLabel}>Телефон</label>
      <input
        type="tel"
        className={cx('input', styles.field, phoneError && styles.inputError)}
        placeholder="+7 999 123 45 67"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          setPhoneError(false);
        }}
        data-testid="profile-phone-input"
      />

      {isChanged && (
        <Button
          variant="primary"
          fullWidth
          onClick={saveProfileDelivery}
          disabled={saving}
          data-testid="profile-save-delivery-btn"
        >
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
      )}
    </div>
  );
}
