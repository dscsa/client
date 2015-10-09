import {inject} from 'aurelia-framework';

@inject(Element)
export class MdTableCustomAttribute {

  constructor(element) {

    //TODO does this render multiple ones per table. Maybe we just add to head once.
    let css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML =
      `.mdl-data-table td {
        border:none;
      }`;

    document.body.appendChild(css);

    element.classList.add("mdl-data-table")
    element.classList.add("mdl-js-data-table")
    element.style.border = "none"

    if (element.getAttribute('md-table'))
      element.classList.add("mdl-data-table--selectable")

    this.element = element
    //this.checkboxes = element.querySelector('')
  }

  valueChanged(selectable) {

    let checkboxes = this.element.querySelectorAll('input[type="checkbox"]')

    for (var i=0; i < checkboxes.length; i++) {
      checkboxes[i].disabled = selectable == 'false'
    }
  }

  attached() {

    componentHandler.upgradeAllRegistered()
  }
}
