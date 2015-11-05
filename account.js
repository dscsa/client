import {inject} from 'aurelia-framework';
import {Db}     from 'db/pouch'
import {Router} from 'aurelia-router'

//TODO this is causing Router to revert route and switches to not be upgraded @pageState()
@inject(Db, Router)
export class account {

  constructor(db, router){
    this.db = db
    this.router = router
    this.session = db.users(true).session()
  }

  activate(params) {
    this.db.accounts({_id:this.session.account._id})
    .then(accounts => { console.log('accounts', accounts[0]); this.account = accounts[0]})

    this.db.accounts({_id:{$ne:this.session.account._id}, state:this.session.account.state})
    .then(accounts => this.accounts = accounts)

    return this.db.users()
    .then(users => {
      this.users = users
      this.user  = users.filter(user => user.name == this.session.name)[0]
      this.add() //Make the user list have a "New User" button at the top
    })
  }

  add() {
    this.users.unshift({
      first:'',
      last:'',
      name:'',
      phone:'',
      password:'',
      account:this.session.account
    })
    this.users = this.users.slice() //Aurelia hack to reactivate the filter
  }

  save($event, $this) {
    //Do not save if clicking around within the same transaction.
    //TODO only save if change occured
    if ($this.contains($event.relatedTarget))
      return

    console.log('saving', this.user)

    if ( ! this.user.password)
      delete this.user.password

    if (this.user._id)
      this.db.users.put(this.user)
  }

  create($event) {
    this.add()
    this.db.users.post(this.user)
  }

  authorize(_id) {
    this.db.accounts({_id}).authorized.post()
  }

  logout() {
    this.router.navigate('login')
  }
}

export class dateValueConverter {
  toView(date = ''){  
    return date.slice(0, 10)
  }
}

//TODO make this work with added items
export class filterValueConverter {
  toView(users = [], filter = ''){
    filter = filter.toLowerCase()
    return users.filter(user => {
      return ~ `${user.first} ${user.last}`.toLowerCase().indexOf(filter)
    })
  }
}
