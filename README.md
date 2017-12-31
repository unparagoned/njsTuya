# njsTuya
Openhab interface for Tuya home automation devices sold under various names
This is a wrapper script for codetheweb/tuyapi. 

Instructions:

Run
npm install codetheweb/tuyapi
copy the ohtuya.js file from the scripts folder into your openhab2.scrips folder
You can also look at the items and rules files for a working setup.

You have to edit the ohtuya.js file with your devices ip, id and key. 
Instructions can be found here:

Commands are 
node ohtuya.js ON
node ohtuya.js OFF
node ohtuya.js TOGGLE
node ohtuya.js STATE
All commands return the state of the switch.


