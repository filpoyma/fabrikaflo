import { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import MapPinIcon from '../../../../assets/icons/map-pin.svg'
import { useUpdateProfileMutation } from '../../../../api/clients'
import { useTelegram } from '../../../../hooks/useTelegram'
import { Button } from '../../../../shared/ui'
import type { LatLng } from '../../../../types/pages.ts'
import type { IClientProfile } from '../../../../types/webapp.ts'
import type { ILocationPickerProps, INominatimReverseResponse } from '../../../../types/ui.ts'
import styles from './ProfileAddressSection.module.css'

const customIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="font-size: 2rem; transform: translate(-50%, -100%); text-shadow: 0px 2px 5px rgba(0,0,0,0.5);">📍</div>',
  iconSize: [0, 0],
})

function LocationPicker({ position, onPositionChange }: ILocationPickerProps) {
  const map = useMap()

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
    },
  })

  useEffect(() => {
    if (position) {
      map.setView(position)
    }
  }, [position, map])

  return position ? <Marker position={position} icon={customIcon} /> : null
}

const DEFAULT_MAP_POSITION: LatLng = { lat: -8.409518, lng: 115.188919 }

function getProfileMapPosition(profile: IClientProfile): LatLng {
  if (profile.address_lat != null && profile.address_lng != null) {
    return { lat: profile.address_lat, lng: profile.address_lng }
  }
  return DEFAULT_MAP_POSITION
}

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
  const [mapPosition, setMapPosition] = useState<LatLng>(() => getProfileMapPosition(profile))
  const [savingAddress, setSavingAddress] = useState(false)

  const isAddressChanged =
    addressText.trim() !== (profile.address || '').trim() ||
    mapPosition.lat !== profile.address_lat ||
    mapPosition.lng !== profile.address_lng

  const handlePositionChange = async (latlng: LatLng) => {
    setMapPosition(latlng)
    haptic.impact('light')
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`,
      )
      const data = (await res.json()) as INominatimReverseResponse
      if (data?.display_name) {
        setAddressText(data.display_name)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fallbackGeo = () => {
    if (!navigator.geolocation) {
      showAlert('Геолокация не поддерживается вашим устройством')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void handlePositionChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => {
        console.error(err)
        showAlert(
          'Не удалось определить местоположение. Пожалуйста, введите название отеля или улицы в строке поиска выше или выберите место на карте вручную.',
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  const locateMe = () => {
    haptic.impact('medium')
    const tg = window.Telegram?.WebApp
    if (tg?.LocationManager && typeof tg.LocationManager.init === 'function') {
      const lm = tg.LocationManager

      const requestTGLocation = () => {
        lm.getLocation((data) => {
          if (data?.latitude) {
            void handlePositionChange({ lat: data.latitude, lng: data.longitude })
          } else {
            fallbackGeo()
          }
        })
      }

      if (!lm.isInited) {
        lm.init(() => {
          if (lm.isLocationAvailable && lm.isAccessGranted) {
            requestTGLocation()
          } else {
            fallbackGeo()
          }
        })
        return
      }

      if (lm.isLocationAvailable && lm.isAccessGranted) {
        requestTGLocation()
        return
      }
    }
    fallbackGeo()
  }

  const saveAddress = async () => {
    if (!addressText.trim()) {
      showAlert('Введите адрес!')
      return
    }
    setSavingAddress(true)
    haptic.impact('heavy')
    try {
      const payload: Partial<IClientProfile> = {
        address: addressText,
        address_lat: mapPosition.lat,
        address_lng: mapPosition.lng,
      }
      await updateProfileMutation.mutateAsync(payload)
      showAlert('Адрес доставки сохранен!')
    } catch (e) {
      console.error(e)
      showAlert('Ошибка сохранения адреса')
    } finally {
      setSavingAddress(false)
    }
  }

  return (
    <div className={`glass-card ${styles.card}`}>
      <h3 className={styles.title}>
        <MapPinIcon width={20} height={20} /> Адрес доставки
      </h3>
      <p className={styles.description}>
        Укажите точку на карте или впишите адрес вручную. Он будет подставляться при заказах.
      </p>

      <div className={styles.mapWrap}>
        <MapContainer center={mapPosition} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap"
          />
          <LocationPicker position={mapPosition} onPositionChange={handlePositionChange} />
        </MapContainer>
      </div>

      <Button variant="secondary" fullWidth onClick={locateMe} className={styles.locateBtn}>
        📍 Найти меня на карте
      </Button>

      <textarea
        className={`input ${styles.addressTextarea}`}
        placeholder="Адрес доставки"
        value={addressText}
        onChange={(e) => setAddressText(e.target.value)}
        rows={3}
      />

      {isAddressChanged && (
        <Button variant="primary" fullWidth onClick={saveAddress} disabled={savingAddress}>
          {savingAddress ? '...' : '✅ Подтвердить адрес'}
        </Button>
      )}
    </div>
  )
}
