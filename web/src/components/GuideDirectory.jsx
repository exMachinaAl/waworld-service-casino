import React,{useEffect,useState} from 'react';
import {ArrowRight,BookOpen,Search,X} from 'lucide-react';
import {GAME_GUIDES,searchGuides} from '../game-guides.mjs';
export default function GuideDirectory({onNavigate,initialCode=null}) {
 const [query,setQuery]=useState('');const [category,setCategory]=useState('all');const [selected,setSelected]=useState(initialCode);
 useEffect(()=>{if(initialCode)setSelected(initialCode)},[initialCode]);
 const matches=searchGuides(query,category);const guide=GAME_GUIDES[selected];
 return <section className="rc3-guide" aria-label="Panduan permainan">
  <div className="view-intro"><span className="eyebrow">GAME RULES · BACA SEBELUM BERMAIN</span><h2>Panduan setiap permainan</h2><p>Pahami alur bermain, syarat bonus, batas taruhan, dan cara melihat hasil. Aturan dan nilai efektif tetap ditentukan server.</p></div>
  <label className="rc3-guide-search"><Search size={18}/><input type="search" placeholder="Cari slot, guci, roulette, lottery…" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Kosongkan pencarian"><X size={16}/></button>}</label>
  <div className="rc3-guide-cats" role="group" aria-label="Kategori panduan">{[['all','Semua'],['slot','Slot'],['arcade','Arcade'],['multiplayer','Multiplayer'],['lottery','Lottery']].map(([v,l])=><button key={v} type="button" className={`btn ${category===v?'primary':'outline'}`} aria-pressed={category===v} onClick={()=>setCategory(v)}>{l}</button>)}</div>
  <div className="rc3-guide-layout"><div className="rc3-guide-list">{matches.length===0&&<div className="panel">Tidak ada panduan yang cocok. Coba kata kunci lain.</div>}{matches.map(([code,item])=><button type="button" key={code} className={`rc3-guide-item ${selected===code?'active':''}`} onClick={()=>setSelected(code)}><span>{code} · {item.category}</span><strong>{item.title}</strong></button>)}</div>
   <div className="panel rc3-guide-detail">{guide?<><span className="eyebrow">{selected} · {guide.category.toUpperCase()}</span><h3>{guide.title}</h3><p>{guide.summary}</p><ol>{guide.steps.map((text,i)=><li key={i}>{text}</li>)}</ol><div className="rc3-guide-tip"><BookOpen size={17}/><span>{guide.tip}</span></div><button type="button" className="btn primary" onClick={()=>onNavigate(guide.category==='multiplayer'?'multiplayer':guide.category==='lottery'?'lottery':guide.category)}><ArrowRight size={16}/> Buka kategori {guide.category}</button></>:<p>Pilih permainan dari daftar untuk membaca panduan.</p>}</div>
  </div></section>
}
