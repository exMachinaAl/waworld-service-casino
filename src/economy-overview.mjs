// Read-only treasury metrics and deterministic recommendations. No access to RNG or VCUR.
export function economyOverview(db){
 const accounts=db.prepare('SELECT kind,SUM(balance) as amount,COUNT(*) count FROM accounts GROUP BY kind').all();
 const balance=kind=>accounts.find(x=>x.kind===kind)?.amount??0;
 const total=accounts.reduce((s,x)=>s+x.amount,0);
 const treasury=db.prepare("SELECT balance FROM accounts WHERE id='wa-treasury'").get()?.balance??0;
 const admin_test_pool=db.prepare("SELECT balance FROM accounts WHERE id='wae-admin-test-pool'").get()?.balance??0;
 const players=balance('PLAYER'),faucet=balance('FAUCET');
 const utcDay=new Date().toISOString().slice(0,10);
 const draw=db.prepare('SELECT COUNT(*) entries,COALESCE(SUM(reward),0) rewards FROM number_draw_plays WHERE day_utc=?').get(utcDay);
 const health=treasury<50000?'WARNING_RESERVE_LOW':treasury<150000?'WATCH':'STABLE';
 const reserved=db.prepare('SELECT COALESCE(SUM(amount),0) n FROM treasury_reserves').get().n;
 return {reserved,available:treasury-reserved,mode:'READ_ONLY',currency:'ACR',supply:{total,treasury,admin_test_pool,players,faucet},number_draw_today:draw,status:health,
 recommendations:[
 {type:'TRANSPARENCY',message:'Periksa hasil treasury dan ledger tiap hari; jangan mengubah RNG ketika ada tren rugi.'},
 {type:health==='STABLE'?'NORMAL':'BUDGET_REVIEW',message:health==='STABLE'?'Cadangan sesuai ambang contoh; pertahankan plafon hadiah terpublikasi.':'Evaluasi anggaran ronde BARU; jangan menarik saldo atau mengurangi hadiah yang sudah sah.'}
 ],llm_applied:false,vcur_bridge_enabled:false};
}
