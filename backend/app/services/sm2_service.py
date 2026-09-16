from datetime import datetime, timedelta, timezone
from typing import Tuple


def calculate_sm2(
    repetition: int,
    interval: int,
    ease_factor: float,
    rating: int,  # 1 to 5
) -> Tuple[int, int, float, datetime]:
    """SuperMemo SM-2 Spaced Repetition calculation.
    
    Returns:
        (new_repetition, new_interval_days, new_ease_factor, next_review_datetime)
    """
    if rating >= 3:
        if repetition == 0:
            new_interval = 1
        elif repetition == 1:
            new_interval = 6
        else:
            new_interval = round(interval * ease_factor)
        new_repetition = repetition + 1
    else:
        new_repetition = 0
        new_interval = 1

    # Adjust ease factor
    new_ease = ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
    if new_ease < 1.3:
        new_ease = 1.3

    new_ease = round(new_ease, 2)
    next_review = datetime.now(timezone.utc) + timedelta(days=new_interval)

    return new_repetition, new_interval, new_ease, next_review
