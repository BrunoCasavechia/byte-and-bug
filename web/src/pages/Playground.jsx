import { useEffect, useMemo, useRef, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { ArrowDown, ArrowUp, CalendarDays, Download, ExternalLink, HelpCircle, Upload } from 'lucide-react';
import { api, brl } from '../lib/api.js';
import { useToast } from '../store.jsx';
import { Alert, Dialog } from '../components/ui.jsx';

function Card({ title, children, wide, testId }) {
  return (
    <section className={`panel play-card${wide ? ' play-wide' : ''}`} aria-labelledby={`${testId}-title`} data-testid={testId}>
      <h2 id={`${testId}-title`}>{title}</h2>
      {children}
    </section>
  );
}

// ---------- Janelas ----------
function WindowsTab() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState('');
  return (
    <div className="play-grid">
      <Card title="Modal (Radix Dialog)" testId="play-modal">
        <p>Renderizado num portal no fim do body. Fecha com Esc, no X ou no botão.</p>
        <div className="row"><button type="button" className="btn btn--primary" onClick={() => setOpen(true)}>Abrir modal</button></div>
        <Dialog open={open} onClose={() => setOpen(false)} title="Assinar newsletter" testId="newsletter-modal"
          footer={<><button type="button" className="btn btn--secondary" onClick={() => setOpen(false)}>Agora não</button>
            <button type="button" className="btn btn--primary" onClick={() => { setOpen(false); toast('Inscrição confirmada.'); }}>Assinar</button></>}>
          <p>Receba ofertas de periféricos toda semana. (É só um teste, nada é enviado.)</p>
        </Dialog>
      </Card>
      <Card title="Toasts (Sonner)" testId="play-toasts">
        <p>Somem sozinhos em 4 segundos. Ótimo para treinar assert de algo que desaparece.</p>
        <div className="row">
          <button type="button" className="btn btn--secondary" onClick={() => toast('Salvo com sucesso.')}>Sucesso</button>
          <button type="button" className="btn btn--secondary" onClick={() => toast('Algo deu errado.', 'error')}>Erro</button>
          <button type="button" className="btn btn--secondary" onClick={() => toast('Informação neutra.', 'info', 10000)}>Info (10 s)</button>
        </div>
      </Card>
      <Card title="Diálogos nativos do navegador" testId="play-native">
        <p>alert, confirm e prompt. No Playwright, use page.on("dialog") antes de clicar.</p>
        <div className="row">
          <button type="button" className="btn btn--secondary" onClick={() => { window.alert('Alerta do navegador'); setResult('alert fechado'); }}>alert</button>
          <button type="button" className="btn btn--secondary" onClick={() => setResult(window.confirm('Confirma?') ? 'confirm: OK' : 'confirm: Cancelar')}>confirm</button>
          <button type="button" className="btn btn--secondary" onClick={() => { const v = window.prompt('Qual seu nome?'); setResult(v === null ? 'prompt cancelado' : `prompt: ${v}`); }}>prompt</button>
        </div>
        <p aria-live="polite" data-testid="native-result">{result || 'Nenhum diálogo aberto ainda.'}</p>
      </Card>
      <Card title="Tooltip (Radix)" testId="play-tooltip">
        <p>Aparece só com hover ou foco, depois de 300 ms.</p>
        <Tooltip.Provider delayDuration={300}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button type="button" className="btn btn--secondary"><HelpCircle size={16} aria-hidden="true" />Passe o mouse aqui</button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="tooltip-content" sideOffset={6}>Frete grátis acima de R$ 299<Tooltip.Arrow className="tooltip-arrow" /></Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </Card>
    </div>
  );
}

