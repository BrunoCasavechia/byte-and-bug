import * as RDialog from '@radix-ui/react-dialog';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../store.jsx';
import { assetUrl } from '../lib/api.js';

export function RequireAuth({ children, role }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to={`/login?voltar=${encodeURIComponent(location.pathname)}`} replace />;
  if (role && user.role !== role) return <Forbidden />;
  return children;
}

function Forbidden() {
  return (
    <div className="not-found" data-testid="forbidden">
      <div className="code">403</div>
      <h1>Acesso negado</h1>
      <p>Esta área é só para administradores.</p>
    </div>
  );
}

export function Field({ id, label, error, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="field-error" id={`${id}-error`} data-testid={`${id}-error`}>{error}</span>}
    </div>
  );
}

// Helper so inputs get aria-invalid / aria-describedby wired consistently.
export const fieldProps = (id, error, hint) => ({
  id,
  name: id,
  'aria-invalid': error ? 'true' : 'false',
  'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
});

export function Alert({ type = 'info', children, ...rest }) {
  const Icon = type === 'ok' ? CheckCircle2 : type === 'info' ? Info : AlertTriangle;
  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'} {...rest}>
      <Icon size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function Stock({ stock }) {
  if (stock === 0) return <span className="stock stock--out" data-testid="stock">Esgotado</span>;
  if (stock <= 3) return <span className="stock stock--low" data-testid="stock">Últimas {stock} unidades</span>;
  return <span className="stock stock--ok" data-testid="stock">Em estoque</span>;
}

export function ProductImage({ product, ...rest }) {
  return <img src={assetUrl(product.imageUrl) || '/products/placeholder.svg'} alt="" loading="lazy" {...rest} />;
}

// Radix Dialog: renders in a portal at the end of <body>, traps focus, closes on Esc.
export function Dialog({ open, onClose, title, children, footer, testId }) {
  return (
    <RDialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <RDialog.Portal>
        <RDialog.Overlay className="dialog-overlay" />
        <RDialog.Content className="dialog" data-testid={testId} aria-describedby={undefined}>
          <div className="dialog__body">
            <RDialog.Title asChild><h2>{title}</h2></RDialog.Title>
            {children}
          </div>
          {footer && <div className="dialog__foot">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
