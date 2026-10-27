import React,{useEffect,useState} from 'react';
import {api} from '../api.js';
export default function StakeInput({game,value,onChange,disabled=false,snapshot}){
 const [live,setLive]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let alive=true;api('GET',`/api/v1/policies?game_code=${encodeURIComponent(game)}`).then(p=>{if(alive){setLive(p);setError('')}}).catch(e=>alive&&setError(e.message));return()=>{alive=false}},[game]);
 const p=snapshot||live;
 if(!p)return <p role="status">{error||'Memuat kebijakan taruhan…'}</p>;
 return <div className="rc-stake"><label>Taruhan ACR · {p.min}–{p.max}<input aria-label="Taruhan ACR" type="number" min={p.min} max={p.max} step="1" value={value} onChange={e=>onChange(e.target.value===''?'':Number(e.target.value))} disabled={disabled}/></label><div className="mp-bets">{p.presets.filter(n=>n>=p.min&&n<=p.max).map(n=><button type="button" key={n} disabled={disabled} onClick={()=>onChange(n)} className={value===n?'selected':''}>{n}</button>)}</div>{(!Number.isInteger(value)||value<p.min||value>p.max)&&<small role="alert">Masukkan bilangan bulat antara {p.min} dan {p.max}.</small>}</div>;
}
