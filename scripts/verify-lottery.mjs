import {createHash} from 'node:crypto';import {lotteryNumber} from '../src/lottery.mjs';
const [id,seed,digits,commitment,result]=process.argv.slice(2);
if(!/^[a-f0-9]{32}$/.test(id||'')||!/^[a-f0-9]{64}$/.test(seed||'')||!Number.isInteger(Number(digits))||Number(digits)<4||Number(digits)>32){console.error('Usage: node scripts/verify-lottery.mjs ROUND_ID SEED DIGITS COMMITMENT RESULT');process.exit(1)}
const verified=createHash('sha256').update(seed).digest('hex')===commitment&&lotteryNumber(seed,id,Number(digits))===result;console.log(JSON.stringify({verified,result:lotteryNumber(seed,id,Number(digits))}));if(!verified)process.exitCode=1;
