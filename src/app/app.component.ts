import { Component, OnInit } from '@angular/core'
import { SharedMap, SharedString } from 'fluid-framework'
import { AzureClient } from '@fluidframework/azure-client'
import { InsecureTokenProvider } from '@fluidframework/test-client-utils'
// import { TinyliciousClient } from '@fluidframework/tinylicious-client'

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
  type: any = 'remote'
  client: any = ''

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
    const clientProps = {
			connection: {
				type: this.type,
				tenantId: '58ac4cc5-399e-4fcc-a01f-b5ce17dcf891',
				tokenProvider: new InsecureTokenProvider('a438d403becde61cbd444f59d2f7a07b', { id: '' }),
				endpoint: 'https://us.fluidrelay.azure.com',
			},
		}

		this.client = new AzureClient(clientProps)
    // this.fluidContainer = await this.client.createContainer(this.schema)
    // const id = await this.fluidContainer.container.attach()
    // console.log(id)
    this.fluidContainer = await this.client.getContainer('2164a0e1-fba8-4300-9bc0-b6cc4b143e3a', this.schema)
    this.sharedDescription = await this.fluidContainer.container.initialObjects.description

    // this.client = new TinyliciousClient()
    // // this.fluidContainer = await this.client.createContainer(this.schema)
    // // const id = await this.fluidContainer.container.attach()
    // // console.log(id)
    // // this.fluidContainer = await this.client.getContainer('132db1ab-8f80-4ce6-8fde-1b7121c9c0e3', this.schema)
    // this.fluidContainer = await this.client.getContainer('be9ca19f-3bda-4342-a674-1d42e98226ed', this.schema)

    // this.sharedDescription = await this.fluidContainer.container.initialObjects.description
  }
}
