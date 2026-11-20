import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Clock, LogIn, LogOut, Package, Search, ShieldCheck, ShoppingCart, User } from 'lucide-react';
import { useAuth, useCart, useToast } from '../store.jsx';
import { autoRefreshEnabled, setAutoRefresh } from '../lib/api.js';
import { Logo } from './Logo.jsx';
import * as Menu from '@radix-ui/react-dropdown-menu';

function SessionTimer({ expiresAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, Math.round((expiresAt - now) / 1000));
  const mm = String(Math.floor(left / 60)).padStart(1, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <span className={`session tabular${left <= 30 ? ' is-low' : ''}`} data-testid="session-timer" title="Tempo até o token de acesso expirar">
      <Clock size={14} aria-hidden="true" />
      {left > 0 ? `Token: ${mm}:${ss}` : 'Token expirado'}
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
        <LogIn size={20} aria-hidden="true" /><span className="icon-btn__label">Entrar</span>
      </Link>
    );
  }
  // Radix DropdownMenu: the list is rendered in a portal, items are role="menuitem".
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <button type="button" className="icon-btn" data-testid="user-menu">
          <User size={20} aria-hidden="true" />
          <span className="icon-btn__label">{user.name.split(' ')[0]}</span>
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
      <ShoppingCart size={20} aria-hidden="true" />
      <span className="icon-btn__label">Carrinho</span>
      {count > 0 && <span className={`via${pulsing ? ' is-pulsing' : ''}`} data-testid="cart-count">{count}</span>}
    </Link>
  );
}

function SearchBox() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState(params.get('q') || '');
  useEffect(() => { if (location.pathname === '/') setQ(params.get('q') || ''); }, [params, location.pathname]);
  return (
    <form
      className="search" role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const next = new URLSearchParams(location.pathname === '/' ? params : undefined);
        if (q.trim()) next.set('q', q.trim()); else next.delete('q');
        next.delete('page');
        navigate(`/?${next}`);
      }}
    >
      <label htmlFor="search" className="sr-only">Buscar produtos</label>
      <Search size={18} aria-hidden="true" />
      <input id="search" type="search" placeholder="Buscar teclado, mouse, SKU..." value={q} onChange={(e) => setQ(e.target.value)} data-testid="search-input" />
    </form>
  );
}

export function Layout() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
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
      <header className="header">
        <div className="header__inner">
          <Link to="/" className="brand" aria-label="Byte & Bug, página inicial" viewTransition>
            <Logo />
            <span className="brand__word">Byte <span>&amp;</span> Bug</span>
          </Link>
          <SearchBox />
          <div className="header__actions">
            {session && <SessionTimer expiresAt={session.expiresAt} />}
            <UserMenu />
            <CartButton />
          </div>
        </div>
        <nav className="subnav" aria-label="Seções">
          <div className="subnav__inner">
            <NavLink to="/" end viewTransition>Catálogo</NavLink>
            <NavLink to="/carrinho" viewTransition>Carrinho</NavLink>
            {user && <NavLink to="/pedidos" viewTransition>Pedidos</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin/produtos" viewTransition>Admin</NavLink>}
            <NavLink to="/playground" viewTransition>Playground</NavLink>
          </div>
        </nav>
      </header>
      <main id="conteudo" className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer__inner">
          <span>Byte & Bug é uma loja fictícia para praticar automação de testes. Produtos e preços são de demonstração.</span>
          <span><a href="http://localhost:3333/docs" target="_blank" rel="noreferrer">Documentação da API</a></span>
        </div>
      </footer>
    </div>
  );
}
