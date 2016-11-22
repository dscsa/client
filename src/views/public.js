import {inject} from 'aurelia-framework';
import {Db}     from '../libs/pouch'
import {canActivate} from '../resources/helpers'

@inject(Db)
export class inventory {

  constructor(db){
    this.db = db
    this.db.user.session.get().then(session => this.session = session)
    this.db.transaction.get({inventory:"sum"}).then(inventory => this.inventory = inventory)
    this.canActivate = canActivate
  }
}
