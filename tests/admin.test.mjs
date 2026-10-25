import test from 'node:test';
import assert from 'node:assert/strict';
import {openDb,transaction,ensurePlayer,wallet,checkLedger} from '../src/db.mjs';
import {setupAdminSchema,createAdmin,adminLogin,adminSession,adminLogout,adminPlayers,adminDashboard,adminAdjust} from '../src/admin.mjs';
const req=(player,operation,amount,request_id='ab123456-1234-1234-1234-123456789abc',reason='Uji admin ACR')=>({player_id:player,operation,amount,request_id,reason});
function fixture(){const db=openDb();setupAdminSchema(db);const id=transaction(db,()=>ensurePlayer(db,'local-demo','demo'));const admin=createAdmin(db,'owner','veryStrongPw1212');return {db,id,admin};}
test('admin created with password hash; invalid login and demo player cannot become admin',()=>{
 const {db,id}=fixture();try{
  assert.throws(()=>adminLogin(db,'owner','wrong'),e=>e.status===401);
  assert.throws(()=>adminLogin(db,'guest','wrong'),e=>e.status===401);
  const out=adminLogin(db,'OWNER','veryStrongPw1212');const active=adminSession(db,out.secret);
  assert.equal(active.username,'owner');assert.equal(active.role,'ADMIN');assert.equal(adminSession(db,'not-a-secret'),null);
  adminLogout(db,active);assert.equal(adminSession(db,out.secret),null);
  assert.ok(!adminSession(db,id));
 }finally{db.close();}
});
test('admin ADD and DEDUCT use distinct test pool, audit and balanced ledger',()=>{
 const {db,id,admin}=fixture();try{
  const before=adminDashboard(db);assert.equal(wallet(db,id),500);
  const added=adminAdjust(db,admin,req(id,'ADD',500));assert.equal(added.balance,1000);
  assert.equal(adminDashboard(db).pool_acr,before.pool_acr-500);
  assert.equal(adminPlayers(db,'local-demo')[0].balance,1000);
  const deducted=adminAdjust(db,admin,req(id,'DEDUCT',300,'bbbbbbbb-1234-1234-1234-123456789abc'));
  assert.equal(deducted.balance,700);assert.equal(adminDashboard(db).pool_acr,before.pool_acr-200);
  assert.deepEqual(checkLedger(db),{imbalanced:[],playerBalancesMismatched:[]});
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM admin_adjustments').get().n,2);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit WHERE event='admin.wallet_adjusted'").get().n,2);
 }finally{db.close()}
});
test('admin duplicate request is idempotent; mismatching body is rejected',()=>{
 const {db,id,admin}=fixture();try{
  const r=req(id,'ADD',200);
  assert.equal(adminAdjust(db,admin,r).reused,false);
  assert.equal(adminAdjust(db,admin,r).reused,true);
  assert.throws(()=>adminAdjust(db,admin,{...r,amount:300}),e=>e.status===409);
  assert.equal(wallet(db,id),700);
 }finally{db.close()}
});
test('admin enforces per-action cap, no overdraft, no unknown player, daily quota',()=>{
 const {db,id,admin}=fixture();try{
  assert.throws(()=>adminAdjust(db,admin,req(id,'ADD',50001)),e=>e.status===400);
  assert.throws(()=>adminAdjust(db,admin,req(id,'DEDUCT',501,'12345678-1234-1234-1234-123456789abc')),e=>e.status===409);
  assert.throws(()=>adminAdjust(db,admin,req('a'.repeat(32),'ADD',2)),e=>e.status===404);
  for(let i=0;i<4;i++)adminAdjust(db,admin,req(id,'ADD',50000,`12345678-1234-1234-1234-${String(i).padStart(12,'0')}`));
  assert.equal(adminDashboard(db).daily_grants,200000);
  assert.throws(()=>adminAdjust(db,admin,req(id,'ADD',1,'12345678-1234-1234-1234-000000000099')),e=>e.status===409);
  assert.equal(wallet(db,id),200500);
  assert.deepEqual(checkLedger(db),{imbalanced:[],playerBalancesMismatched:[]});
 }finally{db.close()}
});
