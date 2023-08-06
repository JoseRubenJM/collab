import { AzureClient, AzureContainerServices } from '@fluidframework/azure-client'
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import { IFluidContainer, SharedString } from 'fluid-framework'
import { AzureFluidRelayService } from '../services/azure-fluid-relay.service'
import { schema } from '../interfaces/fluid'
@Component({
  selector: 'app-collaborative-text-area',
  template: `
    <textarea #textArea
        rows="20"
        cols="50"
        class=""
        style=""
        (beforeinput)="updateSelection()"
        (keydown)="updateSelection()"
        (click)="updateSelection()"
        (contextmenu)="updateSelection()"
        (input)="handleChange($event)"
        [value]="text"></textarea>
  `
})
export class CollaborativeTextAreaComponent implements OnInit {
  @ViewChild('textArea') textArea!: ElementRef
  text: string = ''
  selectionEnd: number = 0
  selectionStart: number = 0

  client!: AzureClient
  fluidContainer!: { container: IFluidContainer; services: AzureContainerServices }
  sharedDescription!: SharedString
  schema = schema

  constructor(
    public azureClient: AzureFluidRelayService
  ){}

  async ngOnInit(): Promise<void> {
    this.client = this.azureClient.getClient()
    // this.fluidContainer = await this.client.createContainer(this.schema)
    // const id = await this.fluidContainer.container.attach()
    // console.log(id)
    this.fluidContainer = await this.client.getContainer('2164a0e1-fba8-4300-9bc0-b6cc4b143e3a', this.schema)
    this.sharedDescription = this.fluidContainer.container.initialObjects.description as SharedString
    this.text = this.sharedDescription.getText()

    this.syncData()
  }

  syncData(): void {
    // Sets an event listener so we can update our state as the value changes
    this.sharedDescription.on('sequenceDelta', (event: any) => {
      console.log(event)
      const newText = this.sharedDescription.getText()
      // We only need to insert if the text changed.
      if (newText === this.text) {
        return
      }

      // If the event is our own then just insert the text
      if (event.isLocal) {
        this.text = newText
        return
      }

      // Because we did not make the change we need to manage the remote
      // character insertion.
      const remoteCaretStart = event.first.position
      const remoteCaretEnd = event.last.position + event.last.segment.cachedLength
      const charactersModifiedCount = newText.length - this.text.length

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

      this.text = newText
      this.setCaretPosition(newCaretStart, newCaretEnd)
      // The event we're listening for here fires outside of Angular
      // so let it know to detect changes
      // this.changeDetector.detectChanges()
    })
  }

  setCaretPosition(newStart: number, newEnd: number): void {
    if (this.textArea) {
        const textArea = this.textArea.nativeElement
        textArea.selectionStart = newStart
        textArea.selectionEnd = newEnd
    }
  }

  updateSelection(): void {
    if (!this.textArea) {
      return
    }

    const textArea = this.textArea.nativeElement
    this.selectionStart = textArea.selectionStart ? textArea.selectionStart : 0
    this.selectionEnd = textArea.selectionEnd ? textArea.selectionEnd : 0
  }

  handleChange(event: any): void {
    // We need to set the value here to keep the input responsive to the user
    const currentTarget = event.currentTarget
    const newText = currentTarget.value
    const charactersModifiedCount = this.text.length - newText.length
    this.text = newText

    // Get the new caret position and use that to get the text that was inserted
    const newPosition = currentTarget.selectionStart ? currentTarget.selectionStart : 0
    const isTextInserted = newPosition - this.selectionStart > 0
    if (isTextInserted) {
        const insertedText = newText.substring(this.selectionStart, newPosition)
        const changeRangeLength = this.selectionEnd - this.selectionStart
        if (changeRangeLength === 0) {
            console.log(insertedText)
            this.sharedDescription.insertText(this.selectionStart, insertedText)
        } else {
            this.sharedDescription.replaceText(this.selectionStart, this.selectionEnd, insertedText)
        }
    } else {
        // Text was removed
        this.sharedDescription.removeText(newPosition, newPosition + charactersModifiedCount)
    }
  }

}
