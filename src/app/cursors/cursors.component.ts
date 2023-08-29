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

  colors: any = ''
  color: any = ''

  constructor() {
    this.colors = [
      '#E57373',
      '#9575CD',
      '#4FC3F7',
      '#81C784',
      '#FFF176',
      '#FF8A65',
      '#F06292',
      '#7986CB',
    ]
  }

  ngOnInit(): void {
    this.color = this.colors[55555 % this.colors.length]
    // console.log(this.color)
    // console.log(this.cursor.x)
  }

  // getCursorStyle(): any {
  //   return {
  //     border: '1px solid #dcdcdc',
  //     transform: 'translate(' + this.cursorX + ',' + this.cursorY + ')'
  //   }
  // }
}
// transform: 'translate(' + this.cursorX + ',' + this.cursorY + ')'
