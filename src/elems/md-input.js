import {inject, bindable, bindingMode} from 'aurelia-framework';

@bindable({name:'value', defaultBindingMode: bindingMode.twoWay})
@bindable('disabled')
@bindable('pattern')
@bindable('step')
@bindable('type')
@bindable('placeholder')
@bindable('input')
@bindable('max')
@bindable('min')
@bindable('required')
@bindable('minlength')
@bindable('maxlength')
@bindable('autofocus')
export class MdInputCustomElement {

  valueChanged() {
    this.changed('checkDirty')
  }

  disabledChanged() {
    this.changed('checkDisabled')
  }

  maxChanged() {
    this.changed()
  }

  minChanged() {
    this.changed()
  }

  maxlengthChanged() {
    this.changed()
  }

  minlengthChanged() {
    this.changed()
  }

  requiredChanged() {
    this.changed()
  }

  changed(methodName) {
    setTimeout(_=> {
      if ( ! this.div || ! this.div.MaterialTextfield) return
      methodName && this.div.MaterialTextfield[methodName]()
      this.div.MaterialTextfield.checkValidity()
      this.div.MaterialTextfield.input_.dispatchEvent(new Event('change', {bubbles:true})) //this is to trigger formCustomAttribute and others to reevaluate
    })
  }

  attached() {
    componentHandler.upgradeElement(this.div)

    if ( ! this.placeholder && this.type != 'date')
      this.div.classList.remove('has-placeholder')

    if (this.autofocus || this.autofocus === '')
      this.div.MaterialTextfield.input_.focus()
  }
}
