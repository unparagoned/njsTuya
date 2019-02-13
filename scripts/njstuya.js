/*
 * Simple wrapper for tuyapi for use with openhab or command line
 Added support for more devices through set command
npm install unparagoned/njsTuya
node njstuya.js args
node njstuya.js -ip 192.168.x.x -id 1231204564df -key dsf456sdf COMMAND
node njstuya.js -id 1231204564df -get "{ \"schema\": true }"
node njstuya.js -ip 192.168.x.x -id 1231204564df -key dsf456sdf -set "{ \"dps\": 0, \"set\": true }"
COMMAND can be, ON, OFF, or TOGGLE. No arguement returns state
@todo set up js to log properly, sending to console messes up output.
@todo limit connection frequency seem to get connection errors
*/

const TuyaDevice = require('tuyapi');

const args = process.argv.slice(2);

let db = false;

function dprint(text) {
  // eslint-disable-next-line no-console
  if (db) console.log(text);
}

function print(text) {
  // eslint-disable-next-line no-console
  console.log(text);
}

function getArgs(allArgs, argName) {
  const nameIndex = allArgs.indexOf(argName);
  let argValue = '';
  if (nameIndex >= 0) {
    argValue = allArgs[nameIndex + 1];
    argValue = (argValue !== undefined ? argValue.replace(/'/g, '') : argValue);
    dprint(`"{argName} value is: ${argValue}`);
  }
  return argValue;
}
const tuyaIP = getArgs(args, '-ip');
const tuyaID = getArgs(args, '-id');
let tuyaKey = getArgs(args, '-key');
const tuyaSet = getArgs(args, '-set');
const tuyaGet = getArgs(args, '-get');
let tuyaResolve = getArgs(args, '-res');
if (tuyaResolve === undefined || tuyaResolve.includes('true')) tuyaResolve = true;
else tuyaResolve = ((tuyaResolve.includes('false') ? false : tuyaResolve));


if (tuyaKey.length === 0) {
  tuyaKey = '1000000000000000';
}

if (args.includes('debug') || args.includes('-d')) {
  db = true;
  dprint('debug enabled');
  dprint(`ip ${tuyaIP} id ${tuyaID} key ${tuyaKey}`);
}
let tuya;
try {
  tuya = new TuyaDevice({
    id: tuyaID,
    key: tuyaKey,
    ip: tuyaIP,
    resolve: tuyaResolve,
    persistentConnection: false,
  });
} catch (error) {
  print(`caught error: ${error.toString()}`);
}

function bmap(istate) {
  const type = typeof istate;
  dprint(`istate ${istate} and typeof ${type}`);
  if (typeof istate !== typeof true) return istate;
  return istate ? 'ON' : 'OFF';
}

function getState(setString) {
  if (setString.includes('true')) return true;
  return false;
}
// Checks ARG type then runs relevent command
function getNewState(setFun) {
  let retVal;
  if (args.includes('TOGGLE')) {
    tuya.get().then((status) => {
      dprint(`Status: ${status}`);
      retVal = !status;
      setFun(retVal);
    }, (reason) => {
      print(reason.toString());
    });
  } else if (args.includes('ON')) {
    retVal = true;
    setFun(retVal);
  } else if (args.includes('OFF')) {
    retVal = false;
    setFun(retVal);
  } else if (args.includes('-set')) {
    setFun(JSON.parse(tuyaSet));
  } else if (args.includes('-get')) {
    tuya.get(JSON.parse(tuyaGet)).then((status) => {
      dprint(`Run :${tuyaGet} Status: ${status}`);
      retVal = status;
      print(bmap(retVal));
    }, (reason) => {
      print(reason.toString());
    });
  } else {
    tuya.get().then((status) => {
      dprint(`Status: ${status}`);
      retVal = status;
      print(bmap(retVal));
    }, (reason) => {
      print(reason.toString());
    });
  }
}

// Sets new state and returns new stae
function setState(iState) {
  let state = iState;
  let stateObj = {
    set: state,
  };
  if (tuyaSet.length > 0) {
    state = getState(tuyaSet);
    stateObj = JSON.parse(tuyaSet);
  }
  dprint(`new state:${JSON.stringify(stateObj)}`);

  tuya.set(stateObj).then((result) => {
    dprint(`Result of setting status to ${JSON.stringify(stateObj)}: ${result}`);
    if (result) {
      print(bmap(state));
    } else {
      // this sounds more like an error than just a fail.
      print(bmap(!state));
    }
  }, (reason) => {
    print(`${reason.toString()} - Try without IP to auto resolve IP`);
  });
}
/* Main Check if ID or IP is missing then perform resolve first
 */
if (tuyaIP.length > 4 && tuyaID.length > 4) {
  dprint('Instant');
  getNewState(setState);
} else if (tuyaIP.length > 0 || tuyaID.length > 0) {
  tuya.resolveId().then(() => {
    dprint(`Resolving IP ${tuya.device.ip} and id ${tuya.device.id}`);
    getNewState(setState);
  });
} else {
  /* tuya.resolveDevices().then(() => {
    dprint(`devices ${JSON.stringify(tuya.devices)}`);
    const ids = Object.keys(tuya.devices);
    ids.forEach((newId) => {
      const newTuya = new TuyaDevice({
        id: newId,
        key: tuyaKey,
        ip: tuya.devices[newId].ip,
      });
      newTuya.get(JSON.parse('{ "schema": true }')).then((status) => {
        dprint(`Run :${newId} Status: ${status}`);
        print(bmap(status));
        dprint(`"id": ${newId}, "broadcast": ${JSON.stringify(tuya.devices[newId])}, "schema": ${JSON.stringify(status)}`);
      }, (reason) => {
        print(reason.toString());
      });
      print(`"id": ${newId}, "broadcast": ${tuya.devices[newId]}`);
    });
  }); */
}
