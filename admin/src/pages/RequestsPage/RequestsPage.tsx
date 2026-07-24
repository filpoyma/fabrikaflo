import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './RequestsPage.module.css';

import { isInitialQueryLoad } from '../../api/queryUtils';
import {
  useConvertRequestMutation,
  useRequestsQuery,
  useUpdateRequestStatusMutation,
} from '../../api/requests';
import CheckIcon from '../../assets/icons/check.svg';
import PlusIcon from '../../assets/icons/plus.svg';
import XMarkIcon from '../../assets/icons/x-mark.svg';
import { PeonyIcon, PickupIcon, VanIcon } from '../../components/BotanicalIcons';
import { pageStyles } from '../../shared/styles';
import { Button, InlineQueryLoader, Input, Modal, Textarea } from '../../shared/ui';
import type { IFlowerInquiry } from '../../types/inquiry';

export const RequestsPage: React.FC = () => {
  const { data, isPending } = useRequestsQuery({ refetchInterval: 20_000 });
  const requests = data ?? [];
  const updateStatusMutation = useUpdateRequestStatusMutation();
  const convertMutation = useConvertRequestMutation();

  // Modal and form states
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<IFlowerInquiry | null>(null);
  const [openTelegramMenuId, setOpenTelegramMenuId] = useState<string | null>(null);
  const [telegramMenuPos, setTelegramMenuPos] = useState({ top: 0, left: 0 });
  const telegramMenuRef = useRef<HTMLDivElement | null>(null);

  // Order Form states
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [postcardText, setPostcardText] = useState('');
  const [wishes, setWishes] = useState('');
  const [comment, setComment] = useState('');
  const [budget, setBudget] = useState(0);

  const openTelegramMenuRequest = openTelegramMenuId
    ? requests.find((req) => req.id === openTelegramMenuId) ?? null
    : null;

  useEffect(() => {
    if (!openTelegramMenuId) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (telegramMenuRef.current?.contains(target)) return;
      if ((target as Element).closest?.(`[data-telegram-trigger="${openTelegramMenuId}"]`)) return;
      setOpenTelegramMenuId(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenTelegramMenuId(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openTelegramMenuId]);

  const handleOpenTelegramMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    requestId: string,
  ) => {
    event.stopPropagation();
    if (openTelegramMenuId === requestId) {
      setOpenTelegramMenuId(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setTelegramMenuPos({ top: rect.bottom + 6, left: rect.left });
    setOpenTelegramMenuId(requestId);
  };

  const handleWriteToClient = (tgname: string) => {
    window.open(`https://t.me/${tgname}`, '_blank', 'noopener,noreferrer');
    setOpenTelegramMenuId(null);
  };

  const handleMarkContacted = (requestId: string) => {
    updateStatusMutation.mutate({ id: requestId, status: 'CONTACTED' });
    setOpenTelegramMenuId(null);
  };

  const handleOpenConvert = (req: IFlowerInquiry) => {
    setSelectedRequest(req);
    setRecipientName(req.client?.name || '');
    setRecipientPhone(req.recipientPhone || req.client?.phone || '');
    setDeliveryAddress(req.deliveryAddress || '');
    setDeliveryTime('');
    setPostcardText(req.postcardText || '');
    setWishes(req.comment || '');
    setComment('');
    setBudget(req.budget);
    setIsConvertModalOpen(true);
  };

  const handleConvertSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const payload = {
      recipientName,
      recipientPhone,
      deliveryAddress: selectedRequest.deliveryType === 'DELIVERY' ? deliveryAddress : '',
      deliveryTime: deliveryTime || undefined,
      postcardText: postcardText || undefined,
      wishes,
      comment: comment || undefined,
      budget: Number(budget),
    };

    convertMutation.mutate(
      { id: selectedRequest.id, data: payload },
      {
        onSuccess: () => {
          setIsConvertModalOpen(false);
          setSelectedRequest(null);
        },
      }
    );
  };

  const statusTranslations: Record<string, string> = {
    PENDING: 'Новая заявка',
    CONTACTED: 'Связались с клиентом',
    CONVERTED: 'Заказ оформлен',
    CANCELLED: 'Отменено',
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'badge badge-pending';
      case 'CONTACTED':
        return 'badge badge-warning';
      case 'CONVERTED':
        return 'badge badge-success';
      case 'CANCELLED':
        return 'badge badge-error';
      default:
        return 'badge';
    }
  };

  return (
    <div className={clsx('animated-fade-in', pageStyles.page)} data-testid="requests-page">
      <header className="page-header">
        <span className="eyebrow">Из Telegram</span>
        <h1>
          Заявки на <em>букеты</em>
        </h1>
        <p>Список обращений клиентов из Telegram-бота. Превращайте их в заказы.</p>
      </header>

      <div className={clsx('glass-card', pageStyles.surfaceCard)}>
        {!isInitialQueryLoad(isPending, data) && requests.length === 0 ? (
          <div className="empty-state">
            <PeonyIcon size={64} color="var(--color-gold-deep)" />
            <div className="headline">Заявок пока нет</div>
            <p>Заявки появятся, когда клиенты нажмут кнопку «Заказать букет» в Telegram-боте.</p>
          </div>
        ) : (
          <div className={pageStyles.tableScroll}>
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Повод / Пожелания</th>
                  <th>Бюджет</th>
                  <th>Доставка / Дата</th>
                  <th>Статус</th>
                  <th className="right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {isInitialQueryLoad(isPending, data) ? (
                  <tr>
                    <td colSpan={6}>
                      <InlineQueryLoader message="Получаем список заявок…" />
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} data-testid={`request-${req.id}`}>
                      <td>
                        <div className="cell-primary">{req.client?.name || 'Клиент'}</div>
                        {req.client?.tgname ? (
                          <button
                            type="button"
                            data-telegram-trigger={req.id}
                            className={clsx('cell-mute', styles.telegramTrigger)}
                            onClick={(event) => handleOpenTelegramMenu(event, req.id)}
                            aria-expanded={openTelegramMenuId === req.id}
                            aria-haspopup="menu"
                          >
                            @{req.client.tgname}
                          </button>
                        ) : null}
                      </td>
                      <td className={styles.occasionCell}>
                        <div className={styles.occasionTitle}>{req.occasion}</div>
                        <div className={clsx('cell-mute', styles.occasionComment)}>
                          {req.comment ? `«${req.comment}»` : 'без комментария'}
                        </div>
                      </td>
                      <td>
                        <div className="cell-mono-num">{req.budget} ₽</div>
                      </td>
                      <td>
                        <div className={styles.deliveryType}>
                          {req.deliveryType === 'PICKUP' ? (
                            <>
                              <PickupIcon size={13} color="var(--color-gold-deep)" /> Самовывоз
                            </>
                          ) : (
                            <>
                              <VanIcon size={13} color="var(--color-gold-deep)" /> Доставка
                            </>
                          )}
                        </div>
                        <div className="cell-mute">
                          {req.date
                            ? new Date(req.date).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                              })
                            : '—'}
                        </div>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(req.status)}>
                          {statusTranslations[req.status] || req.status}
                        </span>
                      </td>
                      <td className="right">
                        <div className={styles.rowActions}>
                          {(req.status === 'PENDING' || req.status === 'CONTACTED') && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                icon={PlusIcon}
                                onClick={() => handleOpenConvert(req)}
                              >
                                Создать заказ
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={XMarkIcon}
                                dangerText
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: req.id, status: 'CANCELLED' })
                                }
                              >
                                Отменить
                              </Button>
                            </>
                          )}
                          {req.status === 'CONVERTED' && (
                            <span className={styles.convertedLabel}>оформлен</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Convert Request Modal */}
      {selectedRequest && (
        <Modal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          title={`Оформление заказа по заявке #${selectedRequest.id.substring(0, 8)}`}
        >
          <form onSubmit={handleConvertSubmit} className={pageStyles.formStack}>
            <div className={styles.conversionSummary}>
              Клиент: <strong>{selectedRequest.client?.name}</strong> • Повод:{' '}
              <strong>{selectedRequest.occasion}</strong>
            </div>

            <div className="form-group">
              <label className="form-label">Получатель (Имя)</label>
              <Input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Телефон получателя</label>
              <Input
                type="text"
                placeholder="+7..."
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                required
              />
            </div>

            {selectedRequest.deliveryType === 'DELIVERY' && (
              <div className="form-group">
                <label className="form-label">Адрес доставки</label>
                <Textarea
                  className={styles.recipientField}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Дата и время доставки / получения</label>
              <Input
                type="datetime-local"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Пожелания</label>
              <Textarea
                className={styles.commentField}
                value={wishes}
                onChange={(e) => setWishes(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Текст открытки (если нужна)</label>
              <Input
                type="text"
                placeholder="С днем рождения!..."
                value={postcardText}
                onChange={(e) => setPostcardText(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Комментарии к доставке / курьеру</label>
              <Input
                type="text"
                placeholder="Позвонить получателю за 15 мин..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Бюджет заказа (руб.)</label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                required
              />
            </div>

            <div className={pageStyles.formActions}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsConvertModalOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={convertMutation.isPending} icon={CheckIcon}>
                {convertMutation.isPending ? 'Оформление...' : 'Оформить заказ'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {openTelegramMenuRequest?.client?.tgname
        ? createPortal(
            <div
              ref={telegramMenuRef}
              className={styles.telegramMenu}
              style={{ top: telegramMenuPos.top, left: telegramMenuPos.left }}
              role="menu"
            >
              <button
                type="button"
                className={styles.telegramMenuItem}
                role="menuitem"
                onClick={() => {
                  const tgname = openTelegramMenuRequest.client?.tgname
                  if (tgname) handleWriteToClient(tgname)
                }}
              >
                Написать клиенту
              </button>
              {openTelegramMenuRequest.status === 'PENDING' ? (
                <button
                  type="button"
                  className={styles.telegramMenuItem}
                  role="menuitem"
                  onClick={() => handleMarkContacted(openTelegramMenuRequest.id)}
                >
                  Отметить: связались
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};
