import { SharedMap, SharedString } from 'fluid-framework'

export const schema = {
  initialObjects: {
    cursor: SharedMap,
    description: SharedString,
  },
  dynamicObjectTypes: [
  ]
}

export interface ICursor {
  userId: string
  x: number
  y: number
}
