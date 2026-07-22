import { useState } from 'react'
import MapPinIcon from '../../../../assets/icons/map-pin.svg'
import { useUpdateProfileMutation } from '../../../../api/clients'
import { useTelegram } from '../../../../hooks/useTelegram'
import { Button } from '../../../../shared/ui'
import type { IClientProfile } from '../../../../types/webapp.ts'
import styles from './ProfileAddressSection.module.css'

export interface IProfileAddressSectionProps {
  profile: IClientProfile
  haptic: ReturnType<typeof useTelegram>['haptic']
  showAlert: ReturnType<typeof useTelegram>['showAlert']
  updateProfileMutation: ReturnType<typeof useUpdateProfileMutation>
}

export function ProfileAddressSection({
  profile,
  haptic,
  showAlert,
  updateProfileMutation,
}: IProfileAddressSectionProps) {
  const [addressText, setAddressText] = useState(() => profile.address || '')
  const [phone, setPhone] = useState(() => profile.phone || '')
  const [saving, setSaving] = useState(false)

  const isChanged =
    addressText.trim() !== (profile.address || '').trim() ||
    phone.trim() !== (profile.phone || '').trim()

  const saveProfileDelivery = async () => {
    if (!addressText.trim()) {
      showAlert('Введите адрес доставки')
      return
    }
    if (!phone.trim()) {
      showAlert('Введите телефон')
      return
    }

    setSaving(true)
    haptic.impact('heavy')
    try {
      await updateProfileMutation.mutateAsync({
        address: addressText.trim(),
        phone: phone.trim(),
      })
      showAlert('Данные сохранены')
    } catch (e) {
      console.error(e)
      showAlert('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`glass-card ${styles.card}`}>
      <h3 className={styles.title}>
        <MapPinIcon width={20} height={20} /> Данные для доставки
      </h3>
      <p className={styles.description}>
        Адрес и телефон будут подставляться при оформлении заказа.
      </p>

      <label className={styles.fieldLabel}>Адрес</label>
      <textarea
        className={`input ${styles.field}`}
        placeholder="Улица, дом, квартира, подъезд"
        value={addressText}
        onChange={(e) => setAddressText(e.target.value)}
        rows={3}
        data-testid="profile-address-input"
      />

      <label className={styles.fieldLabel}>Телефон</label>
      <input
        type="tel"
        className={`input ${styles.field}`}
        placeholder="+7 999 123 45 67"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
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
  )
}
