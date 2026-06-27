"""
Exception Handler Middleware

Centralized error handling for the FastAPI backend.
Catches all unhandled exceptions and returns consistent error responses.
"""

import logging
import traceback
from typing import Any, Dict

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class ExceptionHandlerMiddleware(BaseHTTPMiddleware):
    """
    Global exception handler middleware.
    
    Catches all unhandled exceptions and returns consistent JSON error responses:
    {
        "error": {
            "type": "ValidationError",
            "message": "Human-readable error message",
            "details": {...},
            "path": "/api/endpoint",
            "method": "POST"
        }
    }
    
    In production, the `details` field is omitted for security.
    """
    
    def __init__(self, app: FastAPI, include_details: bool = False):
        super().__init__(app)
        self.include_details = include_details  # Set to True only in development
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            return await self._handle_exception(request, exc)
    
    async def _handle_exception(self, request: Request, exc: Exception) -> JSONResponse:
        """Handle an exception and return a JSON error response."""
        error_type = type(exc).__name__
        error_message = str(exc) or f"Unexpected {error_type} occurred"
        
        # Log the full traceback for debugging
        logger.error(
            f"[Exception] {error_type}: {error_message}\n"
            f"Path: {request.method} {request.url.path}\n"
            f"Traceback:\n{traceback.format_exc()}"
        )
        
        # Build error response
        error_response: Dict[str, Any] = {
            "error": {
                "type": error_type,
                "message": error_message,
                "path": request.url.path,
                "method": request.method,
            }
        }
        
        # Include details only in development
        if self.include_details:
            error_response["error"]["details"] = {
                "traceback": traceback.format_exc(),
                "exception_args": getattr(exc, "args", None),
            }
        
        # Determine HTTP status code
        status_code = self._get_status_code(exc)
        
        return JSONResponse(
            status_code=status_code,
            content=error_response,
        )
    
    def _get_status_code(self, exc: Exception) -> int:
        """Map exception types to HTTP status codes."""
        # Import here to avoid circular dependency
        try:
            from pydantic import ValidationError
            from fastapi.exceptions import RequestValidationError
        except ImportError:
            ValidationError = None
            RequestValidationError = None
        
        if ValidationError and isinstance(exc, ValidationError):
            return 422  # Unprocessable Entity
        if RequestValidationError and isinstance(exc, RequestValidationError):
            return 422
        if isinstance(exc, ValueError):
            return 400  # Bad Request
        if isinstance(exc, TypeError):
            return 400
        if isinstance(exc, KeyError):
            return 404  # Not Found
        if isinstance(exc, PermissionError):
            return 403  # Forbidden
        if isinstance(exc, FileNotFoundError):
            return 404
        if isinstance(exc, ConnectionError):
            return 502  # Bad Gateway
        if isinstance(exc, TimeoutError):
            return 504  # Gateway Timeout
        
        # Default to 500 for unknown errors
        return 500


def register_exception_handlers(app: FastAPI, include_details: bool = False):
    """
    Register exception handlers on the FastAPI app.
    
    This provides both middleware-level handling (for all exceptions)
    and route-level handling (for specific exception types).
    """
    # Register middleware
    app.add_middleware(ExceptionHandlerMiddleware, include_details=include_details)
    
    # Register route-level handlers for specific exception types
    @app.exception_handler(RequestValidationError)
    async def request_validation_error_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "type": "RequestValidationError",
                    "message": "Request validation failed",
                    "details": exc.errors(),
                    "path": request.url.path,
                    "method": request.method,
                }
            },
        )

    @app.exception_handler(ValidationError)
    async def validation_error_handler(request: Request, exc: ValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "type": "ValidationError",
                    "message": "Input validation failed",
                    "details": exc.errors(),
                    "path": request.url.path,
                    "method": request.method,
                }
            },
        )
    
    @app.exception_handler(KeyError)
    async def key_error_handler(request: Request, exc: KeyError):
        return JSONResponse(
            status_code=404,
            content={
                "error": {
                    "type": "NotFoundError",
                    "message": f"Resource not found: {exc.args[0] if exc.args else 'Unknown'}",
                    "path": request.url.path,
                    "method": request.method,
                }
            },
        )
    
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error(f"[Unhandled] {type(exc).__name__}: {exc}\n{traceback.format_exc()}")
        
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "type": "InternalServerError",
                    "message": "An unexpected error occurred",
                    "path": request.url.path,
                    "method": request.method,
                }
            },
        )
