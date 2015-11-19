import {bindable, bindingMode, inject} from 'aurelia-framework';

@bindable({name:'value', defaultBindingMode: bindingMode.twoWay})
@bindable('style')
@bindable('options')
@bindable('disabled')
@bindable('required')
@bindable('property')
export class MdSelectCustomElement {

  attached() {
    //MDL's MaterialTextfield.prototype.updateClasses_ is called inbetween
    //the template actually being attached and this callback.  This means that
    //we need to add ".is-dirty" manually and that ${ value ? 'is_dirty' : ''}
    //on the div doesn't work as expect so we need to add it here manually
    //this.div may not exist if there is an if.bind that is false
    //Related to https://github.com/google/material-design-lite/issues/903
    (this.value || this.options[0]) && this.div.classList.add('is-dirty')
    componentHandler.upgradeAllRegistered()
  }
}
