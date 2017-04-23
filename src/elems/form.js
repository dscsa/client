import {inject} from 'aurelia-framework';

@inject(Element)
export class FormCustomAttribute {

  constructor(element) {
    this.element = element
    this.change  = this.change.bind(this)
  }

  change() {
    this.inputElement.disabled = this.formElement && ! this.formElement.checkValidity()
  }

  attached() {
    //TODO allow attribute value to specify the form by name.
    //TODO a detached method.  Are these event listeners leaking?
    this.formElement = this.element.closest('form')
    this.formElement.addEventListener('change', this.change)
    this.formElement.addEventListener('input', this.change)

    this.inputElement = this.element.querySelector('input,button,select') || this.element

    //When going "back" to "Create New Shipment" form.checkValidity() would return true
    //initially and then turn to false. setTimeout seems to eliminate this problem
    setTimeout(this.change)
  }
}
