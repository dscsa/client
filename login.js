import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Db}     from 'db/pouch'

@inject(Db, Router)
export class login {

  constructor(db, router){
    this.db       = db
    this.router   = router
    this.name     = 'adam@sirum.org'
    this.password = 'password'
    this.db.users(true).session.remove()
    .then(_ => this.enabled = true)
  }

  login() {

    // indexedDB.deleteDatabase('drugSearch');
    // var request = window.indexedDB.open("drugSearch");
    //
    // request.onerror = function(event) {
    //     console.log("onerror1", event) ;
    // };
    //
    // request.onupgradeneeded = function(event) {
    //     const drugData = [
    //         { name: "metformin", strength:50},
    //         { name: "metformin", strength:100},
    //         { name: "zyprexa", strength:2},
    //         { name: "zyprexa", strength:50},
    //     ];
    //
    //     var db = event.target.result;
    //     var objectStore = db.createObjectStore("drugs", { keyPath:["name", "strength"] });
    //     objectStore.createIndex("name", ["name", "strength"], { unique: false });
    //     for (var i in drugData) {
    //         objectStore.add(drugData[i]);
    //     }
    // };
    //
    // request.onsuccess = function(event) {
    //   console.log('hi')
    //     var db = event.target.result;
    //     var transaction = db.transaction(['drugs'],'readonly');
    //     var store = transaction.objectStore('drugs');
    //     var index = store.index('name').openCursor(IDBKeyRange.bound(['zyprex', '100'], ['zyprex\uffff', '100\uffff']))
    //
    //     index.onsuccess = function(event) {
    //         if (! event.target.result) return
    //         alert("index.get is " + JSON.stringify(event.target.result.key) + " " + JSON.stringify(event.target.result.value));
    //         event.target.result.continue()
    //     };
    //     index.onerror = function(event) {
    //         console.log("onerror2", event) ;
    //     };
    // }

    let session = this.db.users({_id:this.name}).session

    this.enabled = false
    this.loading = session.loading

    session.post({password:this.password})
    .then(user => {
      console.log('LOGGED IN', user)
      this.router.navigate(user.account == 'admin' ? 'drugs' : 'account')
    })
    .catch(err => {
      this.enabled = true
      this.loading = null
      console.log('login failed because', err.message, err.stack)
    })
  }
}
