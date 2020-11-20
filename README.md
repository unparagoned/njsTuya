# njsTuya
Openhab interface for Tuya home automation devices sold under various names.

This is a wrapper script for codetheweb/tuyapi. https://github.com/codetheweb/tuyapi
and unparagoned/cloudtuya https://github.com/unparagoned/cloudtuya

There is support for local control after identifying the localKey for each device.
And basic support for devices setup using the tuya or smartlife app. Using the tuya app login email and pass.

## Install Instructions:

If nodejs and npm are installed, install the package from npm (otherwise obtain nodejs and npm first):
```
openhab=/etc/openhab2
cd $openhab/scripts
sudo npm install unparagoned/njsTuya
```
### Test Install
Run the following which should find all devices on your netork and return their state.
```
node node_modules/njstuya
```
### Configuration
To use create a rule which sends a command to the script
```
var resp = executeCommandLine("node /etc/openhab2/scripts/node_modules/njstuya" + command, 50000)
logInfo("Tuya", "Run Command: [{}] Result {}", command, resp)

```
To use the following items and rule as an example copy the files to Openhab configuration directories:
```
cp node_modules/njstuya/items/* $openhab/items/
cp node_modules/njstuya/rules/* $openhab/rules/
```
Once you have your id, ip, key for a device uncomment the first rule un temperature.rules and enter in your device details.

If you know the device id or ip try running, to get the state and dps options for a specific device
```
node njstuya.js -id 213klj349sdfjl324po32 -get '{ "schema": true}'
node njstuya.js -ip 123.0.0.2 -get '{ "schema": true}'
```

#### Cloud setup
You can pass the cloud email and arguments through the cli, or complete the key.json.rename and rename it to key.json

It is reccomended to put the details into key.json in the folder ./scripts/node_modules/njstuya/
```
 {
   "userName" : "d@yahoo.com",
  "password": "yourpassword",
  "countryCode": "44",
  "bizType": "smart_life",
  "region": "EU"
 }
 ```
 bizType can be 'tuya', 'smart_life'

 Then you just need to run
 ```
 node njstuya.js -mode cloud -id DEVICEID COMMAND
```

Otherwise to pass all arugments without config enter the email/pass/international phone code/region
```
node njstuya.js -mode cloud -user email -pass password -biz smart_life -code 44 -region eu -id DEVICEID COMMAND
```
code = internatinal dialing code
region = 'eu' | europe
         'ay' | Asia
         'az' | Americas
biz = 'tuya'
      'smart_life'


## Node installation
### using package manager
```
curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -
sudo apt-get install -y nodejs
```

The following shouldn't be necessary but might be if you have old version of node and don't have timeout.

```
#update node if you have an old version and have problems
sudo npm cache clean -f
sudo npm install npm@latest -g

sudo ln -sf /usr/local/n/versions/node/<VERSION>/bin/node /usr/bin/nodejs
#install timout if you get errors about timeout
pip install timeout
```

### Configuration to obtain private key
You have to create an item with with your devices ip, id and key.(Or if you just have one device you can hardcode the parameters into the exec command as below) This involves MIM of the connection.

#### Android
1. Install "Package Capture" from play store.
2. When you first open it it will ask you to install a certificate, this is needed for it to work.
3. In the top bar there are two "Play" symbols. The one with a 1 allows you to capture packets from certain apps.
4. Click on that and select "Smart Life" from the list of apps.
5. It will popup about setting up a vpn and will then start capturing packets.
6. Open Smart Life and on the screen showing "All Devices" pull down the screen to cause a refresh.
7. Go back to Packet Capture and hit the Stop button at the top.
8. You should now have an entry below showing x number of captures.Tap that to open it.
In mine I had to open the last packet in the list that was marked as SSL.
9. Scroll down through the first few blocks and you should see a large JSON block
This contains a lot of code but if you scroll through it you should see line like the ones below

"devAttribute": 0
"name": Smart Socket 4"
"timezoneId": "Europe/London"
"localKey": "XXXXXXXXXXXXXXX"

### All Other methods
There are alternative methods which can be found here: https://github.com/codetheweb/tuyapi/blob/master/docs/SETUP.md

## Useage Instructions
Commands are:

1. General command:

```
node njstuya.js -mode MODE -ip DEVICEIP -id DEVICEID -key DEVICEKEY COMMAND
```

MODE is:

* local
* cloud

where COMMAND is:

* None
* ON
* OFF
* TOGGLE
* STATE
* -get
* -set

Example:
```
node njstuya.js -ip 10.0.0.2 -id 213klj349sdfjl324po32 -key 342kljerw98 ON
```
If no the ip and id are missing then the script will scan the network and return the state schema(state) of all devices.
```
node node_modules/njstuya
```

All commands return the state of the switch.

2. GET/SET commands for dps:

dps is for local mode only, see below (2.b) for cloud option

```
node njstuya.js -ip DEVICEIP -id DEVICEID -key DEVICEKEY -set GETCOMMAND
```
Where the GETCOMMAND should be of the following format, including quote marks ```'{ "dps": 1 }' ```

##### WINDOWS COMMAND FORMAT #####
If you are on windows or just using the command line on linux you can use the old syntax ```"{ \"dps\": 1 }"```. But you may have issues using this format through the set command in openhab.

To get all the dps options for your device use the get command to get the schema
Example:
```
node njstuya.js -ip 10.0.0.2 -id 213klj349sdfjl324po32 -key 342kljerw98 -get '{ "schema": true}'
```

