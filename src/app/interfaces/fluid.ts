import { SharedMap } from 'fluid-framework'

export const schema = {
  initialObjects: {
    cursors: SharedMap,
    delta: SharedMap,
    description: SharedMap,
  },
  dynamicObjectTypes: [SharedMap]
}

export interface ICursor {
  userId: string
  color: string
  x: number
  y: number
}

export interface IDelta {
  userId: string
  delta: any
}
