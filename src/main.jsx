
import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { initialData, STATUS_OPTIONS } from './data.js';
import './styles.css';

const OPS = ['Southpost','Andreani','Rapiboy','HOP','PICKIT','Flete Propio','URBANO'];
const SHIPPING = ['Envío Gratis','Same Day /NextDay','Retiro en Sucursal'];
const SELLER_FIELDS = ['Estado','Responsable','Razón social','Alias (Nombre de Fantasía)','CUIT (vinculado en el contrato)','Mail (usuario) Módulo logístico','Contraseña Módulo logístico'];
const CONFIG_FIELDS = ['Activo para operar','Depósito OK'];
const DEPOT_FIELDS = ['Provincia','Localidad'];
const STORAGE_KEY = 'sellers-tiendas-data-v2';

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function loadInitial(){
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return clone(initialData);
}
function saveLocal(data){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {} }

function ensureXLSX(){
  return new Promise((resolve, reject) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error('No se pudo cargar el exportador XLSX'));
    document.head.appendChild(script);
  });
}

function flattenSeller(s){
  return {
    Estado: s.datosSeller?.Estado || '',
    Responsable: s.datosSeller?.Responsable || '',
    'Razón social': s.datosSeller?.['Razón social'] || '',
    'Alias (Nombre de Fantasía)': s.datosSeller?.['Alias (Nombre de Fantasía)'] || '',
    'CUIT (vinculado en el contrato)': s.datosSeller?.['CUIT (vinculado en el contrato)'] || '',
    'Mail (usuario) Módulo logístico': s.datosSeller?.['Mail (usuario) Módulo logístico'] || '',
    'Contraseña Módulo logístico': s.datosSeller?.['Contraseña Módulo logístico'] || '',
    Southpost: s.operadorLogistico?.Southpost ? 'SI' : 'NO',
    Andreani: s.operadorLogistico?.Andreani ? 'SI' : 'NO',
    Rapiboy: s.operadorLogistico?.Rapiboy ? 'SI' : 'NO',
    HOP: s.operadorLogistico?.HOP ? 'SI' : 'NO',
    PICKIT: s.operadorLogistico?.PICKIT ? 'SI' : 'NO',
    'Flete Propio': s.operadorLogistico?.['Flete Propio'] ? 'SI' : 'NO',
    URBANO: s.operadorLogistico?.URBANO ? 'SI' : 'NO',
    'Envío Gratis': s.formaEnvio?.['Envío Gratis'] ? 'SI' : 'NO',
    'Detalle Envío Gratis': s.detalleEnvioGratis || '',
    'Same Day /NextDay': s.formaEnvio?.['Same Day /NextDay'] ? 'SI' : 'NO',
    'Retiro en Sucursal': s.formaEnvio?.['Retiro en Sucursal'] ? 'SI' : 'NO',
    'Activo para operar': s.configuracionLogistica?.['Activo para operar'] ? 'SI' : 'NO',
    'Depósito OK': s.configuracionLogistica?.['Depósito OK'] ? 'SI' : 'NO',
    Provincia: s.datosDeposito?.Provincia || '',
    Localidad: s.datosDeposito?.Localidad || '',
    'Direcciones retiro por sucursal': s.retiroPorSucursal?.Direcciones || '',
    Observaciones: s.observaciones || ''
  };
}

