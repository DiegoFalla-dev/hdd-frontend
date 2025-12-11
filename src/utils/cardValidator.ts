// cardValidator.ts
/**
 * Validador de tarjetas de crédito - Luhn Algorithm
 */

export interface CardValidationResult {
  valid: boolean;
  cardType?: 'visa' | 'mastercard' | 'amex' | 'diners' | 'unknown';
  errors: string[];
}

/**
 * Calcula el tipo de tarjeta según el número
 */
export function getCardType(cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'diners' | 'unknown' {
  const patterns: Record<string, RegExp> = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    amex: /^3[47][0-9]{13}$/,
    diners: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
  };

  const number = cardNumber.replace(/\D/g, '');

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(number)) {
      return type as 'visa' | 'mastercard' | 'amex' | 'diners';
    }
  }

  return 'unknown';
}

/**
 * Implementa algoritmo Luhn para validación de números de tarjeta
 */
export function validateCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Valida fecha de vencimiento (formato MM/YY)
 */
export function validateExpiry(expiry: string): boolean {
  const [month, year] = expiry.split('/');

  if (!month || !year) {
    return false;
  }

  const m = parseInt(month, 10);
  const y = parseInt('20' + year, 10);

  if (m < 1 || m > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (y < currentYear) {
    return false;
  }

  if (y === currentYear && m < currentMonth) {
    return false;
  }

  return true;
}

/**
 * Valida CVV (3-4 dígitos)
 */
export function validateCVV(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv);
}

/**
 * Validación completa de tarjeta
 */
export function validateCard(
  cardNumber: string,
  cardName: string,
  expiry: string,
  cvv: string
): CardValidationResult {
  const errors: string[] = [];

  // Validar número
  if (!validateCardNumber(cardNumber)) {
    errors.push('Número de tarjeta inválido');
  }

  // Validar nombre
  if (!cardName || cardName.trim().length < 3) {
    errors.push('Nombre del titular debe tener al menos 3 caracteres');
  }

  // Validar vencimiento
  if (!validateExpiry(expiry)) {
    errors.push('Fecha de vencimiento inválida o expirada');
  }

  // Validar CVV
  if (!validateCVV(cvv)) {
    errors.push('CVV debe contener 3 o 4 dígitos');
  }

  return {
    valid: errors.length === 0,
    cardType: getCardType(cardNumber),
    errors,
  };
}

/**
 * Formatea número de tarjeta (ej: 1234 5678 9012 3456)
 */
export function formatCardNumber(value: string): string {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(.{4})/g, '$1 ').trim().substring(0, 19);
}

/**
 * Formatea fecha de vencimiento (ej: 12/25)
 */
export function formatExpiry(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length < 2) return numbers;
  return `${numbers.substring(0, 2)}/${numbers.substring(2, 4)}`;
}

/**
 * Máscara del número de tarjeta (últimos 4 dígitos visibles)
 */
export function maskCardNumber(cardNumber: string): string {
  const numbers = cardNumber.replace(/\D/g, '');
  if (numbers.length < 4) return '';
  return '*'.repeat(numbers.length - 4) + numbers.slice(-4);
}
