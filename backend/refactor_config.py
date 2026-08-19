import os

BASE = "backend/app"
MAIN_PATH = os.path.join(BASE, "main.py")
CONFIG_API_PATH = os.path.join(BASE, "api", "config_api.py")

with open(MAIN_PATH, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Extract lines 194 to 950 (Note: lines 193-387 are CONFIG MODELS & HELPERS, 388-950 are CONFIG APIs)
# Wait, models were extracted, but they were NOT removed from main.py yet!
# We should remove CONFIG HELPERS and CONFIG APIs from main.py and put them in config_api.py.

# Let's find exactly the lines
start_idx = 0
end_idx = 0
for i, line in enumerate(lines):
    if "# CONFIG HELPERS" in line:
        start_idx = i - 1
    if "# ACTIVITY LOG" in line:
        end_idx = i - 1
        break

if start_idx == -1 or end_idx == 0:
    print("Error finding boundaries")
    exit(1)

config_lines = lines[start_idx:end_idx]

# Create api/config_api.py
header = """import os
import sqlite3
import uuid
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from app.core.database import get_db
from app.models.schemas import AIConfigCreate, AIConfigUpdate, SetDefaultRequest

router = APIRouter(prefix="/api/config", tags=["Config"])

"""

# Replace @app. with @router. and remove /api/config prefix if needed
# Actually it's easier to just use @router.get("") and keep their paths?
# Wait, if router has prefix="/api/config", then @app.get("/api/config/ai-providers") becomes @router.get("/ai-providers")
processed_lines = []
for line in config_lines:
    if line.startswith("@app."):
        line = line.replace("@app.", "@router.")
        line = line.replace('"/api/config', '"')
    processed_lines.append(line)

with open(CONFIG_API_PATH, "w", encoding="utf-8") as f:
    f.write(header)
    f.writelines(processed_lines)

# Now remove these lines from main.py
new_main_lines = lines[:start_idx] + lines[end_idx:]

# And we also need to remove the config models from main.py since we moved them to schemas.py
# Let's find CONFIG MODELS
model_start = 0
for i, line in enumerate(new_main_lines):
    if "# CONFIG MODELS" in line:
        model_start = i - 1
        break
        
if model_start > 0:
    # CONFIG HELPERS was after CONFIG MODELS, so the models are right before our cut.
    # Since we already cut CONFIG HELPERS, the models end right at start_idx.
    # We will remove from model_start to start_idx.
    # Wait, new_main_lines is already modified.
    pass

# We will just write a patch to main.py to include the router
# Let's find where app = FastAPI(...) is defined
app_idx = 0
for i, line in enumerate(new_main_lines):
    if "app = FastAPI(" in line:
        app_idx = i
        break

# Insert router include after app setup
include_statement = "\nfrom app.api.config_api import router as config_router\napp.include_router(config_router)\n"

# We should insert it after the middleware
middleware_idx = 0
for i, line in enumerate(new_main_lines):
    if "app.add_middleware(" in line:
        # find the closing bracket of middleware
        for j in range(i, len(new_main_lines)):
            if ")" in new_main_lines[j]:
                middleware_idx = j + 1
                break
        break

new_main_lines.insert(middleware_idx, include_statement)

with open(MAIN_PATH, "w", encoding="utf-8") as f:
    f.writelines(new_main_lines)

print("Refactored config API")
