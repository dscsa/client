import {bindable, bindingMode, inject} from 'aurelia-framework';

@bindable({name:'checked', defaultBindingMode: bindingMode.twoWay})
@bindable('disabled')
@bindable('required')
@inject(Element)
export class MdCheckboxCustomElement {

  constructor(element) {
    this.tabindex = element.tabIndex
    //Can't do this with <template click.delegate> since that overwrites authors delegate fn
    element.addEventListener('click', e => this.disabled && e.stopPropagation())
  }

  //A click on input causes a UI change and then if aurelia is also listening for a
  //click that causes a state change, then the two state changes cancel and it looks
  //like the switch is locked.  Prevent this from happening.
  stopPropogation() {
    return true
  }

  //If we are relying on parent method returning true then this isn't needed,
  //but if we are binding to check to change it programmatically we need this

  checkedChanged() {
    this.checked = !! this.checked //force boolean or we get weird behavior
    setTimeout(_ => this.label && this.label.MaterialCheckbox.checkToggleState()) //checked hasn't actually been changed yet so wait for the change and then check
  }

  disabledChanged() {
    setTimeout(_ => this.label && this.label.MaterialCheckbox.checkDisabled()) //disabled hasn't actually been changed yet so wait for the change and then check
  }

  attached() {

    componentHandler.upgradeElement(this.label)
    this.checkedChanged()
    this.disabledChanged()
  }
}
