import {inject} from 'aurelia-framework';

//Create the drawer container so that MDL can find it
let drawer = document.createElement('nav')
let header = document.querySelector('.mdl-layout__header')
drawer.classList.add("mdl-layout__drawer")
header.parentNode.insertBefore(drawer, header.nextSibling)

@inject(Element)
export class MdDrawerCustomElement {

  constructor(element) {

    element.classList.add("mdl-navigation")
    element.style['padding-top'] = '6px'

    //Empty the drawer
    if (drawer.firstChild)
      drawer.removeChild(drawer.firstChild);

    //Move md-nav into the drawer
    drawer.appendChild(element)
  }

  attached() {

    componentHandler.upgradeAllRegistered()
  }
}
