import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Tag, Trash2, X } from 'lucide-react';
import { api, brl } from '../lib/api.js';
import { installments, pixPrice } from '../lib/price.js';
import { Mascot } from '../components/Mascot.jsx';
import { useAuth, useCart, useToast } from '../store.jsx';
import { Alert, ProductImage } from '../components/ui.jsx';

export function Summary({ cart, children }) {
  return (
    <aside className="panel summary" aria-labelledby="summary-title" data-testid="order-summary">
      <div className="panel__head"><h2 id="summary-title">Resumo</h2></div>
      <div className="panel__body" style={{ display: 'grid', gap: 20 }}>
        <dl>
          <dt>Subtotal</dt><dd data-testid="summary-subtotal">{brl(cart.subtotal)}</dd>
          {cart.discount > 0 && (<><dt>Desconto</dt><dd className="discount" data-testid="summary-discount">- {brl(cart.discount)}</dd></>)}
          <dt>Frete</dt><dd data-testid="summary-shipping">{cart.shipping === 0 ? 'Grátis' : brl(cart.shipping)}</dd>
          <dt className="total">Total</dt><dd className="total" data-testid="summary-total">{brl(cart.total)}</dd>
        </dl>
        <div className="summary__pix" data-testid="summary-pix">
          <strong className="tabular">{brl(pixPrice(cart.total))}</strong> no Pix
          <div style={{ fontWeight: 600, color: 'var(--ink-2)', fontSize: '0.8125rem' }}>ou {installments(cart.total).label}</div>
        </div>
        {children}
      </div>
    </aside>
  );
}

function CouponForm({ cart }) {
  const { setCart } = useCart();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (cart.coupon) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <div className="chip" style={{ justifySelf: 'start' }} data-testid="applied-coupon">
          <Tag size={14} aria-hidden="true" />{cart.coupon.code}
          <button type="button" aria-label="Remover cupom" onClick={async () => setCart(await api('/cart/coupon', { method: 'DELETE' }))}><X size={14} /></button>
        </div>
        {cart.coupon.warning && <Alert type="warning" data-testid="coupon-warning">{cart.coupon.warning}</Alert>}
      </div>
    );
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault(); setError(''); setBusy(true);
        try { setCart(await api('/cart/coupon', { method: 'POST', body: { code } })); toast('Cupom aplicado.'); setCode(''); }
        catch (err) { setError(err.message); }
        finally { setBusy(false); }
      }}
      style={{ display: 'grid', gap: 6 }}
    >
      <label htmlFor="coupon" className="label" style={{ fontWeight: 600 }}>Cupom de desconto</label>
      <div className="coupon-form">
        <input id="coupon" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex.: BYTE10" aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? 'coupon-error' : undefined} data-testid="coupon-input" />
        <button type="submit" className="btn btn--secondary" disabled={!code.trim() || busy}>Aplicar</button>
      </div>
      {error && <span className="field-error" id="coupon-error" data-testid="coupon-error">{error}</span>}
    </form>
  );
}

const FREE_FROM = 299;
function FreeShipping({ cart }) {
  const base = cart.subtotal - cart.discount;
  const done = cart.shipping === 0;
  const pct = Math.min(100, Math.round((base / FREE_FROM) * 100));
  return (
    <div className={`free-ship${done ? ' is-done' : ''}`} data-testid="free-shipping">
      <span>{done ? 'Oba! Seu frete é grátis.' : `Faltam ${brl(FREE_FROM - base)} para ganhar frete grátis.`}</span>
      <div className="free-ship__bar" aria-hidden="true"><span style={{ width: `${done ? 100 : pct}%` }} /></div>
    </div>
  );
}

