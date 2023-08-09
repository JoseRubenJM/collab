import { RouterModule, Routes } from '@angular/router'
import { CollaborativeTextAreaComponent } from './editor/editor.component'
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
