import { AfterViewInit, Component, ViewChild, ViewEncapsulation } from '@angular/core'
import { AzureClient, AzureContainerServices, AzureMember } from '@fluidframework/azure-client'
import { ICursor, schema } from '../interfaces/fluid'
import { IFluidContainer, IServiceAudience, SharedMap } from 'fluid-framework'
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
  description?: any
  selectionEnd: number = 0
  selectionStart: number = 0

  cursor?: ICursor
  cursors: ICursor[] = []
  userId?: string

  client!: AzureClient
  fluidContainer!: { container: IFluidContainer; services: AzureContainerServices }
  sharedDescription!: SharedMap
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
    this.fluidContainer = await client.getContainer('9083d626-6d92-4a81-95fa-1761f604775b', this.schema)

    this.sharedDescription = this.fluidContainer.container.initialObjects.description as SharedMap
    this.sharedCursor = this.fluidContainer.container.initialObjects.cursor as SharedMap
    this.audience = this.fluidContainer.services.audience

    // Editor initialization
    this.editor = this.editorEl.quill
    this.editor.container.style.whiteSpace = 'pre-line'

    this.syncData()

  }

  syncData(): void {
    this.sharedDescription.on('valueChanged', () => {
      console.log('sharedDescriptionChanged')

      if (this.userId !== this.sharedDescription.get('delta').userId){
        this.editor.updateContents(this.sharedDescription.get('delta').delta)
      }

    })

    this.sharedCursor.on('valueChanged', () => {
      console.log('sharedCursorChanged')
      if (this.userId !== this.sharedCursor.get('cursor').userId){
        this.cursor = this.sharedCursor.get('cursor')
      }
    })

    this.audience.on('membersChanged', () => {
      this.userId = this.audience.getMyself()?.userId
    })

  }

  onTextChange(event: any): void {
    console.log('onTextChange')

    this.sharedDescription.set('delta', {
      userId: this.userId,
      delta: event.delta
    })

  }

  handleMouseMove(event: any): void {
    console.log(event)
    this.sharedCursor.set('cursor', {
      userId: this.userId,
      x: Math.round(event.pageX),
      y: Math.round(event.pageY)
    })
  }

  onClickUndo(): void {
    this.editor.history.undo()
  }

  onClickRedo(): void {
    this.editor.history.redo()
  }

}
