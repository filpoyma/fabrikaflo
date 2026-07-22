/** +7/7/8 и 10 цифр (XXX XXX XX XX), либо 10 цифр без кода страны; пробелы необязательны */
export const RU_PHONE_REGEX =
  /^(?:\+7|7|8)[\s()-]*(?:\d[\s()-]*){9}\d$|^(?:\d[\s()-]*){9}\d$/

export const RU_PHONE_INVALID_MESSAGE = 'Введите номер в формате +7 XXX XXX XX XX'

export function isValidRuPhone(phone: string): boolean {
  return RU_PHONE_REGEX.test(phone.trim())
}
