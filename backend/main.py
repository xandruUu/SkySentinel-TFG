from fastapi import FastAPI

app = FastAPI(title="SkySentinel API")

@app.get("/")
def root():
    return {"message": "SkySentinel Backend operando con Python 3.13"}