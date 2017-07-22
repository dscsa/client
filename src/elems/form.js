import {inject, bindable} from 'aurelia-framework';

@bindable('disabled')
@inject(Element)
export class FormCustomAttribute {

  constructor(element) {
    this.element = element
    this.change  = this.change.bind(this)
  }

  change() {

    if (this.value == 'onchange' && this.serialize() == this.initialValue)
      return this.inputElement.disabled = true

    //Here we cached response because assigning to elem.disabled everytime
    //does not work if more than one input toggles on disabled (e.g., repacking form)
    const valid = this.formElement && this.formElement.checkValidity()

    if ( ! valid && ! this.cache) {
      this.cache = ! this.inputElement.disabled
      this.inputElement.disabled = true
    }

    if ( valid && this.cache) {
      this.cache = false
      this.inputElement.disabled = false
    }
  }

  attached() {
    //TODO allow attribute value to specify the form by name.
    //TODO a detached method.  Are these event listeners leaking?
    this.formElement = this.element.closest('form')
    this.formElement.addEventListener('change', this.change)
    this.formElement.addEventListener('input', this.change)

    this.inputElement = this.element.querySelector('input,button,select') || this.element

    this.initialValue = this.serialize()
    //When going "back" to "Create New Shipment" form.checkValidity() would return true
    //initially and then turn to false. setTimeout seems to eliminate this problem
    setTimeout(this.change)
  }

  serialize() {
    let s = []
    for (let field of this.formElement.elements) {
      if (field.type != 'select-multiple')
        s.push(field.value)
      else
        for (let option of field.options)
          if(option.selected)
            s.push(option.value)
    }
    return s.join('&')
  }
}
