import logging
import sys

def configure_logging(level: str = 'INFO'):
    logger = logging.getLogger()
    logger.setLevel(level)
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s %(message)s')
    handler.setFormatter(formatter)
    logger.handlers = [handler]
    return logger

logger = configure_logging()
