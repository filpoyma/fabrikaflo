import { useEffect } from "react";

export function useTelegram() {
  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      // Optional: Setup main button for checkout
    }
  }, [tg]);

  // Outside Telegram there is no authenticated Telegram user.
  const user = tg?.initDataUnsafe?.user || null;

  const initData = tg?.initData || "";
  const colorScheme = tg?.colorScheme || "dark";

  const haptic = {
    impact: (style = "medium") => tg?.HapticFeedback?.impactOccurred(style),
    success: () => tg?.HapticFeedback?.notificationOccurred("success"),
    error: () => tg?.HapticFeedback?.notificationOccurred("error"),
  };

  const close = () => tg?.close();
  const showAlert = (msg) => tg?.showAlert(msg);
  const showConfirm = (msg, cb) => tg?.showConfirm(msg, cb);

  return {
    tg,
    user,
    initData,
    colorScheme,
    haptic,
    close,
    showAlert,
    showConfirm,
  };
}
