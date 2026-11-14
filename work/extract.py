import zipfile, os, sys
jar = r'C:\Users\lemon\AppData\Local\Temp\VapeChat\vape-chat-15408.jar'
out = r'D:\vape\work\jarc'
os.makedirs(out, exist_ok=True)
want = [
 'gg/vape/account/LicenseManager', 'gg/vape/account/LicenseStatus', 'gg/vape/account/LicenseStatusClient',
 'gg/vape/account/LicenseStatusResponse', 'gg/vape/account/LicenseInfo', 'gg/vape/account/LicenseInfoClient',
 'gg/vape/account/AccountEntitlements', 'gg/vape/account/AccountInfo', 'gg/vape/account/AccountInfoResponse',
 'gg/vape/api/ApiAccessTokenProvider', 'gg/vape/api/ApiServices',
 'gg/vape/manager/client/OnlineAccountState',
 'gg/vape/protocol/ZeusConnectionManager', 'gg/vape/protocol/ZeusAuthenticatedProtocolState',
 'gg/vape/protocol/ZeusUnauthenticatedProtocolState', 'gg/vape/protocol/packet/AuthenticationPacket',
 'gg/vape/protocol/packet/AuthenticationResponsePacket',
]
z = zipfile.ZipFile(jar)
names = set(z.namelist())
for w in want:
    for n in names:
        if n == w + '.class':
            p = os.path.join(out, w.replace('/', '_') + '.class')
            open(p, 'wb').write(z.read(n))
            print(p, os.path.getsize(p))
