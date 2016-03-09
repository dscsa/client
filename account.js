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

    //this.db.accounts({_id:{$ne:this.session.account._id}, state:this.session.account.state})
    //.then(accounts => this.accounts = accounts)
    Promise.all([
      this.db.accounts({state:this.session.account.state, _id:{$lt:this.session.account._id}}),
      this.db.accounts({state:this.session.account.state, _id:{$gt:this.session.account._id}})
    ]).then(all => this.accounts = [...all[0], ...all[1]])

    return this.db.users()
    .then(users => {
      this.users = users
      this.user  = users.filter(user => user.name == this.session.name)[0]
      this.add() //Make the user list have a "New User" button at the top
    })
  }

  select(user) {
    user.password = ''
    this.user = user
  }

  add() {
    this.users.unshift({
      first:'',
      last:'',
      name:'',
      phone:'',
      password:'',
      account:{_id:this.session.account._id}
    })
    this.users = this.users.slice() //Aurelia hack to reactivate the filter
  }

    //Do not save if clicking around within the same transaction.
    //TODO only save if change occured
    if (form.contains($event.relatedTarget))
      return
  saveUser() {

    console.log('saving', this.user)

    if ( ! this.user.password)
      delete this.user.password

    if (this.user._id)
      this.db.users.put(this.user)
  }

  addUser() {
    this.add()
    this.db.users.post(this.user)
  }

  //Simple debounce doesn't work here to prevent double click
  //because account is not authorized until the db returns
  //which means isAuthorized isn't updated yet for the since click
  authorize(_id) {
    let isAuthorized = ~ this.account.authorized.indexOf(_id)
    console.log(isAuthorized ? 'remove' : 'post')
    this.db.accounts({_id}).authorized[isAuthorized ? 'remove' : 'post']()
    //TODO reset checkbox and show snackbar if change not made
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
