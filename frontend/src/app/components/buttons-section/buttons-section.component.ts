import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-buttons',
  templateUrl: './buttons-section.component.html',
  styleUrls: ['./buttons-section.component.css']
})
export class ButtonsSectionComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  scrollToNetwork() {
    document.querySelector('#network').scrollIntoView();
  }
}
