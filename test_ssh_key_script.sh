#!/bin/sh
cat << 'KEY' | tr -d '\r' > id_test_key
$SSH_PRIVATE_KEY
KEY
chmod 600 id_test_key
ssh-keygen -l -f id_test_key
