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
    // this.fluidContainer = await this.client.getContainer('228c2ef5-03cd-4abe-97de-8a9da5340611', this.schema)
    //     // ac75e9c7-513a-4378-afa7-f8135dfbeb61
    // this.sharedDescription = this.fluidContainer.container.initialObjects.description as SharedString

    const client = new TinyliciousClient()
    // this.fluidContainer = await client.createContainer(this.schema); const id = await this.fluidContainer.container.attach(); console.log(id)
    this.fluidContainer = await client.getContainer('63816fdf-f3e6-457c-bcd7-3b037d39474e', this.schema)
    this.sharedDescription = this.fluidContainer.container.initialObjects.description as SharedString

    this.description = this.sharedDescription.getText()
    this.syncData()
  }

  syncData(): void {
    // Sets an event listener so we can update our state as the value changes
    this.sharedDescription.on('sequenceDelta', (event: any) => {
      // console.log(event)
      const newText = this.sharedDescription.getText()
      // We only need to insert if the text changed.
      if (newText === this.description) {
        return
      }

      // If the event is our own then just insert the text
      if (event.isLocal) {
        this.description = newText
        return
      }

      // Because we did not make the change we need to manage the remote
      // character insertion.
      const remoteCaretStart = event.first.position
      const remoteCaretEnd = event.last.position + event.last.segment.cachedLength
      const charactersModifiedCount = newText.length - this.description.length

      this.updateSelection()
      const currentCaretStart = this.selectionStart
      const currentCaretEnd = this.selectionEnd

      let newCaretStart = 0
      let newCaretEnd = 0

      // Remote text inserted/removed after our cp range
      if (currentCaretEnd <= remoteCaretStart) {
        // cp stays where it was before.
        newCaretStart = currentCaretStart
        newCaretEnd = currentCaretEnd
      } else if (currentCaretStart > (remoteCaretEnd - 1)) {
        // Remote text inserted/removed before our cp range
        // We need to move our cp the number of characters inserted/removed
        // to ensure we are in the same position
        newCaretStart = currentCaretStart + charactersModifiedCount
        newCaretEnd = currentCaretEnd + charactersModifiedCount
      } else {
        // Remote text is overlapping cp

        // The remote changes occurred inside current selection
        if (remoteCaretEnd <= currentCaretEnd && remoteCaretStart > currentCaretStart) {
          // Our selection needs to include remote changes
          newCaretStart = currentCaretStart
          newCaretEnd = currentCaretEnd + charactersModifiedCount
        } else if (remoteCaretEnd >= currentCaretEnd && remoteCaretStart <= currentCaretStart) {
          // The remote changes encompass our location

          // Our selection has been removed
          // Move our cp to the beginning of the new text insertion
          newCaretStart = remoteCaretStart
          newCaretEnd = remoteCaretStart
        } else {
          // We have partial overlapping selection with the changes.
          // This makes things a lot harder to manage so for now we will just remove the current selection
          // and place it to the remote caret start.
          newCaretStart = remoteCaretStart
          newCaretEnd = remoteCaretStart
        }
      }

      this.description = newText
      this.setCaretPosition(newCaretStart, newCaretEnd)
      // The event we're listening for here fires outside of Angular
      // so let it know to detect changes
      // this.changeDetector.detectChanges()
    })
  }

  setCaretPosition(newStart: number, newEnd: number): void {
    // if (this.textArea) {
    //     const textArea = this.textArea.nativeElement
    //     textArea.selectionStart = newStart
    //     textArea.selectionEnd = newEnd
    // }

    console.log('setCaretPosition ' + newStart + ' ' + newEnd)
    this.editor.setSelection(newStart, 0)
  }

  onSelectionChange(event: any): void {
    // console.log('onSelectionChange')
    console.log(event)

    if (this.editor.getSelection()){
      // console.log('this.editor.getSelection ' + this.editor.getSelection().index)
      this.selectionStart = event.range.index
      this.selectionEnd = event.range.index + event.range.length
      console.log(this.selectionStart)
      console.log(this.selectionEnd)

    }
  }

  updateSelection(): void {
    console.log('updateSelection ')

    // if (!this.textArea) {
    //   return
    // }

    // const textArea = this.textArea.nativeElement
    // this.selectionStart = textArea.selectionStart ? textArea.selectionStart : 0
    // this.selectionEnd = textArea.selectionEnd ? textArea.selectionEnd : 0

  }

  onTextChange(event: any): void {
    if (this.quillGetDeltaDelete(event.delta) && this.quillGetDeltaInsert(event.delta)){
      console.log('replace')
      this.sharedDescription.replaceText(this.selectionStart, this.selectionEnd, this.quillGetDeltaInsert(event.delta))
    } else if (this.quillGetDeltaDelete(event.delta) && !this.quillGetDeltaInsert(event.delta)){
      console.log('remove')
      this.sharedDescription.removeText(this.quillGetDeltaPosition(event.delta), this.quillGetDeltaPosition(event.delta) + this.quillGetDeltaDelete(event.delta))
    } else {
      console.log('insert')
      console.log(this.quillGetDeltaPosition(event.delta))
      console.log(this.quillGetDeltaInsert(event.delta))
      // this.sharedDescription.insertText(this.quillGetDeltaPosition(event.delta), this.quillGetDeltaInsert(event.delta))
      this.sharedDescription.insertText(0, 'a')
    }
    console.log('')
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
