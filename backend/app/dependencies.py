from dataclasses import dataclass


@dataclass
class PaginationParams:
    skip: int = 0
    limit: int = 100
