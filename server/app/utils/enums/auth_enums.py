from enum import Enum


class AuthEums(Enum):
    EXISTS = "exists"
    CREATED = "created"
    NOT_FOUND = "not_found"
    NOT_ALLOWED = "not_allowed"
    OK = "ok"
    ERROR = "error"
    ALLOWRD = "allowed"