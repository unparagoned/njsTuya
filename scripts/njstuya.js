/* 
 * Simple wrapper for tuyapi for use with openhab or command line
npm install codetheweb/tuyapi
node ohtuya.js args 
arg format -ip 192.168.x.x -id 1231204564df -key dsf456sdf TOGGLE
args can be, ON, OFF, or TOGGLE. No arguement returns state
@todo set up js to log properly, sending to console messes up output.
@todo limit connection frequency seem to get connection errors
*/

const TuyaDevice = require('tuyapi');
var args = process.argv.slice(2);
_DEBUG = false;

var db = _DEBUG;

function getArgs(allArgs, argName) {
    var nameIndex = allArgs.indexOf(argName);
    argValue = allArgs[nameIndex + 1];
    //console.log(argName + " value is: " + argValue)
    return argValue;
}
var tuyaIP = getArgs(args, "-ip");
var tuyaID = getArgs(args, "-id");
var tuyaKey = getArgs(args, "-key");
var tuya = new TuyaDevice({
    //   type: 'outlet',
    //   ip: tuyaIP,
    id: tuyaID,
    key: tuyaKey
});

function bmap(istate) {
    return istate ? 'ON' : "OFF";
}

var newState = false;
var changeState = false;


tuya.resolveIds().then(() => {
    tuya.get().then(status => {
        if (db) { console.log('Status: ' + status); }
        newState = status;

        if (args.includes("ON")) {
            newState = true;
            changeState = true;
        }
        if (args.includes("OFF")) {
            newState = false;
            changeState = true;
        }
        if (args.includes("TOGGLE")) {
            newState = !status;
            changeState = true;
        }

        if (changeState) {
            tuya.set({ set: newState }).then(result => {
                if (db) { console.log('Result of setting status to ' + newState + ': ' + result); }
                if (result) {
                    console.log(bmap(newState));
                } else {
                    //this sounds more like an error than just a fail.
                    console.log(bmap(!newState));
                }
                return;
            }, reason => {
                console.log(reason.toString());
                return;
            });
        } else {
            console.log(bmap(status));
            return;
        }

    }, reason => {
        console.log(reason.toString());
        return;
    });
});