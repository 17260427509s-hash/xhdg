import { Shape } from 'three'

export function starShape() {
  const shape = new Shape()
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .27 : .6
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  shape.closePath()
  return shape
}

export function heartShape() {
  const shape = new Shape()
  shape.moveTo(0, .23)
  shape.bezierCurveTo(-.12, .65, -.65, .61, -.61, .12)
  shape.bezierCurveTo(-.58, -.2, -.18, -.45, 0, -.6)
  shape.bezierCurveTo(.18, -.45, .58, -.2, .61, .12)
  shape.bezierCurveTo(.65, .61, .12, .65, 0, .23)
  return shape
}
