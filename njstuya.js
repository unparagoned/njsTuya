/**
 * Simple wrapper for tuyapi for use with openhab or command line
 * Added support for more devices through set command
 * npm install unparagoned/njsTuya
 * NEW CLOUD MODE
 * njstuya.js -mode cloud -user email -pass password -biz smart_life -code 44 -region eu -id 12312312312 COMMAND
 * ** USE LOCAL LAN
 * node njstuya.js args COMMAND
 * node njstuya.js -ip 192.168.x.x -id 1231204564df -key dsf456sdf COMMAND
 * node njstuya.js -id 1231204564df -get "{ \"schema\": true }"
 * node njstuya.js -ip 192.168.x.x -id 1231204564df -key dsf456sdf -set "{ \"dps\": 0, \"set\": true }"
 * COMMAND: ON, OFF, or TOGGLE.
 * */

const debug = require('debug')('njstuya');
const CloudTuya = require('cloudtuya');
const TuyaDevice = require('tuyapi');

const name = 'njstuya';

debug('booting %s', name);
const args = process.argv.slice(2);

let db = false;

function dprint(text) {
  // eslint-disable-next-line no-console
  if(db) console.log(text);
}

function print(text) {
  // eslint-disable-next-line no-console
  console.log(text);
}

function getArgs(allArgs, argName) {
  const nameIndex = allArgs.indexOf(argName);
  let argValue = '';
  if(nameIndex >= 0) {
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
const tuyaUser = getArgs(args, '-user');
const tuyaPass = getArgs(args, '-pass');
const tuyaBiz = getArgs(args, '-biz');
const tuyaCountryCode = getArgs(args, '-code');
const tuyaRegion = getArgs(args, '-region');

// cloud or local
let tuyaMode = getArgs(args, '-mode');
if(tuyaResolve === undefined || tuyaResolve.includes('true')) tuyaResolve = true;
else tuyaResolve = ((tuyaResolve.includes('false') ? false : tuyaResolve));

if(tuyaMode.length === 0) {
  if(tuyaKey.length === 0 && tuyaUser.length > 0 && tuyaPass > 0) {
    tuyaMode = 'cloud';
  } else tuyaMode = 'local';
}
if(tuyaKey.length === 0) {
  tuyaKey = '1000000000000000';
}

if(args.includes('debug') || args.includes('-d')) {
  db = true;
  dprint('debug enabled');
  dprint(`ip ${tuyaIP} id ${tuyaID} key ${tuyaKey}`);
}
let tuya;
try{
  tuya = new TuyaDevice({
    id: tuyaID,
    key: tuyaKey,
    ip: tuyaIP,
    resolve: tuyaResolve,
    // persistentConnection: false,
  });
} catch(error) {
  print(`caught error: ${error.toString()}`);
}

function bmap(istate) {
  if(typeof istate !== typeof true) return istate;
  return istate ? 'ON' : 'OFF';
}

function parseState(setString) {
  if(setString.includes('true')) return true;
  return false;
}

function isCommand(command) {
  return(args.includes(command)
    || args.includes(command.toUpperCase())
    || args.includes(command.toLowerCase()));
}

async function getState() {
  let dps;
  if(tuyaGet.length > 0) {
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
  if(tuyaSet.length > 0) {
    state = parseState(tuyaSet);
    stateObj = JSON.parse(tuyaSet);
  }
  dprint(`new state:${JSON.stringify(stateObj)}`);

  await tuya.set(stateObj).then((result) => {
    dprint(`Result of setting status to ${JSON.stringify(stateObj)}: ${result}`);
    if(result) {
      print(bmap(state));
    } else{
      print(bmap(!state));
    }
  }, (reason) => {
    print(`${reason.toString()} - Try without IP to auto resolve IP`);
  });
}

async function runCloud() {
  const api = new CloudTuya({
    userName: tuyaUser,
    password: tuyaPass,
    bizType: tuyaBiz,
    countryCode: tuyaCountryCode,
    region: tuyaRegion,
  });

  const tokens = await api.login();
  debug(`Token ${JSON.stringify(tokens)}`);


  if(isCommand('On')) {
    await api.setState({
      devId: tuyaID,
      setState: 1,
    });
  } else if(isCommand('Off')) {
    await api.setState({
      devId: tuyaID,
      setState: 0,
    });
  } else if(isCommand('-Set')) throw new Error('Set not available on cloud yet');

  // Get state of a single device
  let deviceStates = await api.state({
    devId: tuyaID,
  });
  let status = deviceStates[tuyaID];

  if(isCommand('Toggle')) {
    let newState = 1;
    debug(`status ${status} + ${status.includes('ON')}`);
    if(status.includes('ON')) {
      newState = 0;
    }
    await api.setState({
      devId: tuyaID,
      setState: newState,
    });
    deviceStates = await api.state({
      devId: tuyaID,
    });
    status = deviceStates[tuyaID];
  }

  if(isCommand('-Get')) throw new Error('Set not available on cloud yet');
  // Shows state for all gets status or toggle
  dprint(`Status: ${status}`);
  print(status);
}


async function runLocal() {
  // Promise is probably redundant
  return new Promise(async (resolve, reject) => {
    // Disconnect after 10 seconds
    const tuyaTimeout = setTimeout(() => {
      tuya.disconnect();
      reject();
    }, 10000);
    // Runs the logic converting CLI to commands
    const runCommand = async (initState) => {
      dprint(`runCommand has started with data ${JSON.stringify(initState)}`);
      tuya.removeListener('data', runCommand);
      let status = initState.dps['1'];
      // Ignore initial response if user is using dps
      if(isCommand('On')) await setState(true);
      else if(isCommand('Off')) await setState(false);
      else if(isCommand('-Set')) await setState(JSON.parse(tuyaSet));
      else if(isCommand('Toggle')) await setState(!status);
      else{
        if(isCommand('-Get')) status = await getState();
        // Shows state for all gets status or toggle
        dprint(`Status: ${status}`);
        print(bmap(status));
      }
      tuya.disconnect();
      clearTimeout(tuyaTimeout);
      resolve();
    };

    // Add event listeners
    // Connect auto gets state so put main logic into the listner.
    tuya.on('data', runCommand);

    tuya.on('connected', () => {
      dprint('Connected to device!');
    });

    tuya.on('disconnected', () => {
      dprint('Disconnected from device.');
    });

    tuya.on('error', (error) => {
      dprint('Error!', error);
    });
    // Resolve Missing IDs/IPS or resolve full network
    if(tuyaIP.length === 0 && tuyaID.length === 0) {
      // Logic for my branch and new refactored tuyapi
      const devices = await (tuya.findDevices() || tuya.find());
      print(`Devices ip ${JSON.stringify(devices)}`);
      resolve(devices);
      clearTimeout(tuyaTimeout);
      return;
    }
    if(tuyaIP.length < 4 || tuyaID.length < 4) {
      // Logic for my branch and new refactored tuyapi
      const device = await (tuya.find() || tuya.resolveId());
      dprint(`ip ${device.ip} id: ${device.id}`);
    }
    await tuya.connect();
  });
}
/* Main function which gets and sets state according to input
 */
function main() {
  if(tuyaMode.includes('cloud')) runCloud();
  else runLocal();
}
main();
