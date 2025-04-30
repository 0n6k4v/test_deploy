from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints.inference import router as inference_router
from api.endpoints.provinces import router as province_router
from api.endpoints.districts import router as district_router
from api.endpoints.subdistricts import router as subdistrict_router
from api.endpoints.exhibits import router as exhibits_router
from api.endpoints.history import router as history_router
from api.endpoints.users import router as user_router
from api.endpoints.roles import router as role_router
from api.endpoints.auth import router as auth_router
from api.endpoints.permissions import router as permissions_router
from api.endpoints.notifications import router as notifications_router
import os

app = FastAPI()

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
if not allowed_origins or allowed_origins[0] == "":
    allowed_origins = ["*"]  # Fallback to allow all in development

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(inference_router, prefix="/api")
app.include_router(province_router, prefix="/api")
app.include_router(district_router, prefix="/api")
app.include_router(subdistrict_router, prefix="/api")
app.include_router(exhibits_router, prefix="/api")
app.include_router(history_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(role_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(permissions_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)