/**
 * Simple wrapper for tuyapi for use with openhab or command line
 * Added support for more devices through set command
 * npm install unparagoned/njsTuya
 * NEW CLOUD MODE

 * njstuya.js -mode cloud -user email -pass password -biz smart_life -code 44 -region eu -id 12312312312 COMMAND
 * OR add details to key.json
 * njstuya.js -mode cloud -id 12312312312 COMMAND
 * njstuya.js -mode cloud -id 12312312312 -set "{\"command\": \"temperatureSet\", \"value\": 30}"
 * ** USE LOCAL LAN
 * node njstuya.js args COMMAND
 * node njstuya.js -ip 192.168.x.x -id 1231204564df -key dsf456sdf COMMAND
 * node njstuya.js -id 1231204564df -get "{ \"schema\": true }"
 * node njstuya.js -ip 192.168.x.x -id 1231204564df -key dsf456sdf -set "{ \"dps\": 1, \"set\": true }"
 * COMMAND: ON, OFF, or TOGGLE.
 * DEBUG MODE
 * DEBUG=* node node njstuya.js
 * */

const debug = require('debug')('njstuya');
const CloudTuya = require('cloudtuya');
const TuyaDevice = require('tuyapi');
const fs = require('fs');

const name = 'njstuya';

debug('booting %s', name);
const args = process.argv.slice(2);

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
    debug(`"{argName} value is: ${argValue}`);
  }
  return argValue;
}
const tuyaIP = getArgs(args, '-ip');
let tuyaID = getArgs(args, '-id');
let tuyaKey = getArgs(args, '-key');
const tuyaVersion = getArgs(args, '-v');
const tuyaSet = getArgs(args, '-set');
const tuyaGet = getArgs(args, '-get');
let tuyaResolve = getArgs(args, '-res');
const tuyaUser = getArgs(args, '-user');
const tuyaPass = getArgs(args, '-pass');
const tuyaBiz = getArgs(args, '-biz');
const tuyaCountryCode = getArgs(args, '-code');
const tuyaRegion = getArgs(args, '-region');
let tuyaMode = getArgs(args, '-mode');

// cloud or local

if(tuyaResolve === undefined || tuyaResolve.includes('true')) tuyaResolve = true;
else tuyaResolve = ((tuyaResolve.includes('false') ? false : tuyaResolve));


function getKey() {
  try{
    let key = require('./key.json');
    return key;
  } catch(err) {
    try {
      return require('../../key.json')
    } catch (error) {
      return {}
    }
  }
}
const apiKey = getKey();

if(tuyaMode.length === 0) {
  if(tuyaKey.length === 0 && args.length > 0) {
    if((tuyaUser.length > 0 && tuyaPass.length > 0) || apiKey.undefined) {
      tuyaMode = 'cloud';
    } else{
      tuyaMode = 'local';
      debug('local mode');
    }
  } else{
    tuyaMode = 'local';
  }
}


if(tuyaKey.length === 0) {
  tuyaKey = '1000000000000000';
}
if(tuyaID.length === 0 && tuyaIP.length === 0) {
  tuyaID = '00000000000000000000';
}

let tuya;
try{
  tuya = new TuyaDevice({
    id: tuyaID,
    key: tuyaKey,
    ip: tuyaIP,
    resolve: tuyaResolve,
    version: (tuyaVersion || undefined),
  });
} catch(error) {
  print(`caught error: ${error.toString()}`);
}
let api = {};
debug(`api ${JSON.stringify(apiKey)} or ${apiKey.userName}`);
if(tuyaMode === 'cloud') {
  api = new CloudTuya({
    userName: apiKey.userName || tuyaUser,
    password: apiKey.password || tuyaPass,
    bizType: apiKey.bizType || tuyaBiz,
    countryCode: apiKey.countryCode || tuyaCountryCode,
    region: apiKey.region || tuyaRegion,
  });
}


function bmap(istate) {
  if(typeof istate !== typeof true) return istate;
  return istate ? 'ON' : 'OFF';
}

function cState(istate) {
  return((istate === 1) && true) || false;
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
  debug(`new state:${JSON.stringify(stateObj)}`);

  await tuya.set(stateObj).then((result) => {
    debug(`Result of setting status to ${JSON.stringify(stateObj)}: ${result}`);
    if(result) {
      print(bmap(state));
    } else{
      print(bmap(!state));
    }
  }, (reason) => {
    print(`${reason.toString()} - Try without IP to auto resolve IP`);
  });
}

async function setStateCloud(command, payload) {
  const state = {
    devId: tuyaID,
    command,
    payload,
  }
  // Legacy support for setCommand
  if(Object.keys(payload).includes('value')) state.setState = payload.value;
  const resp = await api.setState(state);
  debug(resp);
  return resp;
}


async function switchStateCloud(iState, command = 'turnOnOff') {
  const resp = await setStateCloud(command, { value: iState });
  const status = (command === 'turnOnOff') ? bmap(cState(iState)) : iState;
  if(resp.header.code === 'SUCCESS') {
    print(status);
  } else print(resp.header.code || 'ERROR');
}

