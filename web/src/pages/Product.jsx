import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { api, brl } from '../lib/api.js';
import { Alert, ProductImage, Stock } from '../components/ui.jsx';
import { useAddToCart } from './Catalog.jsx';
import { NotFound } from './NotFound.jsx';

export function Product() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [colorError, setColorError] = useState('');
  const [busy, setBusy] = useState(false);
  const add = useAddToCart();

  useEffect(() => {
    setStatus('loading');
    api(`/products/${id}`).then((p) => { setProduct(p); setStatus('ok'); setQty(1); setColor(''); }).catch((e) => setStatus(e.status === 404 ? 'missing' : 'error'));
  }, [id]);

  if (status === 'missing') return <NotFound what="Produto" />;
  if (status === 'error') return <Alert type="error">Não foi possível carregar o produto.</Alert>;
  if (!product) return <div className="skeleton" style={{ height: 420 }} aria-label="Carregando produto" />;

  const max = Math.min(product.stock, 10);

  return (
    <>
      <nav className="breadcrumb" aria-label="Você está em">
        <Link to="/">Catálogo</Link><span aria-hidden="true">/</span>
        <Link to={`/?category=${product.category.slug}`}>{product.category.name}</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>
      <div className="pdp">
        <div className="pdp__media"><ProductImage product={product} /></div>
        <div className="pdp__info">
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="designator" data-testid="product-sku">{product.sku} · {product.brand}</span>
            <h1 data-testid="product-name">{product.name}</h1>
            <Stock stock={product.stock} />
          </div>
          <span className="price price--lg" data-testid="product-price">{brl(product.price)}</span>
          <p className="pdp__desc">{product.description}</p>

          {product.colors.length > 0 && (
            <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 8 }} aria-describedby={colorError ? 'color-error' : undefined}>
              <legend className="label" style={{ fontWeight: 600, marginBottom: 8 }}>Cor</legend>
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

          {product.inStock && (
            <div className="field">
              <span className="label" id="qty-label">Quantidade</span>
              <div className="stepper-qty" role="group" aria-labelledby="qty-label">
                <button type="button" aria-label="Diminuir quantidade" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}><Minus size={16} /></button>
                <input aria-label="Quantidade" type="number" min="1" max={max} value={qty} data-testid="quantity-input"
                  onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value) || 1)))} />
                <button type="button" aria-label="Aumentar quantidade" disabled={qty >= max} onClick={() => setQty((q) => q + 1)}><Plus size={16} /></button>
              </div>
              <span className="hint">Máximo de {max} por pedido.</span>
            </div>
          )}

          <div>
            <button
              type="button" className="btn btn--primary" disabled={!product.inStock || busy} data-testid="add-to-cart"
              onClick={async () => {
                if (product.colors.length && !color) { setColorError('Escolha uma cor antes de adicionar.'); return; }
                setBusy(true); await add(product, { quantity: qty, color: color || undefined }); setBusy(false);
              }}
            >
              {busy ? <span className="spinner" aria-hidden="true" /> : <ShoppingCart size={18} aria-hidden="true" />}
              {product.inStock ? 'Adicionar ao carrinho' : 'Produto esgotado'}
            </button>
          </div>

          <dl className="specs">
            <dt>Categoria</dt><dd>{product.category.name}</dd>
            <dt>Marca</dt><dd>{product.brand}</dd>
            <dt>Estoque</dt><dd className="tabular" data-testid="stock-count">{product.stock} unidades</dd>
          </dl>
        </div>
      </div>
    </>
  );
}
