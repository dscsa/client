import {bindable, bindingMode} from 'aurelia-framework';

@bindable({name:'checked', defaultBindingMode: bindingMode.twoWay})
@bindable('disabled')
export class MdSwitchCustomElement {


  //This is causing double events to be fired on parents
  stopPropogation($event) {
    $event.stopPropagation(); return true
  }

  checkedChanged($new) {
    setTimeout(_=> this.label && this.label.MaterialSwitch[$new ? 'on' : 'off']())
  }

  attached() {
    componentHandler.upgradeElement(this.label)
  }
}
