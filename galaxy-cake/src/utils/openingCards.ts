/** Original short wishes, in a deterministic queue on the same heart path. */
const wishes = [
  '愿你眼里总有光', '把日子过成喜欢的模样', '每一岁都有新的热爱', '愿快乐常常来敲门',
  '你值得所有温柔', '愿小小心愿慢慢实现', '喜欢的事都有回响', '新的一岁自在生长',
  '把勇气装进口袋', '愿每次出发都有惊喜', '平凡日子也闪闪发光', '永远有做梦的自由',
  '愿身边总有真心', '今天的你最值得庆祝', '一路有爱也有风景', '愿好事悄悄发生',
  '把温柔留一份给自己', '你有属于自己的星河', '愿生活甜得刚刚好', '慢慢走也能抵达远方',
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
    xs[i] = -16 * Math.sin(a) ** 3 / 32 * width
    ys[i] = (-2.5 - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))) / 32 * height
    if (i) lengths[i] = lengths[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1])
  }
  return { sample(progress: number, out: HeartPoint) {
    const distance = Math.max(0, Math.min(1, progress)) * lengths[steps]
    let low = 0, high = steps
    while (low + 1 < high) { const mid = (low + high) >>> 1; if (lengths[mid] < distance) low = mid; else high = mid }
    const blend = (distance - lengths[low]) / Math.max(.0001, lengths[high] - lengths[low])
    out.x = xs[low] + (xs[high] - xs[low]) * blend
    out.y = ys[low] + (ys[high] - ys[low]) * blend
  } }
}

/** Uniform motion, with continuous deceleration over the last 10% of time. */
export function convoyEase(t: number) {
  if (t <= .9) return t / .95
  const end = (t - .9) / .1
  return (.9 + .1 * (end - end * end * .5)) / .95
}
