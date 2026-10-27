/** Derive public winning payline highlights; never compute payout on the client. */
export function normalizeWins(last,rows,columns){
 const raw=last?.lines??last?.matches??[];
 if(!Array.isArray(raw))return [];
 return raw.filter(x=>Number.isInteger(x.row)&&x.row>=1&&x.row<=rows && Number.isInteger(x.count??columns)&& (x.count??columns)>=3&&(x.count??columns)<=columns).map(x=>({row:x.row,start:x.start??(x.direction==='right'?columns-(x.count??columns)+1:1),direction:x.direction??'left',count:x.count??columns,symbol:String(x.symbol??''),payout:Number(x.payout??0)}));
}
export function scatterCells(grid,symbol='✨'){
 if(!Array.isArray(grid))return [];
 const cells=[];
 for(let r=0;r<grid.length;r++)for(let c=0;c<(grid[r]?.length??0);c++)if(grid[r][c]===symbol)cells.push([r,c]);
 return cells;
}
