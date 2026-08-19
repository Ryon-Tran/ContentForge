import os

BASE = "backend/app"
MAIN_PATH = os.path.join(BASE, "main.py")

with open(MAIN_PATH, "r", encoding="utf-8") as f:
    lines = f.readlines()

def get_lines(start_idx, end_idx):
    # indices are 0-based
    return "".join(lines[start_idx:end_idx])

# models/schemas.py
models_content = "from typing import Optional, List\nfrom pydantic import BaseModel, Field\n\n"
models_content += get_lines(196, 247) # AIConfigCreate, Update, SetDefaultRequest
models_content += get_lines(954, 971) # Activity requests
models_content += get_lines(1372, 1391) # SaveRowRequest, DeleteRowRequest
models_content += get_lines(1602, 1613) # SaveFileRequest
models_content += get_lines(1732, 1803) # Generate requests

with open(os.path.join(BASE, "models/schemas.py"), "w", encoding="utf-8") as f:
    f.write(models_content)

print("Created models/schemas.py")
