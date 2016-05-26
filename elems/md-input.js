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
export class MdInputCustomElement {

  valueChanged() {
    setTimeout(_=> {
      this.div && this.div.MaterialTextfield && this.div.MaterialTextfield.checkDirty()
      this.div && this.div.MaterialTextfield && this.div.MaterialTextfield.checkValidity()
    })
  }

  attached() {
    componentHandler.upgradeElement(this.div)
    if (this.autoselect)
      this.div.MaterialTextfield.input_.focus()
  }
}
