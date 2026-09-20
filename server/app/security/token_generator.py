from uuid import UUID

from fastapi.security import OAuth2PasswordBearer
from typing_extensions import Optional
from datetime import timedelta, datetime
from app.config import settings
import jwt
from jwt.exceptions import DecodeError, ExpiredSignatureError, InvalidSignatureError
from fastapi.exceptions import HTTPException
from fastapi import Depends
from typing_extensions import Annotated, Literal
from app.utils.enums.user_type_enum import UserTypeEnum
from app.repo import db_injection





oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
SK = settings.SK
ALGO = settings.ALGO

ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


# ---------------------------------------------------------------------------
# Lifetimes -- the single source of truth.
#
# A student's DB session lives exactly as long as their refresh token
# (login uses refresh_ttl_for("student") for BOTH), so "refresh token is dead"
# and "session is dead" are the same moment. Admins have no session row, so
# they just get a longer-lived refresh token.
# ---------------------------------------------------------------------------
ACCESS_TOKEN_TTL = timedelta(minutes=settings.ACCESS_TOKEN_MINUTES)
STUDENT_SESSION_TTL = timedelta(hours=settings.STUDENT_SESSION_HOURS)
ADMIN_REFRESH_TTL = timedelta(days=settings.ADMIN_REFRESH_DAYS)


def refresh_ttl_for(role: str) -> timedelta:
    return STUDENT_SESSION_TTL if role == "student" else ADMIN_REFRESH_TTL


def generate_access_token(id: str,identifier: str, full_name: str, role:Literal["student", "admin"]  , exp_time:Optional[timedelta] = None, sid: Optional[str] = None):
    to_ecode = {
        "id":str(id),
        "sub":str(identifier),
        "username": full_name,
        "role": role,
        "token_type": ACCESS_TOKEN_TYPE,
    }
    if sid:
        to_ecode["sid"] = sid

    to_ecode.update({"exp": datetime.utcnow() + (exp_time or ACCESS_TOKEN_TTL)})
    return jwt.encode(to_ecode, SK, algorithm=ALGO)



def generate_refresh_token(id: str,identifier: str, full_name: str, role:Literal["student", "admin"], sid: Optional[str] = None ):
    to_ecode = {
        "id":str(id),
        "sub":str(identifier),
        "username": full_name,
        "role": role,
        "token_type": REFRESH_TOKEN_TYPE,
        "exp": datetime.utcnow() + refresh_ttl_for(role)
    }
    if sid:
        to_ecode["sid"] = sid
    return jwt.encode(to_ecode, SK, algorithm=ALGO)




def general_token_gen(id: str,identifier: str, full_name: str,  exp_time:Optional[timedelta] = None, type:Literal["student", "admin"] = "student", sid: Optional[str] = None):
    return generate_access_token(
        id=id,
        exp_time=exp_time,
        full_name=full_name,
        identifier=identifier,
        role=type,
        sid=sid

        ), generate_refresh_token(
        id=id,

        full_name=full_name,
        identifier=identifier,
        role=type,
        sid=sid
        )




