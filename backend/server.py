from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from dotenv import load_dotenv
import os
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Transaction(BaseModel):
    type: str  # 'income' or 'expense'
    amount: float
    category: str
    date: str
    note: Optional[str] = ""

class AnalysisRequest(BaseModel):
    transactions: List[Transaction]
    totalIncome: float
    totalExpense: float
    categories: dict

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Finance Tracker API is running"}

@app.post("/api/analyze-spending")
async def analyze_spending(request: AnalysisRequest):
    try:
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        # Prepare data summary for AI analysis
        transaction_summary = f"""
Financial Summary:
- Total Income: Rp {request.totalIncome:,.0f}
- Total Expense: Rp {request.totalExpense:,.0f}
- Net Balance: Rp {(request.totalIncome - request.totalExpense):,.0f}

Category Breakdown:
"""
        for category, amount in request.categories.items():
            transaction_summary += f"- {category}: Rp {amount:,.0f}\n"
        
        transaction_summary += f"\nTotal Transactions: {len(request.transactions)}\n"
        
        # Initialize AI chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"finance-analysis-{datetime.now().timestamp()}",
            system_message="You are a professional financial advisor. Provide concise, actionable financial advice in Indonesian language. Keep responses under 200 words, focused on practical tips."
        ).with_model("openai", "gpt-5.2")
        
        # Create analysis prompt
        prompt = f"""{transaction_summary}

Berdasarkan data keuangan di atas, berikan:
1. Analisis singkat pola pengeluaran (2-3 kalimat)
2. 3 saran praktis untuk menghemat pengeluaran
3. 1 tips investasi atau tabungan yang sesuai

Jawab dalam Bahasa Indonesia dengan format yang jelas dan mudah dibaca."""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {
            "success": True,
            "analysis": response,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        print(f"Error in analyze_spending: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/generate-tip")
async def generate_tip():
    """Generate a daily financial tip"""
    try:
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"tip-{datetime.now().timestamp()}",
            system_message="You are a financial advisor providing daily money tips in Indonesian language."
        ).with_model("openai", "gpt-5.2")
        
        prompt = "Berikan 1 tips keuangan praktis untuk hari ini. Maksimal 2 kalimat. Jawab dalam Bahasa Indonesia."
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {
            "success": True,
            "tip": response,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        print(f"Error in generate_tip: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)