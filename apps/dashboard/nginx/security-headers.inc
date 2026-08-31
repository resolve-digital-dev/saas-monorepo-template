# Included from EVERY location block on purpose.
#
# nginx's add_header inheritance is all-or-nothing: a block that defines even
# one add_header of its own discards every add_header inherited from its
# parent. The previous config set these at `server` level and then added
# Cache-Control inside `location /assets/` and `location = /index.html`, which
# silently dropped all of them - including on the SPA fallback, since
# `try_files ... /index.html` re-enters `location = /index.html`.
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# A Content-Security-Policy belongs here too, but the correct `connect-src`
# depends on where your API actually lives, and a wrong one breaks the app
# silently in the browser. Uncomment and set the API origin before shipping:
#
# add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://api.example.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'" always;
