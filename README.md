# njsTuya
Openhab interface for Tuya home automation devices sold under various names
This is a wrapper script for codetheweb/tuyapi. https://github.com/codetheweb/tuyapi

#Instructions:

Install tuyapi from the same folder that the njsTuya.js is in
```
cd /etc/openhab2/scripts
npm install codetheweb/tuyapi
```

Then you need to download this project and place the files in the correct location. I have a seperate git folder and rsync the relevent files, since I have my main openhab in it's own git.
But for this you can just 
copy the njstuya.js file from the scripts folder into your openhab2.scrips folder
You can also look at the items and rules files for a working setup.

You have to create an item with with your devices ip, id and key.(Or if you just have one device you can hardcode the parameters into the exec command as below)
This involves MIM of the connection.
Instructions can be found here: https://github.com/codetheweb/tuyapi/blob/master/docs/SETUP.md

Commands are 
node njstuya.js -ip DEVICEIP -id DEVICEID -key DEVICEKEY COMMAND
Commands are ON, OFF, TOGGLE, STATE,
e.g. node njstuya.js -ip 10.0.0.2 -id 213klj349sdfjl324po32 -key 342kljerw98 ON 
All commands return the state of the switch.

# Issues

There are some reliability issues with tuyapi. Latest changes changed the syntax but still getting error maybe at an even higher rate. 

## Habpanel

Here is hw you would use a slider in habpanel to change the set temp. 
```

<div class="name">Set Target Temp: {{itemValue('KitchenThermostatTargetTemp')}}</div>
<div ng-init="slider = { value: itemValue('KitchenThermostatTargetTemp'), options: { floor: 0, ceil: 40, step: 1, showSelectionBar: true } };"></div>
<rzslider rz-slider-model="slider.value" rz-slider-options="slider.options" ng-click="sendCmd('KitchenThermostatTargetTemp', slider.value)"></rzslider>

```
  

## Related Projects:
https://github.com/clach04/python-tuya

https://github.com/codetheweb/tuyapi

https://github.com/Marcus-L/m4rcus.TuyaCore


Specs:
https://docs.tuya.com/en/cloudapi/cloud_access.html
