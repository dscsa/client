import {bindable, bindingMode} from 'aurelia-framework';

@bindable({name:'checked', defaultBindingMode: bindingMode.twoWay})
@bindable('disabled')
export class MdCheckboxCustomElement {

  //This is causing double events to be fired on parents
  stopPropogation($event) {
    $event.stopPropagation(); return true
  }

  checkedChanged($new) {
    //Unfortunately this initially gets called before this.label is set.
    //Ignore this call, and then manually call it after component attaches.
    if(this.disabled || ! this.label)
      return
    //Toggle doesn't work because value can change from one object to another
    this.label.classList[ !$new ? 'remove' : 'add']('is-checked') //force to boolean
  }

  attached() {
    componentHandler.upgradeAllRegistered();
    this.checkedChanged(this.checked)
  }
}