Set commands are similar but also have a state

```
node njstuya.js -ip DEVICEIP -id DEVICEID -key DEVICEKEY -set SETCOMMAND
```

Where SETCOMMAND should be of the following format, including quote marks '{ "dps": 1, "set": true }' or '{"multiple":true,"data":{"1":false,"7":false}}'
Note for windows you have to use the following format for the command line "{ \"dps\": 1, \"set\": true }". But you may have other issues if you have openhab running on windows.

Example:
```
node njstuya.js -ip 10.0.0.2 -id 213klj349sdfjl324po32 -key 342kljerw98 -set '{ "dps": 1, "set": true }'
node njstuya.js -ip 10.0.0.2 -id 213klj349sdfjl324po32 -key 342kljerw98 -set '{"multiple":true,"data":{"1":false,"7":false}}'
```
Get

You may need to play about with the dps if you have multiple function for your device.

2.b SET commands for cloud mode:

```
node njstuya.js -mode cloud -id DEVICEID -set "{\"command\": \"temperatureSet\", \"payload\" : { \"value\": 30 }}"
node njstuya.js -mode cloud -id DEVICEID -set  '{"command": "turnOnOff", "payload" : {"value": 1 }}'
node njstuya.js -mode cloud -id DEVICEID -set  '{"command": "colorSet", "payload" :{"color": "{ \"hue\": 50, \"saturation\": 50, \"brightness\": 50}" }}'

```


## Habpanel
Here is how you would use a slider in habpanel to change the set temp.

```
<div class="name">Set Target Temp: {{itemValue('KitchenThermostatTargetTemp')}}</div>
<div ng-init="slider = { value: itemValue('KitchenThermostatTargetTemp'), options: { floor: 0, ceil: 40, step: 1, showSelectionBar: true } };"></div>
<rzslider rz-slider-model="slider.value" rz-slider-options="slider.options" ng-click="sendCmd('KitchenThermostatTargetTemp', slider.value)"></rzslider>
```
## Usage

The following is an extract from Habpanel which shows how to send commands to the item.
Send ON,OFF,TOGGLE to LivingRoomCommand.

```
<div class="section">

  <div class="controls">
    <div class="widget">
      <div class="controlGroup">
        <div class="icon off" ng-click="sendCmd('TuyaManual', 'state')"><svg viewBox="0 0 48 48"><use xlink:href="/static/matrix-theme/squidink.svg#double-arrow"></use></svg></div>
        <div class="nameGroup"><div class="name">Update state</div></div>
      </div>
    </div>

    <div class="widget">
      <div class="icon on" ng-click="sendCmd('BedroomHeaterCommand', 'TOGGLE')" ><svg viewBox="0 0 48 48"><use ng-if="itemValue('BedroomHeater')!='ON'" xlink:href="/static/matrix-theme/matrixicons.svg#off"></use><use ng-if="itemValue('BedroomHeater')=='ON'" xlink:href="/static/matrix-theme/matrixicons.svg#on"></use></svg></div>
      <div class="name">Bedroom Heater: {{itemValue('BedroomHeater')}}</div>
    </div>

    <div class="widget">
      <div class="icon on" ng-click="sendCmd('LivingRoomHeaterCommand', 'TOGGLE')" ><svg viewBox="0 0 48 48"><use ng-if="itemValue('LivingRoomHeater')!='ON'" xlink:href="/static/matrix-theme/matrixicons.svg#off"></use><use ng-if="itemValue('LivingRoomHeater')=='ON'" xlink:href="/static/matrix-theme/matrixicons.svg#on"></use></svg></div>
      <div class="name">Living Room Heater: {{itemValue('LivingRoomHeater')}} </div>
    </div>
  </div>

  <div class="bigDash">
    <div class="description">Living room Heater: {{itemValue('LivingRoomHeater')}} </div>
    <div class="top">
      <div class="icon on"><svg viewBox="0 0 48 48"><use xlink:href="/static/matrix-theme/squidink.svg#thermometer-3"></use></svg></div>
      <div class="value">
        <div class="main">{{itemValue('KitchenThermostatCurrentTemp') | number:1}}</div>
        <div class="sub">&#176C</div>
      </div>
    </div>

    <div class="bottom" ng-init="switchState=itemValue('LivingRoomHeater'); ttoggle=true">
      <div class="name">Set Target Temp: {{itemValue('KitchenThermostatTargetTemp')}}</div>
      <div ng-init="slider = { value: 20, options: { floor: 15, ceil: 40, step: 1, showSelectionBar: true } }; slider.value=itemValue('KitchenThermostatTargetTemp')"></div>

      <div ng-switch on="slider.value">
        <div ng-switch-default>
          <div ng-init="sendCmd('KitchenThermostatTargetTemp', slider.value)"></div>
        </div>
      </div>
      <rzslider rz-slider-model="slider.value" rz-slider-options="slider.options" ></rzslider>
    </div>
  </div>
</div>
```

## Related Projects:
https://github.com/clach04/python-tuya

https://github.com/codetheweb/tuyapi

https://github.com/TheAgentK/tuya-mqtt

https://github.com/Marcus-L/m4rcus.TuyaCore

 https://github.com/JamieTemple/tuyasvr

Specs: https://docs.tuya.com/en/cloudapi/cloud_access.html
