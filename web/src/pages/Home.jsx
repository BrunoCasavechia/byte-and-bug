import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgePercent, CreditCard, RotateCcw, Truck } from 'lucide-react';
import { api } from '../lib/api.js';
import { ProductCard } from '../components/ProductCard.jsx';

const SLIDES = [
  { tag: 'Semana do Setup', title: 'Seu setup gamer começa aqui', text: 'Teclados mecânicos, mouses leves e headsets com até 22% off.', cta: 'Ver ofertas', to: '/produtos?sort=discount', art: ['/products/u01.svg', '/products/r01.svg'] },
  { tag: 'Home office', title: 'Trabalhe com mais conforto', text: 'Mouse vertical, apoio de punho e headset com cancelamento de ruído.', cta: 'Montar meu home office', to: '/produtos?category=acessorios', art: ['/products/r02.svg', '/products/h04.svg'] },
  { tag: 'Monitores', title: 'Mais tela, mais produtividade', text: 'De Full HD a ultrawide, em até 10x sem juros.', cta: 'Ver monitores', to: '/produtos?category=monitores', art: ['/products/m03.svg', '/products/m02.svg'] },
];

function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [paused]);
  const s = SLIDES[i];
  return (
    <section className="hero" aria-roledescription="carrossel" aria-label="Destaques" data-testid="hero"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="hero-slide" key={i} aria-roledescription="slide" aria-label={`${i + 1} de ${SLIDES.length}`}>
        <h1>{s.title}</h1>
        <p>{s.text}</p>
        <Link className="btn btn--primary btn--lg" to={s.to} data-testid="hero-cta">{s.cta}</Link>
      </div>
      <div className="hero__art hero-slide" key={`art-${i}`} aria-hidden="true">
        <div style={{ position: 'relative', width: 'min(100%, 460px)' }}>
          <img src={s.art[0]} alt="" style={{ width: '78%', borderRadius: 22, boxShadow: '0 18px 40px rgb(17 12 51 / .35)', display: 'block' }} />
          <img src={s.art[1]} alt="" style={{ position: 'absolute', width: '48%', right: 0, bottom: -26, borderRadius: 18, border: '4px solid #fff', boxShadow: '0 12px 30px rgb(17 12 51 / .35)' }} />
        </div>
      </div>
      <div className="hero__dots" role="group" aria-label="Escolher destaque">
        {SLIDES.map((sl, n) => (
          <button key={sl.tag} type="button" aria-label={`Destaque ${n + 1}: ${sl.tag}`} aria-current={n === i} onClick={() => setI(n)} />
        ))}
      </div>
    </section>
  );
}

const PERKS = [
  [Truck, 'Frete grátis', 'em compras acima de R$ 299'],
  [CreditCard, 'Até 10x sem juros', 'no cartão de crédito'],
  [BadgePercent, '5% off no Pix', 'aprovação na hora'],
  [RotateCcw, 'Troca fácil', 'até 7 dias após a entrega'],
];

function Shelf({ title, query, to, testId }) {
  const [items, setItems] = useState(null);
  useEffect(() => { api(`/products?${query}`).then((r) => setItems(r.items)).catch(() => setItems([])); }, [query]);
  return (
    <section aria-labelledby={`${testId}-title`} style={{ marginBottom: 40 }} data-testid={testId}>
      <div className="section-title"><h2 id={`${testId}-title`}>{title}</h2><Link to={to}>Ver todos</Link></div>
      <div className="grid">
        {items ? items.map((p) => <ProductCard key={p.id} product={p} />) : Array.from({ length: 4 }, (_, n) => <div key={n} className="skeleton" style={{ height: 400 }} />)}
      </div>
    </section>
  );
}

export function Home() {
  const [cats, setCats] = useState([]);
  useEffect(() => { api('/categories').then(setCats).catch(() => {}); }, []);
  const catArt = { teclados: 'u02', mouses: 'r03', headsets: 'h02', monitores: 'm01', webcams: 'w01', acessorios: 'a02' };
  return (
    <>
      <Hero />
      <div className="perks">
        {PERKS.map(([Icon, title, text]) => (
          <div className="perk" key={title}><span className="perk__icon"><Icon size={22} aria-hidden="true" /></span><div><strong>{title}</strong><span>{text}</span></div></div>
        ))}
      </div>

      <div className="section-title"><h2>Compre por departamento</h2></div>
      <nav className="cat-tiles" aria-label="Departamentos">
        {cats.map((c) => (
          <Link key={c.slug} to={`/produtos?category=${c.slug}`} className="cat-tile" data-testid={`tile-${c.slug}`}>
            <span className="cat-tile__img"><img src={`/products/${catArt[c.slug]}.svg`} alt="" /></span>
            {c.name}
          </Link>
        ))}
      </nav>

      <Shelf title="Ofertas da semana" query="sort=discount&limit=4" to="/produtos?sort=discount" testId="shelf-offers" />

      <div className="promo">
        <Link to="/produtos" className="promo__card promo__card--sun">
          <div><h3>10% off na primeira compra</h3><p>Use o cupom no carrinho.</p><code>BYTE10</code></div>
          <BadgePercent size={88} strokeWidth={1.25} aria-hidden="true" />
        </Link>
        <Link to="/produtos" className="promo__card promo__card--mint">
          <div><h3>Frete grátis em qualquer valor</h3><p>Válido para todo o Brasil.</p><code>FRETEGRATIS</code></div>
          <Truck size={88} strokeWidth={1.25} aria-hidden="true" />
        </Link>
      </div>

      <Shelf title="Mais avaliados" query="sort=rating&limit=4" to="/produtos?sort=rating" testId="shelf-top" />
    </>
  );
}
