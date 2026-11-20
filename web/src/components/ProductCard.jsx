import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { brl } from '../lib/api.js';
import { discountPct, installments, pixPrice } from '../lib/price.js';
import { ProductImage } from './ui.jsx';
import { useAddToCart } from '../lib/useAddToCart.js';

const COLOR_HEX = { Preto: '#22202f', Branco: '#ffffff', Cinza: '#9aa0ae', Azul: '#4b7bff', Rosa: '#ff8fb5' };

export function Rating({ value, count }) {
  return (
    <span className="rating" aria-label={`Nota ${value.toFixed(1)} de 5, ${count} avaliações (dados de demonstração)`}>
      <span className="rating__stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} fill={i <= Math.round(value) ? 'currentColor' : 'none'} />)}
      </span>
      <span aria-hidden="true">({count})</span>
    </span>
  );
}

export function ProductCard({ product }) {
  const add = useAddToCart();
  const [busy, setBusy] = useState(false);
  const off = discountPct(product.price, product.oldPrice);
  const needsColor = product.colors.length > 0;
  return (
    <article className="product-card" data-testid="product-card" aria-labelledby={`p-${product.id}`}>
      <Link to={`/produto/${product.id}`} className="product-card__media" tabIndex={-1} aria-hidden="true">
        {off > 0 && <span className="off-badge">-{off}%</span>}
        {!product.inStock && <span className="out-badge">Esgotado</span>}
        <ProductImage product={product} />
      </Link>
      <div className="product-card__body">
        <span className="product-card__brand">{product.brand}</span>
        <Link to={`/produto/${product.id}`} className="product-card__name" id={`p-${product.id}`} viewTransition>{product.name}</Link>
        <Rating value={product.rating} count={product.ratingCount} />
        {product.oldPrice ? <span className="old-price">{brl(product.oldPrice)}</span> : <span className="old-price" aria-hidden="true" style={{ visibility: 'hidden' }}>-</span>}
        <span className="pix-price" data-testid="product-price">{brl(pixPrice(product.price))}</span>
        <span className="pix-label">no Pix (5% off)</span>
        <span className="installments">ou {installments(product.price).label}</span>
        <div className="product-card__foot">
          {needsColor ? (
            <>
              <span className="swatch-dots" aria-label={`Cores: ${product.colors.join(', ')}`}>
                {product.colors.map((c) => <span key={c} style={{ background: COLOR_HEX[c] || '#ccc' }} />)}
              </span>
              <Link className="btn btn--secondary btn--sm" to={`/produto/${product.id}`} aria-label={`Escolher cor de ${product.name}`}>Escolher cor</Link>
            </>
          ) : (
            <button type="button" className="btn btn--primary btn--sm" disabled={!product.inStock || busy}
              aria-label={`Adicionar ${product.name} ao carrinho`} data-testid="add-to-cart"
              onClick={async () => { setBusy(true); await add(product); setBusy(false); }}>
              {busy ? <span className="spinner" aria-hidden="true" /> : <ShoppingCart size={16} aria-hidden="true" />}
              <span className="btn__label">{product.inStock ? 'Adicionar' : 'Esgotado'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
