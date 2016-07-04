import {inject} from 'aurelia-framework';

//Create the drawer container so that MDL can find it
//MDL code runs before the constructor so need it outside class
let header = document.querySelector('.mdl-layout__header')
let drawer = document.createElement('nav')
drawer.classList.add("mdl-layout__drawer")
header.parentNode.insertBefore(drawer, header.nextSibling)

@inject(Element)
export class MdDrawerCustomElement {

  constructor(element) {
    element.classList.add("mdl-navigation")
    element.style['padding-top'] = '6px'

    this.autofocus = element.hasAttribute('autofocus')

    //Move md-nav into the drawer
    drawer.appendChild(element)
  }

  attached() {
    componentHandler.upgradeAllRegistered()

    this.button = document.querySelector('.mdl-layout__drawer-button')
    this.button.style.display = 'block'

    if (this.autofocus)
      header.firstChild.click()
  }

  detached() {
    //New drawer is attached before old drawer is detached so children.length == 2
    //except if going to view without a drawer (e.g login) in which length == 1
    //console.log('detached', drawer.children.length)
    if (drawer.children.length == 1)
      this.button.style.display = 'none'

    //Empty the drawer
    drawer.removeChild(drawer.firstChild)
  }
}
