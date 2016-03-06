import {bindable, bindingMode} from 'aurelia-framework';

@bindable({name:'checked', defaultBindingMode: bindingMode.twoWay})
@bindable('disabled')
export class MdCheckboxCustomElement {

  //This is causing double events to be fired on parents
  stopPropogation($event) {
    $event.stopPropagation(); return true
  }

  checkedChanged($new) {
    if(this.disabled || ! this.label)
      return

    this.label.classList[ !$new ? 'remove' : 'add']('is-checked')
  }

  attached() {
    componentHandler.upgradeAllRegistered();
  }
}
