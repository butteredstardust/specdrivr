import pexpect
import sys

child = pexpect.spawn('pnpm db:generate', encoding='utf-8')
child.logfile = sys.stdout

while True:
    try:
        index = child.expect(['enum', 'column', 'table', pexpect.EOF, pexpect.TIMEOUT], timeout=5)
        if index == 4:
            continue
        elif index == 3:
            break
        else:
            child.sendline('')
    except pexpect.EOF:
        break

child.close()