async def _validate_token(token: str, db, expected_type: str) -> dict:
    """
    Shared by the access-token dependency and the refresh endpoint.

    `expected_type` stops the two token kinds being swapped: a long-lived
    refresh token must not work as a Bearer token on normal endpoints, and an
    access token must not be able to mint new access tokens.
    """
    try:
        payload: dict = jwt.decode(token, SK, algorithms=[ALGO])

        if payload.get("token_type") != expected_type:
            raise HTTPException(
                detail="invalid token type",
                status_code=401
            )

        user_id_raw = payload.get("id")

        try:
            user_id = UUID(user_id_raw)
        except (ValueError, TypeError):
            raise HTTPException(
                detail="invalid user id in token",
                status_code=401
            )

        identifier: str = payload.get("sub")
        user_name: str = payload.get("username")
        role = payload.get("role")
        exp = payload.get("exp")
        sid = payload.get("sid")

        if role == "student":
            if db is None or not sid:
                raise HTTPException(
                    detail="session required, please login again",
                    status_code=401
                )

            from app.repo.queries.auth.session_queries import SessionQueries

            session_repo = SessionQueries(db)

            valid = await session_repo.is_session_valid(user_id, sid)

            if not valid:
                raise HTTPException(
                    detail="your session has ended, please login again",
                    status_code=401
                )

        return {
            "id": user_id,
            "identifier": identifier,
            "username": user_name,
            "role": role,
            "exp": exp,
            "sid": sid
        }

    except HTTPException:
        raise

    except ExpiredSignatureError as e:
        print(f"error due to: {e}")
        raise HTTPException(
            detail="token has expired",
            status_code=401
        )

    except DecodeError as e:
        print(f"error due to: {e}")
        raise HTTPException(
            detail="error decoding token",
            status_code=401
        )

    except InvalidSignatureError as e:
        print(f"error due to: {e}")
        raise HTTPException(
            detail="invalid token",
            status_code=403
        )

    except Exception as e:
        print(f"error due to: {e}")
        raise HTTPException(
            detail="server error in decoding token",
            status_code=500
        )


async def verify_token(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: db_injection = None
):
    """FastAPI dependency for every normal endpoint: accepts ACCESS tokens only."""
    return await _validate_token(token, db, ACCESS_TOKEN_TYPE)


async def verify_refresh_token(token: str, db) -> dict:
    """Accepts REFRESH tokens only. Not a dependency -- called by refresh_access_token."""
    return await _validate_token(token, db, REFRESH_TOKEN_TYPE)


def peek_token(token: Optional[str]) -> Optional[dict]:
    """
    Decode a token, checking its signature but IGNORING expiry.

    Only used to work out whose session a dead token belonged to, so that
    session can be ended. A forged token fails the signature check -> None.
    """
    if not token:
        return None
    try:
        return jwt.decode(token, SK, algorithms=[ALGO], options={"verify_exp": False})
    except jwt.PyJWTError:
        return None


async def end_session_for_tokens(db, *tokens: Optional[str]) -> None:
    """
    Ends the student session(s) the given (possibly expired) tokens belong to.

    A session is only ended when the token's `sid` is the one currently on
    record, so a stale token from an OLD login can never kill the student's
    NEW session (e.g. they moved to another machine).
    """
    from app.repo.queries.auth.session_queries import SessionQueries

    session_repo = SessionQueries(db)
    done = set()
    for token in tokens:
        payload = peek_token(token)
        if not payload or payload.get("role") != "student":
            continue
        user_id, sid = payload.get("id"), payload.get("sid")
        if not user_id or not sid or (user_id, sid) in done:
            continue
        done.add((user_id, sid))
        await session_repo.end_session_if_token(user_id, sid)


async def refresh_access_token(
    db,
    refresh_token: Optional[str],
    stale_access_token: Optional[str] = None,
) -> str:
    """
    Trades a valid refresh token for a fresh access token.

    If the refresh token is rejected with a 401 (missing / expired / bad
    signature / session already ended) the login is over, so the student's
    session is ended here too -- this is what keeps session and tokens in sync.

    `stale_access_token` is the expired access token the client was holding.
    It lets us identify (and end) the session even when the refresh cookie is
    missing altogether (blocked, cleared, expired on the browser side).

    Raises HTTPException; the caller turns it into a response.
    """
    try:
        if not refresh_token:
            raise HTTPException(
                detail="No refresh token found, please login again",
                status_code=401
            )
        data = await verify_refresh_token(refresh_token, db)
    except HTTPException as e:
        if e.status_code == 401:
            try:
                await end_session_for_tokens(db, refresh_token, stale_access_token)
            except Exception as end_err:
                # Never let a cleanup failure hide the real 401 from the client.
                print(f"could not end session after failed refresh: {end_err}")
        raise

    return generate_access_token(
        full_name=data.get("username"),
        id=data.get("id"),
        identifier=data.get("identifier"),
        role=data.get("role"),
        sid=data.get("sid"),
    )
