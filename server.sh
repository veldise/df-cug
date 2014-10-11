#!/bin/bash

# ===============================
# init script
#
# @author nanhaprak
# ===============================

case "$1" in
  start)
    forever start -o out.log -e err.log app.js
    ;;
  stop)
    forever stop app.js
    ;;
  restart)
    forever stop app.js
    forever start -o out.log -e err.log app.js
    ;;
  list)
    forever list
    ;;
  *)
    echo $"Usage: $0 {start|stop|list}"
    exit 1
esac

exit 0
