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
    setTimeout(_=> {
      this.div && this.div.MaterialTextfield && this.div.MaterialTextfield.checkDirty()
      this.div && this.div.MaterialTextfield && this.div.MaterialTextfield.checkValidity()
    })
  }

  disabledChanged() {
    setTimeout(_ => {
      this.div && this.div.MaterialTextfield && this.div.MaterialTextfield.checkDisabled()
      this.div && this.div.MaterialTextfield && this.div.MaterialTextfield.checkValidity()
      this.div.MaterialTextfield.input_.dispatchEvent(new Event('change', {bubbles:true})) //this is to trigger formCustomAttribute and others to reevaluate
    }) //disabled hasn't actually been changed yet so wait for the change and then check
  }

  attached() {
    componentHandler.upgradeElement(this.div)

    if ( ! this.placeholder)
      this.div.classList.remove('has-placeholder')

    if (this.autofocus || this.autofocus === '')
      this.div.MaterialTextfield.input_.focus()
  }
}
