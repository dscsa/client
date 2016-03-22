import {bindable, bindingMode} from 'aurelia-framework';

@bindable({name:'checked', defaultBindingMode: bindingMode.twoWay})
@bindable('disabled')
export class MdSwitchCustomElement {

  //A click on input causes a UI change and then if aurelia is also listening for a
  //click that causes a state change, then the two state changes cancel and it looks
  //like the switch is locked.  Prevent this from happening.
  stopPropogation($event) {
    //console.log('$event', $event)
    $event.preventDefault();
  }

  checkedChanged($new) {
    setTimeout(_=> this.label && this.label.MaterialSwitch[$new ? 'on' : 'off']())
  }

  attached() {
    componentHandler.upgradeElement(this.label)
  }
}
