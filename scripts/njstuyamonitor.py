#Gets List of devices on network
# python njsmonitor.py options
# -v for verbose
from __future__ import print_function
import re
from socket import *
import sys
import os
import errno
import datetime
from timeout import timeout
import subprocess

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
if "-v" in argCommand:
    silent = False

ppid = str(os.getpid())
pidfile = "/tmp/njsmon.pid"


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

def getState(device):
    try:
        output = subprocess.check_output("/usr/bin/node /etc/openhab2/scripts/njstuya.js " + device, shell=True, stderr=subprocess.STDOUT)
    except:
        output = "ERROR njstuya.js missing or can't connect to device"
        pass
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
    detection_loops = 2
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
    print("{ Devices: [ ", end=" ")
    for (i, j) in var_list:
        devDetails="-ip " + i + " -id " + j
        output = getState(devDetails)
        print(" \n{ %s -status: %s" % (devDetails, output), end=" },")
    print('\b ] }')

finally:
    if os.path.isfile(pidfile):
        if(dp): print("fin")  
        os.unlink(pidfile)