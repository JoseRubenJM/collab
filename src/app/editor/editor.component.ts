import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core'
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

export class CollaborativeTextAreaComponent implements OnInit, AfterViewInit {
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

  async ngOnInit(): Promise<void> {
    return
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

      // Because we did not make the change we need to manage the remote character insertion.
      this.setCaretPosition(event.first, event.last, event.opArgs.op, this.sharedDescription.getText() )

      this.description = this.sharedDescription.getText()
      // this.description = ''
    })
  }

  setCaretPosition(first: any, last: any, op: any, sharedDescription: any): void {

    // if (description.length === this.description.length)

    if (first.position < this.selectionStart){
      console.log('selectionStart ' + this.selectionStart)
      console.log('description.length ' + this.description.length)
      console.log('sharedDescription.length ' + sharedDescription.length)
      console.log(this.selectionStart - Math.abs(this.description.length - sharedDescription.length))

      if (this.description.length > sharedDescription.length){
        console.log('small')
        this.selectionStart = this.selectionStart - Math.abs(this.description.length - sharedDescription.length)
      } else {
        console.log('bigger')
        this.selectionStart = this.selectionStart + Math.abs(this.description.length - sharedDescription.length)
      }

    }

    console.log('selectionStart ' + this.selectionStart)
    setTimeout(() => this.editor.setSelection(this.selectionStart, 0), 0)
  }

  onSelectionChange(event: any): void {
    console.log('onSelectionChange')
    console.log(event)

    if (event.source === 'api'){
      console.log(event)
    }

    if (event.source === 'user'){
      if (this.editor.getSelection()){
        this.selectionStart = event.range.index
        this.selectionEnd = event.range.index + event.range.length
        console.log('selectionStart ' + this.selectionStart)
        console.log('selectionEnd ' + this.selectionEnd)
      }
    }

    // console.log(this.editor.getContents(this.selectionStart, this.selectionEnd))
    // console.log(this.editor.getFormat(this.selectionStart, this.selectionEnd))
    // console.log(this.sharedDescription.getPropertiesAtPosition(this.selectionStart))

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
      // console.log(event.delta.ops)
      // console.log('selectionStart ' + this.selectionStart)
      // console.log('editor.getSelection().index ' + this.editor.getSelection().index)
      // console.log('quillGetDeltaPosition(event.delta) ' + this.quillGetDeltaPosition(event.delta))
      // if (event.delta.ops.length > 1){
      //   console.log(true)
      // }
        console.log('quillGetDeltaPosition(event.delta) ' + this.getDeltaPosition(event.delta))
        this.sharedDescription.insertText(this.getDeltaPosition(event.delta), this.getDeltaInsert(event.delta))
      // } else {
        // this.sharedDescription.insertText(this.quillGetDeltaPosition(event.delta), this.quillGetDeltaInsert(event.delta))
      // }
    }

    if (this.getDeltaAttributes(event.delta)){
      console.log('attributes')
      // console.log(JSON.parse(this.getDeltaAttributes(event.delta)))
      // console.log('pos1 ' + event.delta.ops[0].retain)
      // console.log('pos2 ' + (+event.delta.ops[0].retain + +event.delta.ops[1].retain))
      // this.sharedDescription.annotateRange(this.getDeltaRange(event.delta)[0], +this.getDeltaRange(event.delta)[0] + +this.getDeltaRange(event.delta)[1], JSON.parse(this.getDeltaAttributes(event.delta)))
    }

    this.selectionStart = this.getDeltaPosition(event.delta)
    this.selectionEnd = +this.getDeltaPosition(event.delta) + +this.getDeltaInsert(event.delta).length
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