// ---------- Formulários ----------
function FormsTab() {
  const [date, setDate] = useState();
  const [showCal, setShowCal] = useState(false);
  const [nativeDate, setNativeDate] = useState('');
  const [range, setRange] = useState(50);
  const [plan, setPlan] = useState('basico');
  const [extras, setExtras] = useState([]);
  const [files, setFiles] = useState([]);
  const today = new Date();

  const downloadCsv = () => {
    const csv = 'sku;produto;preco\nU01;Teclado Mecânico Flaky TKL;349,90\nR01;Mouse Gamer Timeout;189,90\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'relatorio-produtos.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="play-grid">
      <Card title="Calendário (react-day-picker)" testId="play-datepicker">
        <p>Datas passadas e fins de semana ficam desabilitados.</p>
        <div className="row">
          <button type="button" className="btn btn--secondary" onClick={() => setShowCal((s) => !s)} aria-expanded={showCal} data-testid="open-calendar">
            <CalendarDays size={16} aria-hidden="true" />{date ? date.toLocaleDateString('pt-BR') : 'Escolher data de entrega'}
          </button>
        </div>
        {showCal && (
          <div className="calendar-pop">
            <DayPicker mode="single" locale={ptBR} selected={date} onSelect={(d) => { setDate(d); setShowCal(false); }}
              disabled={[{ before: today }, { dayOfWeek: [0, 6] }]} />
          </div>
        )}
        <p data-testid="picked-date">{date ? `Entrega em ${date.toLocaleDateString('pt-BR')}` : 'Nenhuma data escolhida.'}</p>
      </Card>
      <Card title="Data nativa e slider" testId="play-native-inputs">
        <div className="field"><label htmlFor="nativeDate">Data (input type=date)</label><input id="nativeDate" className="input" type="date" value={nativeDate} onChange={(e) => setNativeDate(e.target.value)} /></div>
        <div className="field">
          <label htmlFor="budget">Orçamento: <span className="tabular" data-testid="budget-value">{brl(range * 10)}</span></label>
          <input id="budget" type="range" min="0" max="300" step="10" value={range} onChange={(e) => setRange(Number(e.target.value))} style={{ accentColor: 'var(--copper)' }} />
        </div>
      </Card>
      <Card title="Radio e checkbox" testId="play-choices">
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          <legend style={{ fontWeight: 600, marginBottom: 6 }}>Plano de garantia</legend>
          {[['basico', 'Básico (90 dias)'], ['estendido', 'Estendido (1 ano)'], ['total', 'Total (2 anos)']].map(([v, l]) => (
            <label className="check" key={v}><input type="radio" name="plan" value={v} checked={plan === v} onChange={() => setPlan(v)} />{l}</label>
          ))}
        </fieldset>
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          <legend style={{ fontWeight: 600, marginBottom: 6 }}>Adicionais</legend>
          {['Embalagem para presente', 'Instalação', 'Seguro contra roubo'].map((x) => (
            <label className="check" key={x}>
              <input type="checkbox" checked={extras.includes(x)} onChange={(e) => setExtras((all) => (e.target.checked ? [...all, x] : all.filter((y) => y !== x)))} />{x}
            </label>
          ))}
        </fieldset>
        <p data-testid="choices-summary">Plano {{ basico: 'Básico', estendido: 'Estendido', total: 'Total' }[plan]}{extras.length ? ` + ${extras.join(', ')}` : ''}</p>
      </Card>
      <Card title="Upload e download" testId="play-files">
        <p>Use set_input_files para o upload e expect_download para o download.</p>
        <label className="btn btn--secondary" htmlFor="play-upload" style={{ cursor: 'pointer', justifySelf: 'start' }}><Upload size={16} aria-hidden="true" />Enviar arquivos</label>
        <input id="play-upload" type="file" multiple className="sr-only" onChange={(e) => setFiles([...e.target.files].map((f) => `${f.name} (${Math.ceil(f.size / 1024)} KB)`))} />
        <ul data-testid="uploaded-files" style={{ margin: 0, paddingLeft: 18 }}>{files.length ? files.map((f) => <li key={f}>{f}</li>) : <li>Nenhum arquivo.</li>}</ul>
        <button type="button" className="btn btn--secondary" onClick={downloadCsv} style={{ justifySelf: 'start' }}><Download size={16} aria-hidden="true" />Baixar relatório CSV</button>
      </Card>
    </div>
  );
}

// ---------- Tabela ----------
function TableTab() {
  const [items, setItems] = useState([]);
  const [sort, setSort] = useState({ key: 'name', dir: 1 });
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const per = 5;
  useEffect(() => { api('/products?limit=50').then((r) => setItems(r.items)); }, []);
  const rows = useMemo(() => {
    const f = filter.toLowerCase();
    return items.filter((p) => p.name.toLowerCase().includes(f)).sort((a, b) => {
      const va = a[sort.key]; const vb = b[sort.key];
      return (typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR')) * sort.dir;
    });
  }, [items, sort, filter]);
  const pages = Math.max(1, Math.ceil(rows.length / per));
  const view = rows.slice((page - 1) * per, page * per);
  const Th = ({ k, children, num }) => (
    <th scope="col" className={num ? 'num' : undefined} aria-sort={sort.key === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => { setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : 1 })); setPage(1); }}>
        {children}{sort.key === k && (sort.dir === 1 ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />)}
      </button>
    </th>
  );
  return (
    <Card title="Tabela com ordenação, filtro e paginação" wide testId="play-table">
      <p>Treine ler células, ordenar por coluna e validar a ordem, navegar entre páginas.</p>
      <div className="field" style={{ maxWidth: 320 }}><label htmlFor="table-filter">Filtrar por nome</label>
        <input id="table-filter" className="input" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} /></div>
      <div className="table-wrap" style={{ border: '1px solid var(--line)', borderRadius: 8 }}>
        <table className="table" data-testid="sortable-table">
          <thead><tr><Th k="sku">SKU</Th><Th k="name">Produto</Th><Th k="price" num>Preço</Th><Th k="stock" num>Estoque</Th></tr></thead>
          <tbody>{view.map((p) => <tr key={p.id}><td>{p.sku}</td><td>{p.name}</td><td className="num">{brl(p.price)}</td><td className="num">{p.stock}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="tabular" data-testid="table-page">Página {page} de {pages} · {rows.length} linhas</span>
        <div className="row">
          <button type="button" className="btn btn--secondary btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
          <button type="button" className="btn btn--secondary btn--sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Próxima</button>
        </div>
      </div>
    </Card>
  );
}

