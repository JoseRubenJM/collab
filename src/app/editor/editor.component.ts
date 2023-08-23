import { AfterViewInit, Component, ViewChild, ViewEncapsulation } from '@angular/core'
import { AzureClient, AzureContainerServices } from '@fluidframework/azure-client'
import { IFluidContainer, SequenceDeltaEvent, SharedString } from 'fluid-framework'
import { AzureFluidRelayService } from '../services/azure-fluid-relay.service'
import { Editor } from 'primeng/editor'
import { TinyliciousClient } from '@fluidframework/tinylicious-client'
import { schema } from '../interfaces/fluid'

@Component({
  selector: 'app-collaborative-text-area',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.sass'],
  encapsulation: ViewEncapsulation.None,
})

export class CollaborativeTextAreaComponent implements AfterViewInit {
  description: string = ''
  selectionEnd: number = 0
  selectionStart: number = 0

  client!: AzureClient
  fluidContainer!: { container: IFluidContainer; services: AzureContainerServices }
  sharedDescription!: SharedString
  schema = schema

  editor!: any
  @ViewChild('editor') editorEl!: Editor

  constructor(
    public azureClient: AzureFluidRelayService
  ){
  }

  async ngAfterViewInit(): Promise<void> {
    // this.client = this.azureClient.getClient()
    // // this.fluidContainer = await this.client.createContainer(this.schema); const id = await this.fluidContainer.container.attach(); console.log(id)
    // this.fluidContainer = await this.client.getContainer('ac75e9c7-513a-4378-afa7-f8135dfbeb61', this.schema)
    // this.sharedDescription = this.fluidContainer.container.initialObjects.description as SharedString

    const client = new TinyliciousClient()
    // this.fluidContainer = await client.createContainer(this.schema); const id = await this.fluidContainer.container.attach(); console.log(id)
    this.fluidContainer = await client.getContainer('8a915c45-3739-4680-b402-f8e732a071de', this.schema)
    this.sharedDescription = this.fluidContainer.container.initialObjects.description as SharedString

    // Editor initialization
    this.editor = this.editorEl.quill
    this.editor.container.style.whiteSpace = 'pre-line'
    this.setAttributes(null, this.sharedDescription)

    this.description = this.sharedDescription.getText()
    this.syncData()

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

      // Update attributes
      this.setAttributes(event.opArgs.op, null)

      // Update the text
      this.description = this.sharedDescription.getText()
      // this.description = ''

      console.log('')
      console.log('')
    })
  }

  setAttributes(op?: any, sharedDescription?: any): void {
    console.log('setAttributes')
    if (op){
      if (op.props) {
        Object.entries(op.props).map(([k,v]) => {
          console.log(`${k} ${v}`)
          if (`${k}` === 'list'){
            console.log(`${v}` === 'null' ? false : `${v}`)
            console.log('pos1 ' + op.pos1)
            console.log('pos2 ' + op.pos2)
            // console.log()
            // console.log(this.editor.getIndex(this.editor.getLine(op.pos1)[0]))
            this.editor.formatLine(op.pos1, op.pos2 - op.pos1, `${k}`, `${v}` === 'null' ? false : `${v}`)
            // this.editor.formatLine(this.editor.getIndex(this.editor.getLine(op.pos1)[0] - 1), op.pos2, `${k}`, `${v}` === 'null' ? false : `${v}`)
          } else {
            this.editor.formatText(op.pos1, Math.abs(op.pos1 - op.pos2), `${k}`, `${v}` === 'null' ? false : `${v}`)
          }
        })
      }
    } else if (sharedDescription){
      for (let i = 0; i < sharedDescription.getText().length; i++) {
        if (sharedDescription.getPropertiesAtPosition(i)){
          Object.entries(sharedDescription.getPropertiesAtPosition(i)).map(([k,v]) => {
            // console.log(sharedDescription.getPropertiesAtPosition(i))
            // console.log(`${k} ${v}`)
            // console.log('index ' + i)

              setTimeout(() => this.editor.formatText(i, 1, `${k}`, `${v}`), 0)
          })
        }
      }
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
      // console.log(event.delta)

      // console.log(this.getDeltaAttributes(event.delta))
      let firstPosLine = 0
      this.getDeltaAttributes(event.delta).map((attributes: any, index: any) => {
        // console.log(attributes)
        console.log(this.getDeltaLine(event.delta))
        // console.log(this.editor.getLine(this.getDeltaLine(event.delta)[index] + this.getDeltaLine(event.delta)[index - 1]))
        console.log('index ' + index)
        console.log(this.getDeltaLine(event.delta)[index] - this.editor.getLine(this.getDeltaLine(event.delta)[index])[1])
        console.log(firstPosLine + this.getDeltaLine(event.delta)[index])

        // console.log(this.getDeltaLine(event.delta)[index])
        console.log(this.editor.getLine(this.getDeltaLine(event.delta)[index]))
        Object.entries(attributes).map(([k,v]: any) => {
          if (`${k}` === 'list'){
            console.log('list')
            this.sharedDescription.annotateRange(this.getDeltaLine(event.delta)[index] - this.editor.getLine(this.getDeltaLine(event.delta)[index])[1], firstPosLine + this.getDeltaLine(event.delta)[index], attributes)
            // this.sharedDescription.annotateRange(this.getDeltaLine(event.delta)[index] - 1, this.getDeltaLine(event.delta)[index] + this.getDeltaLine(event.delta)[this.getDeltaLine(event.delta).length < index ? index + 1 : index], attributes)
          } else {
            // if insert with attributes
            if (this.getDeltaInsert(event.delta)){
              console.log('insert & format')
              this.sharedDescription.annotateRange(this.getDeltaPosition(event.delta), this.getDeltaRange(event.delta)[0] + this.getDeltaInsert(event.delta).length, attributes)
            // set attributes to the text already writen
            } else {
              console.log('format')
              console.log(this.getDeltaPosition(event.delta))
              console.log(this.getDeltaRange(event.delta)[0])
              console.log(attributes)
              this.sharedDescription.annotateRange(this.getDeltaRange(event.delta)[0], this.getDeltaRange(event.delta)[0] + this.getDeltaRange(event.delta)[1], attributes)
            }
          }
        })

        // if (this.getDeltaLine(event.delta).length >= index + 1){
          firstPosLine += this.editor.getLine(this.getDeltaLine(event.delta)[index])[1] + 1
        // }

      })
    }

    this.selectionStart = this.getDeltaPosition(event.delta) + this.getDeltaInsert(event.delta).length
    this.selectionEnd = this.getDeltaPosition(event.delta) + this.getDeltaInsert(event.delta).length
    // console.log('selectionStart ' + this.selectionStart)
    // console.log('selectionEnd ' + this.selectionEnd)
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
