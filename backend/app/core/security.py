import os
from cryptography.fernet import Fernet

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KEY_FILE = os.path.join(BASE_DIR, ".secret.key")

_fernet_instance = None

def get_fernet():
    global _fernet_instance
    if _fernet_instance is None:
        if os.path.exists(KEY_FILE):
            with open(KEY_FILE, "rb") as f:
                key = f.read().strip()
        else:
            key = Fernet.generate_key()
            with open(KEY_FILE, "wb") as f:
                f.write(key)
        _fernet_instance = Fernet(key)
    return _fernet_instance

def encrypt_api_key(api_key: str) -> str:
    if not api_key:
        return ""
    f = get_fernet()
    return f.encrypt(api_key.encode("utf-8")).decode("utf-8")

def decrypt_api_key(encrypted_key: str) -> str:
    if not encrypted_key:
        return ""
    try:
        f = get_fernet()
        return f.decrypt(encrypted_key.encode("utf-8")).decode("utf-8")
    except Exception:
        return encrypted_key
