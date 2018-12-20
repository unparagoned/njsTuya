/* 
 * Simple wrapper for tuyapi for use with openhab or command line
 Added support for more devices through set command
npm install codetheweb/tuyapi
node ohtuya.js args 
arg format -ip 192.168.x.x -id 1231204564df -key dsf456sdf TOGGLE
arg format -ip 192.168.x.x -id 1231204564df -key dsf456sdf -set '{ "dps": 0, "set": true }'
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
    var argValue="";
    if(nameIndex>=0){
        argValue = allArgs[nameIndex + 1];
        argValue = argValue.replace(/'/g,"");
        //console.log(argName + " value is: " + argValue)
    }
    return argValue;
}
var tuyaIP = getArgs(args, "-ip");
var tuyaID = getArgs(args, "-id");
var tuyaKey = getArgs(args, "-key");
var tuyaSet = getArgs(args, "-set");

if(args.includes("debug")) {
    db=true;
    console.log("debug enabled");
}
var tuya = new TuyaDevice({
    //   type: 'outlet',
    //   ip: tuyaIP,
    id: tuyaID,
    key: tuyaKey
});

function bmap(istate) {
    return istate ? 'ON' : "OFF";
}
function getState(setString) {
    if(setString.includes("true")) return true;
    return false;
}

var newState = false;
var changeState = false;

if (args.includes("NOW")) {
    if (db) {
        console.log('ON NOW')
    }
    if (args.includes("OW")) {
        newState = true;
        changeState = true;
    }
    if (args.includes("OFF")) {
        newState = false;
        changeState = true;
    }
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
}

tuya.resolveId().then(() => {
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
        setState={ set: newState };
        if(tuyaSet.length >0) {
            newState=getState(tuyaSet);
            setState = JSON.parse(tuyaSet);
            changeState = true;
        }
        if(db) console.log("new state:" + JSON.stringify(setState));
        if (changeState) {
            tuya.set(setState).then(result => {
                if (db) { console.log('Result of setting status to ' + JSON.stringify(setState) + ': ' + result); }
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
