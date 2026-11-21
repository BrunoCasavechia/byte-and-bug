import { API_URL } from '../lib/api.js';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BadgePercent, ChevronDown, Clock, CreditCard, LogOut, Package, Search, ShieldCheck, ShoppingCart, Truck, User } from 'lucide-react';

const CATS = [['teclados', 'Teclados'], ['mouses', 'Mouses'], ['headsets', 'Headsets'], ['monitores', 'Monitores'], ['webcams', 'Webcams'], ['acessorios', 'Acessórios']];
import { useAuth, useCart, useToast } from '../store.jsx';
import { autoRefreshEnabled, setAutoRefresh } from '../lib/api.js';
import { Logo } from './Logo.jsx';
import * as Menu from '@radix-ui/react-dropdown-menu';

function SessionTimer({ expiresAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, Math.round((expiresAt - now) / 1000));
  const time = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return (
    <span className={`qa-chip tabular${left <= 30 ? ' is-low' : ''}`} data-testid="session-timer" title="Tempo até o token de acesso expirar">
      <Clock size={13} aria-hidden="true" />Modo QA · token {left > 0 ? <strong>{time}</strong> : <strong>expirado</strong>}
    </span>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [auto, setAuto] = useState(autoRefreshEnabled());

  if (!user) {
    return (
      <Link className="icon-btn" to="/login" data-testid="header-login">
        <User size={24} aria-hidden="true" />
        <span className="icon-btn__text"><small>Olá, faça seu</small>Entrar</span>
      </Link>
    );
  }
  // Radix DropdownMenu: the list is rendered in a portal, items are role="menuitem".
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <button type="button" className="icon-btn" data-testid="user-menu">
          <User size={24} aria-hidden="true" />
          <span className="icon-btn__text"><small>Olá, {user.name.split(' ')[0]}</small>Minha conta</span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content className="menu__list" align="end" sideOffset={8}>
          <div className="menu__info"><strong>{user.name}</strong>{user.email}</div>
          <Menu.Item asChild><Link to="/pedidos"><Package size={16} aria-hidden="true" />Meus pedidos</Link></Menu.Item>
          {user.role === 'admin' && (
            <Menu.Item asChild><Link to="/admin/produtos"><ShieldCheck size={16} aria-hidden="true" />Painel admin</Link></Menu.Item>
          )}
          <Menu.CheckboxItem
            className="menu__toggle" checked={auto} data-testid="auto-refresh"
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(v) => { setAutoRefresh(v); setAuto(v); }}
          >
            Renovar token sozinho
            <span className={`switch${auto ? ' is-on' : ''}`} aria-hidden="true" />
          </Menu.CheckboxItem>
          <Menu.Separator className="menu__sep" />
          <Menu.Item data-testid="logout" onSelect={async () => { await logout(); toast('Você saiu da conta.', 'info'); navigate('/'); }}>
            <LogOut size={16} aria-hidden="true" />Sair
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

function CartButton() {
  const { cart, pulse } = useCart();
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    if (!pulse) return undefined;
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 640);
    return () => clearTimeout(t);
  }, [pulse]);
  const count = cart?.itemCount || 0;
  return (
    <Link className="icon-btn" to="/carrinho" aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`} data-testid="header-cart">
      <span className="cart-icon">
        <ShoppingCart size={26} aria-hidden="true" />
        {count > 0 && <span className={`cart-count${pulsing ? ' is-pulsing' : ''}`} data-testid="cart-count">{count}</span>}
      </span>
      <span className="icon-btn__text"><small>Meu</small>Carrinho</span>
    </Link>
  );
}

function SearchBox() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState(params.get('q') || '');
  useEffect(() => { if (location.pathname === '/produtos') setQ(params.get('q') || ''); }, [params, location.pathname]);
  return (
    <form
      className="search" role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const next = new URLSearchParams(location.pathname === '/produtos' ? params : undefined);
        if (q.trim()) next.set('q', q.trim()); else next.delete('q');
        next.delete('page');
        navigate(`/produtos?${next}`);
      }}
    >
      <label htmlFor="search" className="sr-only">Buscar produtos</label>
      <input id="search" type="search" placeholder="O que você procura hoje?" value={q} onChange={(e) => setQ(e.target.value)} data-testid="search-input" />
      <button type="submit" aria-label="Buscar"><Search size={20} aria-hidden="true" /></button>
    </form>
  );
}

export function Layout() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    const onExpired = () => {
      toast('Sua sessão expirou. Entre de novo para continuar.', 'error', 6000);
      navigate('/login?expirou=1');
    };
    window.addEventListener('bb:expired', onExpired);
    return () => window.removeEventListener('bb:expired', onExpired);
  }, [navigate, toast]);

  return (
    <div className="app">
      <a href="#conteudo" className="sr-only">Pular para o conteúdo</a>
      <div className="topbar">
        <div className="topbar__inner">
          <div className="topbar__perks">
            <span><Truck size={14} aria-hidden="true" />Frete grátis acima de R$ 299</span>
            <span><CreditCard size={14} aria-hidden="true" />Até 10x sem juros</span>
            <span><BadgePercent size={14} aria-hidden="true" />5% off no Pix</span>
          </div>
          {session ? <SessionTimer expiresAt={session.expiresAt} /> : <span className="qa-chip">Loja de demonstração para testes</span>}
        </div>
      </div>
      <header className="header">
        <div className="header__inner">
          <Link to="/" className="brand" aria-label="Byte & Bug, página inicial" viewTransition>
            <Logo />
            <span className="brand__word">Byte <span>&amp;</span> Bug</span>
          </Link>
          <SearchBox />
          <div className="header__actions">
            <UserMenu />
            <CartButton />
          </div>
        </div>
      </header>
      <nav className="catnav" aria-label="Departamentos">
        <div className="catnav__inner">
          <NavLink to="/produtos?sort=discount" className="catnav__deal" viewTransition><BadgePercent size={16} aria-hidden="true" />Ofertas</NavLink>
          {CATS.map(([slug, label]) => (
            <NavLink key={slug} to={`/produtos?category=${slug}`} viewTransition
              className={() => (location.pathname === '/produtos' && params.get('category') === slug ? 'active' : '')}>{label}</NavLink>
          ))}
          <NavLink to="/produtos" end viewTransition className={() => (location.pathname === '/produtos' && !params.get('category') && params.get('sort') !== 'discount' ? 'active' : '')}>Todos</NavLink>
        </div>
      </nav>
      <main id="conteudo" className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer__cols">
          <div className="footer__about">
            <Link to="/" className="brand"><Logo size={32} /><span className="brand__word">Byte <span>&amp;</span> Bug</span></Link>
            <p>Periféricos e eletrônicos para montar o seu setup, com entrega para todo o Brasil.</p>
            <div className="footer__pay" aria-label="Formas de pagamento"><span>Pix</span><span>Cartão</span><span>Boleto</span></div>
          </div>
          <div>
            <h2>Ajuda</h2>
            <ul><li><Link to="/pedidos">Meus pedidos</Link></li><li><Link to="/carrinho">Meu carrinho</Link></li><li><span>Trocas em até 7 dias</span></li></ul>
          </div>
          <div>
            <h2>Departamentos</h2>
            <ul>{CATS.slice(0, 4).map(([slug, label]) => <li key={slug}><Link to={`/produtos?category=${slug}`}>{label}</Link></li>)}</ul>
          </div>
          <div>
            <h2>Área de testes</h2>
            <ul>
              <li><Link to="/playground" data-testid="footer-playground">Playground</Link></li>
              <li><a href={`${API_URL}/docs`} target="_blank" rel="noreferrer">Documentação da API</a></li>
              {user?.role === 'admin' && <li><Link to="/admin/produtos">Painel admin</Link></li>}
            </ul>
          </div>
        </div>
        <div className="footer__legal"><div>Byte &amp; Bug é uma loja fictícia criada para praticar automação de testes. Produtos, marcas, preços e avaliações são dados de demonstração.</div></div>
      </footer>
    </div>
  );
}
