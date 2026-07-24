import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfilePage.module.css';

import { API_URL } from '../../api';
import {
  useProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from '../../api/clients';
import { useMyOrdersQuery } from '../../api/orders';
import { useTelegram } from '../../hooks/useTelegram';
import { dayjs } from '../../shared/lib/dayjs';
import { formatOrderBudget, formatOrderDate } from '../../shared/order/orderFormat';
import { isCompletedOrderStatus } from '../../shared/order/orderLabels';
import { buildCheckoutRepeatState } from '../../shared/order/orderRepeat';
import { Button, cx, IconButton, OrderStatusPill, PageTitle } from '../../shared/ui';
import type { IOrder } from '../../types/domain.ts';
import type { IClientProfile } from '../../types/webapp.ts';
import { ProfileAddressSection } from './components/ProfileAddressSection';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { data: profile, isPending: profileLoading } = useProfileQuery();
  const { data: orders = [], isPending: ordersLoading } = useMyOrdersQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const uploadAvatarMutation = useUploadAvatarMutation();
  const loading = profileLoading || ordersLoading;
  const { haptic, showAlert } = useTelegram();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    haptic.impact('light');
    setUploadingAvatar(true);
    try {
      const res = await uploadAvatarMutation.mutateAsync(file);
      if (res.ok && res.url) {
        await updateProfileMutation.mutateAsync({ photo_url: res.url });
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

  const saveProfileData = async () => {
    try {
      haptic.impact('medium');
      const updated = await updateProfileMutation.mutateAsync({ name: editName });
      setEditName(updated.data.name || editName);
      setIsEditingProfile(false);
    } catch (e) {
      console.error(e);
      alert('Ошибка сохранения данных');
    }
  };

  const handleRepeatOrder = (order: IOrder) => {
    haptic.impact('medium');
    navigate('/checkout', { state: { repeatOrder: buildCheckoutRepeatState(order) } });
  };

  if (loading) return <div className="spinner" />;
  if (!profile) {
    return (
      <div className="container">
        <p>Ошибка загрузки профиля</p>
      </div>
    );
  }

  const lastCompletedOrder = orders.find((o) => isCompletedOrderStatus(o.status)) ?? null;
  const recentOrders = [...orders]
    .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
    .slice(0, 5);

  return (
    <div className={cx('container page-transition', styles.page)} data-testid="profile-page">
      <PageTitle eyebrow="Личный кабинет">
        Ваш <em>профиль</em>
      </PageTitle>

      <div className={styles.profileHeader}>
        <div className={styles.avatar} onClick={handleAvatarClick}>
          {profile.photo_url ? (
            <img
              src={
                profile.photo_url.startsWith('/')
                  ? `${API_URL.replace('/api', '')}${profile.photo_url}`
                  : profile.photo_url
              }
              alt="Avatar"
              className={styles.avatarImage}
            />
          ) : (
            profile.name?.charAt(0)?.toUpperCase() || '?'
          )}
          {uploadingAvatar && <div className={styles.avatarOverlay}>...</div>}
        </div>
        <input
          type="file"
          ref={avatarInputRef}
          className={styles.hiddenInput}
          accept="image/*"
          onChange={handleAvatarChange}
        />
        {isEditingProfile ? (
          <div className={styles.editForm}>
            <input
              type="text"
              placeholder="Ваше имя"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={styles.editNameInput}
            />
            <div className={styles.editActions}>
              <Button size="sm" flex className={styles.noMarginBtn} onClick={saveProfileData}>
                💾 Сохранить
              </Button>
              <Button
                variant="secondary"
                size="sm"
                flex
                className={styles.noMarginBtn}
                onClick={() => {
                  setEditName(profile.name || '');
                  setIsEditingProfile(false);
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h2 className={styles.profileName}>{profile.name || 'Имя не указано'}</h2>
              <IconButton
                variant="ghost"
                onClick={() => {
                  setEditName(profile.name || '');
                  setIsEditingProfile(true);
                }}
                aria-label="Редактировать имя"
                className={styles.editIconBtn}
              >
                ✏️
              </IconButton>
            </div>
            <p className={styles.tgName}>
              {profile.tgname ? `@${profile.tgname}` : 'Telegram-ник не указан'}
            </p>
            {profile.discount_percent != null && profile.discount_percent > 0 && (
              <span className={cx('badge', styles.discountBadge)}>
                Скидка {profile.discount_percent}%
              </span>
            )}
          </div>
        )}
      </div>

      {lastCompletedOrder && (
        <div className={cx('glass-card', styles.quickRepeatCard)}>
          <h3 className={styles.quickRepeatTitle}>🔄 Быстрый повтор заказа</h3>
          <p className={styles.quickRepeatDesc}>
            Повторить заказ № {String(lastCompletedOrder.id).slice(-6)} от{' '}
            {formatOrderDate(lastCompletedOrder.createdAt, 'D MMMM')}:
          </p>
          <div className={styles.quickRepeatItems}>
            {lastCompletedOrder.wishes && (
              <div className={styles.quickRepeatItem}>«{lastCompletedOrder.wishes}»</div>
            )}
            <div className={styles.quickRepeatItem}>
              Бюджет: {formatOrderBudget(lastCompletedOrder.budget)}
            </div>
            {lastCompletedOrder.deliveryAddress && (
              <div className={styles.quickRepeatItem}>{lastCompletedOrder.deliveryAddress}</div>
            )}
          </div>
          <Button fullWidth onClick={() => handleRepeatOrder(lastCompletedOrder)}>
            Повторить заказ
          </Button>
        </div>
      )}

      <ProfileAddressSection
        key={`${profile.address ?? ''}-${profile.phone ?? ''}`}
        profile={profile as IClientProfile}
        haptic={haptic}
        showAlert={showAlert}
        updateProfileMutation={updateProfileMutation}
      />

      <div className={styles.ordersHeader}>
        <h3 className={styles.ordersTitle}>📋 Последние заказы</h3>
        <Button variant="secondary" size="sm" to="/orders" className={styles.allOrdersBtn}>
          Все заказы
        </Button>
      </div>
      {orders.length === 0 ? (
        <div className={cx('glass-card', styles.emptyOrders)}>
          <p className={styles.emptyOrdersText}>У вас пока нет заказов</p>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {recentOrders.map((o) => (
            <div key={o.id} className="glass-card">
              <div className={cx('flex-between', styles.orderHeader)}>
                <div>
                  <div className={styles.orderId}>Заказ № {String(o.id).slice(-6)}</div>
                  <div className={styles.orderDate}>{formatOrderDate(o.createdAt)}</div>
                </div>
                <OrderStatusPill status={o.status} />
              </div>

              <div className={styles.orderItems}>
                {o.wishes && (
                  <div className={styles.orderDetailRow}>
                    <span className={styles.orderDetailLabel}>Пожелания</span>
                    <span>«{o.wishes}»</span>
                  </div>
                )}
                {o.recipientPhone && (
                  <div className={styles.orderDetailRow}>
                    <span className={styles.orderDetailLabel}>Телефон</span>
                    <span>{o.recipientPhone}</span>
                  </div>
                )}
                {o.deliveryAddress && o.deliveryAddress !== 'Самовывоз' && (
                  <div className={styles.orderDetailRow}>
                    <span className={styles.orderDetailLabel}>Адрес</span>
                    <span>{o.deliveryAddress}</span>
                  </div>
                )}
                {o.postcardText && (
                  <div className={styles.orderDetailRow}>
                    <span className={styles.orderDetailLabel}>Открытка</span>
                    <span>«{o.postcardText}»</span>
                  </div>
                )}
              </div>

              <div className={cx('flex-between', styles.orderTotal)}>
                <span>Бюджет:</span>
                <span className={styles.orderTotalValue}>{formatOrderBudget(o.budget)}</span>
              </div>

              {(o.status === 'WAITING_FOR_PAYMENT' || o.status === 'APPROVED') && o.paymentLink && (
                <Button
                  href={o.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  fullWidth
                  className={styles.payBtn}
                >
                  💳 Перейти к оплате
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
