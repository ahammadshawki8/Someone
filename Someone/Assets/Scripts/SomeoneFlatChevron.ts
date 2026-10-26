/**
 * SomeoneFlatChevron - builds a flat chevron mesh in the XY plane (normal +Z),
 * pointing along +Y.
 *
 * Owns: geometry only. Sizes are in cm, so the visual using it keeps unit
 * scale. Mitered at the tip (no overlap, so alpha stays even) and cut
 * vertically at the ends. Both windings are emitted.
 *
 * Must not: touch materials, colors or scene objects.
 */
export function buildFlatChevron(width: number, height: number, stroke: number): RenderMesh {
  const mb = new MeshBuilder([
    {name: "position", components: 3},
    {name: "normal", components: 3},
    {name: "texture0", components: 2}
  ])
  mb.topology = MeshTopology.Triangles
  mb.indexType = MeshIndexType.UInt16

  // Inner edge = outer edge shifted down, so the perpendicular stroke is `stroke`.
  const halfW = width / 2
  const halfH = height / 2
  const slope = Math.atan2(height, halfW)
  const drop = stroke / Math.cos(slope)

  const pts = [
    [-halfW, -halfH], // 0 left end, outer
    [0, halfH], // 1 tip, outer
    [halfW, -halfH], // 2 right end, outer
    [-halfW, -halfH - drop], // 3 left end, inner
    [0, halfH - drop], // 4 tip, inner
    [halfW, -halfH - drop] // 5 right end, inner
  ]
  const verts: number[] = []
  for (const p of pts) verts.push(p[0], p[1], 0, 0, 0, 1, (p[0] + halfW) / width, (p[1] + halfH + drop) / (height + drop))
  mb.appendVerticesInterleaved(verts)

  const quads = [
    [0, 1, 4, 3],
    [1, 2, 5, 4]
  ]
  const idx: number[] = []
  for (const q of quads) {
    idx.push(q[0], q[1], q[2], q[0], q[2], q[3]) // one winding
    idx.push(q[0], q[2], q[1], q[0], q[3], q[2]) // and the other
  }
  mb.appendIndices(idx)
  mb.updateMesh()
  return mb.getMesh()
}
