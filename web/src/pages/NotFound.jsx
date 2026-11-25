import { Link } from 'react-router-dom';

export function NotFound({ what = 'Página' }) {
  return (
    <div className="not-found" data-testid="not-found">
      <div className="code">404</div>
      <h1>{what} não encontrad{what === 'Página' ? 'a' : 'o'}</h1>
      <p>Deu bug: o endereço não leva a lugar nenhum.</p>
      <Link className="btn btn--primary" to="/">Voltar para a loja</Link>
    </div>
  );
}
