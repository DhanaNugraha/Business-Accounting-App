from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd
import io
from pathlib import Path
from typing import Dict, Any
import generate_template

app = FastAPI(title="Accounting Helper API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend if dist directory exists
if Path("dist").exists():
    app.mount("/static", StaticFiles(directory="dist"), name="static")
    print("Serving static files from 'dist' directory")
else:
    print("Note: 'dist' directory not found. Running in API-only mode.")

@app.get("/")
async def root():
    return {"message": "Accounting Helper API is running"}

@app.get("/download-template")
async def download_template():
    """Download the Excel template file."""
    try:
        filepath = generate_template.create_template()
        return FileResponse(
            filepath,
            filename="accounting_template.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Process uploaded Excel/CSV file and return accounting reports."""
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Handle both Excel and CSV files
        if file.filename.endswith('.csv'):
            transactions = pd.read_csv(io.BytesIO(contents))
            # For CSV, we'd need to handle the chart of accounts separately
            # For simplicity, we'll use a default chart of accounts in this case
            coa = pd.DataFrame([
                {"account_name": "Cash", "account_type": "Asset", "parent_account": ""},
                {"account_name": "Accounts Receivable", "account_type": "Asset", "parent_account": ""},
                {"account_name": "Accounts Payable", "account_type": "Liability", "parent_account": ""},
                {"account_name": "Owner's Equity", "account_type": "Equity", "parent_account": ""},
                {"account_name": "Revenue", "account_type": "Income", "parent_account": ""},
                {"account_name": "Rent Expense", "account_type": "Expense", "parent_account": ""},
            ])
        else:
            # For Excel files, read both sheets
            df_dict = pd.read_excel(io.BytesIO(contents), sheet_name=None)
            if "Transactions" not in df_dict or "ChartOfAccounts" not in df_dict:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid template: Must include both 'Transactions' and 'ChartOfAccounts' sheets"
                )
            transactions = df_dict["Transactions"]
            coa = df_dict["ChartOfAccounts"]

        # Generate reports
        reports = generate_reports(transactions, coa)
        
        return {"reports": reports}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def generate_reports(transactions: pd.DataFrame, coa: pd.DataFrame) -> Dict[str, Any]:
    """Generate accounting reports from transactions and chart of accounts."""
    # Convert amount to float if it's not already
    if 'amount' in transactions.columns:
        transactions['amount'] = pd.to_numeric(transactions['amount'], errors='coerce')
    
    # Get unique accounts from transactions
    all_accounts = set(transactions['debit_account']).union(set(transactions['credit_account']))
    
    # Calculate account balances
    account_balances = {account: 0.0 for account in all_accounts}
    
    for _, row in transactions.iterrows():
        debit_account = row['debit_account']
        credit_account = row['credit_account']
        amount = float(row['amount'])
        
        account_balances[debit_account] = account_balances.get(debit_account, 0) + amount
        account_balances[credit_account] = account_balances.get(credit_account, 0) - amount
    
    # Categorize accounts
    account_types = {}
    for _, row in coa.iterrows():
        account_types[row['account_name']] = row['account_type']
    
    # Prepare reports
    balance_sheet = {
        'assets': {},
        'liabilities': {},
        'equity': {}
    }
    
    income_statement = {
        'income': {},
        'expenses': {},
        'net_income': 0
    }
    
    # Categorize accounts for balance sheet and income statement
    for account, balance in account_balances.items():
        acc_type = account_types.get(account, '').lower()
        
        if acc_type == 'asset':
            balance_sheet['assets'][account] = balance
        elif acc_type == 'liability':
            balance_sheet['liabilities'][account] = balance
        elif acc_type == 'equity':
            balance_sheet['equity'][account] = balance
        elif acc_type == 'income':
            income_statement['income'][account] = balance
        elif acc_type == 'expense':
            income_statement['expenses'][account] = -balance  # Expenses are negative in the accounting equation
    
    # Calculate net income
    total_income = sum(income_statement['income'].values())
    total_expenses = sum(income_statement['expenses'].values())
    net_income = total_income - total_expenses
    income_statement['net_income'] = net_income
    
    # Simple cash flow (for demonstration)
    cash_flow = {
        'operating': net_income,
        'investing': 0,
        'financing': 0,
        'net_cash_flow': net_income
    }
    
    return {
        'balance_sheet': balance_sheet,
        'income_statement': income_statement,
        'cash_flow': cash_flow
    }

@app.post("/download-updated")
async def download_updated(file: UploadFile = File(...)):
    """Process file and return an updated version with reports."""
    try:
        contents = await file.read()
        df_dict = pd.read_excel(io.BytesIO(contents), sheet_name=None)
        
        if "Transactions" not in df_dict or "ChartOfAccounts" not in df_dict:
            raise HTTPException(
                status_code=400,
                detail="Invalid template: Must include both 'Transactions' and 'ChartOfAccounts' sheets"
            )
        
        # Generate reports
        reports = generate_reports(df_dict["Transactions"], df_dict["ChartOfAccounts"])
        
        # Create a summary report
        summary_data = [
            {"Report": "Balance Sheet", "Total Assets": sum(reports['balance_sheet']['assets'].values())},
            {"Report": "Income Statement", "Net Income": reports['income_statement']['net_income']},
            {"Report": "Cash Flow", "Net Cash Flow": reports['cash_flow']['net_cash_flow']}
        ]
        
        # Create in-memory Excel file
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            # Write original sheets
            for sheet_name, df in df_dict.items():
                df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            # Add reports sheet
            pd.DataFrame(summary_data).to_excel(writer, sheet_name="Summary", index=False)
            
            # Add detailed reports as new sheets
            for report_name, report_data in reports.items():
                if isinstance(report_data, dict):
                    # Flatten the report data for better Excel display
                    flat_data = []
                    for category, items in report_data.items():
                        if isinstance(items, dict):
                            for item, value in items.items():
                                flat_data.append({"Category": str(category).title(), "Account": item, "Amount": value})
                    
                    if flat_data:
                        pd.DataFrame(flat_data).to_excel(
                            writer, 
                            sheet_name=f"{report_name.replace('_', ' ').title()}", 
                            index=False
                        )
        
        output.seek(0)
        
        return FileResponse(
            output,
            filename="updated_accounting_report.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
