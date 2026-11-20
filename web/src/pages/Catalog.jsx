import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, PackageSearch, ShoppingCart, SlidersHorizontal, X } from 'lucide-react';
import { api, brl } from '../lib/api.js';
import { useAuth, useCart, useToast } from '../store.jsx';
import { Alert, ProductImage, Stock } from '../components/ui.jsx';
import { useNavigate } from 'react-router-dom';

const SORTS = [
  ['relevance', 'Relevância'],
  ['price_asc', 'Menor preço'],
  ['price_desc', 'Maior preço'],
  ['name_asc', 'Nome (A-Z)'],
  ['name_desc', 'Nome (Z-A)'],
];

export function useAddToCart() {
  const { user } = useAuth();
  const { setCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  return async (product, { quantity = 1, color } = {}) => {
    if (!user) {
      toast('Entre na sua conta para adicionar ao carrinho.', 'info');
      navigate(`/login?voltar=${encodeURIComponent(`/produto/${product.id}`)}`);
      return false;
    }
    try {
      const cart = await api('/cart/items', { method: 'POST', body: { productId: product.id, quantity, color } });
      setCart(cart);
      toast(`${product.name} adicionado ao carrinho.`);
      return true;
    } catch (err) {
      toast(err.message, 'error');
      return false;
    }
  };
}

function ProductCard({ product }) {
  const add = useAddToCart();
  const [busy, setBusy] = useState(false);
  const needsColor = product.colors.length > 0;
  return (
    <article className="product-card" data-testid="product-card" aria-labelledby={`p-${product.id}`}>
      <Link to={`/produto/${product.id}`} className="product-card__media" tabIndex={-1} aria-hidden="true">
        <ProductImage product={product} />
      </Link>
      <div className="product-card__body">
        <span className="designator" data-testid="product-sku">{product.sku}</span>
        <Link to={`/produto/${product.id}`} className="product-card__name" id={`p-${product.id}`} viewTransition>{product.name}</Link>
        <span className="product-card__brand">{product.brand}</span>
        <Stock stock={product.stock} />
        <div className="product-card__foot">
          <span className="price" data-testid="product-price">{brl(product.price)}</span>
          {needsColor ? (
            <Link className="btn btn--secondary btn--sm" to={`/produto/${product.id}`} aria-label={`Escolher cor de ${product.name}`}>Escolher cor</Link>
          ) : (
            <button
              type="button" className="btn btn--primary btn--sm" disabled={!product.inStock || busy}
              aria-label={`Adicionar ${product.name} ao carrinho`} data-testid="add-to-cart"
              onClick={async () => { setBusy(true); await add(product); setBusy(false); }}
            >
              {busy ? <span className="spinner" aria-hidden="true" /> : <ShoppingCart size={16} aria-hidden="true" />}
              {product.inStock ? 'Adicionar' : 'Esgotado'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [minPrice, setMinPrice] = useState(params.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') || '');
  const [showFilters, setShowFilters] = useState(false);

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'relevance';
  const page = Number(params.get('page') || 1);
  const inStock = params.get('inStock') === 'true';

  useEffect(() => { api('/categories').then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    setData(null); setError(null);
    const query = new URLSearchParams(params);
    query.set('limit', '12');
    api(`/products?${query}`).then(setData).catch((e) => setError(e.message));
  }, [params]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) { if (v === '' || v == null || v === false) next.delete(k); else next.set(k, String(v)); }
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const categoryName = categories.find((c) => c.slug === category)?.name;
  const filters = [
    q && ['q', `Busca: "${q}"`],
    categoryName && ['category', categoryName],
    params.get('minPrice') && ['minPrice', `A partir de ${brl(Number(params.get('minPrice')))}`],
    params.get('maxPrice') && ['maxPrice', `Até ${brl(Number(params.get('maxPrice')))}`],
    inStock && ['inStock', 'Só em estoque'],
  ].filter(Boolean);

  return (
    <div className="catalog">
      <aside className={`rail${showFilters ? ' is-open' : ''}`} id="filters" aria-label="Filtros">
        <section>
          <h2>Categorias</h2>
          <ul className="cat-list">
            <li><button type="button" aria-pressed={!category} onClick={() => update({ category: '' })}>Todas</button></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <button type="button" aria-pressed={category === c.slug} onClick={() => update({ category: c.slug })} data-testid={`category-${c.slug}`}>
                  {c.name}<span className="count">{c.productCount}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Preço</h2>
          <form className="price-range" onSubmit={(e) => { e.preventDefault(); update({ minPrice, maxPrice }); }}>
            <div className="field">
              <label htmlFor="minPrice" className="hint">Mínimo</label>
              <input id="minPrice" className="input" type="number" min="0" inputMode="decimal" placeholder="R$ 0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="maxPrice" className="hint">Máximo</label>
              <input id="maxPrice" className="input" type="number" min="0" inputMode="decimal" placeholder="R$ 3.000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
            <button type="submit" className="btn btn--secondary btn--sm" style={{ gridColumn: '1 / -1' }}>Aplicar preço</button>
          </form>
        </section>
        <label className="check">
          <input type="checkbox" checked={inStock} onChange={(e) => update({ inStock: e.target.checked })} data-testid="filter-in-stock" />
          Só produtos em estoque
        </label>
      </aside>

      <section aria-labelledby="catalog-title">
        <div className="page-head">
          <div>
            <h1 id="catalog-title">{categoryName || 'Catálogo'}</h1>
            <p className="result-count" data-testid="result-count" aria-live="polite">
              {data ? `${data.total} ${data.total === 1 ? 'produto' : 'produtos'}` : 'Carregando produtos...'}
            </p>
          </div>
          <button type="button" className="btn btn--secondary btn--sm filters-toggle" aria-expanded={showFilters} aria-controls="filters" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal size={16} aria-hidden="true" />{showFilters ? 'Esconder filtros' : 'Filtros'}
          </button>
          <div className="field" style={{ gap: 4 }}>
            <label htmlFor="sort" className="hint">Ordenar por</label>
            <select id="sort" className="select" value={sort} onChange={(e) => update({ sort: e.target.value })} data-testid="sort-select">
              {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>

        {filters.length > 0 && (
          <div className="toolbar">
            <div className="chips" aria-label="Filtros ativos">
              {filters.map(([key, label]) => (
                <span className="chip" key={key}>
                  {label}
                  <button type="button" aria-label={`Remover filtro ${label}`} onClick={() => { if (key === 'minPrice') setMinPrice(''); if (key === 'maxPrice') setMaxPrice(''); update({ [key]: '' }); }}><X size={14} /></button>
                </span>
              ))}
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setMinPrice(''); setMaxPrice(''); setParams(new URLSearchParams()); }}>Limpar filtros</button>
          </div>
        )}

        {error && <Alert type="error">Não foi possível carregar os produtos: {error}</Alert>}

        {!data && !error && (
          <div className="grid" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton" style={{ height: 330 }} />)}
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="empty" data-testid="empty-results">
            <PackageSearch size={40} aria-hidden="true" />
            <h2>Nenhum produto encontrado</h2>
            <p>Nada combina com os filtros atuais. Tente outra busca ou limpe os filtros.</p>
            <button type="button" className="btn btn--secondary" onClick={() => setParams(new URLSearchParams())}>Limpar filtros</button>
          </div>
        )}

        {data && data.items.length > 0 && (
          <>
            <div className="grid" data-testid="product-grid">
              {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            {data.totalPages > 1 && (
              <nav className="pagination" aria-label="Paginação">
                <button type="button" disabled={page <= 1} onClick={() => update({ page: page - 1 })} aria-label="Página anterior"><ChevronLeft size={18} /></button>
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" aria-current={n === page ? 'page' : undefined} onClick={() => update({ page: n })} aria-label={`Página ${n}`}>{n}</button>
                ))}
                <button type="button" disabled={page >= data.totalPages} onClick={() => update({ page: page + 1 })} aria-label="Próxima página"><ChevronRight size={18} /></button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
