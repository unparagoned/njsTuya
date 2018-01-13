/* Simple wrapper for tuyapi for use with openhab or command line
npm install codetheweb/tuyapi
node ohtuya.js args 
arg format -ip 192.168.x.x -id 1231204564df -key dsf456sdf TOGGLE
args can be, ON, OFF, or TOGGLE. No arguement returns state
@todo set up js to log properly, sending to console messes up output.
@todo limit connection frequency seem to get connection errors
*/

const TuyaDevice = require('tuyapi');
var args = process.argv.slice(2);

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
    type: 'outlet',
    ip: tuyaIP,
    id: tuyaID,
    key: tuyaKey
});

function bmap(istate) {
    return istate ? 'ON' : "OFF";
}

var newState = false;

tuya.get(function(error, status) {
    if (error) { return console.log(error); }
    //console.log('Start status: ' + bmap(status));

    if (args.includes("ON")) {
        newState = true;
    }
    if (args.includes("OFF")) {
        newState = false;
    }
    if (args.includes("TOGGLE")) {
        newState = !status;
    }
    tuya.set(newState, function(error, result) {
        if (error) { return console.log(error); }
        //console.log('Set status to ' + bmap(newState) + ': ' + bmap(result));

        tuya.get(function(error, status) {
            if (error) { return console.log(error); }
            // console.log('End state: ' + [status ? 'on' : 'off']);
            console.log(bmap(status));
            tuya.destroy();
            // process.exitCode = [status ? 1 : 0]; Exec takes value of console output so no need for this
        });

    });

});