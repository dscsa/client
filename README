# client
Application that uses the RESTful API written with the Aurelia framework

## install development
- [install node](https://nodejs.org/en/download/current)
- [install couchdb](http://couchdb.apache.org/#download)
- install git
```
sudo npm install -g aurelia-cli@^0.16.1                                #install dev tool

sudo mkdir -p dscsa/repos/node_modules dscsa/install/keys              #create the directories we need                         
sudo nano dscsa/install/keys/dev.js                                    #add your couchdb credentials
cd dscsa/repos && sudo ln -s ../install/keys keys                      #create a symlink in the repos folder

sudo npm install dscsa/client --prefix='../install'                    #install the app
sudo npm install dscsa/development --prefix='../install'               #install the development environment
 #Running npm install might bring up some errors because there is no package.json folder in dscsa/client or server. You can ignore these.
cd node_modules && sudo ln -s ../install/node_modules/* ./             #does making aliases here first help?

sudo rm -R client && sudo git clone https://github.com/dscsa/client
sudo rm -R server && sudo git clone https://github.com/dscsa/server
sudo rm -R db && sudo git clone https://github.com/dscsa/pouch
sudo rm -R csv && sudo git clone https://github.com/dscsa/csv

sudo mv pouch db

#Make sure couchDB is running on your local computer
sudo node server                                                       #run the server api
#Duplicate terminal tab                                               
cd client && sudo au run —-watch                                       #start dev environment
```
Test that both http://localhost and http://localhost:9000 now serve the app

##Your local "dscsa" directory should look like this:
```
- install
    - keys
    - node_modules
    - etc (you may or may not have this depending on which version of node you use)
- repos
    - node_modules
        - a bunch of symlinks to node_modules in install folder
        - client
        - server
        - csv
        - db
    - keys (a symlink to where keys folder in install)
```


## install production (ubuntu)
```
ssh -i /path/to/private-key ubuntu@<elastic-ip>

#mount volume
sudo mkdir /dscsa
lsblk                            #details http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-using-volumes.html
sudo mkfs -t ext4 /dev/<volume>  #only make filesystem, if new empty volume.
sudo mount /dev/<volume> /dscsa
cd /dscsa
sudo mkdir /dscsa/keys
sudo nano  /dscsa/keys/dev.js
#add server login

#install couchdb
sudo add-apt-repository ppa:couchdb/stable -y
sudo apt-get update
sudo apt-get install couchdb -y
sudo mv /var/lib/couchdb /dscsa
sudo ln -s /dscsa/couchdb /var/lib/couchdb
sudo nano /etc/couchdb/local.ini
#set [httpd] bind_address = 0.0.0.0,
#add [compactions] _default = [{db_fragmentation, "40%"}, {view_fragmentation, "40%"}]
#set [couch_httpd_auth]	allow_persistent_cookies = true
#set [couch_httpd_auth] timeout = 31536000
sudo service couchdb restart
goto <elastic-ip>:5984/_utils
#create server login

#install nodejs and application
curl --silent --location https://deb.nodesource.com/setup_6.x | sudo bash -
sudo apt-get install nodejs -y
sudo apt-get install git-core
sudo npm install dscsa/client
sudo npm install forever -g
sudo forever start /dscsa/node_modules/server  #forever list, forever stop
```

## tests
|Test|2016-06-XX|
|----|----------|
|Log in/out works multiple times in a row|:+1:|
|During db sync "canceled" requests by browser|:+1:|
|Only current account's shipments, transactions, and users can be seen|:+1:|
|Proper errors on invalid user data (from account and join views?)|:+1:|
|Proper saving on valid user data (from account and join views?)|:+1:|
|Users filter works||
|Users can be deleted||
|Proper errors on invalid account data (from account and join views?)||
|Proper saving on valid account data (from account and join views?)||
|Accounts can be authorized and unauthorized||
|Accounts that have authorized current account can be viewed||
|Proper errors on invalid drug data|[x]|
|Proper saving on valid drug data <br>- multiple generics?<br>- updates transaction info?<br>- goodrx/nadac updated?)||
|Drugs can be imported as CSV||
|Proper errors on invalid shipment data||
|Proper saving on valid shipment data||
|Shipments filter works||
|Proper errors on invalid transaction data||
|Proper saving on valid transaction data (both generic name and NDC search?)||
|Transactions can be imported into shipment as CSV||
|Transactions can be exported from shipment as CSV||
|Transactions can be deleted (qty 0)||
|Transactions can be duplicated with double enter||
|Transactions can be moved between shipments||
|Transactions can be saved to inventory||
|Transactions can be repackaged/combined||
|Transaction checkboxes are properly enabled/disabled based on page state||
|Records date range is accurate||
|Records history is accurate (for inventory? for multi-segment? for repackaged?)||
|Records page can be exported as CSV||
