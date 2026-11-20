import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ImageUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, brl } from '../../lib/api.js';
import { useToast } from '../../store.jsx';
import { Alert, Dialog, Field, fieldProps, ProductImage } from '../../components/ui.jsx';
import { SelectBox } from '../../components/SelectBox.jsx';

export function AdminProducts() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState({ key: 'sku', dir: 1 });
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const pages = [];
    let page = 1; let total = 1;
    while (page <= total) {
      const r = await api(`/products?limit=50&page=${page}`);
      pages.push(...r.items); total = r.totalPages; page += 1;
    }
    setItems(pages);
  };
  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    if (!items) return [];
    const f = filter.trim().toLowerCase();
    return items
      .filter((p) => !f || `${p.sku} ${p.name} ${p.brand}`.toLowerCase().includes(f))
      .sort((a, b) => {
        const va = a[sort.key]; const vb = b[sort.key];
        return (typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR')) * sort.dir;
      });
  }, [items, filter, sort]);

  const Th = ({ k, children, num }) => (
    <th scope="col" className={num ? 'num' : undefined} aria-sort={sort.key === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : 1 }))}>
        {children}{sort.key === k && (sort.dir === 1 ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />)}
      </button>
    </th>
  );

  return (
    <>
      <div className="page-head">
        <div><h1>Produtos</h1><p>Painel admin · {items ? `${items.length} produtos` : 'carregando...'}</p></div>
        <Link className="btn btn--primary" to="/admin/produtos/novo" data-testid="new-product"><Plus size={18} aria-hidden="true" />Novo produto</Link>
      </div>
      <div className="toolbar">
        <div className="field" style={{ minWidth: 280 }}>
          <label htmlFor="admin-filter" className="sr-only">Filtrar produtos</label>
          <input id="admin-filter" className="input" type="search" placeholder="Filtrar por SKU, nome ou marca" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      </div>
      <div className="panel table-wrap">
        <table className="table" data-testid="admin-products-table">
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">Imagem</span></th>
              <Th k="sku">SKU</Th><Th k="name">Nome</Th><Th k="brand">Marca</Th><Th k="price" num>Preço</Th><Th k="stock" num>Estoque</Th>
              <th scope="col" className="num">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} data-testid="admin-product-row">
                <td><ProductImage product={p} /></td>
                <td><span className="designator">{p.sku}</span></td>
                <td>{p.name}</td>
                <td>{p.brand}</td>
                <td className="num">{brl(p.price)}</td>
                <td className="num">{p.stock === 0 ? <span className="badge badge--muted">Esgotado</span> : p.stock}</td>
                <td className="num" style={{ whiteSpace: 'nowrap' }}>
                  <Link className="btn btn--ghost btn--sm" to={`/admin/produtos/${p.id}`} aria-label={`Editar ${p.name}`}><Pencil size={16} aria-hidden="true" /></Link>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setToDelete(p)} aria-label={`Excluir ${p.name}`} data-testid="delete-product"><Trash2 size={16} aria-hidden="true" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items && rows.length === 0 && <p style={{ padding: 20, color: 'var(--ink-2)' }}>Nenhum produto com esse filtro.</p>}
      </div>

      <Dialog
        open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Excluir produto?" testId="confirm-delete"
        footer={(
          <>
            <button type="button" className="btn btn--secondary" onClick={() => setToDelete(null)}>Cancelar</button>
            <button type="button" className="btn btn--danger" disabled={busy} data-testid="confirm-delete-button"
              onClick={async () => {
                setBusy(true);
                try { await api(`/products/${toDelete.id}`, { method: 'DELETE' }); toast(`${toDelete.name} excluído.`); setToDelete(null); load(); }
                catch (err) { toast(err.message, 'error'); setToDelete(null); }
                finally { setBusy(false); }
              }}>
              Excluir
            </button>
          </>
        )}
      >
        <p>Você vai excluir <strong>{toDelete?.name}</strong>. Essa ação não pode ser desfeita.</p>
      </Dialog>
    </>
  );
}

const blank = { sku: '', name: '', brand: '', category: '', price: '', stock: '0', colors: '', description: '' };

