import { AzureClient, AzureContainerServices } from '@fluidframework/azure-client'
import { Component, OnInit, ViewEncapsulation } from '@angular/core'
import { IFluidContainer, SharedString } from 'fluid-framework'
import { AzureFluidRelayService } from '../services/azure-fluid-relay.service'
import { TinyliciousClient } from '@fluidframework/tinylicious-client'
import { schema } from '../interfaces/fluid'

@Component({
  selector: 'app-collaborative-text-area',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.sass'],
  encapsulation: ViewEncapsulation.None,
})

export class CollaborativeTextAreaComponent implements OnInit {
  description: string = ''
  selectionEnd: number = 0
  selectionStart: number = 0

  client!: AzureClient
  fluidContainer!: { container: IFluidContainer; services: AzureContainerServices }
  sharedDescription!: SharedString
  schema = schema

  editor!: any

  constructor(
    public azureClient: AzureFluidRelayService
  ){}

  async ngOnInit(): Promise<void> {
    // this.client = this.azureClient.getClient()
    // // this.fluidContainer = await this.client.createContainer(this.schema); const id = await this.fluidContainer.container.attach(); console.log(id)
    // this.fluidContainer = await this.client.getContainer('ac75e9c7-513a-4378-afa7-f8135dfbeb61', this.schema)
    // this.sharedDescription = this.fluidContainer.container.initialObjects.description as SharedString

    const client = new TinyliciousClient()
    // this.fluidContainer = await client.createContainer(this.schema); const id = await this.fluidContainer.container.attach(); console.log(id)
    this.fluidContainer = await client.getContainer('5a697ee3-509c-4499-ac4d-9719823cf67e', this.schema)
    this.sharedDescription = this.fluidContainer.container.initialObjects.description as SharedString

    this.description = this.sharedDescription.getText()
    this.syncData()
  }

  syncData(): void {
    // Sets an event listener so we can update our state as the value changes
    this.sharedDescription.on('sequenceDelta', (event: any) => {
      console.log('sequenceDelta')
      console.log(event)
      // We only need to insert if the text changed.
      if (this.sharedDescription.getText() === this.description) {
        return
      }

      // If the event is our own then just insert the text
      if (event.isLocal) {
        this.description = this.sharedDescription.getText()
        return
      }

      // Because we did not make the change we need to manage the remote
      // character insertion.
      const remoteCaretStart = event.first.position
      const remoteCaretEnd = event.last.position + event.last.segment.cachedLength
      // const charactersModifiedCount = this.sharedDescription.getText().length - this.description.length

      console.log('event.first.position ' + event.first.position)
      console.log('event.last.position ' + event.last.position)
      console.log('event.last.segment.cachedLength ' + event.last.segment.cachedLength)

      this.description = this.sharedDescription.getText()
    })
  }

  setCaretPosition(newStart: number, newEnd: number): void {
    console.log('setCaretPosition')
    console.log('newStart ' + newStart)
    console.log('newEnd ' + newEnd)
    // this.editor.setSelection(newStart, 0)
    setTimeout(() => this.editor.setSelection(newStart, 0), 0)
  }

  onSelectionChange(event: any): void {
    console.log('onSelectionChange')

    if (event.source === 'api'){
      console.log(event)
    }

    if (event.source === 'user'){
      if (this.editor.getSelection()){
        console.log(this.editor.getSelection())
        // console.log('this.editor.getSelection ' + this.editor.getSelection().index)
        this.selectionStart = event.range.index
        this.selectionEnd = event.range.index + event.range.length
        // console.log('this.selectionStart ' + this.selectionStart)
        // console.log('this.selectionEnd ' + this.selectionEnd)

      }
    }
  }

  // updateSelection(): void {
  //   console.log('updateSelection ')

  //   // if (!this.editor) {
  //   //   return
  //   // }

  //   // const textArea = this.textArea.nativeElement
  //   // this.selectionStart = textArea.selectionStart ? textArea.selectionStart : 0
  //   // this.selectionEnd = textArea.selectionEnd ? textArea.selectionEnd : 0

  //   // console.log(this.editor)
  //   // this.selectionStart = this.editor.getSelection().index ? this.editor.getSelection().index : 0
  //   // this.selectionEnd = this.editor.getSelection().index ? this.editor.getSelection().index : 0

  // }

  onTextChange(event: any): void {
    console.log(event.delta)
    if (this.quillGetDeltaDelete(event.delta) && this.quillGetDeltaInsert(event.delta)){
      console.log('replace')
      this.sharedDescription.replaceText(this.selectionStart, this.selectionEnd, this.quillGetDeltaInsert(event.delta))
    } else if (this.quillGetDeltaDelete(event.delta) && !this.quillGetDeltaInsert(event.delta)){
      console.log('remove')
      this.sharedDescription.removeText(this.quillGetDeltaPosition(event.delta), +this.quillGetDeltaPosition(event.delta) + +this.quillGetDeltaDelete(event.delta))
    } else {
      console.log('insert')
      if (this.quillGetDeltaInsert(event.delta).length > 1){
        this.sharedDescription.insertText(this.selectionStart, this.quillGetDeltaInsert(event.delta))
      } else {
        this.sharedDescription.insertText(this.editor.getSelection().index - 1, this.quillGetDeltaInsert(event.delta))
      }
    }

    this.selectionStart = this.quillGetDeltaPosition(event.delta)
    this.selectionEnd = +this.quillGetDeltaPosition(event.delta) + +this.quillGetDeltaInsert(event.delta).length
    console.log('this.selectionStart ' + this.selectionStart)
    console.log('this.selectionEnd ' + this.selectionEnd)
  }

  onInitEditor(event: any): void{
    this.editor = event.editor
  }

  quillGetDeltaPosition(delta: any): number {
    const retain = delta.map((op: any) => {
      if (typeof op.retain === 'number') {
        return op.retain
      } else {
        return ''
      }
    }).join('')
    return retain !== '' ? retain : 0
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
    return delta.map((op: any) => {
      if (typeof op.delete === 'number') {
        return op.delete
      } else {
        return ''
      }
    }).join('')
  }

}
