import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import { API_URL } from '../lib/api.js';

function Code({ lang, children, testId }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="code" data-testid={testId}>
      <div className="code__bar">
        <span>{lang}</span>
        <button type="button" aria-label={`Copiar código ${lang}`} onClick={async () => {
          try { await navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ }
        }}>
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre><code>{children}</code></pre>
    </div>
  );
}

// Sequence diagram of the auth flow, authored as SVG.
function AuthFlow() {
  const lane = { client: 110, api: 410, db: 690 };
  const msgs = [
    [70, 'client', 'api', 'POST /auth/login { email, password }', 'req'],
    [112, 'api', 'db', 'confere usuário e senha', 'req'],
    [154, 'api', 'client', '200 · accessToken (15 min) + refreshToken (7 dias)', 'ok'],
    [214, 'client', 'api', 'GET /cart · Authorization: Bearer <accessToken>', 'req'],
    [256, 'api', 'client', '200 · carrinho', 'ok'],
    [326, 'client', 'api', 'GET /cart (15 min depois)', 'req'],
    [368, 'api', 'client', '401 · TOKEN_EXPIRED', 'err'],
    [428, 'client', 'api', 'POST /auth/refresh { refreshToken }', 'req'],
    [470, 'api', 'db', 'revoga o refresh antigo (rotação)', 'req'],
    [512, 'api', 'client', '200 · par novo de tokens', 'ok'],
    [572, 'client', 'api', 'repete GET /cart com o token novo', 'req'],
  ];
  const color = { req: '#5b3df5', ok: '#0a7f4f', err: '#c5221f' };
  return (
    <figure className="flow" data-testid="auth-flow">
      <svg viewBox="0 0 800 620" role="img" aria-labelledby="flow-title">
        <title id="flow-title">Fluxo de autenticação: login, uso do token, expiração e renovação</title>
        <defs>
          {Object.entries(color).map(([k, c]) => (
            <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill={c} /></marker>
          ))}
        </defs>
        {[['client', 'Cliente', 'site, Postman ou teste'], ['api', 'API', 'byte-and-bug-api'], ['db', 'Banco', 'PostgreSQL']].map(([k, t, s]) => (
          <g key={k}>
            <rect x={lane[k] - 80} y="6" width="160" height="44" rx="10" fill="#1a1446" />
            <text x={lane[k]} y="26" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="15">{t}</text>
            <text x={lane[k]} y="42" textAnchor="middle" fill="#c9c3f2" fontSize="11">{s}</text>
            <line x1={lane[k]} y1="50" x2={lane[k]} y2="610" stroke="#c9c8da" strokeDasharray="4 5" />
          </g>
        ))}
        <rect x="20" y="300" width="760" height="1" fill="#e3e3ee" />
        <text x="24" y="294" fontSize="11" fill="#6b6985" fontWeight="700">QUANDO O TOKEN EXPIRA</text>
        {msgs.map(([y, from, to, label, kind]) => {
          const x1 = lane[from] + (lane[to] > lane[from] ? 6 : -6);
          const x2 = lane[to] + (lane[to] > lane[from] ? -6 : 6);
          return (
            <g key={y}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke={color[kind]} strokeWidth="2" markerEnd={`url(#arrow-${kind})`} strokeDasharray={kind === 'req' ? undefined : '6 4'} />
              <text x={(lane[from] + lane[to]) / 2} y={y - 8} textAnchor="middle" fontSize="12.5" fill="#17152b" fontWeight="600">{label}</text>
            </g>
          );
        })}
      </svg>
      <figcaption>Linhas cheias são requisições; tracejadas são respostas (verde para sucesso, vermelho para erro).</figcaption>
    </figure>
  );
}

const SECTIONS = [
  ['visao-geral', 'Visão geral'],
  ['tokens', 'Access token e refresh token'],
  ['fluxo', 'Fluxo completo'],
  ['endpoints', 'Endpoints'],
  ['erros', 'Códigos de erro'],
  ['playwright', 'Usando no Playwright'],
  ['cenarios', 'Cenários de teste'],
];

