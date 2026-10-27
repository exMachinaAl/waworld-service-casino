/** European single-zero wheel. Pure display math, no result RNG. */
export const WHEEL_ORDER=Object.freeze([0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26]);
export const RED_NUMBERS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
export const pocketColor=n=>n===0?'green':RED_NUMBERS.has(n)?'red':'black';
export function rotorLandingAngle(number){const index=WHEEL_ORDER.indexOf(number);if(index<0)throw Error('INVALID_WHEEL_RESULT');return -(360/WHEEL_ORDER.length)*index;}
export function radians(deg){return deg*Math.PI/180;}
export function pointAt(cx,cy,r,angle){return [cx+Math.sin(radians(angle))*r,cy-Math.cos(radians(angle))*r];}
export function pocketPath(index,inner=94,outer=136,cx=160,cy=160){
 const step=360/37,a=index*step-step/2,b=index*step+step/2;
 const p1=pointAt(cx,cy,outer,a),p2=pointAt(cx,cy,outer,b),p3=pointAt(cx,cy,inner,b),p4=pointAt(cx,cy,inner,a);
 return `M${p1.join(',')} A${outer},${outer} 0 0 1 ${p2.join(',')} L${p3.join(',')} A${inner},${inner} 0 0 0 ${p4.join(',')} Z`;
}
