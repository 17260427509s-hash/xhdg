/** All three ellipses clear the largest assembled cake in world space.
 * Different inclinations create front/back occlusion rather than crossing the icing. */
export const orbitPaths = [
  {r:2.78,z:2.16,y:.18,rotation:[.24,0,.12] as [number,number,number],speed:.074,color:'#decdf2'},
  {r:2.72,z:2.25,y:.53,rotation:[.48,.1,.27] as [number,number,number],speed:-.052,color:'#f1d9b1'},
  {r:2.69,z:2.13,y:-.48,rotation:[-.27,-.12,-.22] as [number,number,number],speed:.043,color:'#bbd5ed'},
]
