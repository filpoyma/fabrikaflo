import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const translations = {
  ru: {
    // Navigation
    nav_home: 'Главная',
    nav_catalog: 'Каталог',
    nav_cart: 'Корзина',
    nav_orders: 'Заказы',
    nav_profile: 'Профиль',
    nav_ai_guide: 'Проводник',
    nav_admin: 'Админ',

    // Home
    home_hero_title: '🌸 Fabrika Flo',
    home_hero_subtitle: 'Авторские Букеты · Эксклюзивная Флористика',
    home_search_placeholder: 'Поиск товаров...',
    home_categories: 'Категории',
    home_new_arrivals: 'Новинки',
    home_quiz_title: 'AI Подбор Продуктов',
    home_quiz_subtitle: 'Пройдите интеллектуальный опрос и получите персональные рекомендации, комплекты и обучение',
    home_quiz_btn: '⚡ Пройти опрос',
    home_useful_materials: 'Полезные материалы',
    home_ref_title: 'Партнерская программа',
    home_ref_subtitle: 'Приглашай друзей — получай 10% от их первых 3-х заказов на бонусный баланс!',
    home_ref_btn: 'Получить ссылку',
    home_all_products: 'Все товары',
    home_stats_locations: 'Локации',
    home_stats_currencies: 'Валюты',
    home_bali: 'Бали 🌴',
    home_vietnam: 'Вьетнам 🇻🇳',
    home_select_location: 'Выберите локацию',
    home_select_currency: '💳 Валюта магазина',

    // Catalog
    catalog_title: 'Каталог',
    catalog_all: 'Все',
    catalog_empty: 'В этой категории пока нет товаров',
    catalog_search: 'Поиск по каталогу...',

    // Product
    product_back: 'Назад',
    product_in_stock: 'В наличии',
    product_out_of_stock: 'Нет в наличии',
    product_add_to_cart: 'Добавить в корзину',
    product_edit: 'Редактировать',
    product_save: 'Сохранить',
    product_variants: 'Варианты фасовки:',
    product_desc: 'Описание:',
    product_location: 'Локация:',
    product_added_to_cart: 'Добавлено в корзину!',

    // Cart
    cart_title: 'Корзина',
    cart_empty: 'Ваша корзина пуста',
    cart_go_catalog: 'Перейти в каталог',
    cart_bonus_applied: 'Бонусы применены:',
    cart_bonus_title: 'Бонусный баланс:',
    cart_bonus_use_btn: 'Использовать бонусы',
    cart_total: 'Итого:',
    cart_checkout_btn: 'Оформить заказ',

    // Checkout
    checkout_title: 'Оформление заказа',
    checkout_recipient: 'Имя получателя',
    checkout_phone: 'Телефон',
    checkout_address: 'Адрес доставки (Город, улица, дом...)',
    checkout_payment: 'Способ оплаты',
    checkout_screenshot: 'Загрузить скриншот оплаты (чек)',
    checkout_screenshot_required: 'Загрузите скриншот оплаты!',
    checkout_send_order: 'Отправить заказ',
    checkout_success_title: 'Заказ успешно оформлен!',
    checkout_order_number: 'Ваш заказ №',
    checkout_payment_details: 'Реквизиты для оплаты:',
    checkout_copy: 'Копировать реквизиты',

    // Orders
    orders_title: 'Мои заказы',
    orders_empty: 'У вас пока нет заказов',
    orders_repeat_btn: '🔄 Повторить заказ',

    // Profile
    profile_title: 'Профиль',
    profile_address: 'Адрес доставки',
    profile_address_sub: 'Укажите точку на карте или впишите адрес вручную. Он будет подставляться при заказах.',
    profile_confirm_address: '✅ Подтвердить адрес',
    profile_referral: 'Партнерская программа',
    profile_ref_sub: 'Делитесь ссылкой и получайте бонусы от заказов друзей до 5-го уровня (1-й ур: 10%, 2-й: 3%, 3-й: 2%, 4-й: 1%, 5-й: 1%).',
    profile_ref_balance: 'Ваш баланс:',
    profile_ref_link: 'Ваша ссылка:',
    profile_ref_invited: 'Приглашено:',
    profile_ref_earned: 'Заработано:',
    profile_ref_copy: 'Копировать',
    profile_settings: 'Настройки профиля',
    profile_lang: 'Язык',
    profile_curr: 'Валюта по умолчанию',
    profile_discount: 'Скидка {percent}%',
    profile_quick_repeat: '🔄 Быстрый повтор заказа',
    profile_repeat_desc: 'Повторить ваш прошлый заказ #{id} от {date}:',
    profile_adding_to_cart: 'Добавление в корзину...',
    profile_repeat_btn: '🛒 Повторить заказ',
    profile_settings_title: 'Настройки',
    profile_region: 'Регион',
    profile_currency: 'Валюта',
    profile_address_search_placeholder: 'Поиск отеля, улицы, района...',
    profile_address_search_btn: 'Найти',
    profile_locate_me: '📍 Найти меня на карте',
    profile_my_orders: '📋 Мои заказы',
    profile_orders_empty: 'У вас пока нет заказов',
    profile_order_details: '💳 Показать реквизиты',
    profile_copy_ref_link: 'Скопировать ссылку',

    // Quiz
    quiz_step_title: 'Шаг {step} из 4',
    quiz_result_title: 'Ваш результат',
    quiz_close: '✕ Закрыть',
    quiz_next: 'Далее →',
    quiz_back: '← Назад',
    quiz_recommends: 'Рекомендуемые продукты:',
    quiz_bundle_title: '🎁 Рекомендованный комплект',
    quiz_bundle_btn: '🛒 Купить комплект в 1 клик',
    quiz_why_bundle: 'Почему именно этот комплект?',
    quiz_edu_title: '📖 Обучающие материалы для вас',
    quiz_rating: 'Совпадение: {score}%',
  },
  en: {
    // Navigation
    nav_home: 'Home',
    nav_catalog: 'Catalog',
    nav_cart: 'Cart',
    nav_orders: 'Orders',
    nav_profile: 'Profile',
    nav_ai_guide: 'AI Guide',
    nav_admin: 'Admin',

    // Home
    home_hero_title: '🌸 Fabrika Flo',
    home_hero_subtitle: 'Artisan Bouquets · Premium Florals',
    home_search_placeholder: 'Search products...',
    home_categories: 'Categories',
    home_new_arrivals: 'New Arrivals',
    home_quiz_title: 'AI Product Selection',
    home_quiz_subtitle: 'Take our smart quiz to get personalized recommendations, bundles, and education',
    home_quiz_btn: '⚡ Start Quiz',
    home_useful_materials: 'Useful Materials',
    home_ref_title: 'Affiliate Program',
    home_ref_subtitle: 'Invite friends - get 10% of their first 3 orders to your bonus balance!',
    home_ref_btn: 'Get Link',
    home_all_products: 'All Products',
    home_stats_locations: 'Locations',
    home_stats_currencies: 'Currencies',
    home_bali: 'Bali 🌴',
    home_vietnam: 'Vietnam 🇻🇳',
    home_select_location: 'Select Location',
    home_select_currency: '💳 Store Currency',

    // Catalog
    catalog_title: 'Catalog',
    catalog_all: 'All',
    catalog_empty: 'No products in this category yet',
    catalog_search: 'Search catalog...',

    // Product
    product_back: 'Back',
    product_in_stock: 'In stock',
    product_out_of_stock: 'Out of stock',
    product_add_to_cart: 'Add to Cart',
    product_edit: 'Edit',
    product_save: 'Save',
    product_variants: 'Packaging variants:',
    product_desc: 'Description:',
    product_location: 'Location:',
    product_added_to_cart: 'Added to cart!',

    // Cart
    cart_title: 'Cart',
    cart_empty: 'Your cart is empty',
    cart_go_catalog: 'Go to Catalog',
    cart_bonus_applied: 'Bonuses applied:',
    cart_bonus_title: 'Bonus balance:',
    cart_bonus_use_btn: 'Use bonuses',
    cart_total: 'Total:',
    cart_checkout_btn: 'Checkout',

    // Checkout
    checkout_title: 'Checkout',
    checkout_recipient: 'Recipient Name',
    checkout_phone: 'Phone',
    checkout_address: 'Delivery Address (City, street, building...)',
    checkout_payment: 'Payment Method',
    checkout_screenshot: 'Upload payment screenshot (receipt)',
    checkout_screenshot_required: 'Please upload payment screenshot!',
    checkout_send_order: 'Send Order',
    checkout_success_title: 'Order placed successfully!',
    checkout_order_number: 'Your order #',
    checkout_payment_details: 'Payment details:',
    checkout_copy: 'Copy details',

    // Orders
    orders_title: 'My Orders',
    orders_empty: 'You have no orders yet',
    orders_repeat_btn: '🔄 Repeat Order',

    // Profile
    profile_title: 'Profile',
    profile_address: 'Delivery Address',
    profile_address_sub: 'Pin a point on the map or enter address manually. It will be used for delivery.',
    profile_confirm_address: '✅ Confirm Address',
    profile_referral: 'Referral Program',
    profile_ref_sub: 'Share the link and get bonuses from friends\' orders up to the 5th level (Lvl 1: 10%, Lvl 2: 3%, Lvl 3: 2%, Lvl 4: 1%, Lvl 5: 1%).',
    profile_ref_balance: 'Your balance:',
    profile_ref_link: 'Your link:',
    profile_ref_invited: 'Invited:',
    profile_ref_earned: 'Earned:',
    profile_ref_copy: 'Copy',
    profile_settings: 'Profile Settings',
    profile_lang: 'Language',
    profile_curr: 'Default Currency',
    profile_discount: 'Discount {percent}%',
    profile_quick_repeat: '🔄 Quick Order Repeat',
    profile_repeat_desc: 'Repeat your last order #{id} from {date}:',
    profile_adding_to_cart: 'Adding to cart...',
    profile_repeat_btn: '🛒 Repeat Order',
    profile_settings_title: 'Settings',
    profile_region: 'Region',
    profile_currency: 'Currency',
    profile_address_search_placeholder: 'Search hotel, street, area...',
    profile_address_search_btn: 'Search',
    profile_locate_me: '📍 Locate me on the map',
    profile_my_orders: '📋 My Orders',
    profile_orders_empty: 'You have no orders yet',
    profile_order_details: '💳 Show details',
    profile_copy_ref_link: 'Copy referral link',

    // Quiz
    quiz_step_title: 'Step {step} of 4',
    quiz_result_title: 'Your Result',
    quiz_close: '✕ Close',
    quiz_next: 'Next →',
    quiz_back: '← Back',
    quiz_recommends: 'Recommended products:',
    quiz_bundle_title: '🎁 Recommended Bundle',
    quiz_bundle_btn: '🛒 Buy Bundle in 1 click',
    quiz_why_bundle: 'Why this bundle?',
    quiz_edu_title: '📖 Educational materials for you',
    quiz_rating: 'Match: {score}%',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('language') || 'ru';
  });

  const setLanguage = (lang) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const t = (key, params = {}) => {
    let text = translations[language]?.[key] || translations['ru']?.[key] || key;
    Object.keys(params).forEach(p => {
      text = text.split(`{${p}}`).join(params[p]);
    });
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