export function AdminProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(blank);
  const [product, setProduct] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/categories').then(setCategories); }, []);
  useEffect(() => {
    if (!editing) return;
    api(`/products/${id}`).then((p) => {
      setProduct(p);
      setForm({ sku: p.sku, name: p.name, brand: p.brand, category: p.category.slug, price: String(p.price), stock: String(p.stock), colors: p.colors.join(', '), description: p.description });
    }).catch(() => setFormError('Produto não encontrado.'));
  }, [editing, id]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setErrors({}); setFormError('');
    const body = {
      sku: form.sku.trim().toUpperCase(), name: form.name, brand: form.brand, category: form.category,
      price: Number(String(form.price).replace(',', '.')), stock: Number(form.stock),
      colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean), description: form.description,
    };
    setBusy(true);
    try {
      const saved = await api(editing ? `/products/${id}` : '/products', { method: editing ? 'PUT' : 'POST', body });
      if (file) {
        const fd = new FormData(); fd.append('image', file);
        await api(`/products/${saved.id}/image`, { method: 'POST', form: fd });
      }
      toast(editing ? 'Produto atualizado.' : 'Produto criado.');
      navigate('/admin/produtos');
    } catch (err) {
      setErrors(err.fieldErrors?.() || {});
      setFormError(err.message);
    } finally { setBusy(false); }
  };

  const e = errors;
  return (
    <>
      <div className="page-head"><div><h1>{editing ? 'Editar produto' : 'Novo produto'}</h1><p><Link to="/admin/produtos">Voltar para a lista</Link></p></div></div>
      <form className="panel" onSubmit={submit} noValidate data-testid="product-form">
        <div className="panel__body form-grid">
          {formError && <div className="span-6"><Alert type="error" data-testid="product-form-error">{formError}</Alert></div>}
          <div className="span-2"><Field id="sku" label="SKU" error={e.sku} hint="Letra + 2 ou 3 dígitos, ex.: A10"><input className="input" {...fieldProps('sku', e.sku, 'x')} value={form.sku} onChange={set('sku')} /></Field></div>
          <div className="span-4"><Field id="name" label="Nome" error={e.name}><input className="input" {...fieldProps('name', e.name)} value={form.name} onChange={set('name')} /></Field></div>
          <div className="span-2"><Field id="brand" label="Marca" error={e.brand}><input className="input" {...fieldProps('brand', e.brand)} value={form.brand} onChange={set('brand')} /></Field></div>
          <div className="span-2"><Field id="category" label="Categoria" error={e.category}>
            <SelectBox inputId="category" testId="category-select" options={categories.map((c) => ({ value: c.slug, label: c.name }))} value={form.category}
              onChange={(v) => setForm((f) => ({ ...f, category: v }))} invalid={Boolean(e.category)} describedBy="category-error" />
          </Field></div>
          <div className="span-2"><Field id="price" label="Preço (R$)" error={e.price}><input className="input tabular" inputMode="decimal" {...fieldProps('price', e.price)} value={form.price} onChange={set('price')} /></Field></div>
          <div className="span-2"><Field id="stock" label="Estoque" error={e.stock}><input className="input tabular" type="number" min="0" {...fieldProps('stock', e.stock)} value={form.stock} onChange={set('stock')} /></Field></div>
          <div className="span-4"><Field id="colors" label="Cores (opcional)" hint="Separe por vírgula: Preto, Branco"><input className="input" {...fieldProps('colors', null, 'x')} value={form.colors} onChange={set('colors')} /></Field></div>
          <div className="span-6"><Field id="description" label="Descrição"><textarea className="textarea" {...fieldProps('description')} value={form.description} onChange={set('description')} /></Field></div>
          <div className="span-6 field">
            <label htmlFor="image">Imagem</label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              {(preview || product) && (
                preview
                  ? <img src={preview} alt="Pré-visualização" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} />
                  : <ProductImage product={product} style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} />
              )}
              <label className="btn btn--secondary" htmlFor="image" style={{ cursor: 'pointer' }}><ImageUp size={18} aria-hidden="true" />Escolher imagem</label>
              <input id="image" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" data-testid="image-input"
                onChange={(ev) => { const f = ev.target.files?.[0]; setFile(f || null); setPreview(f ? URL.createObjectURL(f) : ''); }} />
              <span className="hint" style={{ color: 'var(--ink-3)' }}>{file ? file.name : 'PNG, JPG ou WEBP até 2 MB'}</span>
            </div>
          </div>
        </div>
        <div className="dialog__foot" style={{ borderRadius: '0 0 var(--radius) var(--radius)' }}>
          <Link className="btn btn--secondary" to="/admin/produtos">Cancelar</Link>
          <button type="submit" className="btn btn--primary" disabled={busy} data-testid="save-product">
            {busy && <span className="spinner" aria-hidden="true" />}Salvar produto
          </button>
        </div>
      </form>
    </>
  );
}