function CartItem({ item }) {
  const { setCart } = useCart();
  const toast = useToast();
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const setQty = async (quantity) => {
    setBusy(true);
    try { setCart(await api(`/cart/items/${item.productId}`, { method: 'PATCH', body: { quantity, color: item.color || undefined } })); }
    catch (err) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    setLeaving(true);
    await new Promise((r) => setTimeout(r, 200));
    try {
      const qs = item.color ? `?color=${encodeURIComponent(item.color)}` : '';
      setCart(await api(`/cart/items/${item.productId}${qs}`, { method: 'DELETE' }));
      toast(`${item.name} removido do carrinho.`, 'info');
    } catch (err) { setLeaving(false); toast(err.message, 'error'); }
  };

  return (
    <li className={`cart-item${leaving ? ' is-leaving' : ''}`} data-testid="cart-item">
      <ProductImage product={item} />
      <div className="cart-item__meta">
        <span className="designator">Cód. {item.sku}</span>
        <Link to={`/produto/${item.productId}`}>{item.name}</Link>
        {item.color && <span className="hint" style={{ color: 'var(--ink-3)', fontSize: '0.875rem' }}>Cor: {item.color}</span>}
        <span className="tabular" style={{ color: 'var(--ink-2)', fontSize: '0.875rem' }}>{brl(item.unitPrice)} cada</span>
        {item.warning && <span className="field-error" data-testid="item-warning">{item.warning}</span>}
      </div>
      <div className="cart-item__side">
        <div className="stepper-qty" role="group" aria-label={`Quantidade de ${item.name}`}>
          <button type="button" aria-label="Diminuir quantidade" disabled={busy || item.quantity <= 1} onClick={() => setQty(item.quantity - 1)}><Minus size={16} /></button>
          <input aria-label="Quantidade" readOnly value={item.quantity} className="tabular" data-testid="item-quantity" />
          <button type="button" aria-label="Aumentar quantidade" disabled={busy} onClick={() => setQty(item.quantity + 1)}><Plus size={16} /></button>
        </div>
        <strong className="tabular" data-testid="item-total">{brl(item.lineTotal)}</strong>
        <button type="button" className="btn btn--ghost btn--sm" onClick={remove} aria-label={`Remover ${item.name}`} data-testid="remove-item">
          <Trash2 size={16} aria-hidden="true" />Remover
        </button>
      </div>
    </li>
  );
}

export function Cart() {
  const { user } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="empty">
        <ShoppingCart size={40} aria-hidden="true" />
        <h1>Seu carrinho</h1>
        <p>Entre na sua conta para ver e montar o carrinho.</p>
        <Link className="btn btn--primary" to="/login?voltar=%2Fcarrinho">Entrar</Link>
      </div>
    );
  }
  if (!cart) return <div className="skeleton" style={{ height: 300 }} aria-label="Carregando carrinho" />;
  if (!cart.items.length) {
    return (
      <div className="empty" data-testid="empty-cart">
        <Mascot mood="sad" />
        <h1>Seu carrinho está vazio</h1>
        <p>Os produtos que você adicionar aparecem aqui.</p>
        <Link className="btn btn--primary" to="/produtos">Ver produtos</Link>
      </div>
    );
  }
  const blocked = cart.items.some((i) => i.warning);
  return (
    <>
      <div className="page-head"><div><h1>Meu carrinho</h1><p>{cart.itemCount} {cart.itemCount === 1 ? 'item' : 'itens'}</p></div><Link className="btn btn--ghost" to="/produtos">Continuar comprando</Link></div>
      <div className="two-col">
        <section aria-label="Itens do carrinho">
          <FreeShipping cart={cart} />
          <div className="panel">
          <ul className="cart-list">{cart.items.map((i) => <CartItem key={`${i.productId}-${i.color}`} item={i} />)}</ul>
          </div>
        </section>
        <Summary cart={cart}>
          <CouponForm cart={cart} />
          {blocked && <Alert type="warning">Ajuste os itens com estoque insuficiente antes de continuar.</Alert>}
          <button type="button" className="btn btn--primary btn--block" disabled={blocked} onClick={() => navigate('/checkout')} data-testid="go-to-checkout">
            Finalizar compra
          </button>
        </Summary>
      </div>
    </>
  );
}