export function DevGuide() {
  return (
    <div className="docs">
      <nav className="docs__nav" aria-label="Nesta página">
        <span className="docs__nav-title">Guia de autenticação</span>
        <ul>{SECTIONS.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ul>
        <a className="btn btn--secondary btn--sm" href={`${API_URL}/docs`} target="_blank" rel="noreferrer">Abrir Swagger</a>
      </nav>

      <article className="docs__body">
        <header id="visao-geral">
          <p className="docs__crumb"><Link to="/">Byte &amp; Bug</Link> / Desenvolvedores</p>
          <h1>Autenticação na API</h1>
          <p className="docs__lead">
            A API da Byte &amp; Bug usa <strong>JWT</strong> com dois tokens: um de acesso, curto, e um de renovação, longo.
            Este guia mostra o fluxo completo e como usar o login pela API para que os testes de interface comecem já logados.
          </p>
          <dl className="docs__facts">
            <div><dt>Base URL</dt><dd><code>{API_URL}</code></dd></div>
            <div><dt>Formato</dt><dd>JSON</dd></div>
            <div><dt>Autenticação</dt><dd><code>Authorization: Bearer &lt;token&gt;</code></dd></div>
          </dl>
        </header>

        <section id="tokens">
          <h2>Access token e refresh token</h2>
          <p>São dois tokens com papéis diferentes. Pense no crachá e no contrato de um funcionário: o crachá abre as portas no dia a dia, e o contrato é o que permite tirar um crachá novo quando o antigo vence.</p>
          <div className="table-wrap docs__table">
            <table className="table">
              <thead><tr><th scope="col"></th><th scope="col">Access token</th><th scope="col">Refresh token</th></tr></thead>
              <tbody>
                <tr><th scope="row">Para que serve</th><td>Acessar rotas protegidas (carrinho, pedidos, admin)</td><td>Pedir um access token novo sem digitar a senha</td></tr>
                <tr><th scope="row">Validade</th><td>15 minutos</td><td>7 dias</td></tr>
                <tr><th scope="row">Onde vai</th><td>Header <code>Authorization</code> de cada requisição</td><td>Só no corpo de <code>POST /auth/refresh</code></td></tr>
                <tr><th scope="row">Formato</th><td>JWT (dá para decodificar em jwt.io)</td><td>Texto aleatório, guardado no banco</td></tr>
                <tr><th scope="row">Se vazar</th><td>Vale por no máximo 15 minutos</td><td>Pode ser revogado no logout</td></tr>
              </tbody>
            </table>
          </div>
          <p>O access token é curto por segurança: se alguém roubar, o estrago dura pouco. O refresh token é o que mantém o usuário logado por dias sem perceber nada, porque o site troca o token vencido por um novo em segundo plano.</p>
          <p><strong>Rotação:</strong> cada refresh token só pode ser usado uma vez. Ao usar, você recebe um par novo e o antigo é revogado. Usar o mesmo refresh duas vezes devolve <code>401 REFRESH_TOKEN_REVOKED</code>.</p>
        </section>

        <section id="fluxo">
          <h2>Fluxo completo</h2>
          <AuthFlow />
        </section>

        <section id="endpoints">
          <h2>Endpoints</h2>
          <h3><span className="method method--post">POST</span> /auth/login</h3>
          <Code lang="curl" testId="code-login">{`curl -X POST ${API_URL}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"cliente@bytebug.dev","password":"byte123"}'`}</Code>
          <Code lang="Resposta 200">{`{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "9f2c1e...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": { "id": 1, "name": "Cliente Teste", "email": "cliente@bytebug.dev", "role": "customer" }
}`}</Code>

          <h3><span className="method method--get">GET</span> /cart <span className="docs__lock">requer token</span></h3>
          <Code lang="curl">{`curl ${API_URL}/cart \\
  -H "Authorization: Bearer <accessToken>"`}</Code>

          <h3><span className="method method--post">POST</span> /auth/refresh</h3>
          <Code lang="curl">{`curl -X POST ${API_URL}/auth/refresh \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken":"<refreshToken>"}'`}</Code>

          <h3><span className="method method--post">POST</span> /auth/logout</h3>
          <p>Revoga o refresh token. Depois disso, ele não serve mais para renovar a sessão.</p>
        </section>

        <section id="erros">
          <h2>Códigos de erro</h2>
          <p>Todo erro tem o mesmo formato: <code>{'{ "error": { "code": "...", "message": "..." } }'}</code>. Valide o <code>code</code>, que é estável; a <code>message</code> pode mudar de texto.</p>
          <div className="table-wrap docs__table">
            <table className="table">
              <thead><tr><th scope="col">Status</th><th scope="col">code</th><th scope="col">Quando acontece</th></tr></thead>
              <tbody>
                <tr><td>400</td><td><code>VALIDATION_ERROR</code></td><td>E-mail ou senha vazios</td></tr>
                <tr><td>401</td><td><code>INVALID_CREDENTIALS</code></td><td>E-mail ou senha errados</td></tr>
                <tr><td>401</td><td><code>TOKEN_MISSING</code></td><td>Rota protegida sem header Authorization</td></tr>
                <tr><td>401</td><td><code>TOKEN_INVALID</code></td><td>Token adulterado ou sem o prefixo Bearer</td></tr>
                <tr><td>401</td><td><code>TOKEN_EXPIRED</code></td><td>Access token com mais de 15 minutos</td></tr>
                <tr><td>401</td><td><code>REFRESH_TOKEN_REVOKED</code></td><td>Refresh token usado duas vezes ou após logout</td></tr>
                <tr><td>403</td><td><code>USER_LOCKED</code></td><td>Login com o usuário bloqueado</td></tr>
                <tr><td>403</td><td><code>FORBIDDEN</code></td><td>Cliente tentando usar rota de admin ou pedido de outra pessoa</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="playwright">
          <h2>Usando no Playwright</h2>
          <p>O login pela interface é lento e quebra a suíte inteira quando a tela muda. O padrão de mercado é fazer o login <strong>pela API</strong> e entregar a página já logada. A tela de login ganha seus próprios testes, e o resto da suíte não depende dela.</p>
          <p>O site guarda a sessão no <code>localStorage</code>, na chave <code>bb.session</code>. Basta gravar essa chave antes da página carregar:</p>
          <Code lang="Python · conftest.py" testId="code-fixture">{`import json, time, pytest

API_URL = "${API_URL}"

@pytest.fixture
def login_api(playwright):
    request = playwright.request.new_context(base_url=API_URL)
    response = request.post("/auth/login", data={"email": "cliente@bytebug.dev", "password": "byte123"})
    assert response.status == 200
    yield response.json()
    request.dispose()

@pytest.fixture
def logged_page(page, login_api):
    session = {
        "accessToken": login_api["accessToken"],
        "refreshToken": login_api["refreshToken"],
        "expiresAt": int(time.time() * 1000) + login_api["expiresIn"] * 1000,
        "user": login_api["user"],
    }
    page.add_init_script(f"localStorage.setItem('bb.session', {json.dumps(json.dumps(session))})")
    page.goto("/")
    return page`}</Code>
          <p>Como cada teste faz o próprio login, nenhum teste dura o suficiente para o token expirar no meio. Se a suíte de API reaproveitar um token só, ela começa a receber <code>TOKEN_EXPIRED</code> depois de 15 minutos.</p>
        </section>

        <section id="cenarios">
          <h2>Cenários de teste sugeridos</h2>
          <ul className="docs__checks">
            <li>Login válido devolve 200, <code>tokenType</code> Bearer e <code>expiresIn</code> 900.</li>
            <li>Senha errada devolve 401 <code>INVALID_CREDENTIALS</code>.</li>
            <li>Usuário bloqueado devolve 403 <code>USER_LOCKED</code>.</li>
            <li>Rota protegida sem token devolve 401 <code>TOKEN_MISSING</code>; com token alterado, 401 <code>TOKEN_INVALID</code>.</li>
            <li>Refresh devolve um par novo, e reusar o refresh antigo devolve 401 <code>REFRESH_TOKEN_REVOKED</code>.</li>
            <li>Depois do logout, o refresh token não renova mais a sessão.</li>
            <li>Cliente chamando <code>POST /products</code> recebe 403 <code>FORBIDDEN</code>.</li>
            <li>Na interface, a página aberta com <code>logged_page</code> mostra "Minha conta" no topo.</li>
          </ul>
          <p className="docs__note">Usuários de teste: <code>cliente@bytebug.dev</code> / <code>byte123</code>, <code>admin@bytebug.dev</code> / <code>admin123</code> e <code>bloqueado@bytebug.dev</code> / <code>byte123</code>. Todos os dados são fictícios.</p>
        </section>
      </article>
    </div>
  );
}
