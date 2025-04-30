import multiprocessing
import os

# Server socket
bind = "0.0.0.0:" + str(os.getenv("PORT", "8000"))

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Timeout
timeout = 120
keepalive = 5 