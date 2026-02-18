# FastAPI Modular Architecture for Large Applications

## Overview

As FastAPI applications grow in complexity, organizing code into modules becomes essential for maintainability, scalability, and team collaboration. This guide provides a comprehensive approach to structuring large FastAPI applications using a modular architecture while maintaining the core principles of layered design and dependency injection.

## When to Use Modular Architecture

### Indicators for Modularization
- **Team Size**: More than 3-4 developers working on the project
- **Feature Count**: More than 10-15 distinct feature areas
- **Code Base Size**: More than 50 API endpoints or 10,000+ lines of code
- **Domain Complexity**: Multiple business domains (e.g., user management, billing, analytics)
- **Deployment Needs**: Different modules may need independent deployment cycles

### Benefits of Modular Architecture
- **Separation of Concerns**: Each module handles a specific business domain
- **Team Autonomy**: Teams can work independently on different modules
- **Code Reusability**: Shared components can be used across modules
- **Testing Isolation**: Modules can be tested independently
- **Scalability**: Easier to scale specific parts of the application

## Modular Project Structure

### High-Level Directory Structure
```
project_root/
├── app/
│   ├── __init__.py
│   ├── main.py                     # Application entry point
│   ├── config/                     # Global configuration
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   └── database.py
│   ├── core/                       # Shared core functionality
│   │   ├── __init__.py
│   │   ├── security.py
│   │   ├── exceptions.py
│   │   ├── middleware.py
│   │   └── dependencies.py
│   ├── shared/                     # Shared utilities and models
│   │   ├── __init__.py
│   │   ├── utils/
│   │   ├── models/
│   │   └── schemas/
│   ├── modules/                    # Business modules
│   │   ├── __init__.py
│   │   ├── auth/                   # Authentication module
│   │   ├── users/                  # User management module
│   │   ├── billing/                # Billing module
│   │   ├── analytics/              # Analytics module
│   │   └── notifications/          # Notifications module
│   └── api/                        # API layer
│       ├── __init__.py
│       ├── router.py               # Main API router
│       └── v1/
│           ├── __init__.py
│           └── router.py           # Version-specific router
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── unit/
│   ├── integration/
│   └── modules/                    # Module-specific tests
│       ├── auth/
│       ├── users/
│       ├── billing/
│       └── analytics/
├── migrations/                     # Database migrations with timestamp naming
│   └── versions/
│       ├── 20240101_120000_create_users_table.py
│       ├── 20240102_143000_add_user_preferences.py
│       └── 20240103_091500_add_user_email_verification.py
├── scripts/                        # Utility scripts
└── docs/                          # Documentation
```

### Individual Module Structure
Each module follows a consistent internal structure:

```
modules/users/
├── __init__.py
├── api/                           # API endpoints for this module
│   ├── __init__.py
│   ├── router.py                  # Module's main router
│   └── endpoints/
│       ├── __init__.py
│       ├── users.py               # User CRUD endpoints
│       └── profiles.py            # User profile endpoints
├── services/                      # Business logic layer
│   ├── __init__.py
│   ├── UserService.py             # class UserService
│   └── UserProfileService.py      # class UserProfileService
├── repositories/                  # Data access layer
│   ├── __init__.py
│   ├── UserRepository.py          # class UserRepository
│   └── UserProfileRepository.py   # class UserProfileRepository
├── models/                        # Database models
│   ├── __init__.py
│   ├── User.py                    # User model class
│   └── UserProfile.py             # UserProfile model class
├── schemas/                       # Pydantic models
│   ├── __init__.py
│   ├── UserSchema.py              # User-related schemas
│   └── UserProfileSchema.py       # UserProfile-related schemas
├── dependencies.py                # Module-specific dependencies
├── exceptions.py                  # Module-specific exceptions
└── constants.py                   # Module constants
```

## Architectural Pattern: Enhanced MVC with Service Layer

FastAPI applications benefit from an **Enhanced MVC (Model-View-Controller) pattern with Service Layer**, which provides better separation of concerns than traditional MVC:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   View Layer    │    │  Controller     │    │  Service Layer  │
│   (API/Routes)  │◄──►│   (FastAPI      │◄──►│  (Business      │
│                 │    │   Endpoints)    │    │   Logic)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │ Repository Layer│
                                               │ (Data Access)   │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Model Layer    │
                                               │ (Database       │
                                               │  Models)        │
                                               └─────────────────┘
