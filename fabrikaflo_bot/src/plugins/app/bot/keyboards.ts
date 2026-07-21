import { Keyboard } from 'grammy'

export const getClientMainMenu = (miniAppUrl: string) => {
  const isHttps = miniAppUrl && miniAppUrl.startsWith('https://')

  if (isHttps) {
    return new Keyboard()
      .webApp('🌸 Заказать букет', `${miniAppUrl}/checkout`)
      .webApp('❤️ Наши работы', `${miniAppUrl}/catalog`)
      .row()
      .webApp('📦 Мои заказы', `${miniAppUrl}/orders`)
      .text('📞 Контакты')
      .resized()
  }

  // Fallback to text buttons if no HTTPS link is provided
  return new Keyboard()
    .text('🌸 Заказать букет').text('❤️ Наши работы')
    .row()
    .text('📦 Мои заказы').text('📞 Контакты')
    .resized()
}

export const getCourierMainMenu = () => {
  return new Keyboard()
    .text('📦 Мои доставки')
    .row()
    .text('🌸 В меню клиента')
    .resized()
}
