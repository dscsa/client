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

  //.trigger is needed in html rather than .delegate to make sure it is called before parent delegates that may have been attached first
  click($event) {
      console.log($event);
    if ($event.target.tagName != 'INPUT' && ! $event.target.disabled)
      return true //needed to continue a propogation of an <a> link

    $event.stopImmediatePropagation();
  }

  openCloseButtonClick(){
      //the click is an open event if the element doesn't have the 'is-visible' class
      //if the element is already visible, then we're closing
      const isOpenClick = !this.element.querySelector('.mdl-menu__container').classList.contains('is-visible');

      const eventName = isOpenClick ? 'open' : 'close';

      const event = new Event(eventName);

      this.element.dispatchEvent(event);
  }

  setDisabled(li, disabled) {
    disabled
      ? li.setAttribute('disabled', '')
      : li.removeAttribute('disabled')
  }

  //Copied code without animation from
  //https://github.com/google/material-design-lite/blob/mdl-1.x/src/menu/menu.js
  resize() {
     var height = this.ul.getBoundingClientRect().height
     var width = this.ul.getBoundingClientRect().width

     console.log('resize', height, width)
     //console.dir(this.ul)
     // Apply the inner element's size to the container and outline.
     this.ul.MaterialMenu.container_.style.width = width + 'px'
     this.ul.MaterialMenu.container_.style.height = height + 'px'
     this.ul.MaterialMenu.outline_.style.width = width + 'px'
     this.ul.MaterialMenu.outline_.style.height = height + 'px'
     this.ul.style.clip = 'rect(0 ' + width + 'px ' + height + 'px 0)'
  }

  attached() {
    for (let li of this.element.querySelectorAll('li')) {
      li.classList.add('mdl-menu__item')
      this.setDisabled(li, li.disabled)
      this.observer.getObserver(li, 'disabled').subscribe(disabled => {
        this.setDisabled(li, disabled)
      })
    }

    this.element.resize = opts => {
      return setTimeout(_ => this.resize(opts), 100) //give Aurelia time to readjust its for.repeats
    }

  }
}
