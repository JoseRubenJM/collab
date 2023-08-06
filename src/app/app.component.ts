import { Component, OnInit } from '@angular/core'
import { SharedMap, SharedString } from 'fluid-framework'
import { TinyliciousClient } from '@fluidframework/tinylicious-client'

@Component({
  selector: 'app-root',
  template: `
  <div>
    <div class="text-area" *ngIf="sharedDescription">
      <app-collaborative-text-area [sharedString]="sharedDescription"></app-collaborative-text-area>
    </div>
  </div>
  `
})
export class AppComponent implements OnInit {
  fluidContainer: any = ''
  sharedDescription!: SharedString
  schema = {
    initialObjects: {
      map1: SharedMap,
      description: SharedString,
    },
    dynamicObjectTypes: [
    ]
  }

  async ngOnInit(): Promise<void> {
    const client = new TinyliciousClient()
    // this.fluidContainer = await client.createContainer(this.schema)
    // const id = await this.fluidContainer.container.attach()
    // console.log(id)
    // this.fluidContainer = await client.getContainer('132db1ab-8f80-4ce6-8fde-1b7121c9c0e3', this.schema)
    this.fluidContainer = await client.getContainer('be9ca19f-3bda-4342-a674-1d42e98226ed', this.schema)

    this.sharedDescription = await this.fluidContainer.container.initialObjects.description
  }
}
