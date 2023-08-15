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
    this.fluidContainer = await client.getContainer('86d85f79-b1bd-43a8-b5ba-ad7bef7fcd41', this.schema)
    this.sharedDescription = this.fluidContainer.container.initialObjects.description as SharedString

    this.description = this.sharedDescription.getText()

    this.syncData()

    // ToDo: initialize editor here
    this.editor = this.editorEl.quill
    this.editor.container.style.whiteSpace = 'pre-line'

  }

  syncData(): void {
    // Sets an event listener so we can update our state as the value changes
    this.sharedDescription.on('sequenceDelta', (event: SequenceDeltaEvent) => {
      console.log('sequenceDelta')
      console.log(event)
      // We only need to insert if the text changed.
      // if (this.sharedDescription.getText() === this.description) {
      //   return
      // }

      // If the event is our own then just insert the text
      if (event.isLocal) {
        this.description = this.sharedDescription.getText()
        return
      }

      // Because we did not make the change we need to manage the remote
      // character insertion.
      const remoteCaretStart = event.first.position
      const remoteCaretEnd = event.last.position + event.last.segment.cachedLength

      if (remoteCaretStart < this.selectionStart){
        this.selectionStart = this.selectionStart + event.last.segment.cachedLength
      }

      setTimeout(() => this.editor.setSelection(this.selectionStart, 0), 0)

      this.description = this.sharedDescription.getText()
      // this.description = ''
    })
  }

  setCaretPosition(newStart: number, newEnd: number): void {
    // setTimeout(() => this.editor.setSelection(newStart, 0), 0)
  }

  onSelectionChange(event: any): void {
    console.log('onSelectionChange')
    // console.log(event)

    if (event.source === 'api'){
      console.log(event)
    }

    if (event.source === 'user'){
      if (this.editor.getSelection()){
        console.log(this.editor.getSelection())
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
    if (this.quillGetDeltaDelete(event.delta) && this.quillGetDeltaInsert(event.delta)){
      console.log('replace')
      this.sharedDescription.replaceText(this.selectionStart, this.selectionEnd, this.quillGetDeltaInsert(event.delta))
    } else if (this.quillGetDeltaDelete(event.delta) && !this.quillGetDeltaInsert(event.delta)){
      console.log('remove')
      this.sharedDescription.removeText(this.editor.getSelection().index, +this.editor.getSelection().index + +this.quillGetDeltaDelete(event.delta))
    } else {
      console.log('insert')
      console.log(event.delta.ops)
      // console.log('selectionStart ' + this.selectionStart)
      // console.log('editor.getSelection().index ' + this.editor.getSelection().index)
      // console.log('quillGetDeltaPosition(event.delta) ' + this.quillGetDeltaPosition(event.delta))
      // if (event.delta.ops.length > 1){
        this.sharedDescription.insertText(this.quillGetDeltaPosition(event.delta), this.quillGetDeltaInsert(event.delta))
      // } else {
        // this.sharedDescription.insertText(this.quillGetDeltaPosition(event.delta), this.quillGetDeltaInsert(event.delta))
      // }
    }

    if (this.quillGetDeltaAttributes(event.delta)){
      console.log(JSON.parse(this.quillGetDeltaAttributes(event.delta)))
      console.log('attributes')
      console.log('pos1 ' + event.delta.ops[0].retain)
      console.log('pos2 ' + (+event.delta.ops[0].retain + +event.delta.ops[1].retain))
      this.sharedDescription.annotateRange(event.delta.ops[0].retain, +event.delta.ops[0].retain + +event.delta.ops[1].retain, JSON.parse(this.quillGetDeltaAttributes(event.delta)))
    }

    this.selectionStart = this.quillGetDeltaPosition(event.delta)
    this.selectionEnd = +this.quillGetDeltaPosition(event.delta) + +this.quillGetDeltaInsert(event.delta).length
    console.log('selectionStart ' + this.selectionStart)
    console.log('selectionEnd ' + this.selectionEnd)
    console.log('')
    console.log('')
  }

  onInitEditor(event: any): void{
    // console.log(event.editor)
    // this.editor = event.editor
    // this.editor.container.style.whiteSpace = 'pre-line'
  }

  quillGetDeltaPosition(delta: any): number {
    // const retain = delta.map((op: any) => {
    //   if (typeof op.retain === 'number') {
    //     return op.retain
    //   } else {
    //     return ''
    //   }
    // }).join('')
    const retain = delta.ops[0].retain
    return retain !== '' && retain !== undefined ? retain : 0
  }

  quillGetDeltaInsert(delta: any): string {
    return delta.map((op: any) => {
      if (typeof op.insert === 'string') {
        return op.insert
      } else {
        return ''
      }
    }).join('')
  }

  quillGetDeltaDelete(delta: any): number {
    const del = delta.map((op: any) => {
      if (typeof op.delete === 'number') {
        return op.delete
      } else {
        return ''
      }
    }).join('')
    return del !== '' ? del : 0
  }

  quillGetDeltaAttributes(delta: any): any {
    return delta.map((op: any) => {
      if (op.attributes) {
        return JSON.stringify(op.attributes)
      } else {
        return ''
      }
    }).join('')
  }

}
