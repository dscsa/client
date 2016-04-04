import {bindable, bindingMode} from 'aurelia-framework';

@bindable({name:'checked', defaultBindingMode: bindingMode.twoWay})
@bindable('disabled')
export class MdSwitchCustomElement {

  //A click on input causes a UI change and then if aurelia is also listening for a
  //click that causes a state change, then the two state changes cancel and it looks
  //like the switch is locked.  Prevent this from happening.
  stopPropogation($event) {
    return true
  }

  //If we are relying on parent returning true then this isn't needed, but
  //if we are binding to check to change it programmatically we need this
  checkedChanged($new) {
    this.label && this.label.MaterialSwitch[$new ? 'on' : 'off']()
  }

  attached() {
    componentHandler.upgradeElement(this.label)
  }
}
