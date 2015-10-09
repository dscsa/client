export class Db {}

let resources = ['drugs', 'accounts', 'users', 'shipments', 'transactions']
let ajax      = PouchDB.utils.toPromise(PouchDB.ajax)
let synced    = {}
let remote    = {}
let local     = {}

resources.forEach(resource => {
  remote[resource] = new PouchDB('http://localhost:3000/'+resource)
  db(resource)

  Db.prototype[resource] = selector => {
    let start = performance.now()
    if ( ! selector) {
      return local[resource].allDocs({startkey:'_design\uffff', include_docs:true}).then(doc => {
        console.log(doc, 'found:', resource, 'in', (performance.now() - start).toFixed(2), 'ms')
        return doc.rows.map(doc => doc.doc).reverse()
      })
    }
    console.log('selector', selector)
    return local[resource].find({selector}).then(doc => {
      console.log('finding', resource, JSON.stringify({selector}), 'in', (performance.now() - start).toFixed(2), 'ms')
      return doc.docs.reverse()
    })
    .catch(console.log)
  }

  Db.prototype[resource].post = body => {
    let start = Date.now()
    return ajax({method:'POST', url:'http://localhost:3000/'+resource, body})
    .then(res => {
      body._id = res.id
      body._rev = res.rev
      console.log(Date.now()-start, 'ms saved remotely, now saving locally', body)
      return Db.prototype[resource].put(body)
    })
  }

  Db.prototype[resource].put = doc => {
    return local[resource].put(doc)
    .then(res => {
      doc._rev = res.rev
      return doc
    })
  }

  Db.prototype[resource].query = map => {
    return local[resource].query({map}, {include_docs:true})
    .then(docs => docs.rows.map(doc => doc.doc).reverse())
  }

  Db.prototype[resource].remove = doc => {
    return local[resource].remove(doc)
  }
})

Db.prototype.users.session = function(find) {
  return JSON.parse(sessionStorage.getItem('session') || "null")
}

//This is find user with CouchDB functionality
Db.prototype.users.session.post = function(user) {
  let req = ajax({
    method:'POST',
    url:'http://localhost:3000/users/'+user.name+'/session',
    body:user
  })
  //Only sync resources after user login
  .then(session => {
    sessionStorage.setItem('session', JSON.stringify(session))
    return Promise.all(resources.map(name => {
      //https://github.com/pouchdb/pouchdb/issues/4266
      return remote[name].sync(local[name], {retry:true})
      .then(_ => {
        synced[name] = remote[name].sync(local[name], {live:true, retry:true})
        //Output running list of what is left because syncing takes a while
        //Can't use original index because we are deleting items as we go
        req.resources.splice(req.resources.indexOf(name), 1)
      })
    }))
    .then(_ => session)
  })
  req.resources = Object.assign([], resources)
  return req
}

Db.prototype.users.session.remove = function() {

  var user = Db.prototype.users.session()

  if ( ! user)
    return Promise.resolve(true)

  sessionStorage.removeItem('session')
  return ajax({method:'DELETE', url:'http://localhost:3000/users/'+user.name+'/session', json:false})
  .then(_ => {
    //Destroying will stop the rest of the dbs from syncing
    synced.accounts && synced.accounts.cancel();
    synced.drugs && synced.drugs.cancel();

    return Promise.all(['users', 'shipments', 'transactions']
    .map(resource => {
      return local[resource].destroy().then(_ => {
          return db(resource)
      })
    }))
    .then(_ => {
      console.log('LOGGED OUT')
    })
  })
  .catch(console.log)
}

// if (Db.prototype.users.session())
//   resources.forEach(r => {
//       synced[r] = remote[r].sync(local[r], {live:true, retry:true})
//   })

//Build all the type's indexes
function db(name) {
  local[name] = new PouchDB(name, {auto_compaction:true})
  return local[name].info().then(info => {
    if (info.update_seq === 0) { //info.update_seq
      let index
      if (name == 'drugs')
        index = ['name', 'ndc']
      else if (name == 'accounts')
        index = ['joined.to', 'joined.from']
      else if (name == 'users')
        index = ['account']
      else if (name == 'shipments')
        index = ['tracking', 'to.account', 'from.account']
      else if (name == 'transactions')
        index = ['shipment']

      for (let i of index) {
        //TODO capture promises and return Promise.all()?
        local[name].createIndex({index: {fields:[i]}})
      }
    }
  })
}
