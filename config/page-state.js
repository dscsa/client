export default function pageState() {
  return function (target) {
    let activate = target.prototype.activate || function() {}
    let attached = target.prototype.attached || function() {}

    target.prototype.activate = function(query, ...rest) {
      this.query = query

      return activate.call(this, query, ...rest)
    }

    target.prototype.attached = function(...rest) {

      for (let i in this.query) {

        if ( ~ this.query[i].indexOf('/')) {
          continue
        }

        if (i == 'focus') {
          document.getElementById(this.query.focus).focus()
          continue
        }

        let elem = document.getElementById(i)

        if (elem.nodeName != 'SELECT') {
          this[i] = this.query[i]
          continue
        }

        let all = []

        //No easy way to know which promise we are waiting on
        //e.g., donor = Clinic1 => this.donors. So wait for all
        for (let i in this)
          if (this[i].then)
            all.push(this[i])

        Promise.all(all).then(_ => {
          for (let j in elem.options)
            if (elem.options[j].textContent == this.query[i])
              this[i] = elem.options[j].model || elem.options[j].value
        })
      }

      return attached.call(this, ...rest)
    }
  }
}
