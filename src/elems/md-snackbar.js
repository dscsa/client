import {bindable, inject} from 'aurelia-framework';

@bindable('show')
@inject(Element)
export class MdSnackbarCustomElement {

  constructor(element) {
    this.element = element
  }

  attached() {
    componentHandler.upgradeElement(this.element)
    this.element.show = opts => {
      if (typeof opts == 'string')
        opts = {message:opts, timeout:8000}

      this.element.MaterialSnackbar.showSnackbar(opts)
    }
  }
}
