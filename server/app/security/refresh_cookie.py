from fastapi import Response

REFRESH_COOKIE = "refresh_token"

# Kept identical for set + delete: a browser only removes a cookie when the
# delete request matches the attributes it was set with.
_COOKIE_ATTRS = dict(
    httponly=True,   # JS can never read the refresh token (XSS-safe)
    samesite="none",
    secure=True,
    path="/",
)


def set_refresh_cookie(response: Response, token: str) -> None:
    # No max_age on purpose: this stays a browser-session cookie so it is dropped
    # when the browser closes (exam machines are often shared). The real expiry
    # is the `exp` inside the JWT itself.
    response.set_cookie(key=REFRESH_COOKIE, value=token, **_COOKIE_ATTRS)


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=REFRESH_COOKIE, **_COOKIE_ATTRS)
