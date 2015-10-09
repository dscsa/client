//Inspired by FoundationDB.  Rather than building in large nested arrays
//Use the id keys to nest child tables alphabetically
export let tables = [
  'accounts/:id',
  'accounts/:id/approvedRecipients/:id',
  'accounts/:id/approvedDrugs/form/:form/name/:name',
  'accounts/:id/users/:id',
  'transactions/:id',
  'transactions/:id/drugs/:id',
  'drugs/form/:form/name/:name/ndc/:ndc'
]

export let accounts = [
   { name:'SNF1',    description:'none', license:'RCFE', registered:{from:'03/10/85', to:'03/10/85'}},
   { name:'Clinic1', description:'none', license:'RCFE', registered:{from:'03/10/85', to:'03/10/85'}},
   { name:'Clinic2', description:'none', license:'RCFE', registered:{from:'03/10/85', to:'03/10/85'}}
]

export let drugs = [
  { name:'Atorvastatin', strength:'20mg', form:'Tablet',    brand:'Lipitor', type:'Rx', nadac:{price:1.20,  date:'03/2/14'}, labeler:'Pfizer', ndc:'8or9digitNDC1', ndc8:'8digitNDC1', ndc9:'9digitNDC1', source:'9digitNDC', image:'http://pillbox.nlm.nih.gov/assets/large/672530180.jpg', imprint:'', score:'', size:'', color:'', shape:''},
  { name:'Olanzapine',   strength:'5mg',  form:'Tablet',    brand:'Generic', type:'Rx', nadac:{price:0.05,  date:'03/2/14'}, labeler:'Pfizer', ndc:'8or9digitNDC2', ndc8:'8digitNDC2', ndc9:'9digitNDC2', source:'9digitNDC', image:'http://pillbox.nlm.nih.gov/assets/large/633040696.jpg', imprint:'', score:'', size:'', color:'', shape:''},
  { name:'Olanzapine',   strength:'10mg', form:'Tablet',    brand:'Zyprexa', type:'Rx', nadac:{price:2.60,  date:'03/2/14'}, labeler:'Pfizer', ndc:'8or9digitNDC3', ndc8:'8digitNDC3', ndc9:'9digitNDC3', source:'9digitNDC', image:'http://pillbox.nlm.nih.gov/assets/large/005915708.jpg', imprint:'', score:'', size:'', color:'', shape:''},
  { name:'Olanzapine',   strength:'15mg', form:'Injection', brand:'Zyprexa', type:'Rx', nadac:{price:66.32, date:'03/2/14'}, labeler:'Pfizer', ndc:'8or9digitNDC4', ndc8:'8digitNDC4', ndc9:'9digitNDC4', source:'9digitNDC', image:'http://pillbox.nlm.nih.gov/assets/large/005912882.jpg', imprint:'', score:'', size:'', color:'', shape:''}
]

// export let donations = [
//   {  tracking:'BCD',donor:{}, donee:{}, date:{pickup:null, shipped:null, received:null, verified:null}},
//   {  tracking:'ABC',donor:{}, donee:{}, date:{pickup:null, shipped:null, received:null, verified:null}},
//   {  tracking:'ABC',donor:{}, donee:{}, date:{pickup:null, shipped:null, received:null, verified:null}},
//   {  tracking:'ABC',donor:{}, donee:{}, date:{pickup:null, shipped:null, received:null, verified:null}},
//   {  tracking:'ABC',donor:{}, donee:{}, date:{pickup:null, shipped:null, received:null, verified:null}},
//   {  tracking:'ABC',donor:{}, donee:{}, date:{pickup:null, shipped:null, received:null, verified:null}}
// ]

// export let users = [
//   { account:1, email:'adam@sirum.org',  name:{first:'Adam', last:'Kircher'}, salt:'111', password:'secret1'},
//   { account:1, email:'kiah@sirum.org',  name:{first:'Adam', last:'Kircher'}, salt:'222', password:'secret2'},
//   { account:1, email:'george@sirum.org',name:{first:'Adam', last:'Kircher'}, salt:'333', password:'secret3'}
// ]

// let approvedDonee = [
//   { account:1, donees:['2'], names:['Clinic1']},
//   { account:1, donees:['3'], names:['Clinic2']},
//   { account:2, donees:['3'], names:['Clinic2']}
// ]
//
// let approvedDrugs = [
//    { account:1, form:'Injection', names:['Atorvastatin', 'Olanzapine']},
//    { account:1, form:'Tablet',    names:['Olanzapine']},
//    { account:2, form:'Tablet',    names:['Atorvastatin', 'Olanzapine']}
// ]
