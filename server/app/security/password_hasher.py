from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

def generate_password(password: str):
    return pwd_context.hash(password)


def verify_hash_password(password: str, hash_pass: str) -> bool:
    return pwd_context.verify(password, hash=hash_pass)