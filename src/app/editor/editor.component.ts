import { AfterViewInit, Component, ViewChild, ViewEncapsulation } from '@angular/core'
import { AzureClient, AzureContainerServices, AzureMember } from '@fluidframework/azure-client'
import { ICursor, schema } from '../interfaces/fluid'
import { IFluidContainer, IServiceAudience, SequenceDeltaEvent, SharedMap, SharedString } from 'fluid-framework'
import { AzureFluidRelayService } from '../services/azure-fluid-relay.service'
import { Editor } from 'primeng/editor'
import { TinyliciousClient } from '@fluidframework/tinylicious-client'

@Component({
  selector: 'app-collaborative-text-area',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.sass'],
  encapsulation: ViewEncapsulation.None,
})

export class CollaborativeTextAreaComponent implements AfterViewInit {
  @ViewChild('editor') editorEl!: Editor

  editor!: any
  description: string = ''
  selectionEnd: number = 0
  selectionStart: number = 0

  cursor?: ICursor
  cursors: ICursor[] = []
  userId?: string

  client!: AzureClient
  fluidContainer!: { container: IFluidContainer; services: AzureContainerServices }
  sharedDescription!: SharedString
  sharedCursor!: SharedMap
  schema = schema
  audience!: IServiceAudience<AzureMember<any>>

  constructor(
    public azureClient: AzureFluidRelayService,
    // public readonly globalStorage: GlobalStorageService,
  ){}

  async ngAfterViewInit(): Promise<void> {
    // this.client = this.azureClient.getClient()
    // this.fluidContainer = await this.client.createContainer(this.schema); const id = await this.fluidContainer.container.attach(); console.log(id)
    // this.fluidContainer = await this.client.getContainer('639cb7a0-ba19-42d8-9947-f2f22f779ce0', this.schema)

    const client = new TinyliciousClient()
    // this.fluidContainer = await client.createContainer(this.schema); const id = await this.fluidContainer.container.attach(); console.log(id)
    this.fluidContainer = await client.getContainer('f3673e9a-cfbb-4a31-9856-877f81ebd525', this.schema)

    this.sharedDescription = this.fluidContainer.container.initialObjects.description as SharedString
    this.sharedCursor = this.fluidContainer.container.initialObjects.cursor as SharedMap
    this.audience = this.fluidContainer.services.audience

    // Editor initialization
    this.editor = this.editorEl.quill
    this.editor.container.style.whiteSpace = 'pre-line'
    // this.setAttributes(null, this.sharedDescription)

    this.description = this.sharedDescription.getText()

    this.syncData()

    this.setAttributes(null, this.sharedDescription)
  }

  syncData(): void {
    this.sharedDescription.on('sequenceDelta', (event: SequenceDeltaEvent) => {
      console.log('sequenceDelta')
      console.log(event)

      // If the event is our own then just insert the text
      if (event.isLocal) {
        this.description = this.sharedDescription.getText()
        return
      }

      // Update caret position
      this.setCaretPosition(event.first, event.last, event.opArgs.op)

      // Update the text
      this.description = this.sharedDescription.getText()

      // Update attributes
      this.setAttributes(event.opArgs.op, null)
      this.setAttributes(null, this.sharedDescription)

      // this.description = ''

      console.log('')
    })

    this.sharedCursor.on('valueChanged', () => {
      // console.log('valueChanged')

      if (this.userId !== this.sharedCursor.get('cursor').userId){
        this.cursor = this.sharedCursor.get('cursor')
      }

    })

    this.audience.on('membersChanged', () => {
      // console.log('changed')
      this.userId = this.audience.getMyself()?.userId
    })

  }

  handleMouseMove(event: any): void {
    this.sharedCursor.set('cursor', {
      userId: this.userId,
      x: Math.round(event.clientX),
      y: Math.round(event.clientY)
    })

  }

  handleMouseLeave(): void {
    //
  }

  setAttributes(op?: any, sharedDescription?: any): void {
    console.log('setAttributes')
    if (op){
      if (op.props) {
        Object.entries(op.props).map(([k,v]) => {
          console.log(`${k} ${v}`)
          if (`${k}` === 'list'){
            console.log('format line')
            // console.log(`${v}` === 'null' ? false : `${v}`)
            // console.log('pos1 ' + op.pos1)
            // console.log('pos2 ' + op.pos2)
            // console.log()
            // console.log(this.editor.getIndex(this.editor.getLine(op.pos1)[0]))
            this.editor.formatLine(op.pos1, op.pos2 - op.pos1, `${k}`, `${v}` === 'null' ? false : `${v}`)
            // this.editor.formatLine(this.editor.getIndex(this.editor.getLine(op.pos1)[0] - 1), op.pos2, `${k}`, `${v}` === 'null' ? false : `${v}`)
          } else {
            console.log('format text')
            this.editor.formatText(op.pos1, Math.abs(op.pos1 - op.pos2), `${k}`, `${v}` === 'null' ? false : `${v}`)
          }
        })
      }
    } else if (sharedDescription){
      console.log('sharedDescription')

      Object.entries(sharedDescription.getText()).map((index) => {

        if (sharedDescription.getPropertiesAtPosition(parseInt(index[0]))){
          Object.entries(sharedDescription.getPropertiesAtPosition(parseInt(index[0]))).map(([k,v]) => {
            // console.log(sharedDescription.getPropertiesAtPosition(i))
            console.log(`${k} ${v}`)
            // console.log('index ' + i)
            console.log(parseInt(index[0]))
            setTimeout(() =>
            // ToDo: format by ranges not by index
            this.editor.formatText(parseInt(index[0]), 1, `${k}`, `${v}`)
            , 0)
          })
        }
      })
    }

    this.editor.blur()
    this.editor.setSelection(this.selectionStart, 0)
  }

