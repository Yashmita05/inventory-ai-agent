from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np

app = FastAPI()

# These classes tell Python exactly what data to expect from Node.js
class SaleRecord(BaseModel):
    date: str
    quantity: int

class ForecastRequest(BaseModel):
    productId: str
    productName: str
    currentStock: int
    leadTimeDays: int
    safetyStock: int
    salesHistory: List[SaleRecord]

class ForecastResponse(BaseModel):
    productId: str
    predictedDemand: int
    recommendedOrder: int
    historicalAverage: float
    explanation: str

@app.post("/forecast", response_model=ForecastResponse)
def generate_forecast(req: ForecastRequest):
    if not req.salesHistory:
        raise HTTPException(status_code=400, detail="No sales history provided")

    # 1. Convert the data into a Pandas DataFrame for easy math
    df = pd.DataFrame([s.dict() for s in req.salesHistory])
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # 2. Calculate the average daily demand
    daily_sales = df.groupby(df['date'].dt.date)['quantity'].sum()
    avg_daily_demand = daily_sales.mean()
    
    # 3. Give more weight to recent sales (AI logic)
    recent_sales = daily_sales.tail(5)
    weights = np.linspace(0.5, 1.0, len(recent_sales))
    if len(recent_sales) > 0:
        weighted_daily_demand = np.average(recent_sales, weights=weights)
    else:
        weighted_daily_demand = avg_daily_demand

    # 4. Forecast the next 7 days
    predicted_7_day_demand = int(np.ceil(weighted_daily_demand * 7))
    
    # 5. Order calculation: (Lead time demand + Safety Stock) - Current Stock
    lead_time_demand = int(np.ceil(weighted_daily_demand * req.leadTimeDays))
    target_inventory = lead_time_demand + req.safetyStock
    recommended_order = max(0, target_inventory - req.currentStock)

    explanation = (
        f"Avg daily demand calculated as ~{weighted_daily_demand:.1f}. "
        f"Predicted 7-day demand: {predicted_7_day_demand}. "
        f"Target Inventory (Lead time {req.leadTimeDays}d + Safety {req.safetyStock}) = {target_inventory}. "
        f"Current Stock is {req.currentStock}. "
        f"Recommended Order = max(0, {target_inventory} - {req.currentStock}) = {recommended_order}."
    )

    return ForecastResponse(
        productId=req.productId,
        predictedDemand=predicted_7_day_demand,
        recommendedOrder=recommended_order,
        historicalAverage=float(avg_daily_demand),
        explanation=explanation
    )