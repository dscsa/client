import {bindable, inject} from 'aurelia-framework';

@inject(Element)
export class MdMenuCustomElement {

  constructor(element) {
    //Router add both pages to view at same time.  This confuses the MDL library
    //which add the button's click handler to the previous page rather than the
    //next page since the two ids are the same.  Prevent this by randomly generating
    //the id.  Also 'for.bind' doesn't seem to work so using synomym data-md-for
    this.id = 'id'+Math.floor(Math.random()*1000)
    this.element = element

  }

  attached() {
    for (let li of this.element.querySelectorAll('li'))
      li.classList.add('mdl-menu__item')
  }
}
