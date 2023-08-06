import { Component, OnInit } from '@angular/core'
// import { CollaborativeText } from './services/collaborative-text.dataobject'
// import { FluidLoaderService } from './services/fluid-loader.service';
// import { CollaborativeTextContainerRuntimeFactory } from "./services/containerCode";
import { SharedMap, SharedString } from 'fluid-framework'
import { TinyliciousClient } from '@fluidframework/tinylicious-client'

@Component({
  selector: 'app-root',
  template: `
  <div>
    <h1>Collaborative TextArea Fluid Demo</h1>
    This demonstration shows how to use Fluid distributed data structures to sync data across multiple clients.
    After starting the demo (see the readme for instructions), copy the browser's URL into another tab to create another Fluid client.
    <br /><br />
    After multiple clients are available, type into the text area and notice that all changes are synced across clients.
    <br />
    <div class="text-area" *ngIf="sharedDescription">
      <app-collaborative-text-area [sharedString]="this.sharedDescription"></app-collaborative-text-area>
    </div>
  </div>
  `
})
export class AppComponent implements OnInit {
  // dataObject: CollaborativeText;
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

  // constructor(private fluidService: FluidLoaderService) {}

  async ngOnInit(): Promise<void> {
    const client = new TinyliciousClient()
    // this.fluidContainer = await client.createContainer(this.schema)
    // const id = await this.fluidContainer.container.attach()
    // console.log(id)
    // this.fluidContainer = await client.getContainer('132db1ab-8f80-4ce6-8fde-1b7121c9c0e3', this.schema)
    this.fluidContainer = await client.getContainer('be9ca19f-3bda-4342-a674-1d42e98226ed', this.schema)

    this.sharedDescription = await this.fluidContainer.container.initialObjects.description
    // console.log(this.sharedDescription)

    // this.dataObject = await this.fluidService.loadDataObject<CollaborativeText>(CollaborativeTextContainerRuntimeFactory);
  }

}
