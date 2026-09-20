"""
Decides whether a student's chosen option is the right one.

The exam screen submits the option LETTER ("A".."D"), but question banks
uploaded from Excel store the correct answer in either form:

    letter ->  "b", "B", "b.", "(b)"
    text   ->  "Abuja", "347", "Ostrich"   (the wording of the right option)

Comparing a letter to option text never matches, so every student scored 0
on banks that use the text form. Both forms are handled here.
"""
import re
from dataclasses import dataclass, field
from typing import Dict, Optional

_LETTER_ONLY = re.compile(r"^\(?\s*([a-d])\s*[.):]?\s*$", re.IGNORECASE)
LETTERS = ("a", "b", "c", "d")


@dataclass
class AnswerKey:
    """One question's answer key: its id, the stored answer, and the option texts."""
    id: object
    answer: str
    options: Dict[str, str] = field(default_factory=dict)   # {"a": "...", "b": "...", ...}


def _norm(value) -> str:
    return " ".join(str(value if value is not None else "").split()).casefold()


def _to_number(value) -> Optional[float]:
    try:
        return float(_norm(value).replace(",", ""))
    except ValueError:
        return None


def _same_text(a, b) -> bool:
    """Case/whitespace-insensitive, and numerically tolerant ("12" == "12.0")."""
    if _norm(a) == _norm(b):
        return True
    na, nb = _to_number(a), _to_number(b)
    return na is not None and nb is not None and abs(na - nb) < 1e-9


def stored_answer_letter(stored) -> Optional[str]:
    """'b' / 'B.' / '(b)' -> 'b'. Anything else (i.e. option text) -> None."""
    match = _LETTER_ONLY.match(str(stored if stored is not None else "").strip())
    return match.group(1).lower() if match else None


def is_correct_answer(chosen, stored_answer, options: Dict[str, str]) -> bool:
    chosen_norm = _norm(chosen)
    # A blank choice (unanswered) or a blank stored answer must never count as
    # correct -- otherwise "" would match a missing/blank option text.
    if not chosen_norm or not _norm(stored_answer):
        return False
    stored_letter = stored_answer_letter(stored_answer)

    if chosen_norm in LETTERS:
        if stored_letter:
            return chosen_norm == stored_letter
        # Stored answer is option text: is the chosen option's text that answer?
        return _same_text(options.get(chosen_norm, ""), stored_answer)

    # The client sent option text instead of a letter -- support that too.
    if stored_letter:
        return _same_text(chosen, options.get(stored_letter, ""))
    return _same_text(chosen, stored_answer)
