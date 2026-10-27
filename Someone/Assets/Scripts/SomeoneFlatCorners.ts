/**
 * SomeoneFlatCorners - builds four L-shaped viewfinder corners in the XY
 * plane (normal +Z), framing a width x height rectangle centered on the
 * origin.
 *
 * Owns: geometry only. Sizes are in cm. Both windings are emitted.
 * Must not: touch materials, colors or scene objects.
 */
export function buildFlatCorners(width: number, height: number, arm: number, stroke: number): RenderMesh {
  const mb = new MeshBuilder([
    {name: "position", components: 3},
    {name: "normal", components: 3},
    {name: "texture0", components: 2}
  ])
  mb.topology = MeshTopology.Triangles
  mb.indexType = MeshIndexType.UInt16

  const verts: number[] = []
  const idx: number[] = []
  const quad = (x0: number, y0: number, x1: number, y1: number) => {
    const base = verts.length / 8
    for (const [x, y] of [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1]
    ]) {
      verts.push(x, y, 0, 0, 0, 1, 0, 0)
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3) // one winding
    idx.push(base, base + 2, base + 1, base, base + 3, base + 2) // and the other
  }

  const hw = width / 2
  const hh = height / 2
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const cx = sx * hw
      const cy = sy * hh
      // Horizontal arm, then the vertical arm (without overlapping the corner).
      quad(Math.min(cx, cx - sx * arm), cy - stroke / 2, Math.max(cx, cx - sx * arm), cy + stroke / 2)
      const yIn = cy - sy * stroke / 2
      const yEnd = cy - sy * arm
      quad(cx - stroke / 2, Math.min(yIn, yEnd), cx + stroke / 2, Math.max(yIn, yEnd))
    }
  }
  mb.appendVerticesInterleaved(verts)
  mb.appendIndices(idx)
  mb.updateMesh()
  return mb.getMesh()
}
