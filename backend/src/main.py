"""
FastAPI Backend for Autometa Phase 4
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import workflow, escrow, price, utils
from .utils.config import settings
from .utils.logger import logger
from .utils.web3_provider import w3


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Automated workflow execution backend for Moonbeam",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount API routers
app.include_router(workflow.router, prefix="/api")
app.include_router(escrow.router, prefix="/api")
app.include_router(price.router, prefix="/api")
app.include_router(utils.router, prefix="/api")


# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Run on application startup
    """
    logger.info("Starting Autometa Backend API")
    logger.info(f"App Name: {settings.APP_NAME}")
    logger.info(f"Chain ID: {settings.CHAIN_ID}")
    logger.info(f"Web3 Connected: {w3.is_connected()}")
    logger.info(f"Workflow Registry: {settings.WORKFLOW_REGISTRY_ADDRESS}")
    logger.info(f"Action Executor: {settings.ACTION_EXECUTOR_ADDRESS}")
    logger.info(f"Fee Escrow: {settings.FEE_ESCROW_ADDRESS}")
    
    # Verify Web3 connection
    if not w3.is_connected():
        logger.error("Failed to connect to Web3 provider!")
    else:
        chain_id = w3.eth.chain_id
        logger.info(f"Connected to chain ID: {chain_id}")
        if chain_id != settings.CHAIN_ID:
            logger.warning(f"Chain ID mismatch! Expected {settings.CHAIN_ID}, got {chain_id}")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Run on application shutdown
    """
    logger.info("Shutting down Autometa Backend API")


# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint - API information
    """
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "workflows": "/api/workflow",
            "escrow": "/api/escrow",
            "prices": "/api/price",
            "utils": "/api/utils"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
