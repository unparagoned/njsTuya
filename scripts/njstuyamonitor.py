#Gets List of devices on network
# python njsmonitor.py options
# -v for verbose
# -s for simple mode, ON/OFF - how it used to work
from __future__ import print_function
import re
from socket import *
import sys
import os
from functools import wraps
import errno
import datetime
import subprocess
import signal
import json 

_DEBUG = False
dp = _DEBUG
ARGLIST = sys.argv[1:]
argCommand = " ".join(ARGLIST)
watchIp = "NOIPMATCH"
watchId = "NOIDMATCH"
idMatch = ""
ipMatch = ""
ipMatch = re.match('.*ip ([0-9\.]*).*', argCommand)
silent = True
schema = " -get '{ \"schema\": true}'"
mode = "schema"
detection_loops = 2

if "-v" in argCommand:
    silent = False
if "-s" in argCommand:
    mode = "status"
    schema = ""
if "-q" in argCommand:
    detection_loops = 1

ppid = str(os.getpid())
pidfile = "/tmp/njsmon.pid"
class TimeoutError(Exception):
    pass

def timeout(seconds=10, error_message=os.strerror(errno.ETIMEDOUT)):
    def decorator(func):
        def _handle_timeout(signum, frame):
            raise TimeoutError(error_message)

        def wrapper(*args, **kwargs):
            signal.signal(signal.SIGALRM, _handle_timeout)
            signal.alarm(seconds)
            try:
                result = func(*args, **kwargs)
            finally:
                signal.alarm(0)
            return result

        return wraps(func)(wrapper)

    return decorator

@timeout(2, os.strerror(errno.ETIMEDOUT))
def pid_exists(pid):
    """Check whether pid exists in the current process table.
    UNIX only.
    """
    if pid < 0:
        return False
    if pid == 0:
        # According to "man 2 kill" PID 0 refers to every process
        # in the process group of the calling process.
        # On certain systems 0 is a valid PID but we have no way
        # to know that in a portable fashion.
        raise ValueError('invalid PID 0')
    try:
        os.kill(pid, 0)
    except OSError as err:
        if err.errno == errno.ESRCH:
            # ESRCH == No such process
            return False
        elif err.errno == errno.EPERM:
            # EPERM clearly means there's a process to deny access to
            return True
        else:
            # According to "man 2 kill" possible error values are
            # (EINVAL, EPERM, ESRCH)
            raise
    else:
        return True

#only on linux
if os.name != 'nt':
    #file can become read only and cause problems
    if os.path.isfile(pidfile):
        f = open(pidfile, "r")
        for line in f:
            lineInt = int(line)
            #print("line %s int %d" % (line, lineInt))
            if(pid_exists(lineInt)):           
                print("Error: Process is already runnign %s already exists, exiting" % (pidfile))
                sys.exit()
        f.close()
        if(dp): print("Warning: Pidfile exists %s deleting" % (pidfile))
        # checks pid anyway
    #errors out checking pid anyway
    fw = open(pidfile, "w")
    fw.write(ppid)
    fw.close()

# quick conversion to more json like format for output
def commandToJSON(command):
    return re.sub(r'-(i[pd]) ([0-9a-zA-Z\.]*)',r'"\1": \2,',command)

def fixJSONString(brokenString):
    return re.sub(r' ([a-zA-Z]+)\:', r' "\1":', brokenString.replace("'",'"'))

def getState(device):
    scriptLocation=os.path.dirname(os.path.realpath(sys.argv[0]))
    fullCmd = "node " + scriptLocation + "/njstuya.js " + device
    try:   
        if dp: print("script cmd: %s" % fullCmd)
        output = subprocess.check_output(fullCmd, shell=True, stderr=subprocess.STDOUT)
    except:
        try: 
            output = subprocess.check_output("node njstuya.js " + device, shell=True, stderr=subprocess.STDOUT)
        except:
            output = "ERROR njstuya.js missing or can't connect to device"
            pass
    if dp: print("%s output : %s" % (fullCmd, output))
    return output

try:
    if not silent: print("Scnanning network for decices: Please wait")
    if (dp): print ("argCommand: %s" % argCommand)
    if ipMatch:
        watchIp = ipMatch.group(1)
    else:
        idMatch = re.match('.*id ([0-9a-z]*).*', argCommand)
        if idMatch:
            watchId = idMatch.group(1)
        elif re.match(r'[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*', argCommand):
            watchIp = argCommand.strip()
        else:
            watchId = argCommand.strip()
    if (dp): print ("watchIP: %s and watchId: %s" % (watchIp, watchId))
    s = socket(AF_INET, SOCK_DGRAM)
    s.settimeout(18.0)
    s.bind(('', 6666))
    #user for loop just in case errors create infinite loops
    #Also go through twice incase timing error or device is slow
    var_list = []
    
    for cvar in range(0, 255):
        m = s.recvfrom(1024)
        if(not silent): print (' Devices on network details:\n%s' % m[0])
        ipi = re.match('.*"ip":"(.+?)"."gwId":"(.+?)".*', m[0])
        if ipi:
            if(dp): print (datetime.datetime.now())
            ip = ipi.group(1)
            gwId = ipi.group(2).lower()
            if (ip, gwId) in var_list:
                detection_loops -= 1
            else:
                var_list.append((ip, gwId))
            if (dp): print('ip : %s : %s - id %s : %s' %  (ip, watchIp, gwId, watchId))   
            if ip.strip() == watchIp or gwId.strip() == watchId:
                if (dp): print("Match ip or id")
                break
        else:
            print ("Error no ip found %s" % m[0])
            break
        if detection_loops < 1:
            break
    s.close()
    if not silent: print("Getting device states")
    print('{ "Devices": [ ', end=" ")
    for (i, j) in var_list:
        devDetails="-ip " + i + " -id " + j
        output = getState(devDetails + schema)
        devDetailsJSON = commandToJSON(devDetails)
        outputJSON = fixJSONString(output)
        status=""
        if mode == "schema":
            status=json.loads(outputJSON)['dps']['1']
            if type(status) is type(True):
                statusString = 'ON' if status else 'OFF'
            else:
                statusString = str(status)
            outputJSON= outputJSON + ' "status": ' + statusString
        print(" \n{ %s \"%s\": %s" % (devDetailsJSON, mode, outputJSON), end=" },")
    print('\b ] }')

finally:
    if os.path.isfile(pidfile):
        if(dp): print("fin")  
        os.unlink(pidfile)