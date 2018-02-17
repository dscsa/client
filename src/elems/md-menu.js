import {ObserverLocator, bindable, inject} from 'aurelia-framework';

@inject(ObserverLocator, Element)
export class MdMenuCustomElement {

  constructor(observer, element) {
    //Router add both pages to view at same time.  This confuses the MDL library
    //which add the button's click handler to the previous page rather than the
    //next page since the two ids are the same.  Prevent this by randomly generating
    //the id.  Also 'for.bind' doesn't seem to work so using synomym data-md-for
    this.id = 'id'+Date.now()
    this.element = element
    this.observer = observer
  }

  click($event) {
    console.log('md-menu', $event.target.disabled, $event.target.tagName, $event.target, $event)
    if ($event.target.tagName == 'INPUT' || $event.target.disabled)
      $event.stopImmediatePropagation()

    return true //needed to continue a propogation of an <a> link
  }

  setDisabled(li, disabled) {
    disabled
      ? li.setAttribute('disabled', '')
      : li.removeAttribute('disabled')
  }

  attached() {
    for (let li of this.element.querySelectorAll('li')) {
      li.classList.add('mdl-menu__item')
      this.setDisabled(li, li.disabled)
      this.observer.getObserver(li, 'disabled').subscribe(disabled => {
        this.setDisabled(li, disabled)
      })
    }

    this.element.show = opts => {
      console.log('this.element.show', this.element, opts)
      return this.element.MaterialMenu.show(opts)
    }

    this.element.hide = opts => {
      return this.element.MaterialMenu.hide(opts)
    }

  }
}
