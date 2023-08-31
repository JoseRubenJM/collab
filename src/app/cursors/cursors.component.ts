import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core'
import { ICursor } from '../interfaces/fluid'

@Component({
  selector: 'app-cursors',
  templateUrl: './cursors.component.html',
  styleUrls: ['./cursors.component.sass'],
  encapsulation: ViewEncapsulation.None,
})
export class CursorsComponent implements OnInit {
  @Input('cursor') cursor!: ICursor
  @ViewChild('cursorIcon') cursorIcon!: any

  ngOnInit(): void {
    console.log()
  }

}
