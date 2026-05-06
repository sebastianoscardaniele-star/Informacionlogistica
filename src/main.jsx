import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { initialData } from './data.js';
import './styles.css';

const STORAGE_KEY = 'sellers-tiendas-data-v3';
const brands = Object.keys(initialData);
const Icon = ({ label }) => <span className="icon" aria-hidden="true">{label}</span>;

const sellerFields = [
  'Estado',
  'Responsable',
  'Razón social',
  'Alias (Nombre de Fantasía)',
  'CUIT (vinculado en el contrato)',
  'Mail (usuario) Módulo logístico',
  'Contraseña Módulo logístico'
];

const statusOptions = ['Activo', 'En Proceso', 'En espera OL', 'En espera Seller', 'Seller sin respuesta'];
const logisticOperatorFields = ['Southpost', 'Andreani', 'Rapiboy', 'HOP', 'PICKIT', 'Flete Propio', 'URBANO'];
const shippingFields = ['Envío Gratis', 'Same Day /NextDay', 'Retiro en Sucursal'];
const logisticsConfigFields = ['Activo para operar', 'Depósito OK'];
const depositFields = ['Provincia', 'Localidad'];
const branchAddressField = 'Direcciones Retiro por Sucursal';
const requiredFields = [...sellerFields, ...logisticOperatorFields, ...shippingFields, ...logisticsConfigFields, ...depositFields, branchAddressField];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeValue(value) {
  if (value === true) return 'Sí';
  if (value === false) return 'No';
  if (value === null || value === undefined) return '';
  return String(value);
}

function toBoolean(value) {
  if (value === true) return true;
  if (value === false || value === null || value === undefined || value === '') return false;
  const text = String(value).trim().toLowerCase();
  return ['si', 'sí', 'true', '1', 'x', 'ok', 'activo', 'activa', 'yes'].includes(text);
}

function getSellerName(row) {
  return row['Alias (Nombre de Fantasía)'] || row['Razón social'] || row['CUIT (vinculado en el contrato)'] || 'Seller sin nombre';
}


function loadXlsxFromCdn() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-xlsx-cdn="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.XLSX), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    script.async = true;
    script.dataset.xlsxCdn = 'true';
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error('No se pudo cargar el exportador XLSX. Revisá la conexión e intentá de nuevo.'));
    document.head.appendChild(script);
  });
}

function prepareData(source) {
  const next = clone(source);
  for (const brandName of Object.keys(next)) {
    const headers = Array.from(new Set([...(next[brandName].headers || []), ...requiredFields]));
    next[brandName].headers = headers;
    next[brandName].rows = (next[brandName].rows || []).map(row => {
      const prepared = { ...row };
      requiredFields.forEach(field => {
        if (!(field in prepared)) prepared[field] = '';
      });
      [...logisticOperatorFields, 'Retiro en Sucursal', ...logisticsConfigFields].forEach(field => {
        prepared[field] = toBoolean(prepared[field]);
      });
      return prepared;
    });
  }
  return next;
}

