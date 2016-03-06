import {bindable, bindingMode} from 'aurelia-framework';

@bindable({name:'checked', defaultBindingMode: bindingMode.twoWay})
@bindable('disabled')
export class MdSwitchCustomElement {


  //This is causing double events to be fired on parents
  stopPropogation($event) {
    $event.stopPropagation(); return true
  }

  checkedChanged($new) {
    if(this.disabled || ! this.label)
      return
    //Toggle doesn't work because value can change from one object to another
    this.label.classList[ !$new ? 'remove' : 'add']('is-checked') //force to boolean
  }

  attached() {
    componentHandler.upgradeAllRegistered()
  }
}
