# client
Application that uses the RESTful API written with the Aurelia framework

## install development into new dscsa folder
- [install node](https://nodejs.org/en/download/current)
- [install couchdb](http://couchdb.apache.org/#download)
- install git (dialog will appear on first use of git clone command)
```
- dscsa
  - keys
    - dev.js (with your couchdb credentials)
  - install (npm update this folder to update dependencies)
    - node_modules
    - etc (you may or may not have this depending on which version of node you use)
  - node_modules
    - a bunch of symlinks to node_modules in install folder
    - client (github repo)
    - server (github repo)
    - csv    (github repo)
    - pouch  (github repo)
```
```
sudo mkdir -p dscsa/node_modules                                           #create the directories we need
sudo npm install dscsa/development --prefix='install'                      #install the development environment                         
cd dscsa/node_modules && sudo ln -s ../install/node_modules/* ./           #create symlinks from install to repo

sudo rm -R client && sudo git clone https://github.com/dscsa/client
sudo rm -R server && sudo git clone https://github.com/dscsa/server
sudo rm -R pouch && sudo git clone https://github.com/dscsa/pouch
sudo rm -R csv && sudo git clone https://github.com/dscsa/csv

#ensure couchDB is running on your local computer

sudo npm start                                                             #add your couchdb credentials

#test that both http://localhost and http://localhost:9000 now serve the app
```

## install production into dscsa folder (ubuntu)
```
- dscsa
  - couchdb
  - keys
    - dev.js (with your couchdb credentials)
  - node_modules
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
sudo mkdir production
sudo npm install dscsa/server
sudo npm install forever -g
sudo node /dscsa/node_modules/server           #create server login
ctrl c (to stop server)
sudo forever start /dscsa/node_modules/server  #forever list, forever stop
```











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
