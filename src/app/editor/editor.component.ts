import { AfterViewInit, Component, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core'
import { AzureClient, AzureContainerServices, AzureMember } from '@fluidframework/azure-client'
import { ICursor, schema } from '../interfaces/fluid'
import { IFluidContainer, IServiceAudience, SharedMap } from 'fluid-framework'
import { AzureFluidRelayService } from '../services/azure-fluid-relay.service'
import { Editor } from 'primeng/editor'
import { TinyliciousClient } from '@fluidframework/tinylicious-client'
import { v4 as uuidv4 } from 'uuid'

@Component({
  selector: 'app-collaborative-text-area',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.sass'],
  encapsulation: ViewEncapsulation.None,
})

export class CollaborativeTextAreaComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editor') editorEl!: Editor

  editor!: any
  description?: any
  selectionEnd: number = 0
  selectionStart: number = 0

  // cursor: any = ''
  cursors: ICursor[] = []
  userId?: string
  uuidv4: string = uuidv4()

  color!: string
  colors: string[] = []

  client!: AzureClient
  fluidContainer!: { container: IFluidContainer; services: AzureContainerServices }
  sharedDelta!: SharedMap
  sharedDescription!: SharedMap
  sharedCursors!: SharedMap
  sharedCursorMap!: SharedMap
  sharedCursor!: any
  cursorHandle!: any
  schema = schema
  audience!: IServiceAudience<AzureMember<any>>

  constructor(
    public azureClient: AzureFluidRelayService,
    // public readonly globalStorage: GlobalStorageService,
  ){
    this.colors = [
      '#e57373',
      '#c91e1e',
      '#9575cd',
      '#541ab8',
      '#007fba',
      '#41b547',
      '#038c0a',
      '#dbc60d',
      '#f7710a',
      '#fa4b85',
      '#d1027b',
      '#7986cb',
    ]
  }

  async ngAfterViewInit(): Promise<void> {
    this.client = this.azureClient.getClient()
    // this.fluidContainer = await this.client.createContainer(this.schema); const id = await this.fluidContainer.container.attach(); console.log(id)
    this.fluidContainer = await this.client.getContainer('a77e4af0-8f4f-472b-8cde-c64b09975999', this.schema)

    // const client = new TinyliciousClient()
    // this.fluidContainer = await client.createContainer(this.schema); const id = await this.fluidContainer.container.attach(); console.log(id)
    // this.fluidContainer = await client.getContainer('affcd72a-f3c7-4c5d-9fb5-bb024495adba', this.schema)

    this.audience = this.fluidContainer.services.audience
    this.sharedDelta = this.fluidContainer.container.initialObjects.delta as SharedMap
    this.sharedDescription = this.fluidContainer.container.initialObjects.description as SharedMap

    this.sharedCursors = this.fluidContainer.container.initialObjects.cursors as SharedMap
    this.sharedCursorMap = await this.fluidContainer.container.create(SharedMap)
    this.sharedCursors.set(this.uuidv4, this.sharedCursorMap.handle)
    this.cursorHandle = this.sharedCursors.get(this.uuidv4)
    this.sharedCursor = await this.cursorHandle.get()

    // Editor initialization
    this.editor = this.editorEl.quill
    this.editor.setContents(this.sharedDescription.get('contents'))
    // this.editor.container.style.whiteSpace = 'pre-line'

    this.syncData()

  }

  syncData(): void {

    this.sharedDelta.on('valueChanged', () => {
      // console.log('sharedDescriptionChanged')

      if (this.uuidv4 !== this.sharedDelta.get('delta').userId){
        this.editor.updateContents(this.sharedDelta.get('delta').delta)
      }

      this.sharedDescription.set('contents', this.editor.getContents())

    })

    this.sharedCursors.on('valueChanged', () => {
      console.log('sharedCursorChanged')

      this.sharedCursors.forEach(async (value: any, key: any) => {
        const cursorHandle = this.sharedCursors.get(key)
        const sharedCursor = await cursorHandle.get()
        if (key !== this.uuidv4){
          sharedCursor.on('valueChanged', () => {
            const cursorIndex = this.cursors.findIndex((cursor: any) => {
              return cursor.userId === sharedCursor.get('cursor').userId
            })
            if (cursorIndex >= 0){
              this.cursors[cursorIndex] = sharedCursor.get('cursor')
            } else {
              this.cursors.push(sharedCursor.get('cursor'))
            }
          })
        }
      })
    })

    this.audience.on('membersChanged', () => {
      // this.userId = this.audience.getMyself()?.userId

      // if (this.userId){
      //   console.log(this.userId)
      // }
      // console.log(this.audience.getMembers())

    })

  }

  onTextChange(event: any): void {
    console.log('onTextChange')

    this.sharedDelta.set('delta', {
      userId: this.uuidv4,
      delta: event.delta
    })

  }

  async onMouseMove(event: any): Promise<void> {
    if (!this.sharedCursor){ return }

    this.sharedCursor.set('cursor', {
      userId: this.uuidv4,
      color: this.colors[1],
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

  ngOnDestroy(): void {
    this.sharedCursors.delete(this.uuidv4)
  }
}
