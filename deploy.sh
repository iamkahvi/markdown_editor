#!/bin/bash

npx next export && rsync -azP out root@142.93.152.73:/var/www/write.kahvipatel.com
