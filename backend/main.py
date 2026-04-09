from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes.stock import router as stock_router

load_dotenv()

app = FastAPI(title="NorthStar Invest API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stock_router)

@app.get("/health")
def health():
    return {"status": "ok", "app": "NorthStar Invest"}
