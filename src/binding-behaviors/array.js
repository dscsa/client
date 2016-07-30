//http://stackoverflow.com/questions/32017532/observe-property-on-an-array-of-objects-for-any-changes
export class ArrayBindingBehavior {
  bind(binding, source, parameter) {
    binding.standardObserveProperty = binding.observeProperty
    binding.observeProperty = function(obj, property) {
      this.standardObserveProperty(obj, property)
      let value = obj[property]
      if (Array.isArray(value)) {
        this.observeArray(value)
        if (parameter) {
          for(let each of value) {
            this.standardObserveProperty(each, parameter)
          }
        }
      }
    }
  }

  unbind(binding, source) {
    binding.observeProperty = binding.standardObserveProperty
    binding.standardObserveProperty = null
  }
}
