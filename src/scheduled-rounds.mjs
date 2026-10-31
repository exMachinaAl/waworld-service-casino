import {sweepBlackjackTimeouts} from './blackjack-tables.mjs';
import {sweepLottery} from './lottery.mjs';
import {sweepRoulette} from './roulette-rounds.mjs';

// Run every game even when another game needs operator attention.
export function sweepScheduledRounds(db){
 const failures=[];
 for(const [name,sweep] of [['blackjack',sweepBlackjackTimeouts],['lottery',sweepLottery],['roulette',sweepRoulette]]){
  try{sweep(db);}catch(error){failures.push(new Error(`${name} scheduler failed`,{cause:error}));}
 }
 if(failures.length)throw new AggregateError(failures,'Scheduled round processing failed');
}
