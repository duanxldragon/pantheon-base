import os
import subprocess, time
import tenant_acceptance as ta

ta.BASE = "http://127.0.0.1:8081"
CLI = r"D:/Redis/redis-cli.exe"
def redis(*args):
    return subprocess.run([CLI, "-a", os.environ.get("PANTHEON_REDIS_PASSWORD", ""), "-n", "0", *args],
                          capture_output=True, text=True).stdout.strip()

def state(label, uid, sid):
    print("%s user_key=blacklist:%s val=%r ttl=%r | session_key=blacklist:session:%s val=%r ttl=%r" % (
        label, uid, redis("get", "blacklist:%s" % uid), redis("ttl", "blacklist:%s" % uid),
        sid, redis("get", "blacklist:session:%s" % sid), redis("ttl", "blacklist:session:%s" % sid)))

run = time.strftime("%m%d%H%M%S")
admin = ta.Session("redis-admin")
admin.login(ta.ACME_ADMIN, ta.ACME_ADMIN_PWD)
admin.operation_verify(ta.ACME_ADMIN_PWD)
uname = "redisprobe_" + run
_, _, created = admin.call("POST", "/api/v1/system/user", {
    "username": uname, "password": ta.USER_PWD, "nickname": "Redis Probe", "status": 1,
})
uid = ta.data_of(created).get("id")
user = ta.Session("redis-user")
_, login = user.login(uname, ta.USER_PWD, tenant_id=282)
sid = ta.data_of(login).get("sessionId")
print("created user", uid, "session", sid)
state("after-login      ", uid, sid)

_, _, reset = admin.call("PUT", "/api/v1/system/user/%s/reset-password" % uid, {"newPassword": ta.USER_PWD2})
print("reset-password code", ta.code_of(reset))
state("after-reset      ", uid, sid)

fresh = ta.Session("redis-fresh")
fresh.login(uname, ta.USER_PWD2, tenant_id=282)
state("after-new-login  ", uid, sid)

_, _, old_after = user.call("GET", "/api/v1/auth/tenants/current")
_, _, new_after = fresh.call("GET", "/api/v1/auth/tenants/current")
print("old session after reset+new-login:", ta.code_of(old_after), old_after.get("message"))
print("new session after reset+new-login:", ta.code_of(new_after))

admin.call("DELETE", "/api/v1/system/user/%s" % uid)
