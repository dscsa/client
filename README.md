# client
Application that uses the RESTful API written with the Aurelia framework

## install development
[install node](https://nodejs.org/en/download/current)
[install couchbb](http://couchdb.apache.org/#download)
```
cd /<installation directory>
sudo mkdir /keys
sudo nano  /keys/dev.js
sudo npm install aurelia-cli -g            #install dev tool
sudo npm install dscsa/client              #install the app
sudo node /dscsa/node_modules/server       #run the api
cd node_modules/client && au run —-watch   #start dev environment
```
Test that both http://localhost and http://localhost:9000 now serve the app

## install production (ubuntu)
```
ssh -i /path/to/private-key ubuntu@<elastic-ip>

#mount volume
sudo mkdir /dscsa
lsblk                            #details http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-using-volumes.html
sudo mount /dev/<volume> /dscsa
sudo mkfs -t ext4 /dev/<volume>  #only make filesystem, if new empty volume.
cd /dscsa
sudo mkdir /dscsa/keys
sudo nano  /dscsa/keys/dev.js

#install couchdb
sudo add-apt-repository ppa:couchdb/stable -y
sudo apt-get update
sudo apt-get install couchdb -y
sudo nano /etc/couchdb/local.ini #change bind_address to 0.0.0.0
sudo service couchdb restart
#check <elastic-ip>:5984/_utils serves futon

#install nodejs and application
curl --silent --location https://rpm.nodesource.com/setup_6.x | sudo bash -
sudo yum install nodejs -y
sudo yum install git-core
sudo npm install dscsa/client
sudo npm install forever -g
forever start /dscsa/node_modules/server
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
