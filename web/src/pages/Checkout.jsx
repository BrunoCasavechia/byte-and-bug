import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import { api } from '../lib/api.js';
import { maskCard, maskCep, maskCpf, maskCvv, maskExpiry } from '../lib/masks.js';
import { useCart, useToast } from '../store.jsx';
import { Alert, Field, fieldProps } from '../components/ui.jsx';
import { SelectBox } from '../components/SelectBox.jsx';
import { Summary } from './Cart.jsx';

const STEPS = ['Endereço', 'Pagamento', 'Revisão'];
const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

// Signature: the steps are pads on a board and a copper trace lights up between them.
function Trace({ step }) {
  const progress = step / (STEPS.length - 1);
  return (
    <ol className="trace" aria-label="Etapas do pedido" data-testid="checkout-steps">
      <svg className="trace__svg" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
        <line className="trace__base" x1="0" y1="3" x2="100" y2="3" />
        <line className="trace__copper" x1="0" y1="3" x2="100" y2="3" pathLength="1" style={{ '--progress': progress }} />
      </svg>
      {STEPS.map((label, i) => {
        const state = i < step ? 'is-done' : i === step ? 'is-current' : '';
        return (
          <li key={label} className={`trace__step ${state}`} aria-current={i === step ? 'step' : undefined}>
            <span className="pad">{i < step ? <Check size={16} aria-hidden="true" /> : i + 1}</span>
            <span className="trace__label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

const empty = { fullName: '', cpf: '', cep: '', street: '', number: '', complement: '', city: '', state: '' };
const emptyPay = { cardNumber: '', cardName: '', expiry: '', cvv: '' };

function validateAddress(a) {
  const e = {};
  if (a.fullName.trim().split(/\s+/).length < 2) e.fullName = 'Informe nome e sobrenome.';
  if (a.cpf.replace(/\D/g, '').length !== 11) e.cpf = 'CPF deve ter 11 dígitos.';
  if (a.cep.replace(/\D/g, '').length !== 8) e.cep = 'CEP deve ter 8 dígitos.';
  if (!a.street.trim()) e.street = 'Informe a rua.';
  if (!a.number.trim()) e.number = 'Informe o número.';
  if (!a.city.trim()) e.city = 'Informe a cidade.';
  if (!a.state) e.state = 'Escolha o estado.';
  return e;
}
function validatePayment(p) {
  const e = {};
  if (p.cardNumber.replace(/\D/g, '').length !== 16) e.cardNumber = 'O cartão deve ter 16 dígitos.';
  if (!p.cardName.trim()) e.cardName = 'Informe o nome impresso no cartão.';
  if (!/^\d{2}\/\d{2}$/.test(p.expiry)) e.expiry = 'Use o formato MM/AA.';
  if (!/^\d{3}$/.test(p.cvv)) e.cvv = 'O CVV tem 3 dígitos.';
  return e;
}

export function Checkout() {
  const { cart, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState(empty);
  const [payment, setPayment] = useState(emptyPay);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  if (cart && !cart.items.length) return <Navigate to="/carrinho" replace />;
  if (!cart) return <div className="skeleton" style={{ height: 300 }} aria-label="Carregando" />;

  const setA = (k, mask) => (e) => setAddress((a) => ({ ...a, [k]: mask ? mask(e.target.value) : e.target.value }));
  const setP = (k, mask) => (e) => setPayment((p) => ({ ...p, [k]: mask ? mask(e.target.value) : e.target.value }));

  const next = () => {
    const e = step === 0 ? validateAddress(address) : validatePayment(payment);
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(Object.keys(e)[0])?.focus();
      return;
    }
    setStep((s) => s + 1);
  };

  const placeOrder = async () => {
    setBusy(true); setServerError('');
    try {
      const order = await api('/orders', { method: 'POST', body: { shipping: address, payment } });
      toast(`Pedido #${order.id} confirmado!`);
      navigate(`/pedidos/${order.id}?novo=1`, { viewTransition: true });
      refresh();
    } catch (err) {
      const fe = err.fieldErrors?.() || {};
      const mapped = Object.fromEntries(Object.entries(fe).map(([k, v]) => [k.split('.')[1], v]));
      if (Object.keys(mapped).length) {
        setErrors(mapped);
        setStep(Object.keys(mapped).some((k) => k in empty) ? 0 : 1);
      }
      setServerError(err.message);
    } finally { setBusy(false); }
  };

  const e = errors;
  return (
    <>
      <div className="page-head"><h1>Finalizar compra</h1><span className="checkout-secure"><Lock size={16} aria-hidden="true" />Compra 100% segura</span></div>
      <Trace step={step} />
      <div className="two-col">
        <section className="panel" aria-labelledby="step-title">
          <div className="panel__head"><h2 id="step-title">{STEPS[step]}</h2></div>
          <div className="panel__body step-panel" key={step} style={{ display: 'grid', gap: 20 }}>
            {serverError && <Alert type="error" data-testid="checkout-error">{serverError}</Alert>}

            {step === 0 && (
              <form className="form-grid" noValidate onSubmit={(ev) => { ev.preventDefault(); next(); }} data-testid="address-form">
                <div className="span-4"><Field id="fullName" label="Nome completo" error={e.fullName}><input className="input" autoComplete="name" {...fieldProps('fullName', e.fullName)} value={address.fullName} onChange={setA('fullName')} /></Field></div>
                <div className="span-2"><Field id="cpf" label="CPF" error={e.cpf}><input className="input tabular" inputMode="numeric" placeholder="000.000.000-00" {...fieldProps('cpf', e.cpf)} value={address.cpf} onChange={setA('cpf', maskCpf)} /></Field></div>
                <div className="span-2"><Field id="cep" label="CEP" error={e.cep}><input className="input tabular" inputMode="numeric" placeholder="00000-000" autoComplete="postal-code" {...fieldProps('cep', e.cep)} value={address.cep} onChange={setA('cep', maskCep)} /></Field></div>
                <div className="span-4"><Field id="street" label="Rua" error={e.street}><input className="input" autoComplete="address-line1" {...fieldProps('street', e.street)} value={address.street} onChange={setA('street')} /></Field></div>
                <div className="span-2"><Field id="number" label="Número" error={e.number}><input className="input" {...fieldProps('number', e.number)} value={address.number} onChange={setA('number')} /></Field></div>
                <div className="span-4"><Field id="complement" label="Complemento (opcional)"><input className="input" {...fieldProps('complement')} value={address.complement} onChange={setA('complement')} /></Field></div>
                <div className="span-4"><Field id="city" label="Cidade" error={e.city}><input className="input" autoComplete="address-level2" {...fieldProps('city', e.city)} value={address.city} onChange={setA('city')} /></Field></div>
                <div className="span-2"><Field id="state" label="Estado" error={e.state}>
                  <SelectBox inputId="state" testId="state-select" options={UFS.map((uf) => ({ value: uf, label: uf }))} value={address.state}
                    onChange={(v) => setAddress((a) => ({ ...a, state: v }))} invalid={Boolean(e.state)} describedBy="state-error" placeholder="UF" />
                </Field></div>
                <div className="span-6" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn--primary" data-testid="continue">Continuar para pagamento</button>
                </div>
              </form>
            )}

            {step === 1 && (
              <form className="form-grid" noValidate onSubmit={(ev) => { ev.preventDefault(); next(); }} data-testid="payment-form">
                <div className="span-6"><Alert type="info">Ambiente de teste: o cartão <strong className="tabular">4111 1111 1111 1111</strong> aprova e o <strong className="tabular">4000 0000 0000 0002</strong> é recusado.</Alert></div>
                <div className="span-4"><Field id="cardNumber" label="Número do cartão" error={e.cardNumber}><input className="input tabular" inputMode="numeric" autoComplete="off" placeholder="0000 0000 0000 0000" {...fieldProps('cardNumber', e.cardNumber)} value={payment.cardNumber} onChange={setP('cardNumber', maskCard)} /></Field></div>
                <div className="span-2"><Field id="expiry" label="Validade" error={e.expiry}><input className="input tabular" inputMode="numeric" placeholder="MM/AA" autoComplete="off" {...fieldProps('expiry', e.expiry)} value={payment.expiry} onChange={setP('expiry', maskExpiry)} /></Field></div>
                <div className="span-4"><Field id="cardName" label="Nome impresso no cartão" error={e.cardName}><input className="input" autoComplete="off" {...fieldProps('cardName', e.cardName)} value={payment.cardName} onChange={setP('cardName')} /></Field></div>
                <div className="span-2"><Field id="cvv" label="CVV" error={e.cvv}><input className="input tabular" inputMode="numeric" placeholder="000" autoComplete="off" {...fieldProps('cvv', e.cvv)} value={payment.cvv} onChange={setP('cvv', maskCvv)} /></Field></div>
                <div className="span-6" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn--ghost" onClick={() => setStep(0)}><ArrowLeft size={16} aria-hidden="true" />Voltar</button>
                  <button type="submit" className="btn btn--primary" data-testid="continue">Revisar pedido</button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div style={{ display: 'grid', gap: 16 }} data-testid="review">
                <div className="review-block">
                  <h3>Entrega <button type="button" className="link-btn" onClick={() => setStep(0)}>Alterar</button></h3>
                  <span>{address.fullName}</span>
                  <span>{address.street}, {address.number}{address.complement ? ` - ${address.complement}` : ''}</span>
                  <span>{address.city}/{address.state} · CEP {address.cep}</span>
                </div>
                <div className="review-block">
                  <h3>Pagamento <button type="button" className="link-btn" onClick={() => setStep(1)}>Alterar</button></h3>
                  <span className="tabular">Cartão final {payment.cardNumber.replace(/\D/g, '').slice(-4)} · {payment.cardName}</span>
                </div>
                <div className="review-block">
                  <h3>Itens</h3>
                  {cart.items.map((i) => <span key={`${i.productId}-${i.color}`}>{i.quantity}x {i.name}{i.color ? ` (${i.color})` : ''}</span>)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn--ghost" onClick={() => setStep(1)}><ArrowLeft size={16} aria-hidden="true" />Voltar</button>
                  <button type="button" className="btn btn--primary" onClick={placeOrder} disabled={busy} data-testid="place-order">
                    {busy ? <span className="spinner" aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
                    {busy ? 'Processando...' : 'Confirmar pedido'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
        <Summary cart={cart} />
      </div>
    </>
  );
}