// ---------- Assíncrono ----------
function AsyncTab() {
  const [slow, setSlow] = useState({ state: 'idle' });
  const [ms, setMs] = useState(3000);
  const [appear, setAppear] = useState(false);
  const [gone, setGone] = useState(false);
  const [flaky, setFlaky] = useState('');
  const [counter, setCounter] = useState(0);

  return (
    <div className="play-grid">
      <Card title="Resposta lenta da API" testId="play-slow">
        <p>Chama GET /qa/slow. Pratique timeouts e esperas sem sleep fixo.</p>
        <div className="row">
          <select className="select" style={{ width: 'auto' }} value={ms} onChange={(e) => setMs(Number(e.target.value))} aria-label="Atraso">
            {[1000, 3000, 6000, 12000].map((v) => <option key={v} value={v}>{v / 1000} s</option>)}
          </select>
          <button type="button" className="btn btn--primary" disabled={slow.state === 'loading'} data-testid="slow-button"
            onClick={async () => { setSlow({ state: 'loading' }); try { const r = await api(`/qa/slow?ms=${ms}`); setSlow({ state: 'done', r }); } catch (e) { setSlow({ state: 'error', e: e.message }); } }}>
            {slow.state === 'loading' && <span className="spinner" aria-hidden="true" />}{slow.state === 'loading' ? 'Carregando...' : 'Carregar dados'}
          </button>
        </div>
        <p aria-live="polite" data-testid="slow-result">
          {slow.state === 'done' ? `Dados carregados em ${slow.r.waitedMs} ms.` : slow.state === 'error' ? slow.e : 'Aguardando clique.'}
        </p>
      </Card>
      <Card title="Elemento que aparece e some" testId="play-appear">
        <p>Um aparece 2 s depois do clique; o outro some 2 s depois.</p>
        <div className="row">
          <button type="button" className="btn btn--secondary" onClick={() => { setAppear(false); setTimeout(() => setAppear(true), 2000); }}>Mostrar em 2 s</button>
          <button type="button" className="btn btn--secondary" onClick={() => { setGone(false); setTimeout(() => setGone(true), 2000); }}>Esconder em 2 s</button>
        </div>
        {appear && <Alert type="ok" data-testid="delayed-element">Apareci!</Alert>}
        {!gone && <Alert type="info" data-testid="vanishing-element">Vou sumir quando você pedir.</Alert>}
      </Card>
      <Card title="Endpoint instável" testId="play-flaky">
        <p>GET /qa/flaky falha metade das vezes. Bom para discutir testes intermitentes.</p>
        <div className="row"><button type="button" className="btn btn--secondary" onClick={async () => { try { await api('/qa/flaky'); setFlaky('Funcionou'); } catch (e) { setFlaky(`Falhou: ${e.message}`); } }}>Chamar endpoint</button></div>
        <p aria-live="polite" data-testid="flaky-result">{flaky || 'Ainda não chamado.'}</p>
      </Card>
      <Card title="Clique duplo e contador" testId="play-counter">
        <p>Botão que só conta no duplo clique. Dica: dblclick().</p>
        <div className="row"><button type="button" className="btn btn--secondary" onDoubleClick={() => setCounter((c) => c + 1)}>Clique duas vezes</button>
          <strong className="tabular" data-testid="counter">{counter}</strong></div>
      </Card>
    </div>
  );
}

