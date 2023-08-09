import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
import { BrowserModule } from '@angular/platform-browser'
import { CollaborativeTextAreaComponent } from './editor/editor.component'
import { EditorModule } from 'primeng/editor'
import { FormsModule } from '@angular/forms'
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'

@NgModule({
  declarations: [
    AppComponent,
    CollaborativeTextAreaComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    RouterModule,
    EditorModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
