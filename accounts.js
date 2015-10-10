import {inject} from 'aurelia-framework';
import {Db}     from 'db/pouch'

@inject(Db)
export class accounts {

  constructor(db){

    this.db = db

    db.accounts().then(accounts => {
      this.accounts = accounts
      this.add()
      this.select(accounts[1] || accounts[0])
    })
  }

  select(account) {
    this.account = account
  }

  add() {
    this.accounts.unshift({
      name:'',
      license:'',
      street:'',
      city:'',
      state:'',
      zip:'',
      approvedBy:{}
    })
  }

  save($event, $this) {

    //Do not save if clicking around within the same transaction.
    //TODO only save if change occured
    if ($this.contains($event.relatedTarget))
      return

    if (this.account._id) {
      console.log('saving', this.account)
      return this.db.accounts.put(this.account)
    }
  }

  create() {
    this.add()
    this.select(this.account)

    console.log('adding', this.account)
    return this.db.accounts.post(this.account).then(_ => {

      console.log('adding inventory')
      this.db.shipments.post({
        from:{ name:this.account.name, account:this.account._id }
      })
    })
  }
}

//TODO make this work with added items
export class filterValueConverter {
  toView(transactions = [], filter = ''){

    filter = filter.toLowerCase()

    let result = transactions.filter(transaction => {
      return ~ `${transaction.name}`.toLowerCase().indexOf(filter)
    })

    console.log(result)

    return result
  }
}
