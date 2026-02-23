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
    import time

    error_id = str(int(time.time() * 1000))
    tb = traceback.format_exc()
    print(f"[Error ID: {error_id}] {request.method} {request.url.path}")
    print(f"[Error ID: {error_id}] {type(exc).__name__}: {exc}")
    print(f"[Error ID: {error_id}] Traceback:\n{tb}")
    return JSONResponse(
        status_code=500,
        content={
            "code": 500,
            "data": None,
            "message": str(exc),
            "errorId": error_id,
            "errorType": type(exc).__name__,
        },
    )
