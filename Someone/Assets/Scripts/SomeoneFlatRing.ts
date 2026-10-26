/**
 * SomeoneFlatRing - builds a flat annulus mesh in the XZ plane (normal +Y).
 *
 * Owns: geometry only. Sizes are in cm, so the visual using it keeps unit
 * scale. Both windings are emitted, so the ring reads from above and below
 * whatever the material's cull mode.
 *
 * Must not: touch materials, colors or scene objects.
 */
export function buildFlatRing(innerRadius: number, outerRadius: number, segments: number = 96): RenderMesh {
  const mb = new MeshBuilder([
    {name: "position", components: 3},
    {name: "normal", components: 3},
    {name: "texture0", components: 2}
  ])
  mb.topology = MeshTopology.Triangles
  mb.indexType = MeshIndexType.UInt16

  const verts: number[] = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    const u = i / segments
    verts.push(c * innerRadius, 0, s * innerRadius, 0, 1, 0, u, 0)
    verts.push(c * outerRadius, 0, s * outerRadius, 0, 1, 0, u, 1)
  }
  mb.appendVerticesInterleaved(verts)

  const idx: number[] = []
  for (let i = 0; i < segments; i++) {
    const i0 = i * 2
    const o0 = i0 + 1
    const i1 = i0 + 2
    const o1 = i0 + 3
    idx.push(i0, o0, i1, i1, o0, o1) // one winding
    idx.push(i0, i1, o0, i1, o1, o0) // and the other
  }
  mb.appendIndices(idx)
  mb.updateMesh()
  return mb.getMesh()
}
