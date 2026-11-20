import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth, useToast } from '../store.jsx';
import { Alert, Field, fieldProps } from '../components/ui.jsx';

function PasswordInput({ id, value, onChange, error, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input className="input" type={show ? 'text' : 'password'} autoComplete={autoComplete} {...fieldProps(id, error)} value={value} onChange={onChange} style={{ paddingRight: 48 }} />
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShow((s) => !s)} aria-label={show ? 'Esconder senha' : 'Mostrar senha'} aria-pressed={show}
        style={{ position: 'absolute', right: 4, top: 5, width: 36, padding: 0 }}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const back = params.get('voltar') || '/';

  if (user && !busy) return <Navigate to={back} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const fe = {};
    if (!email.trim()) fe.email = 'Informe o e-mail.';
    if (!password) fe.password = 'Informe a senha.';
    setErrors(fe); setFormError('');
    if (Object.keys(fe).length) return;
    setBusy(true);
    try {
      const u = await login(email, password);
      toast(`Olá, ${u.name.split(' ')[0]}!`);
      navigate(back, { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <form className="panel auth__card" onSubmit={submit} noValidate aria-labelledby="login-title" data-testid="login-form">
        <div style={{ display: 'grid', gap: 6 }}>
          <h1 id="login-title">Entrar</h1>
          <p style={{ color: 'var(--ink-2)' }}>Use sua conta para comprar e acompanhar pedidos.</p>
        </div>
        {params.get('expirou') && <Alert type="warning" data-testid="session-expired">Sua sessão expirou. Entre de novo.</Alert>}
        {formError && <Alert type="error" data-testid="login-error">{formError}</Alert>}
        <Field id="email" label="E-mail" error={errors.email}>
          <input className="input" type="email" autoComplete="email" {...fieldProps('email', errors.email)} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="password" label="Senha" error={errors.password}>
          <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        </Field>
        <button type="submit" className="btn btn--primary btn--block" disabled={busy} data-testid="login-submit">
          {busy ? <span className="spinner" aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}Entrar
        </button>
        <p style={{ textAlign: 'center' }}>Ainda não tem conta? <Link to="/cadastro">Criar conta</Link></p>
        <div className="test-users" aria-label="Usuários de teste">
          <strong>Usuários de teste</strong>
          <span>Cliente: <code>cliente@bytebug.dev</code> / <code>byte123</code></span>
          <span>Admin: <code>admin@bytebug.dev</code> / <code>admin123</code></span>
          <span>Bloqueado: <code>bloqueado@bytebug.dev</code> / <code>byte123</code></span>
        </div>
      </form>
    </div>
  );
}

export function Register() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', terms: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const fe = {};
    if (!form.name.trim()) fe.name = 'Informe seu nome.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) fe.email = 'Informe um e-mail válido.';
    if (form.password.length < 6) fe.password = 'A senha precisa de pelo menos 6 caracteres.';
    if (form.confirm !== form.password) fe.confirm = 'As senhas não conferem.';
    if (!form.terms) fe.terms = 'Aceite os termos para continuar.';
    setErrors(fe); setFormError('');
    if (Object.keys(fe).length) return;
    setBusy(true);
    try {
      await api('/auth/register', { method: 'POST', body: { name: form.name, email: form.email, password: form.password } });
      toast('Conta criada! Agora é só entrar.');
      navigate('/login');
    } catch (err) {
      if (err.code === 'EMAIL_IN_USE') setErrors({ email: err.message });
      else setFormError(err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <form className="panel auth__card" onSubmit={submit} noValidate aria-labelledby="register-title" data-testid="register-form">
        <h1 id="register-title">Criar conta</h1>
        {formError && <Alert type="error">{formError}</Alert>}
        <Field id="name" label="Nome" error={errors.name}><input className="input" autoComplete="name" {...fieldProps('name', errors.name)} value={form.name} onChange={set('name')} /></Field>
        <Field id="email" label="E-mail" error={errors.email}><input className="input" type="email" autoComplete="email" {...fieldProps('email', errors.email)} value={form.email} onChange={set('email')} /></Field>
        <Field id="password" label="Senha" error={errors.password} hint="Mínimo de 6 caracteres."><PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} /></Field>
        <Field id="confirm" label="Confirmar senha" error={errors.confirm}><input className="input" type="password" autoComplete="new-password" {...fieldProps('confirm', errors.confirm)} value={form.confirm} onChange={set('confirm')} /></Field>
        <div className="field">
          <label className="check"><input type="checkbox" checked={form.terms} onChange={set('terms')} aria-describedby={errors.terms ? 'terms-error' : undefined} data-testid="terms" />Li e aceito os termos de uso</label>
          {errors.terms && <span className="field-error" id="terms-error" data-testid="terms-error">{errors.terms}</span>}
        </div>
        <button type="submit" className="btn btn--primary btn--block" disabled={busy} data-testid="register-submit">
          {busy ? <span className="spinner" aria-hidden="true" /> : <UserPlus size={18} aria-hidden="true" />}Criar conta
        </button>
        <p style={{ textAlign: 'center' }}>Já tem conta? <Link to="/login">Entrar</Link></p>
      </form>
    </div>
  );
}
