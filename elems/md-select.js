import {bindable, bindingMode, inject} from 'aurelia-framework';

@bindable({name:'value', defaultBindingMode: bindingMode.twoWay})
@bindable('style')
@bindable('options')
@bindable('disabled')
@bindable('required')
@bindable('property')
export class MdSelectCustomElement {

  valueChanged() {
    setTimeout(_=> this.div && this.div.MaterialTextfield.checkDirty())
  }

  attached() {
    componentHandler.upgradeElement(this.div)
  }
}
