import {inject, bindable, bindingMode} from 'aurelia-framework';

@bindable({name:'value', defaultBindingMode: bindingMode.twoWay})
@bindable('disabled')
@bindable('pattern')
@bindable('step')
@bindable('type')
@bindable('placeholder')
@bindable('input')
@bindable('max')
export class MdInputCustomElement {

  valueChanged() {
    setTimeout(_=> this.div && this.div.MaterialTextfield.checkDirty())
  }

  attached() {
    componentHandler.upgradeElement(this.div)
    if (this.autoselect)
      this.div.MaterialTextfield.input_.focus()
  }
}
