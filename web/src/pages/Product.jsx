import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Minus, Plus, RotateCcw, ShieldCheck, ShoppingCart, Truck, Zap } from 'lucide-react';
import { api, brl } from '../lib/api.js';
import { maskCep } from '../lib/masks.js';
import { discountPct, installments, pixPrice } from '../lib/price.js';
import { Alert, ProductImage, Stock } from '../components/ui.jsx';
import { Rating } from '../components/ProductCard.jsx';
import { useAddToCart } from '../lib/useAddToCart.js';
import { NotFound } from './NotFound.jsx';

const VIEWS = [['Frente', 'scale(1)'], ['Detalhe', 'scale(1.6) translate(6%, 4%)'], ['Lateral', 'scale(1.3) translate(-8%, 0)']];

// Deterministic shipping quote so tests always get the same answer for the same CEP.
function quote(cep, price) {
  const d = cep.replace(/\D/g, '');
  const far = Number(d[0]) >= 4;
  const free = price >= 299;
  return [
    { id: 'pac', name: 'Econômica', days: far ? 9 : 5, price: free ? 0 : 19.9 },
    { id: 'sedex', name: 'Expressa', days: far ? 4 : 2, price: 34.9 },
  ];
}

function ShippingCalc({ price }) {
  const [cep, setCep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  return (
    <div className="ship-calc" data-testid="shipping-calc">
      <label htmlFor="ship-cep" style={{ fontWeight: 800 }}>Calcular frete e prazo</label>
      <form onSubmit={(e) => {
        e.preventDefault();
        if (cep.replace(/\D/g, '').length !== 8) { setError('Digite um CEP com 8 dígitos.'); setResult(null); return; }
        setError(''); setResult(quote(cep, price));
      }}>
        <input id="ship-cep" className="input tabular" inputMode="numeric" placeholder="00000-000" value={cep} onChange={(e) => setCep(maskCep(e.target.value))} aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? 'ship-error' : undefined} />
        <button type="submit" className="btn btn--secondary">Calcular</button>
      </form>
      {error && <span className="field-error" id="ship-error" data-testid="shipping-error">{error}</span>}
      {result && (
        <ul className="ship-options" data-testid="shipping-options">
          {result.map((o) => <li key={o.id}><span>{o.name} · até {o.days} dias úteis</span><strong>{o.price === 0 ? 'Grátis' : brl(o.price)}</strong></li>)}
        </ul>
      )}
    </div>
  );
}

