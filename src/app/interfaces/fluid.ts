import { SharedMap, SharedString } from 'fluid-framework'

export const schema = {
  initialObjects: {
    cursor: SharedMap,
    description: SharedMap,
  },
  dynamicObjectTypes: [
  ]
}

export interface ICursor {
  userId: string
  x: number
  y: number
}

export interface IDelta {
  userId: string
  delta: any
}
