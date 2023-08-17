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
    this.fluidContainer = await client.getContainer('760b7a07-0ce8-406a-8f9a-87484d4c62f6', this.schema)
    this.sharedDescription = this.fluidContainer.container.initialObjects.description as SharedString

    this.description = this.sharedDescription.getText()
    this.syncData()

    // Editor initialization
    this.editor = this.editorEl.quill
    this.editor.container.style.whiteSpace = 'pre-line'

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
      this.setAttributes(event.opArgs.op)

      // Update the text
      this.description = this.sharedDescription.getText()
      // this.description = ''
    })
  }

  setAttributes(op: any): void {
    console.log('setAttributes')
    if (op.props){
      console.log(op.props)

      Object.entries(op.props).map(([k,v]) => {
        console.log('op.pos1 ' + op.pos1)
        console.log('op.pos2 ' + op.pos2)
        console.log(`${k} ${v}`)
        this.editor.formatText(op.pos1, Math.abs(op.pos1 - op.pos2), `${k}`, `${v}`)
      })
    }
    setTimeout(() => this.editor.setSelection(this.selectionStart - 1, 0), 0)
    setTimeout(() => this.editor.setSelection(this.selectionStart, 0), 0)
    // this.editor.update()
    // this.editor.focus()
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
    console.log(event)

    if (event.source === 'api'){
      // console.log(event)
    }

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
      console.log(JSON.parse(this.getDeltaAttributes(event.delta)))
      this.sharedDescription.annotateRange(this.getDeltaRange(event.delta)[0], +this.getDeltaRange(event.delta)[0] + +this.getDeltaRange(event.delta)[1], JSON.parse(this.getDeltaAttributes(event.delta)))
    }

    this.selectionStart = this.getDeltaPosition(event.delta) + this.getDeltaInsert(event.delta).length
    this.selectionEnd = this.getDeltaPosition(event.delta) + this.getDeltaInsert(event.delta).length
    // console.log('selectionStart ' + this.selectionStart)
    // console.log('selectionEnd ' + this.selectionEnd)
    console.log('')
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
        retain.push(op.retain)
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

  getDeltaAttributes(delta: any): any {
    return delta.map((op: any) => {
      if (op.attributes) {
        return JSON.stringify(op.attributes)
      } else {
        return ''
      }
    }).join('')
  }

}
