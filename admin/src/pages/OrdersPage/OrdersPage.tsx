import React, { useState } from 'react';
import clsx from 'clsx';
import { pageStyles } from '../../shared/styles';
import {
  useOrdersQuery,
  useUpdateOrderStatusMutation,
  useUploadOrderPhotoMutation,
  useSendOrderApprovalMutation,
  useSendOrderPaymentMutation,
  useAssignOrderCourierMutation,
} from '../../api/orders';
import styles from './OrdersPage.module.css'
import { useCouriersQuery } from '../../api/clients';
import type { IFlowerOrder } from '../../types/order';
import { Button, getButtonClassName, Input, Select } from '../../shared/ui';

import InboxIcon from '../../assets/icons/inbox.svg';
import ShoppingBagIcon from '../../assets/icons/shopping-bag.svg';
import CheckIcon from '../../assets/icons/check.svg';
import TruckIcon from '../../assets/icons/scooter.svg';
import XMarkIcon from '../../assets/icons/x-mark.svg';
import PlusIcon from '../../assets/icons/plus.svg';
import ShoppingIcon from '../../assets/icons/shopping-bag.svg';
import DocumentIcon from '../../assets/icons/document.svg';
import { PinIcon, DeliveryIcon } from '../../components/BotanicalIcons';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const OrdersPage: React.FC = () => {
  const { data } = useOrdersQuery({ refetchInterval: 20_000 });
  const orders = data ?? [];
  const { data: couriers = [] } = useCouriersQuery();

  const updateStatusMutation = useUpdateOrderStatusMutation();
  const uploadPhotoMutation = useUploadOrderPhotoMutation();
  const sendApprovalMutation = useSendOrderApprovalMutation();
  const sendPaymentMutation = useSendOrderPaymentMutation();
  const assignCourierMutation = useAssignOrderCourierMutation();

  // Local component states
  const [paymentLinks, setPaymentLinks] = useState<Record<string, string>>({});
  const [selectedCouriers, setSelectedCouriers] = useState<Record<string, string>>({});

  // Columns partition
  const colAssembly = orders.filter((o) => o.status === 'CREATED' || o.status === 'ASSEMBLING');
  const colApproval = orders.filter(
    (o) =>
      o.status === 'ASSEMBLED' ||
      o.status === 'WAITING_FOR_APPROVAL' ||
      o.status === 'APPROVED' ||
      o.status === 'WAITING_FOR_PAYMENT'
  );
  const colDelivery = orders.filter((o) => o.status === 'PAID' || o.status === 'DELIVERING');
  const colCompleted = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED');

  const handlePhotoSelect = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(
        { id, file },
        {
          onError: (error) => {
            console.error('Upload photo error:', error);
            alert(`Ошибка загрузки фотографии: ${getErrorMessage(error)}`);
          },
        }
      );
    }
  };

  const mutateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate(
      { id, status },
      {
        onError: (error) => {
          console.error('Update status error:', error);
          alert(`Ошибка обновления статуса: ${getErrorMessage(error)}`);
        },
      }
    );
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CREATED':
        return 'Принят';
      case 'ASSEMBLING':
        return 'Собирается';
      case 'ASSEMBLED':
        return 'Собран';
      case 'WAITING_FOR_APPROVAL':
        return 'На согласовании';
      case 'APPROVED':
        return 'Одобрен';
      case 'WAITING_FOR_PAYMENT':
        return 'Ожидает оплаты';
      case 'PAID':
        return 'Оплачен';
      case 'DELIVERING':
        return 'В доставке';
      case 'DELIVERED':
        return 'Доставлен';
      case 'CANCELLED':
        return 'Отменен';
      default:
        return status;
    }
  };

  const getStatusPillClass = (status: string) => {
    switch (status) {
      case 'CREATED':
      case 'ASSEMBLING':
        return 'status-pill status-pill--info';
      case 'ASSEMBLED':
      case 'APPROVED':
        return 'status-pill status-pill--sage';
      case 'WAITING_FOR_APPROVAL':
      case 'WAITING_FOR_PAYMENT':
        return 'status-pill status-pill--warn';
      case 'PAID':
      case 'DELIVERING':
        return 'status-pill status-pill--gold';
      case 'DELIVERED':
        return 'status-pill status-pill--ok';
      case 'CANCELLED':
        return 'status-pill status-pill--err';
      default:
        return 'status-pill status-pill--info';
    }
  };

  const renderOrderCard = (order: IFlowerOrder) => {
    const isUploading =
      uploadPhotoMutation.isPending && uploadPhotoMutation.variables?.id === order.id;
    const hasPhotos = order.photos && order.photos.length > 0;
    const currentPhoto = hasPhotos ? order.photos![order.photos!.length - 1].photoUrl : null;

    return (
      <div key={order.id} className="card-editorial" data-testid={`order-card-${order.id}`}>
        {/* Card Header */}
        <div className={styles.cardHeader}>
          <div
            className={styles.cardTitleRow}
          >
            <div className={styles.clientSummary}>
              <span className="card-eyebrow">№ {order.id.substring(0, 8)}</span>
              <div className={clsx('card-title', styles.clientName)}>
                {order.client?.name || 'Клиент'}
              </div>
            </div>
            <span className={getStatusPillClass(order.status)}>{getStatusLabel(order.status)}</span>
          </div>

          {(order.client?.phone || order.client?.tgname) && (
            <div
              className={styles.clientContacts}
            >
              {order.client?.phone && <span>{order.client.phone}</span>}
              {order.client?.tgname && (
                <a
                  href={`https://t.me/${order.client.tgname}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.clientTelegramLink}
                >
                  @{order.client.tgname}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Thumb */}
        <div className="card-thumb">
          {currentPhoto ? (
            <img src={currentPhoto} alt="Готовый букет" />
          ) : order.request?.examplePhotoUrl ? (
            <>
              <img
                src={order.request.examplePhotoUrl}
                alt="Пример клиента"
                className={styles.referenceThumbnail}
              />
              <span className="thumb-badge">Пример клиента</span>
            </>
          ) : (
            <div
              className={styles.emptyThumbnail}
            >
              {isUploading ? 'Загрузка…' : 'фото ещё нет'}
            </div>
          )}
        </div>

        {/* Details */}
        <div
          className={styles.cardDetails}
        >
          <div className="card-detail">
            <span className="k">Бюджет</span>
            <span className="v number">{order.budget} ₽</span>
          </div>
          {order.wishes && (
            <div className="card-detail">
              <span className="k">Состав</span>
              <span className="v serif">«{order.wishes}»</span>
            </div>
          )}
          {order.postcardText && (
            <div className="card-detail">
              <span className="k">Открытка</span>
              <span className="v serif">«{order.postcardText}»</span>
            </div>
          )}
          {order.request?.examplePhotoUrl && (
            <div
              className={clsx('card-detail', styles.referenceDetail)}
            >
              <span className={clsx('k', styles.detailLabel)}>
                Референс
              </span>
              <a
                href={order.request.examplePhotoUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.referenceImageLink}
              >
                <img
                  src={order.request.examplePhotoUrl}
                  alt="Reference"
                  className={styles.referenceImage}
                />
              </a>
            </div>
          )}

          <div className="card-detail">
            <span className="k">Куда</span>
            <span
              className={clsx('v', styles.deliveryAddress)}
            >
              <PinIcon size={12} color="var(--color-gold-deep)" />
              {order.deliveryAddress ? order.deliveryAddress : 'Самовывоз'}
            </span>
            {order.deliveryTime && (
              <span
                className={clsx('v', styles.deliveryTime)}
              >
                {new Date(order.deliveryTime).toLocaleString('ru-RU')}
              </span>
            )}
          </div>
          {order.courier && (
            <div
              className={styles.courierLabel}
            >
              Курьер · {order.courier.name}
            </div>
          )}
          {order.comment && (
            <div
              className={styles.adminComment}
            >
              <strong
                className={styles.commentLabel}
              >
                Комментарий
              </strong>
              <div
                className={styles.commentText}
              >
                {order.comment}
              </div>
            </div>
          )}
          {order.clientFeedback && (
            <div
              className={styles.clientFeedback}
            >
              <strong
                className={styles.feedbackLabel}
              >
                Замечания клиента
              </strong>
              <div
                className={styles.feedbackText}
              >
                {order.clientFeedback}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div
          className={styles.actionControls}
        >
          {/* CREATED state */}
          {order.status === 'CREATED' && (
            <Button
              fullWidth
              icon={ShoppingBagIcon}
              onClick={() => mutateStatus(order.id, 'ASSEMBLING')}
            >
              Начать сборку
            </Button>
          )}

          {/* ASSEMBLING state (Upload picture) */}
          {order.status === 'ASSEMBLING' && (
            <div className={styles.photoUploadControl}>
              <label className={clsx('form-label', styles.photoUploadLabel)}>
                Загрузить фото готового букета
              </label>
              <Input
                id={`order-photo-upload-${order.id}`}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoSelect(order.id, e)}
                hidden
                disabled={isUploading}
              />
              <label
                htmlFor={`order-photo-upload-${order.id}`}
                className={clsx(getButtonClassName({ variant: 'secondary', size: 'sm' }), styles.uploadLabel)}
              >
                <PlusIcon className={styles.photoUploadIcon} />
                <span>{isUploading ? 'Загрузка...' : 'Выбрать фото'}</span>
              </label>
            </div>
          )}

          {/* ASSEMBLED state (Send approval) */}
          {order.status === 'ASSEMBLED' && (
            <Button
              fullWidth
              icon={InboxIcon}
              onClick={() =>
                sendApprovalMutation.mutate(order.id, {
                  onError: (error) => {
                    console.error('Send approval error:', error);
                    alert(`Ошибка отправки на согласование: ${getErrorMessage(error)}`);
                  },
                })
              }
              disabled={
                sendApprovalMutation.isPending && sendApprovalMutation.variables === order.id
              }
            >
              Отправить на согласование
            </Button>
          )}

          {/* WAITING_FOR_APPROVAL state */}
          {order.status === 'WAITING_FOR_APPROVAL' && (
            <div
              className={styles.approvalPending}
            >
              Согласование отправлено клиенту в Telegram... ⏳
            </div>
          )}

          {/* APPROVED or WAITING_FOR_PAYMENT (Send payment link input) */}
          {(order.status === 'APPROVED' ||
            order.status === 'WAITING_FOR_PAYMENT' ||
            order.status === 'ASSEMBLED' ||
            order.status === 'WAITING_FOR_APPROVAL') && (
            <div className={styles.paymentForm}>
              <Input
                type="text"
                fieldSize="sm"
                placeholder="Ссылка на оплату..."
                value={paymentLinks[order.id] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setPaymentLinks((prev) => ({ ...prev, [order.id]: val }));
                }}
              />
              <Button
                fullWidth
                size="sm"
                icon={InboxIcon}
                onClick={() => {
                  const link = (paymentLinks[order.id] || '').trim();
                  sendPaymentMutation.mutate(
                    {
                      id: order.id,
                      paymentLink: link,
                    },
                    {
                      onSuccess: (_data, variables) => {
                        setPaymentLinks((prev) => {
                          const copy = { ...prev };
                          delete copy[variables.id];
                          return copy;
                        });
                      },
                      onError: (error) => {
                        console.error('Send payment error:', error);
                        alert(`Ошибка отправки ссылки на оплату: ${getErrorMessage(error)}`);
                      },
                    }
                  );
                }}
                disabled={
                  (sendPaymentMutation.isPending &&
                    sendPaymentMutation.variables?.id === order.id) ||
                  !/^https?:\/\/\S+$/i.test((paymentLinks[order.id] || '').trim())
                }
              >
                Отправить ссылку
              </Button>
              {order.status === 'WAITING_FOR_PAYMENT' && (
                <Button
                  fullWidth
                  size="sm"
                  variant="secondary"
                  icon={CheckIcon}
                  onClick={() => mutateStatus(order.id, 'PAID')}
                >
                  Оплачено вручную
                </Button>
              )}
            </div>
          )}

          {/* PAID state (Courier Selection and dispatch) */}
          {order.status === 'PAID' && (
            <div className={styles.courierForm}>
              <Select
                fieldSize="sm"
                value={selectedCouriers[order.id] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCouriers((prev) => ({ ...prev, [order.id]: val }));
                }}
              >
                <option value="">-- Выбрать курьера --</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · @{c.tgname || 'нет'}
                  </option>
                ))}
              </Select>
              <Button
                fullWidth
                size="sm"
                icon={TruckIcon}
                onClick={() => {
                  const courierId = selectedCouriers[order.id];
                  if (!courierId) return alert('Пожалуйста, выберите курьера!');
                  assignCourierMutation.mutate(
                    { id: order.id, courierId },
                    {
                      onError: (error) => {
                        console.error('Assign courier error:', error);
                        alert(`Ошибка назначения курьера: ${getErrorMessage(error)}`);
                      },
                    }
                  );
                }}
                disabled={!selectedCouriers[order.id] || assignCourierMutation.isPending}
              >
                Передать курьеру
              </Button>
            </div>
          )}

          {/* DELIVERING state */}
          {order.status === 'DELIVERING' && (
            <div
              className={styles.deliveryStatus}
            >
              <div
                className={styles.deliveryStatusContent}
              >
                <DeliveryIcon size={18} color="var(--color-sage)" />
                <span>Курьер в пути… ожидаем отметки о доставке.</span>
              </div>
            </div>
          )}

          {/* Cancel capability at any active stage */}
          {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
            <Button
              fullWidth
              size="sm"
              variant="secondary"
              icon={XMarkIcon}
              dangerText
              className={styles.cancelButton}
              onClick={() => mutateStatus(order.id, 'CANCELLED')}
            >
              Отменить заказ
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={clsx('animated-fade-in', pageStyles.page)}
      data-testid="orders-page"
    >
      <header className="page-header">
        <span className="eyebrow">Доска заказов</span>
        <h1>
          Управление <em>заказами</em>
        </h1>
        <p>Сборка, согласование по фото, отправка оплаты и курьерская доставка — единой canvas.</p>
      </header>

      <div
          className={styles.orderBoard}
        >
          {/* Column 1: Assembly */}
          <div className={styles.column}>
            <div
              className={styles.columnHeader}
            >
              <h3
                className={styles.columnTitle}
              >
                <ShoppingIcon
                  className={clsx(styles.columnIcon, styles.columnIconSage)}
                />
                Сборка
              </h3>
            </div>
            <div className={styles.orderList}>
              {colAssembly.map(renderOrderCard)}
            </div>
          </div>

          {/* Column 2: Approval & Payment */}
          <div className={styles.column}>
            <div
              className={styles.columnHeader}
            >
              <h3
                className={styles.columnTitle}
              >
                <DocumentIcon
                  className={clsx(styles.columnIcon, styles.columnIconWarn)}
                />
                Согласование
              </h3>
            </div>
            <div className={styles.orderList}>
              {colApproval.map(renderOrderCard)}
            </div>
          </div>

          {/* Column 3: Delivery */}
          <div className={styles.column}>
            <div
              className={styles.columnHeader}
            >
              <h3
                className={styles.columnTitle}
              >
                <TruckIcon className={clsx(styles.columnIcon, styles.columnIconGold)} />
                Доставка
              </h3>
            </div>
            <div className={styles.orderList}>
              {colDelivery.map(renderOrderCard)}
            </div>
          </div>

          {/* Column 4: Completed */}
          <div className={styles.column}>
            <div
              className={styles.columnHeader}
            >
              <h3
                className={styles.columnTitle}
              >
                <CheckIcon
                  className={clsx(styles.columnIcon, styles.columnIconSuccess)}
                />
                Завершено
              </h3>
            </div>
            <div className={styles.orderList}>
              {colCompleted.map(renderOrderCard)}
            </div>
          </div>
      </div>
    </div>
  );
};