async function runCloud() {
  let tokens;
  try{
    tokens = JSON.parse(fs.readFileSync('./cloudToken.json'));
    debug(`cloud Token Catch ${JSON.stringify(tokens)}`);
    if(tokens.valid_to < Date.now() + 10) throw ('update token');
    api.setToken(tokens);
  } catch(err) {
    debug(err);
    tokens = await api.login();
    tokens.valid_to = Date.now() + tokens.expires_in;
  }

  debug(`Token: ${JSON.stringify(tokens)}`);

  if(isCommand('On')) {
    await switchStateCloud(1);
  } else if(isCommand('Off')) {
    await switchStateCloud(0);
  } else if(isCommand('-Set')) {
    const setCommand = JSON.parse(tuyaSet);
    await setStateCloud(setCommand.command, setCommand.payload);
  } else{
    // Get state of a single device
    const deviceStates = await api.state({
      devId: tuyaID,
    });
    debug(`deviceStates ${JSON.stringify(deviceStates)}`);
    const status = ((tuyaID.length > 0) && deviceStates[tuyaID]) || deviceStates;

    if(isCommand('Toggle')) {
      let newState = 1;
      debug(`status ${status} + ${status.includes('ON')}`);
      if(status.includes('ON')) {
        newState = 0;
      }
      switchStateCloud(newState);
    } else{
      if(isCommand('-Get')) throw new Error('Set not available on cloud yet');
      // Shows state for all gets status or toggle
      debug(`Status: ${status}`);
      print(status);
    }
  }
  fs.writeFileSync(`./cloudToken.json`, JSON.stringify(tokens));
}

async function getSchema(ip, id, key = '1000000000000000', version = '') {
  return new Promise((resolve, reject) => {
    let deviceData = {};
    const newTuya = new TuyaDevice({
      id,
      ip,
      key,
      version,
    });
    setTimeout(() => {
      debug('Timeout');
      newTuya.disconnect();
      reject(new Error('Timeout getting schema'));
    }, 5000);
    newTuya.on('disconnected', () => {
      debug('Disconnected from device.');
    });
    newTuya.on('error', (error) => {
      debug('Error', error);
      newTuya.disconnect();
      reject(error);
    });
    newTuya.on('connected', () => {
      debug('Connected to device!');
    });
    newTuya.on('data', (schema) => {
      debug(`${id}: ${JSON.stringify(schema)}`);
      try{
        newTuya.disconnect();
        const broadcast = {};
        Object.keys(newTuya.device).forEach((dkey) => {
          if(dkey !== 'parser' && dkey !== 'key') broadcast[dkey] = newTuya.device[dkey];
        });
        deviceData = { id, broadcast, schema };
        print(JSON.stringify(deviceData));
        Object.keys(schema).forEach(attname => debug(`${attname}: ${JSON.stringify(schema[attname])}`));
        resolve(deviceData);
      } catch(error) {
        debug(error);
      }
    });
    newTuya.connect();
  });
}

/**
 * Find details of devices on network.
 * @returns {Promise<Object>} the resulting state
 */
function findDevices() {
  return new Promise((resolve, reject) => {
    const devices = [];
    tuya.find({ timeout: 8, all: true }).then(async () => {
      debug(`devices ${JSON.stringify(tuya.foundDevices)}`);
      debug(tuya.foundDevices);
      print('{ "devices": [ ');
      // eslint-disable-next-line no-restricted-syntax
      for(const{ id, ip } of tuya.foundDevices) {
        if(ip) {
          // eslint-disable-next-line no-await-in-loop
          await getSchema(ip, id).then(device => devices.push(device)).catch(error => debug(error));
        }
      }
      print('] } ');
      debug(`Updated Devices ${JSON.stringify(tuya.foundDevices)}`);
      resolve(devices);
    }, (reason) => {
      print(`findDevices error ${reason.toString()}`);
      reject(reason.toString());
    }).catch(error => debug(error));
  });
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
      debug(`runCommand has started with data ${JSON.stringify(initState)}`);
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
        debug(`Status: ${status}`);
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
      debug('Connected to device!');
    });

    tuya.on('disconnected', () => {
      debug('Disconnected from device.');
    });

    tuya.on('error', (error) => {
      debug('Error!', error);
    });
    // Resolve Missing IDs/IPS or resolve full network
    if(tuyaID === '00000000000000000000') {
      // Logic for my branch and new refactored tuyapi
      findDevices().then((devices) => {
        debug(`All devices ${JSON.stringify(devices)}`);
        return resolve(devices);
      }).catch(error => debug(error));
      return;
    }
    if(tuyaIP.length < 4 || tuyaID.length < 4) {
      // Logic for my branch and new refactored tuyapi
      const device = await (tuya.find() || tuya.resolveId());
      debug(`ip ${device.ip} id: ${device.id}`);
    }
    await tuya.connect();
  });
}

/* Main function which gets and sets state according to input
 */
async function main() {
  if(tuyaMode.includes('cloud')) runCloud();
  else runLocal().catch(error => debug(error));
}
main();
