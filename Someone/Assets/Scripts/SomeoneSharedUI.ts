/**
 * SomeoneSharedUI - shared view helpers for the Someone UI modules.
 *
 * Owns: the type scale (size + weight together), the text factory, the
 * UIKit Button factory (capsule, width-budgeted label), flex helpers, and a
 * small tween helper for slow 300-500 ms fades. No bounces, no pops.
 *
 * Used only by *UI.ts view modules. Must not hold domain state.
 */
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexAlign, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"

// ---- Typography -------------------------------------------------------------
// Text.size is the em-square height: em cm = size / 43.886. These roles are
// tuned for content about 85 cm from the eye (kneeling over the figure).
export const FONT_SIZE_SCALE = 1.0

export type SomeoneTextRole = "Instruction" | "Display" | "Value" | "Body" | "Label" | "Caption" | "Button"

export const TYPE_SCALE: Record<SomeoneTextRole, {size: number; weight: number}> = {
  Instruction: {size: 120, weight: 600}, // about 2.7 cm em, the one big line
  Display: {size: 96, weight: 600}, // replay closing line
  Value: {size: 64, weight: 600}, // clock digits, replay values, rate cue
  Body: {size: 50, weight: 500}, // dispatcher captions
  Label: {size: 44, weight: 500}, // badge, replay labels
  Caption: {size: 38, weight: 500}, // floor
  Button: {size: 50, weight: 600}
}

export function applyTextRole(t: Text, role: SomeoneTextRole, sizeOverride?: number): void {
  const base = sizeOverride !== undefined && sizeOverride > 0 ? sizeOverride : TYPE_SCALE[role].size
  t.size = base * FONT_SIZE_SCALE
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

// ---- Scene helpers -----------------------------------------------------------
export const LAYOUT_Z_LIFT = 0.02
export const BUTTON_LABEL_Z = 0.08

export function makeObj(parent: SceneObject, name: string, pos?: vec3): SceneObject {
  const so = global.scene.createSceneObject(name)
  so.setParent(parent)
  if (pos) so.getTransform().setLocalPosition(pos)
  return so
}

/** A column FlexLayout container. Configured inside onInitialized (race-safe). */
export function makeColumn(
  parent: SceneObject,
  name: string,
  width: number,
  opts: {gap?: number; pad?: number; align?: FlexAlign; justify?: FlexJustify}
): {so: SceneObject; flex: FlexLayout} {
  const so = makeObj(parent, name, new vec3(0, 0, LAYOUT_Z_LIFT))
  const flex = so.createComponent(FlexLayout.getTypeName()) as FlexLayout
  flex.autoDiscoverItemsOnStart = false // items are registered explicitly via addItems
  flex.onInitialized.add(() => {
    flex.width = width
    flex.height = -1
    flex.direction = FlexDirection.Column
    flex.rowGap = opts.gap ?? 0
    const p = opts.pad ?? 0
    flex.paddingTop = p
    flex.paddingBottom = p
    flex.paddingLeft = p
    flex.paddingRight = p
    flex.alignItems = opts.align ?? FlexAlign.Center
    flex.justifyContent = opts.justify ?? FlexJustify.Center
  })
  return {so, flex}
}

/** A row FlexLayout that is itself a fixed-size item of its parent layout. */
export function makeRow(
  parent: SceneObject,
  parentFlex: FlexLayout,
  name: string,
  width: number,
  height: number,
  justify: FlexJustify
): {so: SceneObject; flex: FlexLayout} {
  const so = makeObj(parent, name, new vec3(0, 0, LAYOUT_Z_LIFT))
  const flex = so.createComponent(FlexLayout.getTypeName()) as FlexLayout
  flex.autoDiscoverItemsOnStart = false // items are registered explicitly via addItems
  const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
  item.overrideWidth = width
  item.overrideHeight = height
  item.flexShrink = 0
  flex.onInitialized.add(() => {
    flex.width = width
    flex.height = height
    flex.direction = FlexDirection.Row
    flex.justifyContent = justify
    flex.alignItems = FlexAlign.Center
  })
  parentFlex.addItems([item])
  return {so, flex}
}

/**
 * A text cell registered as a fixed-size flex item. The layout sizes its
 * layoutRect to (width x height); wrap lets long lines break inside it.
 */
export function makeTextItem(
  parent: SceneObject,
  parentFlex: FlexLayout,
  name: string,
  text: string,
  role: SomeoneTextRole,
  width: number,
  height: number,
  opts: {wrap?: boolean; color?: vec4; align?: HorizontalAlignment; sizeOverride?: number}
): Text {
  const so = makeObj(parent, name, new vec3(0, 0, LAYOUT_Z_LIFT))
  const t = so.createComponent("Component.Text") as Text
  t.text = text
  t.depthTest = true
  applyTextRole(t, role, opts.sizeOverride)
  t.horizontalAlignment = opts.align ?? HorizontalAlignment.Center
  t.verticalAlignment = VerticalAlignment.Center
  t.horizontalOverflow = opts.wrap ? HorizontalOverflow.Wrap : HorizontalOverflow.Overflow
  t.verticalOverflow = VerticalOverflow.Overflow
  t.layoutRect = Rect.create(-width / 2, width / 2, -height / 2, height / 2)
  if (opts.color) t.textFill.color = opts.color
  const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
  item.overrideWidth = width
  item.overrideHeight = height
  item.flexShrink = 0
  parentFlex.addItems([item])
  return t
}

/**
 * A UIKit capsule Button with a width-budgeted raw Text label lifted off the
 * face. Registered as a fixed-size flex item. Returns the Button and label.
 */
export function makeCapsuleButton(
  parent: SceneObject,
  parentFlex: FlexLayout,
  name: string,
  label: string,
  width: number,
  height: number,
  labelColor: vec4,
  labelSize?: number
): {so: SceneObject; button: Button; label: Text} {
  const so = makeObj(parent, name, new vec3(0, 0, LAYOUT_Z_LIFT))
  const button = so.createComponent(Button.getTypeName()) as Button
  button.setVariant({theme: "SnapOS2", shape: "Capsule", style: "PrimaryNeutral"})
  button.size = new vec3(width, height, 1) // BEFORE init
  const labelSo = makeObj(so, name + "Label", new vec3(0, 0, BUTTON_LABEL_Z))
  const t = labelSo.createComponent("Component.Text") as Text
  t.text = label
  t.depthTest = true
  applyTextRole(t, "Button", labelSize)
  t.horizontalAlignment = HorizontalAlignment.Center
  t.verticalAlignment = VerticalAlignment.Center
  t.horizontalOverflow = HorizontalOverflow.Overflow
  t.verticalOverflow = VerticalOverflow.Overflow
  const lw = width - 0.5
  t.layoutRect = Rect.create(-lw / 2, lw / 2, -height / 2, height / 2)
  t.textFill.color = labelColor
  const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
  item.overrideWidth = width
  item.overrideHeight = height
  item.flexShrink = 0
  parentFlex.addItems([item])
  return {so, button, label: t}
}

export {SomeoneTweens, setTextAlpha, lerp} from "./SomeoneTween"
