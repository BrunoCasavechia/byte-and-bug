const digits = (v, max) => String(v || '').replace(/\D/g, '').slice(0, max);

export const maskCpf = (v) => {
  const d = digits(v, 11);
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};
export const maskCep = (v) => digits(v, 8).replace(/(\d{5})(\d)/, '$1-$2');
export const maskCard = (v) => digits(v, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
export const maskExpiry = (v) => digits(v, 4).replace(/(\d{2})(\d)/, '$1/$2');
export const maskCvv = (v) => digits(v, 3);