export function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [view, setView] = useState(0);
  const [colorError, setColorError] = useState('');
  const [busy, setBusy] = useState('');
  const add = useAddToCart();

  useEffect(() => {
    setStatus('loading');
    api(`/products/${id}`).then((p) => { setProduct(p); setStatus('ok'); setQty(1); setColor(''); setView(0); }).catch((e) => setStatus(e.status === 404 ? 'missing' : 'error'));
  }, [id]);

  if (status === 'missing') return <NotFound what="Produto" />;
  if (status === 'error') return <Alert type="error">Não foi possível carregar o produto.</Alert>;
  if (!product) return <div className="skeleton" style={{ height: 460 }} aria-label="Carregando produto" />;

  const max = Math.min(product.stock, 10);
  const off = discountPct(product.price, product.oldPrice);
  const buy = async (now) => {
    if (product.colors.length && !color) { setColorError('Escolha uma cor antes de continuar.'); return; }
    setBusy(now ? 'now' : 'add');
    const ok = await add(product, { quantity: qty, color: color || undefined });
    setBusy('');
    if (ok && now) navigate('/carrinho');
  };

  return (
    <>
      <nav className="breadcrumb" aria-label="Você está em">
        <Link to="/">Início</Link><span aria-hidden="true">/</span>
        <Link to={`/produtos?category=${product.category.slug}`}>{product.category.name}</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>
      <div className="pdp">
        <div className="gallery">
          <div className="gallery__thumbs" role="group" aria-label="Imagens do produto">
            {VIEWS.map(([label, tf], n) => (
              <button key={label} type="button" aria-pressed={view === n} aria-label={`Ver imagem: ${label}`} onClick={() => setView(n)}>
                <ProductImage product={product} style={{ transform: tf }} />
              </button>
            ))}
          </div>
          <div className="pdp__media">
            {off > 0 && <span className="off-badge">-{off}%</span>}
            <ProductImage product={product} style={{ transform: VIEWS[view][1] }} />
          </div>
        </div>

        <div className="buybox">
          <div style={{ display: 'grid', gap: 8 }}>
            <div className="buybox__meta"><span>{product.brand}</span><span data-testid="product-sku">Cód. {product.sku}</span><Rating value={product.rating} count={product.ratingCount} /></div>
            <h1 data-testid="product-name" style={{ fontSize: 'clamp(1.5rem, 1.2rem + 1vw, 1.875rem)' }}>{product.name}</h1>
            <Stock stock={product.stock} />
          </div>
          <div className="pix-box">
            {product.oldPrice && <span className="old-price">de {brl(product.oldPrice)} por</span>}
            <span className="pix-price tabular" data-testid="product-price">{brl(pixPrice(product.price))}</span>
            <span className="pix-label">no Pix, com 5% de desconto</span>
            <span className="installments">ou <strong className="tabular">{brl(product.price)}</strong> em {installments(product.price).label}</span>
          </div>

          {product.colors.length > 0 && (
            <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 8 }} aria-describedby={colorError ? 'color-error' : undefined}>
              <legend style={{ fontWeight: 800, marginBottom: 8 }}>Cor: <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{color || 'escolha uma opção'}</span></legend>
              <div className="swatches">
                {product.colors.map((c) => (
                  <span key={c}>
                    <input type="radio" name="color" id={`color-${c}`} value={c} checked={color === c} onChange={() => { setColor(c); setColorError(''); }} />
                    <label htmlFor={`color-${c}`}>{c}</label>
                  </span>
                ))}
              </div>
              {colorError && <span className="field-error" id="color-error" data-testid="color-error">{colorError}</span>}
            </fieldset>
          )}

          {product.inStock ? (
            <div className="buy-row">
              <div className="field">
                <span className="label" id="qty-label">Quantidade</span>
                <div className="stepper-qty" role="group" aria-labelledby="qty-label">
                  <button type="button" aria-label="Diminuir quantidade" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}><Minus size={16} /></button>
                  <input aria-label="Quantidade" type="number" min="1" max={max} value={qty} data-testid="quantity-input"
                    onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value) || 1)))} />
                  <button type="button" aria-label="Aumentar quantidade" disabled={qty >= max} onClick={() => setQty((q) => q + 1)}><Plus size={16} /></button>
                </div>
              </div>
              <button type="button" className="btn btn--buy btn--lg" disabled={Boolean(busy)} onClick={() => buy(true)} data-testid="buy-now">
                {busy === 'now' ? <span className="spinner" aria-hidden="true" /> : <Zap size={18} aria-hidden="true" />}Comprar agora
              </button>
            </div>
          ) : <Alert type="warning">Produto esgotado no momento.</Alert>}
          <button type="button" className="btn btn--secondary" disabled={!product.inStock || Boolean(busy)} data-testid="add-to-cart" onClick={() => buy(false)}>
            {busy === 'add' ? <span className="spinner" aria-hidden="true" /> : <ShoppingCart size={18} aria-hidden="true" />}
            {product.inStock ? 'Adicionar ao carrinho' : 'Produto esgotado'}
          </button>
          <span className="hint" style={{ color: 'var(--ink-3)', fontSize: '0.8125rem', fontWeight: 600 }}>Máximo de {Math.max(max, 1)} por pedido.</span>

          <ShippingCalc price={product.price} />
          <div className="trust">
            <span><ShieldCheck size={16} aria-hidden="true" />Garantia de 12 meses</span>
            <span><RotateCcw size={16} aria-hidden="true" />Troca em até 7 dias</span>
            <span><Truck size={16} aria-hidden="true" />Entrega para todo o Brasil</span>
          </div>
        </div>
      </div>

      <div className="pdp-details">
        <section className="panel panel__body" aria-labelledby="desc-title" style={{ display: 'grid', gap: 10 }}>
          <h2 id="desc-title">Descrição</h2>
          <p className="pdp__desc">{product.description}</p>
        </section>
        <section aria-labelledby="specs-title" style={{ display: 'grid', gap: 12 }}>
          <h2 id="specs-title">Especificações</h2>
          <dl className="specs" data-testid="specs">
            <dt>Marca</dt><dd>{product.brand}</dd>
            <dt>Modelo</dt><dd>{product.sku}</dd>
            <dt>Categoria</dt><dd>{product.category.name}</dd>
            {product.colors.length > 0 && (<><dt>Cores</dt><dd>{product.colors.join(', ')}</dd></>)}
            <dt>Estoque</dt><dd className="tabular" data-testid="stock-count">{product.stock} unidades</dd>
            <dt>Garantia</dt><dd>12 meses</dd>
          </dl>
        </section>
      </div>
    </>
  );
}
