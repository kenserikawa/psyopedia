/**
 * Registro de las etiquetas de los puntos.
 *
 * Cada OperationDot publica aquí su elemento y cuánto quiere mostrarse; un
 * único componente (LabelDeclutter) decide después quién sobrevive cuando dos
 * rótulos caen en el mismo sitio. Sin un árbitro central cada etiqueta solo se
 * ve a sí misma, y con la órbita de perfil se amontonan de tres en tres.
 */
export interface LabelEntry {
  el: HTMLDivElement
  /** Opacidad que pide el punto: enfoque de nivel × orientación. */
  opacity: number
  /** Desenfoque por orientación, en píxeles. */
  blur: number
  /** Quién gana ante un solape. El punto bajo el cursor siempre. */
  priority: number
  /** Objetivo del árbitro: 1 si cede ante una vecina con más prioridad. */
  suppressed: number
  /** El valor anterior, interpolado, para que ceder sea un fundido. */
  suppressionT: number
}

const labels = new Map<string, LabelEntry>()

export function registerLabel(id: string, el: HTMLDivElement): LabelEntry {
  const entry: LabelEntry = {
    el,
    opacity: 0,
    blur: 0,
    priority: 0,
    suppressed: 0,
    suppressionT: 0,
  }
  labels.set(id, entry)
  return entry
}

export function unregisterLabel(id: string) {
  labels.delete(id)
}

export function labelEntries(): LabelEntry[] {
  return [...labels.values()]
}
