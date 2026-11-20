// Small validation helpers. Each returns an error message or null.
export const required = (v) => (v === undefined || v === null || String(v).trim() === '' ? 'obrigatório' : null);

export const isEmail = (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '')) ? null : 'e-mail inválido');

export const isCep = (v) => (/^\d{5}-?\d{3}$/.test(String(v || '')) ? null : 'CEP deve ter 8 dígitos');

export function isCpf(value) {
  const cpf = String(value || '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return 'CPF inválido';
  const calc = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]) ? null : 'CPF inválido';
}

export function isCardNumber(value) {
  const digits = String(value || '').replace(/\s/g, '');
  if (!/^\d{16}$/.test(digits)) return 'número do cartão deve ter 16 dígitos';
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let d = Number(digits[15 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0 ? null : 'número do cartão inválido';
}

export function isExpiry(value) {
  const m = /^(\d{2})\/(\d{2})$/.exec(String(value || ''));
  if (!m) return 'validade no formato MM/AA';
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return 'mês inválido';
  const now = new Date();
  const end = new Date(year, month, 1);
  return end > now ? null : 'cartão vencido';
}

// Runs a map of field -> [checks] and returns details array for a 400.
export function validate(body, rules) {
  const details = [];
  for (const [field, checks] of Object.entries(rules)) {
    for (const check of checks) {
      const msg = check(body?.[field]);
      if (msg) { details.push({ field, message: msg }); break; }
    }
  }
  return details;
}
