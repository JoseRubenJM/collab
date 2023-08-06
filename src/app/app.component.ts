import { AzureClient, AzureContainerServices } from '@fluidframework/azure-client'
import { Component, OnInit } from '@angular/core'
import { IFluidContainer, SharedString } from 'fluid-framework'
import { AzureFluidRelayService } from './services/azure-fluid-relay.service'
import { schema } from './interfaces/fluid'

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit {
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
  }
}