```

### Architecture Layers Explained

1. **View Layer (API/Routes)**: FastAPI endpoints that handle HTTP requests/responses
2. **Controller Layer**: FastAPI endpoint functions that orchestrate the request flow
3. **Service Layer**: Business logic and domain operations
4. **Repository Layer**: Data access and database operations
5. **Model Layer**: Database models and domain entities

## Module Guidelines and Principles

### 1. File Naming Conventions
- **Model Files**: Should match the class name exactly
  - `User.py` contains `class User`
  - `UserProfile.py` contains `class UserProfile`
  - `BillingAccount.py` contains `class BillingAccount`

- **Schema Files**: Should indicate the domain and purpose
  - `UserSchema.py` contains `UserCreate`, `UserUpdate`, `UserResponse`
  - `UserProfileSchema.py` contains `UserProfileCreate`, `UserProfileUpdate`, `UserProfileResponse`

- **Service Files**: Should indicate the business domain
  - `UserService.py` contains `class UserService`
  - `BillingService.py` contains `class BillingService`

- **Repository Files**: Should match the entity they manage
  - `UserRepository.py` contains `class UserRepository`
  - `UserProfileRepository.py` contains `class UserProfileRepository`

### 2. Module Boundaries
- **Single Responsibility**: Each module should handle one business domain
- **High Cohesion**: Related functionality should be grouped together
- **Loose Coupling**: Modules should have minimal dependencies on each other
- **Clear Interfaces**: Well-defined APIs for inter-module communication

### 3. MVC + Service Layer Benefits
- **Separation of Concerns**: Each layer has a specific responsibility
- **Testability**: Easy to unit test each layer independently
- **Maintainability**: Changes in one layer don't affect others
- **Scalability**: Can scale different layers independently
- **Reusability**: Service layer can be reused across different controllers

### 4. Module Communication Patterns
- **Direct Service Calls**: For simple, synchronous operations
- **Event-Driven**: For complex, asynchronous operations
- **Shared Repositories**: For common data access patterns
- **API Calls**: For truly independent modules

### 5. Dependency Management
- **Shared Dependencies**: Common utilities in `shared/` directory
- **Module Dependencies**: Specific to individual modules
- **Core Dependencies**: Framework-level dependencies in `core/`

## Implementation Examples

### Core Shared Components

#### Shared Base Repository
```python
# shared/repositories/base.py
from typing import Generic, TypeVar, Type, List, Optional, Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.exc import SQLAlchemyError
from abc import ABC

from core.exceptions import DatabaseError
from shared.utils.logger import get_logger

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")

logger = get_logger(__name__)

class BaseAsyncRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType], ABC):
    """
    Shared base repository for all modules.
    
    This provides common CRUD operations that can be inherited
    by module-specific repositories.
    """
    
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db
        self.module_name = self.__module__.split('.')[1]  # Extract module name
    
    async def get(self, id: Any) -> Optional[ModelType]:
        """Get a single record by ID."""
        try:
            stmt = select(self.model).where(self.model.id == id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except SQLAlchemyError as e:
            logger.error(
                f"Failed to get {self.model.__name__}",
                extra={
                    "module": self.module_name,
                    "model": self.model.__name__,
                    "id": id,
                    "error": str(e)
                }
            )
            raise DatabaseError(f"Failed to get {self.model.__name__}") from e
    
    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[ModelType]:
        """Get multiple records with pagination and filtering."""
        try:
            stmt = select(self.model)
            
            if filters:
                for key, value in filters.items():
                    if hasattr(self.model, key):
                        stmt = stmt.where(getattr(self.model, key) == value)
            
            stmt = stmt.offset(skip).limit(limit)
            result = await self.db.execute(stmt)
            return list(result.scalars().all())
            
        except SQLAlchemyError as e:
            logger.error(
                f"Failed to get {self.model.__name__} list",
                extra={
                    "module": self.module_name,
                    "model": self.model.__name__,
                    "filters": filters,
                    "error": str(e)
                }
            )
            raise DatabaseError(f"Failed to get {self.model.__name__} list") from e
    
    async def create(self, obj_in: CreateSchemaType) -> ModelType:
        """Create a new record."""
        try:
            obj_data = obj_in.dict() if hasattr(obj_in, 'dict') else obj_in
            db_obj = self.model(**obj_data)
            
            self.db.add(db_obj)
            await self.db.commit()
            await self.db.refresh(db_obj)
            
            logger.info(
                f"{self.model.__name__} created successfully",
                extra={
                    "module": self.module_name,
                    "model": self.model.__name__,
                    "id": db_obj.id
                }
            )
            
            return db_obj
            
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(
                f"Failed to create {self.model.__name__}",
                extra={
                    "module": self.module_name,
                    "model": self.model.__name__,
                    "data": obj_data,
                    "error": str(e)
                }
            )
            raise DatabaseError(f"Failed to create {self.model.__name__}") from e
```

#### Shared Base Service
```python
# shared/services/base.py
from typing import Generic, TypeVar, Type, List, Optional, Any, Dict
from abc import ABC

from shared.repositories.base import BaseAsyncRepository
from shared.utils.logger import get_logger

RepositoryType = TypeVar("RepositoryType", bound=BaseAsyncRepository)

logger = get_logger(__name__)

class BaseAsyncService(Generic[RepositoryType], ABC):
    """
    Shared base service for all modules.
    
    Provides common business logic patterns that can be inherited
    by module-specific services.
    """
    
    def __init__(self, repository: RepositoryType):
        self.repository = repository
        self.module_name = self.__module__.split('.')[1]  # Extract module name
    
    async def get_by_id(self, id: Any) -> Optional[Any]:
        """Get entity by ID with business logic validation."""
        logger.info(
            "Getting entity by ID",
            extra={
                "module": self.module_name,
                "entity_id": id,
                "operation": "get_by_id"
            }
        )
        
        entity = await self.repository.get(id)
        if entity:
            # Add any common business logic here
            return entity
        return None
    
    async def get_list(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Any]:
        """Get paginated list with business logic."""
        logger.info(
            "Getting entity list",
            extra={
                "module": self.module_name,
                "skip": skip,
                "limit": limit,
                "filters": filters,
                "operation": "get_list"
            }
        )
        
        return await self.repository.get_multi(skip=skip, limit=limit, filters=filters)
    
    async def create(self, obj_in: Any) -> Any:
        """Create entity with business logic validation."""
        logger.info(
            "Creating entity",
            extra={
                "module": self.module_name,
                "operation": "create"
            }
        )
        
        # Add common business logic here (e.g., validation, audit logging)
        return await self.repository.create(obj_in)
```

#### Shared Response Models
```python
# shared/schemas/responses.py
from pydantic import BaseModel, Field
from typing import Any, Optional, Dict, List, Union
from enum import Enum

class ResponseCode(str, Enum):
    """Standard response codes for all modules."""
    SUCCESS = "SUCCESS"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    INTERNAL_ERROR = "INTERNAL_ERROR"

class BaseResponse(BaseModel):
    """Base response model for all modules."""
    code: Union[int, str] = Field(..., description="HTTP status code or custom response code")
    data: Optional[Any] = Field(None, description="Response payload (null for errors)")
    message: str = Field(..., description="Human-readable message describing the response")
    module: Optional[str] = Field(None, description="Module that generated the response")

class ModuleSuccessResponse(BaseResponse):
    """Success response model with module information."""
    code: Union[int, str] = Field(default=200, description="Success code")
    data: Any = Field(..., description="Response data")
    message: str = Field(default="Operation completed successfully")

class ModuleErrorResponse(BaseResponse):
    """Error response model with module information."""
    code: Union[int, str] = Field(..., description="Error code")
    data: Optional[Dict[str, Any]] = Field(None, description="Error details")
    message: str = Field(..., description="Error message")

# Response creators with module context
def create_module_success_response(
    data: Any,
    message: str = "Operation completed successfully",
    code: Union[int, str] = 200,
    module: str = None
) -> ModuleSuccessResponse:
    """Create a standardized success response with module context."""
    return ModuleSuccessResponse(
        code=code,
        data=data,
        message=message,
        module=module
    )

def create_module_error_response(
    message: str,
    code: Union[int, str] = 500,
    data: Optional[Dict[str, Any]] = None,
    module: str = None
) -> ModuleErrorResponse:
    """Create a standardized error response with module context."""
    return ModuleErrorResponse(
        code=code,
        data=data,
        message=message,
        module=module
    )
```

## Module Implementation Examples

### Users Module Implementation

#### User Models (Following Class Name = File Name Convention)
```python
# modules/users/models/User.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from shared.models.base import Base

class User(Base):
    """User database model."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    role = Column(String(50), default="user", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships with other modules
    # Note: Use string references to avoid circular imports
    billing_accounts = relationship("BillingAccount", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

# modules/users/models/UserProfile.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from shared.models.base import Base

class UserProfile(Base):
    """User profile database model."""
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    timezone = Column(String(50), default="UTC", nullable=False)
    language = Column(String(10), default="en", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="profile")
```

### File Naming Convention Summary

**Models (Class Name = File Name):**
- `User.py` → `class User`
- `UserProfile.py` → `class UserProfile`
- `BillingAccount.py` → `class BillingAccount`

**Schemas (Domain-Based Naming):**
- `UserSchema.py` → `UserCreate`, `UserUpdate`, `UserResponse`
- `UserProfileSchema.py` → `UserProfileCreate`, `UserProfileUpdate`, `UserProfileResponse`
- `BillingSchema.py` → `BillingCreate`, `BillingUpdate`, `BillingResponse`

**Services (Class Name = File Name):**
- `UserService.py` → `class UserService`
- `BillingService.py` → `class BillingService`
- `NotificationService.py` → `class NotificationService`

**Repositories (Class Name = File Name):**
- `UserRepository.py` → `class UserRepository`
- `BillingRepository.py` → `class BillingRepository`
- `NotificationRepository.py` → `class NotificationRepository`
```

#### User Schemas (Domain-Based File Naming)
```python
# modules/users/schemas/UserSchema.py
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    USER = "user"
    MODERATOR = "moderator"

class UserBase(BaseModel):
    """Base user schema with shared fields."""
    email: EmailStr = Field(..., description="User email address")
    full_name: str = Field(..., min_length=1, max_length=100, description="Full name")
    is_active: bool = Field(default=True, description="Whether user is active")
    role: UserRole = Field(default=UserRole.USER, description="User role")

class UserCreate(UserBase):
    """Schema for user creation requests."""
    password: str = Field(..., min_length=8, max_length=100, description="User password")

    @validator('password')
    def validate_password(cls, v):
        """Validate password strength."""
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserUpdate(BaseModel):
    """Schema for user update requests."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None

class UserResponse(UserBase):
    """Schema for user API responses."""
    id: int = Field(..., description="User ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "full_name": "John Doe",
                "is_active": True,
                "role": "user",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
                "last_login": "2024-01-02T10:30:00Z"
            }
        }