  setCaretPosition(first: any, last: any, op: any): void {
    // insert before caret
    if (first.position < this.selectionStart){
      // on select range and insert
      if (op.type === 0){
        this.selectionStart = this.selectionStart + last.segment.cachedLength
      } else if(op.type === 1) {
        if (this.selectionStart > op.pos2){
          this.selectionStart = this.selectionStart - Math.abs(op.pos1 - op.pos2)
        } else {
          this.selectionStart = op.pos1
        }
      }
    }

    console.log('selectionStart ' + this.selectionStart)
    setTimeout(() => this.editor.setSelection(this.selectionStart, 0), 0)
  }

  onSelectionChange(event: any): void {
    console.log('onSelectionChange')
    // console.log(event)

    if (event.source === 'user'){
      if (this.editor.getSelection()){
        this.selectionStart = event.range.index
        this.selectionEnd = event.range.index + event.range.length
        console.log('selectionStart ' + this.selectionStart)
        console.log('selectionEnd ' + this.selectionEnd)
      }
    }

    console.log(this.sharedDescription.getPropertiesAtPosition(this.selectionStart))
  }

  onTextChange(event: any): void {
    console.log('onTextChange')
    console.log(event.delta)
    if (this.getDeltaDelete(event.delta) && this.getDeltaInsert(event.delta)){
      console.log('replace')
      this.sharedDescription.replaceText(this.getDeltaPosition(event.delta), +this.getDeltaPosition(event.delta) + +this.getDeltaDelete(event.delta), this.getDeltaInsert(event.delta))
    } else if (this.getDeltaDelete(event.delta) && !this.getDeltaInsert(event.delta)){
      console.log('remove')
      this.sharedDescription.removeText(this.editor.getSelection().index, +this.editor.getSelection().index + +this.getDeltaDelete(event.delta))
    } else {
      console.log('insert')
      this.sharedDescription.insertText(this.getDeltaPosition(event.delta), this.getDeltaInsert(event.delta))
    }

    if (this.getDeltaAttributes(event.delta)){
      console.log('attributes')
      console.log(event.delta)

      let firstPosLine = 0
      let pos1 = 0
      let pos2 = 0
      let attribute = ''
      this.getDeltaAttributes(event.delta).map((attributes: any, index: any) => {
        console.log(attributes)

        Object.entries(attributes).map(([k,v]: any) => {
          if (`${k}` === 'list'){
            attribute = 'list'

          }
        })

        switch(attribute){
          case 'list':{
            // console.log('list')
            // console.log('index ' + index)
            // console.log('firstPosLine ' + firstPosLine)
            // console.log(firstPosLine + this.getDeltaLine(event.delta)[index])

            pos1 = firstPosLine
            pos2 = firstPosLine + this.getDeltaLine(event.delta)[index]

            if (firstPosLine !== 0){
              pos1 = pos2 - (this.editor.getLine(firstPosLine)[0].cache.length - 1)
            } else {
              pos1 = pos2 - (this.editor.getLine(this.getDeltaLine(event.delta)[index])[0].cache.length - 1)
            }

            // console.log('pos1 ' + pos1)
            // console.log('pos2 ' + pos2)

            firstPosLine += this.getDeltaLine(event.delta)[index] + 1

            this.sharedDescription.annotateRange(pos1, pos2, attributes)

            break
          }
          default: {
            // if insert with attributes
            if (this.getDeltaInsert(event.delta)){
              console.log('insert & format')
              this.sharedDescription.annotateRange(this.getDeltaPosition(event.delta), this.getDeltaRange(event.delta)[0] + this.getDeltaInsert(event.delta).length, attributes)
            // set attributes to the text already writen
            } else {
              console.log('format')
              this.sharedDescription.annotateRange(this.selectionStart, this.selectionEnd, attributes)
            }
            break
          }
        }
      })
    }

    // this.selectionStart = this.getDeltaPosition(event.delta) + this.getDeltaInsert(event.delta).length
    // this.selectionEnd = this.getDeltaPosition(event.delta) + this.getDeltaInsert(event.delta).length
    // console.log('selectionStart ' + this.selectionStart)
    // console.log('selectionEnd ' + this.selectionEnd)
    console.log('')
  }

  getDeltaPosition(delta: any): number {
    let retain = 0
    delta.map((op: any) => {
      if (typeof op.retain === 'number') {
        retain = op.retain
      }
    })
    return retain
  }

  getDeltaRange(delta: any): number[] {
    const retain: any[] = []
    delta.map((op: any) => {
      if (op.retain === '' || op.retain === undefined ){
        retain.push(0)
      } else {
        // if (op.attributes === undefined){
          retain.push(op.retain)
        // }
      }
    })
    return retain
  }

  getDeltaLine(delta: any): number[] {
    const retain: any[] = []
    delta.map((op: any) => {
      if (op.retain === '' || op.retain === undefined ){
        retain.push(0)
      } else {
        if (op.attributes === undefined){
          retain.push(op.retain)
        }
      }
    })
    return retain
  }

  getDeltaInsert(delta: any): string {
    return delta.map((op: any) => {
      if (typeof op.insert === 'string') {
        return op.insert
      } else {
        return ''
      }
    }).join('')
  }

  getDeltaDelete(delta: any): number {
    const del = delta.map((op: any) => {
      if (typeof op.delete === 'number') {
        return op.delete
      } else {
        return ''
      }
    }).join('')
    return del !== '' ? del : 0
  }

  getDeltaAttributes(delta: any): any[] {
    const attributes: any[] = []
    delta.map((op: any) => {
      if (op.attributes) {
        // console.log(op.attributes)
        attributes.push(op.attributes)
      }
    })
    return attributes
  }

}
