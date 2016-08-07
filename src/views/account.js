import {inject} from 'aurelia-framework';
import {Db}     from '../libs/pouch'
import {Router} from 'aurelia-router'

//TODO this is causing Router to revert route and switches to not be upgraded @pageState()
@inject(Db, Router)
export class account {

  constructor(db, router){
    this.db           = db
    this.router       = router
  }

  activate() {

    this.db.user.session.get().then(session => {

      this.session = session

      //TODO allow a valueConverter for each state or do a new search
      this.db.account.get().then(accounts => {
        this.accounts = accounts.filter(account => {
          if (account._id != session.account._id)
            return true
          this.account = account
        })
      })

      return this.db.user.get().then(users => {
        this.users = users
        this.selectUser()
      })
    })
  }

  selectUser(user) {
    this.user = user || this.users.filter(user => user._id == this.session._id)[0]
  }

  saveUser() {
    if (this.user._id) {
      console.log('saving', this.user)
      this.db.user.put(this.user)
    }
    return true
  }

  addUser() {
    this.db.user.post(this.user).then(user => {
      this.users.unshift(user)
    }).catch(err => {
      this.snackbar.show(err.reason)
    })
  }

  deleteUser() {
    let index = this.users.indexOf(this.user)
    console.log('deleting', this.user, this.users, index)
    this.db.user.delete(this.user).then(_ => {
      this.users.splice(index, 1)
      this.selectUser()
    })
    .catch(err => {
      console.log(err)
      this.snackbar.show(err.reason)
    })
  }

  //Simple debounce doesn't work here to prevent double click
  //because account is not authorized until the db returns
  //which means isAuthorized isn't updated yet for the since click
  authorize(_id) {
    console.log('account.authorize', _id, this.account.authorized)
    let index = this.account.authorized.indexOf(_id)
    let auth  = this.db.account.authorized
    ~ index
      ? auth.delete({_id}).then(_ => this.account.authorized.splice(index, 1))
      : auth.post({_id}).then(_ => this.account.authorized.push(_id))

      return true
    //TODO reset checkbox and show snackbar if change not made
  }

  logout() {
    this.disableLogout = 'Uninstalling...'
    this.db.user.session.delete().then(_ => {
      this.router.navigate('login', {trigger:true})
    })
    .catch(err => console.log('Logout failed: '+err))
  }
}

export class jsonValueConverter {
  toView(object = null){
    //console.log(Object.keys(object), JSON.stringify(object, null, " "))
    return JSON.stringify(object, null, " ")
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
      return ~ `${user.name.first} ${user.name.last}`.toLowerCase().indexOf(filter)
    })
  }
}