function App(){
  const [data, setDataState] = useState(loadInitial);
  const shops = Object.keys(data);
  const [shop, setShop] = useState(shops[0] || 'BNA');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(data[shop]?.[0]?.id || '');
  const [notice, setNotice] = useState('');

  function setData(next){ setDataState(next); saveLocal(next); }
  const sellers = data[shop] || [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sellers;
    return sellers.filter(s => JSON.stringify(s).toLowerCase().includes(q));
  }, [sellers, query]);
  const selected = sellers.find(s => s.id === selectedId) || filtered[0] || sellers[0];

  function patchSeller(path, value){
    if (!selected) return;
    const next = clone(data);
    const arr = next[shop];
    const i = arr.findIndex(s => s.id === selected.id);
    let target = arr[i];
    for (let p = 0; p < path.length - 1; p++) target = target[path[p]];
    target[path[path.length - 1]] = value;
    setData(next);
  }
  function addSeller(){
    const next = clone(data);
    const id = `${shop}-${Date.now()}`;
    const blank = { id, datosSeller:{ Estado:'En Proceso', Responsable:'', 'Razón social':'', 'Alias (Nombre de Fantasía)':'', 'CUIT (vinculado en el contrato)':'', 'Mail (usuario) Módulo logístico':'', 'Contraseña Módulo logístico':'' }, operadorLogistico:Object.fromEntries(OPS.map(o=>[o,false])), formaEnvio:Object.fromEntries(SHIPPING.map(o=>[o,false])), detalleEnvioGratis:'', configuracionLogistica:{'Activo para operar':false,'Depósito OK':false}, datosDeposito:{Provincia:'',Localidad:''}, retiroPorSucursal:{Direcciones:''}, observaciones:'' };
    next[shop].unshift(blank); setData(next); setSelectedId(id);
  }
  function deleteSeller(){
    if (!selected || !confirm('¿Eliminar este seller?')) return;
    const next = clone(data); next[shop] = next[shop].filter(s => s.id !== selected.id); setData(next); setSelectedId(next[shop][0]?.id || '');
  }
  async function exportXLSX(){
    try {
      const XLSX = await ensureXLSX();
      const wb = XLSX.utils.book_new();
      Object.entries(data).forEach(([name, rows]) => {
        const flat = rows.map(flattenSeller);
        const ws = XLSX.utils.json_to_sheet(flat);
        XLSX.utils.book_append_sheet(wb, ws, name.slice(0,31));
      });
      XLSX.writeFile(wb, `sellers-tiendas-${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (e) { alert(e.message || 'Error exportando XLSX'); }
  }
  function resetData(){ if(confirm('¿Restaurar datos originales del Excel? Se pierden cambios guardados en este navegador.')) { localStorage.removeItem(STORAGE_KEY); const fresh = clone(initialData); setDataState(fresh); setShop(Object.keys(fresh)[0]); setSelectedId(fresh[Object.keys(fresh)[0]]?.[0]?.id || ''); } }

  return <div className="app">
    <header className="topbar">
      <div><h1>Gestión de sellers</h1><p>Datos reales parseados por solapa/tienda. Todo es editable y se guarda en este navegador.</p></div>
      <div className="actions"><button onClick={exportXLSX}>Exportar XLSX</button><button className="ghost" onClick={resetData}>Restaurar Excel</button></div>
    </header>
    <nav className="tabs">{shops.map(name => <button key={name} className={name===shop?'active':''} onClick={()=>{setShop(name); setSelectedId(data[name]?.[0]?.id || ''); setQuery('');}}>{name}<span>{data[name]?.length || 0}</span></button>)}</nav>
    <main className="layout">
      <aside className="sidebar">
        <div className="side-head"><strong>{shop}</strong><button onClick={addSeller}>+ Seller</button></div>
        <input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar seller, CUIT, mail..." />
        <div className="seller-list">{filtered.map(s => <button key={s.id} onClick={()=>setSelectedId(s.id)} className={selected?.id===s.id?'selected':''}><b>{s.datosSeller?.['Alias (Nombre de Fantasía)'] || 'Sin alias'}</b><small>{s.datosSeller?.['Razón social'] || ''}</small><em>{s.datosSeller?.Estado || ''}</em></button>)}</div>
      </aside>
      <section className="panel">{selected ? <SellerForm seller={selected} patch={patchSeller} deleteSeller={deleteSeller}/> : <div className="empty">No hay sellers para mostrar.</div>}</section>
    </main>
  </div>
}

function TextInput({label,value,onChange,type='text'}){ return <label className="field"><span>{label}</span><input type={type} value={value ?? ''} onChange={e=>onChange(e.target.value)} /></label> }
function Check({label,checked,onChange}){ return <label className="check"><input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)} /><span>{label}</span></label> }
function Section({title,children}){ return <section className="card"><h2>{title}</h2><div className="grid">{children}</div></section> }
function SellerForm({seller, patch, deleteSeller}){
  return <>
    <div className="form-title"><div><h2>{seller.datosSeller?.['Alias (Nombre de Fantasía)'] || 'Seller'}</h2><p>{seller.datosSeller?.['Razón social']}</p></div><button className="danger" onClick={deleteSeller}>Eliminar</button></div>
    <Section title="Datos del seller">
      <label className="field"><span>Estado</span><select value={seller.datosSeller?.Estado || 'En Proceso'} onChange={e=>patch(['datosSeller','Estado'], e.target.value)}>{STATUS_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}</select></label>
      {SELLER_FIELDS.filter(f=>f!=='Estado').map(f => <TextInput key={f} label={f} value={seller.datosSeller?.[f]} onChange={v=>patch(['datosSeller',f], v)} />)}
    </Section>
    <Section title="Operador logístico">{OPS.map(op => <Check key={op} label={op} checked={seller.operadorLogistico?.[op]} onChange={v=>patch(['operadorLogistico',op], v)} />)}</Section>
    <Section title="Forma de envío">
      {SHIPPING.map(f => <Check key={f} label={f} checked={seller.formaEnvio?.[f]} onChange={v=>patch(['formaEnvio',f], v)} />)}
      <TextInput label="Detalle Envío Gratis" value={seller.detalleEnvioGratis} onChange={v=>patch(['detalleEnvioGratis'], v)} />
    </Section>
    <Section title="Configuración logística">{CONFIG_FIELDS.map(f => <Check key={f} label={f} checked={seller.configuracionLogistica?.[f]} onChange={v=>patch(['configuracionLogistica',f], v)} />)}</Section>
    <Section title="Datos del depósito">{DEPOT_FIELDS.map(f => <TextInput key={f} label={f} value={seller.datosDeposito?.[f]} onChange={v=>patch(['datosDeposito',f], v)} />)}</Section>
    <section className="card"><h2>Retiro por sucursal</h2><label className="field full"><span>Direcciones</span><textarea value={seller.retiroPorSucursal?.Direcciones || ''} onChange={e=>patch(['retiroPorSucursal','Direcciones'], e.target.value)} placeholder="Cargar o editar direcciones de retiro por sucursal" /></label></section>
    <section className="card"><h2>Observaciones</h2><label className="field full"><textarea value={seller.observaciones || ''} onChange={e=>patch(['observaciones'], e.target.value)} /></label></section>
  </>
}

createRoot(document.getElementById('root')).render(<App />);
