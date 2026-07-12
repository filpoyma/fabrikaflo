import { Keyboard } from 'grammy'

export const getClientMainMenu = () => {
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