# modules/users/schemas/UserProfileSchema.py
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class UserProfileBase(BaseModel):
    """Base user profile schema."""
    bio: Optional[str] = Field(None, max_length=500, description="User biography")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    phone: Optional[str] = Field(None, description="Phone number")
    timezone: str = Field(default="UTC", description="User timezone")
    language: str = Field(default="en", description="Preferred language")

class UserProfileCreate(UserProfileBase):
    """Schema for user profile creation."""
    user_id: int = Field(..., description="Associated user ID")

class UserProfileUpdate(UserProfileBase):
    """Schema for user profile updates."""
    pass

class UserProfileResponse(UserProfileBase):
    """Schema for user profile API responses."""
    id: int = Field(..., description="Profile ID")
    user_id: int = Field(..., description="Associated user ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        orm_mode = True
```

#### User Repository (Class Name = File Name)
```python
# modules/users/repositories/UserRepository.py
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from shared.repositories.base import BaseAsyncRepository
from modules.users.models.User import User
from modules.users.schemas.UserSchema import UserCreate, UserUpdate
from shared.utils.logger import get_logger

logger = get_logger(__name__)

class UserRepository(BaseAsyncRepository[User, UserCreate, UserUpdate]):
    """Repository for user-specific database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email address."""
        try:
            stmt = select(User).where(User.email == email)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(
                "Failed to get user by email",
                extra={
                    "module": "users",
                    "email": email,
                    "error": str(e)
                }
            )
            raise

    async def get_active_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all active users."""
        return await self.get_multi(
            skip=skip,
            limit=limit,
            filters={"is_active": True}
        )

    async def search_users(self, search_term: str, limit: int = 50) -> List[User]:
        """Search users by name or email."""
        try:
            stmt = (
                select(User)
                .where(
                    or_(
                        User.full_name.ilike(f"%{search_term}%"),
                        User.email.ilike(f"%{search_term}%")
                    )
                )
                .limit(limit)
            )

            result = await self.db.execute(stmt)
            return list(result.scalars().all())

        except Exception as e:
            logger.error(
                "Failed to search users",
                extra={
                    "module": "users",
                    "search_term": search_term,
                    "error": str(e)
                }
            )
            raise
```

#### User Service (Class Name = File Name)
```python
# modules/users/services/UserService.py
from typing import Optional, List
from datetime import datetime

from shared.services.base import BaseAsyncService
from modules.users.repositories.UserRepository import UserRepository
from modules.users.schemas.UserSchema import UserCreate, UserUpdate
from modules.users.models.User import User
from core.security import get_password_hash, verify_password
from core.exceptions import ValidationError, NotFoundError, UnauthorizedError
from shared.utils.logger import get_logger

logger = get_logger(__name__)

class UserService(BaseAsyncService[UserRepository]):
    """Service for user business logic operations."""

    def __init__(self, repository: UserRepository):
        super().__init__(repository)

    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user with business logic validation."""
        logger.info(
            "Creating new user",
            extra={
                "module": "users",
                "email": user_data.email,
                "operation": "create_user"
            }
        )

        # Check if user already exists
        existing_user = await self.repository.get_by_email(user_data.email)
        if existing_user:
            logger.warning(
                "User creation failed - email already exists",
                extra={
                    "module": "users",
                    "email": user_data.email,
                    "existing_user_id": existing_user.id
                }
            )
            raise ValidationError("User with this email already exists")

        # Hash password
        hashed_password = get_password_hash(user_data.password)

        # Create user data
        user_dict = user_data.dict()
        user_dict["password"] = hashed_password
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()

        # Create user
        user = await self.repository.create(user_dict)

        logger.info(
            "User created successfully",
            extra={
                "module": "users",
                "user_id": user.id,
                "email": user.email,
                "operation": "create_user"
            }
        )

        return user

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user credentials."""
        logger.info(
            "Authenticating user",
            extra={
                "module": "users",
                "email": email,
                "operation": "authenticate_user"
            }
        )

        user = await self.repository.get_by_email(email)
        if not user:
            logger.warning(
                "Authentication failed - user not found",
                extra={"module": "users", "email": email}
            )
            return None

        if not verify_password(password, user.password):
            logger.warning(
                "Authentication failed - invalid password",
                extra={"module": "users", "user_id": user.id, "email": email}
            )
            return None

        if not user.is_active:
            logger.warning(
                "Authentication failed - user account disabled",
                extra={"module": "users", "user_id": user.id, "email": email}
            )
            raise UnauthorizedError("User account is disabled")

        # Update last login
        await self.repository.update(user.id, {"last_login": datetime.utcnow()})

        logger.info(
            "User authenticated successfully",
            extra={
                "module": "users",
                "user_id": user.id,
                "email": email,
                "operation": "authenticate_user"
            }
        )

        return user

    async def search_users(self, search_term: str, current_user: User) -> List[User]:
        """Search users with access control."""
        logger.info(
            "Searching users",
            extra={
                "module": "users",
                "search_term": search_term,
                "current_user_id": current_user.id,
                "operation": "search_users"
            }
        )

        # Business logic: Only active users can search
        if not current_user.is_active:
            logger.warning(
                "User search failed - inactive user",
                extra={"module": "users", "current_user_id": current_user.id}
            )
            raise UnauthorizedError("Account is not active")

        results = await self.repository.search_users(search_term)

        logger.info(
            "User search completed",
            extra={
                "module": "users",
                "search_term": search_term,
                "results_count": len(results),
                "current_user_id": current_user.id,
                "operation": "search_users"
            }
        )

        return results
```

#### User API Endpoints (Updated Import Paths)
```python
# modules/users/api/endpoints/users.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from modules.users.services.UserService import UserService
from modules.users.repositories.UserRepository import UserRepository
from modules.users.schemas.UserSchema import UserCreate, UserUpdate, UserResponse
from modules.users.models.User import User
from shared.schemas.responses import create_module_success_response, create_module_error_response
from core.dependencies import get_async_db, get_current_user
from core.exceptions import ValidationError, NotFoundError
from shared.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()

async def get_user_service(db: AsyncSession = Depends(get_async_db)) -> UserService:
    """Dependency to get user service."""
    repository = UserRepository(db)
    return UserService(repository)

@router.post("/", response_model=dict)
async def create_user(
    user_data: UserCreate,
    user_service: UserService = Depends(get_user_service)
):
    """Create a new user."""
    try:
        user = await user_service.create_user(user_data)
        user_response = UserResponse.from_orm(user)

        return create_module_success_response(
            data=user_response.dict(),
            message="User created successfully",
            module="users"
        )

    except ValidationError as e:
        logger.error(
            "User creation validation error",
            extra={
                "module": "users",
                "error": str(e),
                "email": user_data.email
            }
        )
        return create_module_error_response(
            message=str(e),
            code=400,
            module="users"
        )
    except Exception as e:
        logger.error(
            "User creation failed",
            extra={
                "module": "users",
                "error": str(e),
                "email": user_data.email
            }
        )
        return create_module_error_response(
            message="Failed to create user",
            code=500,
            module="users"
        )

@router.get("/search", response_model=dict)
async def search_users(
    q: str = Query(..., min_length=2, description="Search term"),
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Search users by name or email."""
    try:
        users = await user_service.search_users(q, current_user)
        user_responses = [UserResponse.from_orm(user).dict() for user in users]

        return create_module_success_response(
            data={
                "users": user_responses,
                "count": len(user_responses),
                "search_term": q
            },
            message=f"Found {len(user_responses)} users",
            module="users"
        )

    except Exception as e:
        logger.error(
            "User search failed",
            extra={
                "module": "users",
                "error": str(e),
                "search_term": q,
                "current_user_id": current_user.id
            }
        )
        return create_module_error_response(
            message="Search failed",
            code=500,
            module="users"
        )

@router.get("/{user_id}", response_model=dict)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Get user by ID."""
    try:
        user = await user_service.get_by_id(user_id)
        if not user:
            return create_module_error_response(
                message="User not found",
                code=404,
                module="users"
            )

        user_response = UserResponse.from_orm(user)

        return create_module_success_response(
            data=user_response.dict(),
            message="User retrieved successfully",
            module="users"
        )

    except Exception as e:
        logger.error(
            "Failed to get user",
            extra={
                "module": "users",
                "error": str(e),
                "user_id": user_id,
                "current_user_id": current_user.id
            }
        )
        return create_module_error_response(
            message="Failed to retrieve user",
            code=500,
            module="users"
        )
```

#### Module Router
```python
# modules/users/api/router.py
from fastapi import APIRouter

from modules.users.api.endpoints import users

# Create module router
router = APIRouter()

# Include endpoint routers
router.include_router(users.router, prefix="/users", tags=["users"])

# Module-specific middleware can be added here
# router.middleware("http")(module_specific_middleware)
```

#### Module Dependencies
```python
# modules/users/dependencies.py
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from modules.users.services.UserService import UserService
from modules.users.repositories.UserRepository import UserRepository
from core.dependencies import get_async_db

async def get_user_repository(db: AsyncSession = Depends(get_async_db)) -> UserRepository:
    """Get user repository dependency."""
    return UserRepository(db)

async def get_user_service(
    repository: UserRepository = Depends(get_user_repository)
) -> UserService:
    """Get user service dependency."""
    return UserService(repository)

# Module-specific dependencies can be defined here
async def get_user_by_id_dependency(user_id: int, service: UserService = Depends(get_user_service)):
    """Dependency to get and validate user by ID."""
    user = await service.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

## Inter-Module Communication Patterns

### 1. Direct Service Communication
```python
# modules/billing/services/BillingService.py
from modules.users.services.UserService import UserService
from modules.users.repositories.UserRepository import UserRepository

class BillingService:
    """Billing service that communicates with users module."""

    def __init__(self, billing_repository, db_session):
        self.billing_repository = billing_repository
        # Create user service for inter-module communication
        user_repository = UserRepository(db_session)
        self.user_service = UserService(user_repository)

    async def create_billing_account(self, user_id: int, billing_data):
        """Create billing account with user validation."""
        # Validate user exists using users module
        user = await self.user_service.get_by_id(user_id)
        if not user:
            raise ValidationError("User not found")

        if not user.is_active:
            raise ValidationError("Cannot create billing account for inactive user")

        # Create billing account
        billing_account = await self.billing_repository.create({
            "user_id": user_id,
            "user_email": user.email,  # Denormalize for performance
            **billing_data
        })

        logger.info(
            "Billing account created",
            extra={
                "module": "billing",
                "user_id": user_id,
                "billing_account_id": billing_account.id,
                "operation": "create_billing_account"
            }
        )

        return billing_account
```

### 2. Event-Driven Communication
```python
# shared/events/event_bus.py
from typing import Dict, List, Callable, Any
from abc import ABC, abstractmethod
import asyncio

class Event(ABC):
    """Base event class."""

    @property
    @abstractmethod
    def event_type(self) -> str:
        pass

class UserCreatedEvent(Event):
    """Event fired when a user is created."""

    def __init__(self, user_id: int, email: str, full_name: str):
        self.user_id = user_id
        self.email = email
        self.full_name = full_name
        self.event_type = "user.created"

class EventBus:
    """Simple event bus for inter-module communication."""

    def __init__(self):
        self._handlers: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, handler: Callable):
        """Subscribe to an event type."""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    async def publish(self, event: Event):
        """Publish an event to all subscribers."""
        if event.event_type in self._handlers:
            tasks = []
            for handler in self._handlers[event.event_type]:
                tasks.append(asyncio.create_task(handler(event)))

            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

# Global event bus instance
event_bus = EventBus()

# Usage in users module
# modules/users/services/user_service.py (updated)
from shared.events.event_bus import event_bus, UserCreatedEvent

class UserService(BaseAsyncService[UserRepository]):
    async def create_user(self, user_data: UserCreate) -> User:
        # ... existing creation logic ...

        user = await self.repository.create(user_dict)

        # Publish event for other modules
        await event_bus.publish(UserCreatedEvent(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name
        ))

        return user

# Usage in notifications module
# modules/notifications/services/notification_service.py
from shared.events.event_bus import event_bus, UserCreatedEvent

class NotificationService:
    async def handle_user_created(self, event: UserCreatedEvent):
        """Handle user created event."""
        logger.info(
            "Handling user created event",
            extra={
                "module": "notifications",
                "user_id": event.user_id,
                "email": event.email,
                "operation": "handle_user_created"
            }
        )

        # Send welcome email
        await self.send_welcome_email(event.email, event.full_name)

        # Create default notification preferences
        await self.create_default_preferences(event.user_id)

# Register event handlers
notification_service = NotificationService()
event_bus.subscribe("user.created", notification_service.handle_user_created)
```

### 3. Shared Repository Pattern
```python
# shared/repositories/user_lookup.py
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from modules.users.models.User import User
from modules.users.repositories.UserRepository import UserRepository

class SharedUserLookup:
    """Shared service for user lookups across modules."""

    def __init__(self, db: AsyncSession):
        self.user_repository = UserRepository(db)

    async def get_user_basic_info(self, user_id: int) -> Optional[dict]:
        """Get basic user info for other modules."""
        user = await self.user_repository.get(user_id)
        if not user:
            return None

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "role": user.role
        }

    async def validate_user_exists_and_active(self, user_id: int) -> bool:
        """Validate user exists and is active."""
        user = await self.user_repository.get(user_id)
        return user is not None and user.is_active

# Usage in other modules
# modules/billing/services/billing_service.py
from shared.repositories.user_lookup import SharedUserLookup

class BillingService:
    def __init__(self, billing_repository, db_session):
        self.billing_repository = billing_repository
        self.user_lookup = SharedUserLookup(db_session)

    async def create_billing_account(self, user_id: int, billing_data):
        # Use shared lookup instead of direct service dependency
        if not await self.user_lookup.validate_user_exists_and_active(user_id):
            raise ValidationError("User not found or inactive")

        user_info = await self.user_lookup.get_user_basic_info(user_id)

        billing_account = await self.billing_repository.create({
            "user_id": user_id,
            "user_email": user_info["email"],
            **billing_data
        })

        return billing_account
```

## Main Application Integration

### Application Entry Point
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.core.middleware import RequestLoggingMiddleware, DeprecationMiddleware
from app.core.exceptions import setup_exception_handlers
from app.api.router import api_router

def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Modular FastAPI Application",
        openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.ENVIRONMENT != "production" else None,
    )

    # Add middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_HOSTS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(DeprecationMiddleware)

    # Setup exception handlers
    setup_exception_handlers(app)

    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app

app = create_application()

@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    logger.info(
        "Application starting up",
        extra={
            "environment": settings.ENVIRONMENT,
            "version": settings.VERSION,
            "modules": ["users", "billing", "notifications", "analytics"]
        }
    )

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    logger.info("Application shutting down")
```

### API Router Integration
```python
# app/api/router.py
from fastapi import APIRouter

# Import module routers
from modules.users.api.router import router as users_router
from modules.billing.api.router import router as billing_router
from modules.notifications.api.router import router as notifications_router
from modules.analytics.api.router import router as analytics_router

# Create main API router
api_router = APIRouter()

# Include module routers with their prefixes
api_router.include_router(
    users_router,
    prefix="/users",
    tags=["users"]
)

api_router.include_router(
    billing_router,
    prefix="/billing",
    tags=["billing"]
)

api_router.include_router(
    notifications_router,
    prefix="/notifications",
    tags=["notifications"]
)

api_router.include_router(
    analytics_router,
    prefix="/analytics",
    tags=["analytics"]
)

@api_router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "modules": ["users", "billing", "notifications", "analytics"]
    }
```

## Testing Patterns for Modular Architecture

### Module-Specific Test Configuration
```python
# tests/modules/users/conftest.py
import pytest
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.config.settings import settings
from shared.models.base import Base
from modules.users.models.User import User
from modules.users.repositories.UserRepository import UserRepository
from modules.users.services.UserService import UserService

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_users.db"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()

@pytest.fixture
async def test_db_session(test_engine):
    """Create test database session."""
    async_session = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session

@pytest.fixture
async def user_repository(test_db_session):
    """Create user repository for testing."""
    return UserRepository(test_db_session)

@pytest.fixture
async def user_service(user_repository):
    """Create user service for testing."""
    return UserService(user_repository)

@pytest.fixture
async def sample_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "TestPassword123",
        "is_active": True,
        "role": "user"
    }
```

### Module Unit Tests
```python
# tests/modules/users/test_user_service.py
import pytest
from modules.users.schemas.UserSchema import UserCreate
from core.exceptions import ValidationError

@pytest.mark.asyncio
async def test_create_user_success(user_service, sample_user_data):
    """Test successful user creation."""
    user_create = UserCreate(**sample_user_data)
    user = await user_service.create_user(user_create)

    assert user.email == sample_user_data["email"]
    assert user.full_name == sample_user_data["full_name"]
    assert user.is_active == sample_user_data["is_active"]
    assert user.role == sample_user_data["role"]
    assert user.id is not None

@pytest.mark.asyncio
async def test_create_user_duplicate_email(user_service, sample_user_data):
    """Test user creation with duplicate email."""
    user_create = UserCreate(**sample_user_data)

    # Create first user
    await user_service.create_user(user_create)

    # Try to create second user with same email
    with pytest.raises(ValidationError, match="User with this email already exists"):
        await user_service.create_user(user_create)

@pytest.mark.asyncio
async def test_authenticate_user_success(user_service, sample_user_data):
    """Test successful user authentication."""
    user_create = UserCreate(**sample_user_data)
    created_user = await user_service.create_user(user_create)

    # Authenticate user
    authenticated_user = await user_service.authenticate_user(
        sample_user_data["email"],
        sample_user_data["password"]
    )

    assert authenticated_user is not None
    assert authenticated_user.id == created_user.id
    assert authenticated_user.email == sample_user_data["email"]

@pytest.mark.asyncio
async def test_authenticate_user_invalid_password(user_service, sample_user_data):
    """Test authentication with invalid password."""
    user_create = UserCreate(**sample_user_data)
    await user_service.create_user(user_create)

    # Try to authenticate with wrong password
    authenticated_user = await user_service.authenticate_user(
        sample_user_data["email"],
        "WrongPassword123"
    )

    assert authenticated_user is None
```

### Integration Tests
```python
# tests/modules/users/test_user_integration.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_user_endpoint():
    """Test user creation endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        user_data = {
            "email": "integration@example.com",
            "full_name": "Integration Test User",
            "password": "TestPassword123",
            "is_active": True,
            "role": "user"
        }

        response = await client.post("/api/v1/users/", json=user_data)

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["module"] == "users"
        assert data["data"]["email"] == user_data["email"]
        assert data["data"]["full_name"] == user_data["full_name"]

@pytest.mark.asyncio
async def test_search_users_endpoint():
    """Test user search endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First create a user
        user_data = {
            "email": "searchable@example.com",
            "full_name": "Searchable User",
            "password": "TestPassword123"
        }

        await client.post("/api/v1/users/", json=user_data)

        # Then search for the user
        response = await client.get(
            "/api/v1/users/search",
            params={"q": "searchable"},
            headers={"Authorization": "Bearer test-token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["module"] == "users"
        assert len(data["data"]["users"]) > 0
```

## Best Practices and Guidelines

### Module Design Principles

1. **Single Responsibility**: Each module should handle one business domain
2. **High Cohesion**: Related functionality should be grouped together
3. **Loose Coupling**: Modules should have minimal dependencies on each other
4. **Clear Interfaces**: Well-defined APIs for inter-module communication
5. **Consistent Structure**: All modules follow the same internal organization

### Import Guidelines

```python
# Good: Use absolute imports from module root (following Class Name = File Name)
from modules.users.services.UserService import UserService
from modules.users.repositories.UserRepository import UserRepository
from modules.billing.models.BillingAccount import BillingAccount
from modules.billing.services.BillingService import BillingService

# Good: Use shared components
from shared.repositories.base import BaseAsyncRepository
from shared.schemas.responses import create_module_success_response

# Good: Import schemas (domain-based naming)
from modules.users.schemas.UserSchema import UserCreate, UserUpdate, UserResponse
from modules.billing.schemas.BillingSchema import BillingCreate, BillingUpdate

# Avoid: Circular imports between modules
# Don't import from modules.billing in modules.users if billing imports users

# Good: Use string references in SQLAlchemy relationships
billing_accounts = relationship("BillingAccount", back_populates="user")

# Good: Use dependency injection for inter-module communication
class BillingService:
    def __init__(self, billing_repository, user_lookup_service):
        self.billing_repository = billing_repository
        self.user_lookup = user_lookup_service
```

### Module Communication Guidelines

1. **Prefer Events**: Use event-driven communication for loose coupling
2. **Shared Services**: Create shared lookup services for common operations
3. **API Calls**: Use HTTP API calls for truly independent modules
4. **Avoid Direct Imports**: Don't directly import services from other modules
5. **Use Interfaces**: Define clear interfaces for inter-module communication

### Testing Guidelines

1. **Module Isolation**: Test each module independently
2. **Mock Dependencies**: Mock inter-module dependencies in unit tests
3. **Integration Tests**: Test module interactions in integration tests
4. **Shared Fixtures**: Use shared test fixtures for common setup
5. **Test Data**: Keep test data isolated per module