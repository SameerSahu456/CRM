from fastapi import Request
from fastapi.responses import JSONResponse


class CRMException(Exception):
    def __init__(self, detail: str = "An error occurred", status_code: int = 500):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class NotFoundException(CRMException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail=detail, status_code=404)


class BadRequestException(CRMException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(detail=detail, status_code=400)


class UnauthorizedException(CRMException):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(detail=detail, status_code=401)


class ForbiddenException(CRMException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(detail=detail, status_code=403)


class ConflictException(CRMException):
    def __init__(self, detail: str = "Conflict"):
        super().__init__(detail=detail, status_code=409)


async def crm_exception_handler(request: Request, exc: CRMException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.status_code, "data": None, "message": exc.detail},
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"code": 500, "data": None, "message": str(exc)},
    )
