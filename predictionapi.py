from fastapi import Request, FastAPI
from sklearn.ensemble import RandomForestClassifier
import joblib
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

forest = RandomForestClassifier()

with open('anubis_predictor.pkl', 'rb') as f:
    forest = joblib.load(f)

app = FastAPI()

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/")
async def root():
    return {"message": "hello worl"}

@app.post('/predict')
async def predict(request: Request):
    predictData = await request.json()

    print(predictData)
    
    predictFrame = pd.DataFrame([predictData])

    print(forest.predict_proba(predictFrame))

    return forest.predict_proba(predictFrame)