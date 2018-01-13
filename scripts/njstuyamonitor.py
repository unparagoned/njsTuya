#Gets List of devices on network
from __future__ import print_function
import re
from socket import *
import sys

_DEBUG = False
dp = _DEBUG
ARGLIST = sys.argv[1:]
argCommand = " ".join(ARGLIST)
watchIp = "NOIPMATCH"
watchId = "NOIDMATCH"
idMatch = ""
ipMatch = ""
ipMatch = re.match('.*ip ([0-9\.]*).*', argCommand)
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
s.bind(('', 6666))
#user for loop just in case errors create infinite loops
#Also go through twice incase timing error or device is slow
var_list = []
detection_loops = 2
for cvar in range(0, 255):
    m = s.recvfrom(1024)
    if(dp): print (' Devices on network details:\n%s' % m[0])
    ipi = re.match('.*"ip":"(.+?)"."gwId":"(.+?)".*', m[0])
    if ipi:
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
#        print "no ip found"
        print ("Error no ip found %s" % m[0])
        break
    if detection_loops < 1:
        break

#    print 'Extracted IP: %s\n' % ip
print("{ Devices: [ ", end=" ")
for (i, j) in var_list:
    print(" { -ip %s -id %s -key " % (i, j), end=" },")
print('\b ] }')
