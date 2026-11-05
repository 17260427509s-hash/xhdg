/** Original short wishes. Fixed positions keep re-renders and resizing deterministic. */
const wishes = [
  '愿你眼里总有光', '把日子过成喜欢的模样', '每一岁都有新的热爱', '愿快乐常常来敲门',
  '你值得所有温柔', '愿小小心愿慢慢实现', '喜欢的事都有回响', '新的一岁自在生长',
  '把勇气装进口袋', '愿每次出发都有惊喜', '平凡日子也闪闪发光', '永远有做梦的自由',
  '愿身边总有真心', '今天的你最值得庆祝', '一路有爱也有风景', '愿好事悄悄发生',
  '把温柔留一份给自己', '你有属于自己的星河', '愿生活甜得刚刚好', '慢慢走也能抵达远方',
  '愿每一天都被珍惜', '带着笑意奔向明天', '热爱不必等到以后', '愿你始终喜欢自己',
]
export function openingCards(count: number) {
  return Array.from({ length: count }, (_, index) => {
    // Start at the upper notch, travel around both lobes and the pointed base.
    const angle = Math.PI * 2 * index / count
    const x = 16 * Math.sin(angle) ** 3
    const y = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)
    return { text: wishes[index % wishes.length], x: x / 32, y: (-2.5 - y) / 32,
      tilt: Math.sin(index * 2.31) * 7, color: index % 5,
      startX: (index % 2 ? 1 : -1) * (100 + index % 7 * 16), startY: 60 + index % 6 * 13,
      delay: 1.2 + index / (count - 1) * 4.05 }
  })
}
