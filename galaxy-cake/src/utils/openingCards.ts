/** Original short wishes, in a deterministic queue on the same heart path. */
const wishes = [
  '愿你眼里总有光', '日子皆是你所爱', '每岁都有新热爱', '愿快乐常来敲门',
  '你值得所有温柔', '愿心愿慢慢实现', '喜欢的事有回响', '新岁自在生长',
  '把勇气装进口袋', '愿出发总有惊喜', '平凡也闪闪发光', '永远有做梦自由',
  '愿身边总有真心', '今天为你庆祝', '一路有爱有风景', '愿好事悄悄发生',
  '留份温柔给自己', '你有自己的星河', '愿生活甜得刚好', '慢走也抵达远方',
  '愿每一天都被珍惜', '带着笑意奔向明天', '热爱不必等到以后', '愿你始终喜欢自己',
]
export function openingCards(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    text: wishes[index % wishes.length], offset: index / count,
    tilt: Math.sin(index * 2.31) * 4, color: index % 5,
  }))
}

export interface HeartPoint { x: number; y: number }
/** Constant travel speed in actual CSS pixels, including non-square phone paths.
 * Built on resize only. Sampling reuses the caller's point and allocates nothing. */
export function createHeartPath(width: number, height: number) {
  const steps = 1024, xs = new Float32Array(steps + 1), ys = new Float32Array(steps + 1), lengths = new Float32Array(steps + 1)
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI * 2 * i / steps
    // Round the two cusps enough for real rectangular cards to follow the turn.
    xs[i] = -(16*Math.sin(a)**3+32*Math.sin(a))/96*width
    ys[i] = (-2.5 - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))) / 32 * height
    if (i) lengths[i] = lengths[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1])
  }
  return { totalLength:lengths[steps],sample(progress: number, out: HeartPoint) {
    const distance = Math.max(0, Math.min(1, progress)) * lengths[steps]
    let low = 0, high = steps
    while (low + 1 < high) { const mid = (low + high) >>> 1; if (lengths[mid] < distance) low = mid; else high = mid }
    const blend = (distance - lengths[low]) / Math.max(.0001, lengths[high] - lengths[low])
    out.x = xs[low] + (xs[high] - xs[low]) * blend
    out.y = ys[low] + (ys[high] - ys[low]) * blend
  } }
}

/** Size and spacing are solved together, including the notch and moving queue.
 * Only runs on resize. A complete loop is the worst case for visible subsets. */
export function openingLayout(width:number,height:number,mobile:boolean) {
  const tilt=4*Math.PI/180,cardHeight=mobile?40:52,maxWidth=mobile?54:96,minWidth=mobile?50:72
  let chosen={width,height,cardWidth:minWidth,cardHeight,count:20,maxOverlap:1}
  for(let cardWidth=maxWidth;cardWidth>=minWidth;cardWidth-=2){
    const boundW=cardWidth*Math.cos(tilt)+cardHeight*Math.sin(tilt),boundH=cardHeight*Math.cos(tilt)+cardWidth*Math.sin(tilt)
    const path=createHeartPath(Math.max(1,width-boundW-4),Math.max(1,height-boundH-4))
    const maximum=Math.min(mobile?32:48,Math.max(20,Math.floor(path.totalLength/(cardWidth*1.1))))
    for(let count=maximum;count>=20;count--){
      let maxOverlap=0
      const cards=openingCards(count),points=cards.map(()=>({x:0,y:0,w:0,h:0}))
      for(let step=0;step<40;step++){
        points.forEach((p,i)=>{path.sample((i+step/40)/count,p);const a=cards[i].tilt*Math.PI/180;p.w=Math.abs(cardWidth*Math.cos(a))+Math.abs(cardHeight*Math.sin(a));p.h=Math.abs(cardHeight*Math.cos(a))+Math.abs(cardWidth*Math.sin(a))})
        for(let i=0;i<count;i++)for(let j=i+1;j<count;j++){
          const a=points[i],b=points[j],overlap=Math.max(0,Math.min(a.x+a.w/2,b.x+b.w/2)-Math.max(a.x-a.w/2,b.x-b.w/2))*Math.max(0,Math.min(a.y+a.h/2,b.y+b.h/2)-Math.max(a.y-a.h/2,b.y-b.h/2))/(cardWidth*cardHeight)
          maxOverlap=Math.max(maxOverlap,overlap)
        }
      }
      chosen={width,height,cardWidth,cardHeight,count,maxOverlap}
      if(maxOverlap<.2)return chosen
    }
  }
  return chosen
}

/** Uniform motion, with continuous deceleration over the last 10% of time. */
export function convoyEase(t: number) {
  if (t <= .9) return t / .95
  const end = (t - .9) / .1
  return (.9 + .1 * (end - end * end * .5)) / .95
}
