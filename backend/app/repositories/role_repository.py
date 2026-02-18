from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Role)
