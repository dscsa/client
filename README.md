# client
Application that uses the RESTful API written with the Aurelia framework

## install development into new dscsa folder
### note: dscsa/development is a large install because it depends on gulp for bundling, babel for transpiling, and protractor for testing.
- [install node](https://nodejs.org/en/download/current)
- [install couchdb](http://couchdb.apache.org/#download)
- install git (dialog will appear on first use of git clone command)
- create and cd into the folder in which you want to install
```
npm install dscsa/development
sudo npm start #will ask for couchdb credentials on first run
```
```
- Your Installation Folder
  - package.json
  - keys     (added after running sudo npm start the first time)
    - dev.js (with your couchdb credentials)
  - node_modules
    - client (github repo)
    - server (github repo)
    - csv    (github repo)
    - pouch  (github repo)
    - many dependencies
```

## install production into dscsa folder (ubuntu)
```
- /dscsa #installation folder
  - couchdb
  - package.json
  - keys     (added after running sudo npm start the first time)
    - dev.js (with your couchdb credentials)
  - node_modules
    - client (github repo)
    - server (github repo)
    - csv    (github repo)
    - pouch  (github repo)
    - many dependencies
```
```
ssh -i /path/to/private-key ubuntu@<elastic-ip>

#mount volume
sudo mkdir /dscsa
lsblk                            #details http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-using-volumes.html
sudo mkfs -t ext4 /dev/<volume>  #only make filesystem, if new empty volume.
sudo mount /dev/<volume> /dscsa
cd /dscsa

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

#install nodejs and application
curl --silent --location https://deb.nodesource.com/setup_6.x | sudo bash -
sudo apt-get install nodejs -y
sudo apt-get install git-core
sudo npm install dscsa/server
sudo npm install forever -g                    #to do make new repo with this dependency that runs this with npm start
sudo node /dscsa/node_modules/server           #create server login
ctrl c (to stop server)
sudo forever start /dscsa/node_modules/server  #forever list, forever stop
```