function FieldInput({ row, field, onChange, textarea = false, checkbox = false }) {
  if (field === 'Estado') {
    const currentValue = normalizeValue(row[field]);
    return (
      <label className="field">
        <span>{field}</span>
        <select value={statusOptions.includes(currentValue) ? currentValue : ''} onChange={e => onChange(field, e.target.value)}>
          <option value="">Seleccionar estado</option>
          {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    );
  }
  if (checkbox) {
    return (
      <label className="checkField">
        <input type="checkbox" checked={toBoolean(row[field])} onChange={e => onChange(field, e.target.checked)} />
        <span>{field}</span>
      </label>
    );
  }
  return (
    <label className="field">
      <span>{field}</span>
      {textarea ? (
        <textarea value={normalizeValue(row[field])} onChange={e => onChange(field, e.target.value)} rows={5} />
      ) : (
        <input value={normalizeValue(row[field])} onChange={e => onChange(field, e.target.value)} />
      )}
    </label>
  );
}

function Section({ icon, title, children }) {
  return (
    <section className="cardSection">
      <div className="sectionTitle">{icon}<h3>{title}</h3></div>
      <div className="sectionBody">{children}</div>
    </section>
  );
}

function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    
      const base = prepareData(initialData);
      if (!saved) return base;
      const parsed = prepareData(JSON.parse(saved));
      return { ...base, ...parsed };
    
  });
  const [brand, setBrand] = useState(brands[0]);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSavedAt(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
  }, [data]);

  useEffect(() => {
    setSelectedIndex(0);
    setQuery('');
  }, [brand]);

  const rows = data[brand]?.rows || [];
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const indexed = rows.map((row, index) => ({ row, index }));
    if (!q) return indexed;
    return indexed.filter(({ row }) => Object.values(row).some(value => normalizeValue(value).toLowerCase().includes(q)));
  }, [query, rows]);

  const selected = rows[selectedIndex] || filteredRows[0]?.row || null;

  function updateField(field, value) {
    setData(prev => {
      const next = clone(prev);
      next[brand].rows[selectedIndex][field] = value;
      return next;
    });
  }

  function addSeller() {
    setData(prev => {
      const next = clone(prev);
      const blank = Object.fromEntries(requiredFields.map(h => [h, '']));
      blank.Estado = 'En Proceso';
      [...logisticOperatorFields, 'Retiro en Sucursal', ...logisticsConfigFields].forEach(field => { blank[field] = false; });
      next[brand].headers = Array.from(new Set([...(next[brand].headers || []), ...requiredFields]));
      next[brand].rows.unshift(blank);
      return next;
    });
    setSelectedIndex(0);
    setQuery('');
  }

  function deleteSeller() {
    if (!selected) return;
    const ok = confirm(`¿Eliminar ${getSellerName(selected)}?`);
    if (!ok) return;
    setData(prev => {
      const next = clone(prev);
      next[brand].rows.splice(selectedIndex, 1);
      return next;
    });
    setSelectedIndex(0);
  }

  async function exportXlsx() {
    const XLSX = await loadXlsxFromCdn();
    const workbook = XLSX.utils.book_new();
    Object.entries(data).forEach(([storeName, storeData]) => {
      const headers = Array.from(new Set([...(storeData.headers || []), ...requiredFields]));
      const rowsForSheet = (storeData.rows || []).map(row => {
        const output = {};
        headers.forEach(header => {
          output[header] = normalizeValue(row[header]);
        });
        return output;
      });
      const worksheet = XLSX.utils.json_to_sheet(rowsForSheet, { header: headers });
      worksheet['!cols'] = headers.map(header => ({ wch: Math.max(14, Math.min(36, String(header).length + 4)) }));
      XLSX.utils.book_append_sheet(workbook, worksheet, String(storeName).slice(0, 31));
    });
    XLSX.writeFile(workbook, `sellers-tiendas-${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  function resetData() {
    const ok = confirm('Esto restaura los datos originales del Excel y borra cambios locales. ¿Continuar?');
    if (ok) {
      localStorage.removeItem(STORAGE_KEY);
      setData(prepareData(initialData));
      setSelectedIndex(0);
    }
  }

  const activeCount = rows.filter(r => normalizeValue(r.Estado).toLowerCase().includes('activo')).length;

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Operadores logísticos</p>
          <h1>Sellers por tienda</h1>
          <p>Información editable separada por tienda, seller, operador, envío, logística y depósito.</p>
        </div>
        <div className="heroActions">
          <button onClick={addSeller}><Icon label="+" /> Nuevo seller</button>
          <button onClick={exportXlsx}><Icon label="↓" /> Exportar XLSX</button>
          <button className="ghost" onClick={resetData}><Icon label="↺" /> Restaurar</button>
        </div>
      </header>

      <section className="brandTabs">
        {brands.map(item => (
          <button key={item} className={brand === item ? 'active' : ''} onClick={() => setBrand(item)}>
            <Icon label="▣" /> {item}
          </button>
        ))}
      </section>

      <section className="stats">
        <div><strong>{rows.length}</strong><span>Sellers {brand}</span></div>
        <div><strong>{activeCount}</strong><span>Con estado activo</span></div>
        <div><strong>{requiredFields.length}</strong><span>Campos principales</span></div>
        <div><strong>{savedAt || '-'}</strong><span>Último guardado local</span></div>
      </section>

      <section className="workspace">
        <aside className="sellerList">
          <div className="searchBox">
            <Icon label="⌕" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar seller, CUIT, mail, provincia..." />
          </div>
          <div className="listCount">{filteredRows.length} resultado(s)</div>
          <div className="listItems">
            {filteredRows.map(({ row, index }) => (
              <button key={`${brand}-${index}`} className={index === selectedIndex ? 'selected' : ''} onClick={() => setSelectedIndex(index)}>
                <Icon label="▤" />
                <span>
                  <strong>{getSellerName(row)}</strong>
                  <small>{row['Razón social'] || 'Sin razón social'} · {normalizeValue(row.Estado) || 'Sin estado'}</small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="detailPanel">
          {selected ? (
            <>
              <div className="detailHeader">
                <div>
                  <p className="eyebrow">{brand}</p>
                  <h2>{getSellerName(selected)}</h2>
                  <p>{selected['Razón social'] || 'Sin razón social'}</p>
                </div>
                <button className="danger" onClick={deleteSeller}><Icon label="×" /> Eliminar</button>
              </div>

              <div className="sectionGrid">
                <Section icon={<Store size={20}/>} title="Datos del seller">
                  <div className="formGrid twoCols">
                    {sellerFields.map(field => <FieldInput key={field} row={selected} field={field} onChange={updateField} />)}
                  </div>
                </Section>

                <Section icon={<Icon label="▸" />} title="Operador logístico">
                  <div className="checkboxGrid">
                    {logisticOperatorFields.map(field => <FieldInput key={field} row={selected} field={field} onChange={updateField} checkbox />)}
                  </div>
                </Section>

                <Section icon={<Icon label="□" />} title="Forma de envío">
                  <div className="formGrid twoCols">
                    <FieldInput row={selected} field="Envío Gratis" onChange={updateField} />
                    <FieldInput row={selected} field="Same Day /NextDay" onChange={updateField} />
                    <FieldInput row={selected} field="Retiro en Sucursal" onChange={updateField} checkbox />
                  </div>
                </Section>

                <Section icon={<Icon label="☑" />} title="Configuración logística">
                  <div className="checkboxGrid compact">
                    {logisticsConfigFields.map(field => <FieldInput key={field} row={selected} field={field} onChange={updateField} checkbox />)}
                  </div>
                </Section>

                <Section icon={<Icon label="⌖" />} title="Datos del depósito">
                  <div className="formGrid twoCols">
                    {depositFields.map(field => <FieldInput key={field} row={selected} field={field} onChange={updateField} />)}
                  </div>
                </Section>

                <Section icon={<Icon label="⌖" />} title="Retiro por sucursal">
                  <FieldInput row={selected} field={branchAddressField} onChange={updateField} textarea />
                </Section>
              </div>

              <div className="saveNote"><Save size={16}/> Los cambios se guardan automáticamente en este navegador. Usá Exportar para descargar el XLSX actualizado.</div>
            </>
          ) : (
            <div className="empty">No hay sellers para mostrar.</div>
          )}
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
