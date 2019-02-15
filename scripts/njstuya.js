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
  if (typeof istate !== typeof true) return istate;
  return istate ? 'ON' : 'OFF';
}

function parseState(setString) {
  if (setString.includes('true')) return true;
  return false;
}

function isCommand(command) {
  return (args.includes(command)
    || args.includes(command.toUpperCase())
    || args.includes(command.toLowerCase()));
}

async function getState() {
  let dps;
  if (tuyaGet.length > 0) {
    dps = JSON.parse(tuyaGet);
  }
  return tuya.get(dps).then(status => status, (reason) => {
    print(reason.toString());
  });
}

// Sets new state and returns new stae
async function setState(iState) {
  let state = iState;
  let stateObj = {
    set: state,
  };
  if (tuyaSet.length > 0) {
    state = parseState(tuyaSet);
    stateObj = JSON.parse(tuyaSet);
  }
  dprint(`new state:${JSON.stringify(stateObj)}`);

  await tuya.set(stateObj).then((result) => {
    dprint(`Result of setting status to ${JSON.stringify(stateObj)}: ${result}`);
    if (result) {
      print(bmap(state));
    } else {
      print(bmap(!state));
    }
  }, (reason) => {
    print(`${reason.toString()} - Try without IP to auto resolve IP`);
  });
}
/* Main Check if ID or IP is missing then perform resolve first
 */
async function main() {
  if (tuyaIP.length === 0 && tuyaID.length === 0) {
    // Logic for my branch and new refactored tuyapi
    if (tuya.findDevices !== undefined) await tuya.findDevices();
    return;
  }
  if (tuyaIP.length < 4 || tuyaID.length < 4) {
    // Logic for my branch and new refactored tuyapi
    if (tuya.find === undefined) await tuya.resolveId();
    else await tuya.find();
    dprint(`ip ${tuya.device.ip} id: ${tuya.device.id}`);
  }

  if (isCommand('Toggle')) {
    const status = await getState();
    dprint(`Status: ${status}`);
    await setState(!status);
  } else if (isCommand('On')) {
    await setState(true);
  } else if (isCommand('Off')) {
    await setState(false);
  } else if (isCommand('-Set')) {
    await setState(JSON.parse(tuyaSet));
  } else {
    const status = await getState();
    dprint(`Status: ${status}`);
    print(bmap(status));
  }
  // tuya.disconnect();
}
main();
