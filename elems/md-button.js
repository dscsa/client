import {bindable, inject} from 'aurelia-framework';

@bindable('class')
@bindable('raised')
@bindable('fab')
@bindable('disabled')
@bindable('color')
@inject(Element)
export class MdButtonCustomElement {

  constructor(element) {
    this.element = element
  }

  //click.trigger won't trigger when button is disabled, but delegate will
  //but we cant use trigger because $parent's delegate will still fire regardless
  //so use delegate, but for some reason delegate stops bubbling even if we do
  //"return true" so we need to to refire the event.
  click($event) {
    //console.log('click', this.button.disabled))
    if ( ! this.disabled)
      this.element.dispatchEvent(new MouseEvent($event.type, $event))
  }

  attached() {
    if (this.class)
      this.button.classList.add(this.class)
    //attributes are made an empty string by default, so we can't just test for truthiness
    //primary and accent are dynamic/reactive based on disable so need to be in the template.
    if (typeof this.color == 'string' && this.color.slice(0, 4) != 'mdl-') {
      this.color = 'mdl-button--'+(this.color || 'colored')
    }

    if (this.fab > 0) {
      this.button.classList.add('mdl-button--fab')
      this.button.style.height = this.fab+'px'
      this.button.style.width  = this.fab+'px'
      this.button.style['min-width'] = this.button.style.width
      this.button.style['font-size'] = this.fab*.75+'px'
      this.button.style['line-height'] = this.fab+'px'
      //this.button.style['min-width'] = this.element.fab+'px'
    }

    if(this.element.parentElement.tagName == 'MD-DRAWER') {
      this.button.style.width = "100%"
      this.button.style.height = "auto"
      this.button.style.padding = "16px 8px"
      this.button.style['line-height'] = "18px"
      this.button.style['text-align'] = "left"
    }
  }

}
