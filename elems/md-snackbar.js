import {bindable, inject} from 'aurelia-framework';

@bindable('show')
@inject(Element)
export class MdSnackbarCustomElement {

  constructor(element) {
    this.element = element
  }

  attached() {
    this.element.show = this.element.MaterialSnackbar.showSnackbar.bind(this.element.MaterialSnackbar)
  }
}
