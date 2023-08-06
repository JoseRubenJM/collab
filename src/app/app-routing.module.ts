import { RouterModule, Routes } from '@angular/router'
import { CollaborativeTextAreaComponent } from './collaborative-text-area/collaborative-text-area.component'
import { NgModule } from '@angular/core'

const routes: Routes = [
  {
    path: '',
    component: CollaborativeTextAreaComponent
  }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
