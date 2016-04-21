import {bindable, bindingMode, inject} from 'aurelia-framework';

@bindable({name:'checked', defaultBindingMode: bindingMode.twoWay})
@bindable('disabled')
@inject(Element)
export class MdSwitchCustomElement {

  constructor(elem) {
    //Can't do this with <template click.delegate> since that overwrites authors delegate fn
    elem.addEventListener('click', e => this.disabled && e.stopPropagation())
  }

  //A click on input causes a UI change and then if aurelia is also listening for a
  //click that causes a state change, then the two state changes cancel and it looks
  //like the switch is locked.  Prevent this from happening.
  stopPropogation($event) {
    return true
  }

  //If we are relying on parent returning true then this isn't needed, but
  //if we are binding to check to change it programmatically we need this
  checkedChanged($new) {
    this.label //When initially called the view is not attached yet
      ? this.label.MaterialSwitch[$new ? 'on' : 'off']()
      : this.$new = $new
  }

  attached() {
    componentHandler.upgradeElement(this.label)
    this.checkedChanged(this.$new)
  }
}