// ---------- Estruturas difíceis ----------
class ByteCoupon extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        div{font-family:'Barlow',sans-serif;border:2px dashed #a5591d;border-radius:10px;padding:14px;display:flex;gap:10px;align-items:center;justify-content:space-between;background:#fff}
        button{font:inherit;font-weight:600;border:0;border-radius:8px;padding:8px 14px;background:#a5591d;color:#fff;cursor:pointer}
        span{font-weight:700;letter-spacing:.08em}
      </style>
      <div><span id="code">BYTE10</span><button type="button">Copiar cupom</button></div>`;
    root.querySelector('button').addEventListener('click', (e) => { e.target.textContent = 'Copiado!'; });
  }
}
if (!customElements.get('bb-coupon')) customElements.define('bb-coupon', ByteCoupon);

const IFRAME_HTML = `<!doctype html><html lang="pt-BR"><body style="font-family:sans-serif;padding:14px;margin:0">
<form onsubmit="event.preventDefault();document.getElementById('msg').textContent='Obrigado, '+document.getElementById('nome').value+'!'">
<label for="nome">Seu nome</label><br><input id="nome" style="padding:8px;margin:6px 0;width:200px"><br>
<button type="submit" style="padding:8px 14px">Enviar avaliação</button></form><p id="msg"></p></body></html>`;

function DndBoard() {
  const [cols, setCols] = useState({ todo: ['Testar login', 'Testar cupom', 'Testar checkout'], doing: [], done: [] });
  const [over, setOver] = useState('');
  const drag = useRef(null);
  const names = { todo: 'A fazer', doing: 'Fazendo', done: 'Feito' };
  return (
    <div className="dnd" data-testid="dnd-board">
      {Object.keys(cols).map((col) => (
        <div key={col} className={`dnd__col${over === col ? ' is-over' : ''}`} data-testid={`dnd-${col}`}
          onDragOver={(e) => { e.preventDefault(); setOver(col); }} onDragLeave={() => setOver('')}
          onDrop={() => {
            setOver('');
            const item = drag.current; if (!item) return;
            setCols((c) => {
              const next = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.filter((x) => x !== item)]));
              next[col] = [...next[col], item]; return next;
            });
          }}>
          <h3>{names[col]} ({cols[col].length})</h3>
          {cols[col].map((item) => <div key={item} className="dnd__item" draggable onDragStart={() => { drag.current = item; }}>{item}</div>)}
        </div>
      ))}
    </div>
  );
}

function StructuresTab() {
  return (
    <div className="play-grid">
      <Card title="Iframe" testId="play-iframe">
        <p>O formulário está dentro de um iframe. Use frame_locator.</p>
        <iframe title="Avaliação do produto" className="iframe-box" srcDoc={IFRAME_HTML} data-testid="review-iframe" />
      </Card>
      <Card title="Shadow DOM (Web Component)" testId="play-shadow">
        <p>O botão está dentro de um shadow root. O Playwright atravessa shadow DOM aberto sozinho.</p>
        <bb-coupon data-testid="shadow-coupon" />
      </Card>
      <Card title="Nova aba" testId="play-newtab">
        <p>Abre a documentação da API em outra aba. Use expect_page.</p>
        <a className="btn btn--secondary" href={`${API_URL}/docs`} target="_blank" rel="noreferrer" style={{ justifySelf: 'start' }}>
          <ExternalLink size={16} aria-hidden="true" />Abrir documentação
        </a>
      </Card>
      <Card title="Arrastar e soltar" wide testId="play-dnd">
        <p>Mova as tarefas entre as colunas. Use drag_to.</p>
        <DndBoard />
      </Card>
    </div>
  );
}

export function Playground() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Playground</h1>
          <p>Componentes difíceis de automatizar, reunidos para treino. Cada aba tem um tipo de desafio.</p>
        </div>
      </div>
      <Tabs.Root defaultValue="janelas">
        <Tabs.List className="tabs__list" aria-label="Tipos de desafio">
          <Tabs.Trigger className="tabs__trigger" value="janelas">Janelas e avisos</Tabs.Trigger>
          <Tabs.Trigger className="tabs__trigger" value="formularios">Formulários</Tabs.Trigger>
          <Tabs.Trigger className="tabs__trigger" value="tabela">Tabela</Tabs.Trigger>
          <Tabs.Trigger className="tabs__trigger" value="assincrono">Assíncrono</Tabs.Trigger>
          <Tabs.Trigger className="tabs__trigger" value="estruturas">Iframe, shadow DOM e arrastar</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className="tabs__content" value="janelas"><WindowsTab /></Tabs.Content>
        <Tabs.Content className="tabs__content" value="formularios"><FormsTab /></Tabs.Content>
        <Tabs.Content className="tabs__content" value="tabela"><TableTab /></Tabs.Content>
        <Tabs.Content className="tabs__content" value="assincrono"><AsyncTab /></Tabs.Content>
        <Tabs.Content className="tabs__content" value="estruturas"><StructuresTab /></Tabs.Content>
      </Tabs.Root>
    </>
  );
}
