import {inject, bindable, bindingMode} from 'aurelia-framework';

@bindable({name:'value', defaultBindingMode: bindingMode.twoWay})
@bindable('disabled')
@bindable('pattern')
@bindable('step')
@bindable('type')
@bindable('placeholder')
@bindable('input')
@bindable('max')
@inject(Element)
export class MdInputCustomElement {

  constructor(element) {
    this.autoselect = element.attributes.autoselect
  }

  attached() {
    //console.log('autoselect', this.autoselect)
    componentHandler.upgradeAllRegistered();
    if (this.autoselect)
      this.myInput.focus()
  }
}
