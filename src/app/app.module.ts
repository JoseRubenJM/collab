import { AppComponent } from './app.component'
import { BrowserModule } from '@angular/platform-browser'
import { CollaborativeTextAreaComponent } from './collaborative-text-area/collaborative-text-area.component'
import { NgModule } from '@angular/core'

@NgModule({
  declarations: [
    AppComponent,
    CollaborativeTextAreaComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
