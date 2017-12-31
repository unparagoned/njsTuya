/* Simple wrapper for tuyapi for use with openhab or command line
npm install codetheweb/tuyapi
node ohtuya.js args 
args can be, ON, OFF, or TOGGLE. No arguement returns state
@todo set up js to log properly, sending to console messes up output.
*/

const TuyaDevice = require('tuyapi');
var args = process.argv.slice(2);
var tuya = new TuyaDevice({
    type: 'outlet',
    ip: 'changeToSwitchIP',
    id: 'changeToID',
    key: 'changeToKey'
});

function bmap(istate) {
    return istate ? 'ON' : "OFF";
}

var newState = false;

tuya.getStatus(function(error, status) {
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
    tuya.setStatus(newState, function(error, result) {
        if (error) { return console.log(error); }
        //console.log('Set status to ' + bmap(newState) + ': ' + bmap(result));

        tuya.getStatus(function(error, status) {
            if (error) { return console.log(error); }
            // console.log('End state: ' + [status ? 'on' : 'off']);
            console.log(bmap(status));
            tuya.destroy();
            // process.exitCode = [status ? 1 : 0]; Exec takes value of console output so no need for this
        });

    });

});