"""
Logging configuration for the backend
"""
import logging
import sys
from pythonjsonlogger import jsonlogger


def setup_logger(name: str = "autometa-backend") -> logging.Logger:
    """Configure and return a logger instance"""
    
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Console handler with JSON formatting
    handler = logging.StreamHandler(sys.stdout)
    formatter = jsonlogger.JsonFormatter(
        fmt='%(asctime)s %(name)s %(levelname)s %(message)s',
        rename_fields={'asctime': 'timestamp', 'levelname': 'level'}
    )
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    return logger


# Global logger instance
logger = setup_logger()
