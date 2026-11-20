import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Check, Package } from 'lucide-react';
import { api, brl, formatDate } from '../lib/api.js';
import { Alert } from '../components/ui.jsx';
import { NotFound } from './NotFound.jsx';

export function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/orders').then(setOrders).catch((e) => setError(e.message)); }, []);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!orders) return <div className="skeleton" style={{ height: 240 }} aria-label="Carregando pedidos" />;
  return (
    <>
      <div className="page-head"><div><h1>Meus pedidos</h1><p>{orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}</p></div></div>
      {orders.length === 0 ? (
        <div className="empty" data-testid="empty-orders">
          <Package size={40} aria-hidden="true" />
          <h2>Nenhum pedido ainda</h2>
          <p>Quando você finalizar uma compra, ela aparece aqui.</p>
          <Link className="btn btn--primary" to="/">Ver catálogo</Link>
        </div>
      ) : (
        <div className="panel table-wrap">
          <table className="table" data-testid="orders-table">
            <thead><tr><th scope="col">Pedido</th><th scope="col">Data</th><th scope="col">Itens</th><th scope="col">Status</th><th scope="col" className="num">Total</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/pedidos/${o.id}`}>#{o.id}</Link></td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td><span className="badge badge--ok">Pago</span></td>
                  <td className="num">{brl(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { api(`/orders/${id}`).then(setOrder).catch(setError); }, [id]);

  if (error?.status === 404) return <NotFound what="Pedido" />;
  if (error?.status === 403) return <Alert type="error" data-testid="order-forbidden">Este pedido pertence a outra conta.</Alert>;
  if (error) return <Alert type="error">{error.message}</Alert>;
  if (!order) return <div className="skeleton" style={{ height: 300 }} aria-label="Carregando pedido" />;

  const fresh = params.get('novo') === '1';
  const a = order.shippingAddress;
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {fresh && (
        <section className="panel confirm" data-testid="order-confirmation">
          <span className="confirm__badge"><Check size={36} aria-hidden="true" /></span>
          <h1>Pedido confirmado</h1>
          <p>Obrigado pela compra! O número do seu pedido é <strong data-testid="order-number">#{order.id}</strong>.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link className="btn btn--primary" to="/">Continuar comprando</Link>
            <Link className="btn btn--secondary" to="/pedidos">Ver meus pedidos</Link>
          </div>
        </section>
      )}
      {!fresh && <div className="page-head"><div><h1>Pedido #{order.id}</h1><p>{formatDate(order.createdAt)}</p></div></div>}
      <div className="two-col">
        <section className="panel">
          <div className="panel__head"><h2>Itens</h2></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th scope="col">Produto</th><th scope="col" className="num">Qtd.</th><th scope="col" className="num">Preço</th></tr></thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={`${i.productId}-${i.color}`}><td>{i.name}{i.color ? ` (${i.color})` : ''}</td><td className="num">{i.quantity}</td><td className="num">{brl(i.unitPrice * i.quantity)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel__body" style={{ display: 'grid', gap: 12 }}>
            <div className="review-block"><h3>Entrega</h3><span>{a.fullName}</span><span>{a.street}, {a.number}</span><span>{a.city}/{a.state} · CEP {a.cep}</span></div>
            <div className="review-block"><h3>Pagamento</h3><span className="tabular">Cartão final {order.cardLast4}</span></div>
          </div>
        </section>
        <aside className="panel summary">
          <div className="panel__head"><h2>Valores</h2></div>
          <div className="panel__body">
            <dl>
              <dt>Subtotal</dt><dd>{brl(order.subtotal)}</dd>
              {order.discount > 0 && (<><dt>Desconto{order.couponCode ? ` (${order.couponCode})` : ''}</dt><dd className="discount">- {brl(order.discount)}</dd></>)}
              <dt>Frete</dt><dd>{order.shipping === 0 ? 'Grátis' : brl(order.shipping)}</dd>
              <dt className="total">Total</dt><dd className="total" data-testid="order-total">{brl(order.total)}</dd>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
