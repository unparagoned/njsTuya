# njsTuya
Openhab interface for Tuya home automation devices sold under various names. This is a wrapper script for codetheweb/tuyapi. https://github.com/codetheweb/tuyapi

## Instructions:

If nodejs and npm are installed, install the package from npm (otherwise obtain nodejs and npm first):
```
openhab=/etc/openhab2
cd $openhab/scripts
sudo npm install unparagoned/njsTuya
```

Then copy the files to Openhab configuration directories:
```
cp node_modules/njstuya/scripts/* $openhab/scripts
cp node_modules/njstuya/items/* $openhab/items/
cp node_modules/njstuya/rules/* $openhab/rules/
```
Try running
```
node njstuya.js
$ ...Error: resolveIds() timed out. Is the device powered on and the ID correct?
```
you should get an error as above

### Get Devices on network and thier state
If you have python installed you can find all devices on your network and get thier state without having their key.
```
python $openhab/scripts/scripts/njstuyamonitor.py -v
```

# Node installation
### using package manager
```
curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### using npm
Install tuyapi from the same folder that the njsTuya.js is in
```
cd $openhab/scripts
npm install codetheweb/tuyapi
```
Then just copy njstuya.js into your scripts directory, and the rules and items into the appropriate folders in $openhab

The following shouldn't be necessary but might be if you have old version of node and don't have timeout. 

```
#update node if you have an old version and have problems
sudo npm cache clean -f
sudo npm install npm@latest -g

sudo ln -sf /usr/local/n/versions/node/<VERSION>/bin/node /usr/bin/nodejs
#install timout if you get errors about timeout
pip install timeout
```
Ignore the Warnings. If it's run in the same folder as the njsTuya.js script it should have installed fine.(You can run npm init --yes before hand to reduce the number of warnings if you are of that type)

Then you need to download this project and place the files in the correct location. I have a separate git folder and rsync the relevant files, since I have my main openhab in it's own git. But for this you can just copy the njstuya.js file from the scripts folder into your openhab2.scrips folder You can also look at the items and rules files for a working setup.

## Configuration
You have to create an item with with your devices ip, id and key.(Or if you just have one device you can hardcode the parameters into the exec command as below) This involves MIM of the connection. Instructions can be found here: https://github.com/codetheweb/tuyapi/blob/master/docs/SETUP.md

Commands are:
1. General command:
```
node njstuya.js -ip DEVICEIP -id DEVICEID -key DEVICEKEY COMMAND
```

where COMMAND is:
* ON
* OFF
* TOGGLE
* STATE

Example:
```
node njstuya.js -ip 10.0.0.2 -id 213klj349sdfjl324po32 -key 342kljerw98 ON
```

All commands return the state of the switch.

2. SET command:
```
node njstuya.js -ip DEVICEIP -id DEVICEID -key DEVICEKEY -set SETCOMMAND
```

where SETCOMMAND should be of the following format, including quote marks '{ "dps": 1, "set": true }'

Example:
```
node njstuya.js -ip 10.0.0.2 -id 213klj349sdfjl324po32 -key 342kljerw98 -set '{ "dps":1, "set": true }'
```

You may need to play about with the dps if you have multiple function for your device.

## Issues
There are some reliability issues with tuyapi. Latest changes changed the syntax but still getting error maybe at an even higher rate.

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
