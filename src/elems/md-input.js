import {inject, bindable, bindingMode} from 'aurelia-framework';

@bindable({name:'value', defaultBindingMode: bindingMode.twoWay})
@bindable('disabled')
@bindable('pattern')
@bindable('step')
@bindable('type')
@bindable('placeholder')
@bindable('input')
@bindable('max')
@bindable('required')
@bindable('minlength')
export class MdInputCustomElement {

  valueChanged() {
    setTimeout(_=> {
      this.div && this.div.MaterialTextfield && this.div.MaterialTextfield.checkDirty()
      this.div && this.div.MaterialTextfield && this.div.MaterialTextfield.checkValidity()
    })
  }

  disabledChanged() {
    setTimeout(_ => this.div && this.div.MaterialTextfield && this.div.MaterialTextfield.checkDisabled()) //disabled hasn't actually been changed yet so wait for the change and then check
  }

  attached() {
    componentHandler.upgradeElement(this.div)

    if ( ! this.placeholder)
      this.div.classList.remove('has-placeholder')

    if (this.autoselect)
      this.div.MaterialTextfield.input_.focus()
  }
}