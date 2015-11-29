import {bindable, bindingMode} from 'aurelia-framework';

@bindable({name:'value', defaultBindingMode:bindingMode.twoWay})
@bindable('query')
@bindable('select')
@bindable('disabled')
@bindable('placeholder')
export class MdAutocompleteCustomElement {

  bind(parent) {
    this.parent = parent
  }

  valueChanged(now, old) {
    let query = this.query.call(this.parent, now, old)

    if ( ! query.then)
      query = Promise.resolve(query)

    query.then(items => {
      this.show = now && items.length
      this.items = items
    })
  }

  action(item) {
    this.select.call(this.parent, item)
    this.show = false
  }
}
