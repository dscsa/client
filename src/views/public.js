import {inject} from 'aurelia-framework';
import {Pouch}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {canActivate} from '../resources/helpers'

@inject(Pouch, Router)
export class inventory {

  constructor(db, router){
    this.db = db
    this.router = router
    this.canActivate = canActivate
  }

  activate(params) {
    function reduce(accumulate, account, index) {
      return account._id == params.id ? index : accumulate
    }

    this.db.account.get().then(accounts => {
      this.accounts = accounts
      this.selectAccount(this.accounts.reduce(reduce))
    })
  }

  selectAccount($index) {
    this.account = this.accounts[$index]._id
    this.router.navigate('inventory/'+this.account, {trigger:false})
    this.db.transaction.get({inventory:"sum", account:this.account}).then(inventory => this.inventory = inventory)
  }
}
