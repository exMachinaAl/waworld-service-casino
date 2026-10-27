import RoundLobby from './RoundLobby.jsx';
import React,{useState} from 'react';
import MultiplayerLobby from './MultiplayerLobby.jsx';
import BlackjackLobby from './BlackjackLobby.jsx';
export default function MultiplayerHub(props){
 const [tab,setTab]=useState('blackjack');
 return <div><div className="mp-game-tabs" role="tablist" aria-label="Pilih permainan multiplayer">
   <button role="tab" aria-selected={tab==='blackjack'} className={tab==='blackjack'?'selected':''} onClick={()=>setTab('blackjack')}>🃏 Blackjack (1–4)</button>
   <button role="tab" aria-selected={tab==='dice'} className={tab==='dice'?'selected':''} onClick={()=>setTab('dice')}>🎲 Dice Duel (2)</button>
   <button role="tab" aria-selected={tab==='roulette'} onClick={()=>setTab('roulette')}>🎯 Roulette</button>
  </div>{tab==='blackjack'?<BlackjackLobby {...props}/>:tab==='roulette'?<RoundLobby kind="roulette" {...props}/>:<MultiplayerLobby {...props}/>}</div>;
}
