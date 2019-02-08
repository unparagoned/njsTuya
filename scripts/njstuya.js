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

const args = process.argv.slice(2);
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
var tuyaGet = getArgs(args, "-get");

if(tuyaKey.length == 0) {
    tuyaKey="1000000000000000"
}

if(args.includes("debug")) {
    db=true;
    console.log("debug enabled");
    console.log(`ip ${tuyaIP} id ${tuyaID} key ${tuyaKey}`);
}
let tuya = new TuyaDevice({
    id: tuyaID,
    key: tuyaKey
});

if(tuyaIP.length > 4){
    tuya = new TuyaDevice({
        id: tuyaID,
        key: tuyaKey,
        ip: tuyaIP
    });
}


function bmap(istate) {
    type = typeof istate
    if(db) console.log(`istate ${istate} and typeof ${type}`)
    if(typeof istate != typeof true) return istate;
    return istate ? 'ON' : "OFF";
}
function getState(setString) {
    if(setString.includes("true")) return true;
    return false;
}

var newState = false;
var changeState = false;

function getNewState(retVal, setFun) {
    if (args.includes("TOGGLE")) {
        tuya.get().then(status => {
            if (db) { console.log('Status: ' + status); }
            retVal= !status;
            setFun(retVal);
        }, reason => {
            console.log(reason.toString());
            return;
        });
    } else if (args.includes("ON")) {
        retVal=  true;
        setFun(retVal);
    } else if (args.includes("OFF")) {
        retVal=  false;
        setFun(retVal);
    } else if (args.includes("-set")) {
        setFun(JSON.parse(tuyaSet));
    } else if (args.includes("-get")) {
        tuya.get(JSON.parse(tuyaGet)).then(status => {
            if (db) { console.log('Run :' + tuyaGet +' Status: ' + status); }
            retVal= status;
            console.log(bmap(retVal));
        }, reason => {
            console.log(reason.toString());
            return;
        });
    } else {
        tuya.get().then(status => {
            if (db) { console.log('Status: ' + status); }
            retVal= status;
            console.log(bmap(retVal));
        }, reason => {
            console.log(reason.toString());
            return;
        });
    }
}


var setState = function(newState) {
    setState={ set: newState };
    if(tuyaSet.length >0) {
        newState=getState(tuyaSet);
        setState = JSON.parse(tuyaSet);
    }
    if(db) console.log("new state:" + JSON.stringify(setState));

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
        console.log(reason.toString() + ' - Try without IP to auto resolve IP');
        return;
    });
}


if (tuyaIP.length > 4) {
    if (db) {
        console.log('Instant')
    }
    getNewState(newState, setState);
} else {
    tuya.resolveId().then(() => {
        if(db) { console.log(`Resolving IP tuyaip is ${tuya.device.ip} and id ${tuya.device.id}`)}       
        getNewState(newState, setState);
    });
}
