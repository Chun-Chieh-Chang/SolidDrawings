"""
Middleware package for the 3D-Builder backend.

Contains centralized middleware modules:
- exception_handler: Global exception handling and error responses
"""

from .exception_handler import ExceptionHandlerMiddleware, register_exception_handlers

__all__ = [
    "ExceptionHandlerMiddleware",
    "register_exception_handlers",
]
