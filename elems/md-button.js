import {bindable, inject} from 'aurelia-framework';

@bindable('class')
@bindable('disabled')
@bindable('primary')
@bindable('accent')
@bindable('raised')
@bindable('fab')
@inject(Element)
export class MdButtonCustomElement {

  constructor(element) {
    this.element = element
  }

  //Not sure why I need this function at all.  Without it click.delegate on md-button
  //would fire even when button was disabled.  Also just having this function stops
  //event propogation, so we must redispatch the event
  click($event) {
    return  ! this.button || ! this.button.disabled
    //this.element.dispatchEvent(new MouseEvent($event.type, $event))
  }


  attached() {

    if(this.element.parentElement.tagName != 'MD-DRAWER')
      return

    this.button.style.width = "100%"
    this.button.style.height = "auto"
    this.button.style.padding = "16px 8px"
    this.button.style['line-height'] = "18px"
    this.button.style['text-align'] = "left"
  }

}
