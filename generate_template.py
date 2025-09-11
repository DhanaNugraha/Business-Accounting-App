import pandas as pd
from pathlib import Path

def create_template(output_path: str = "template.xlsx") -> str:
    """
    Generate an Excel template with Transactions and ChartOfAccounts sheets.
    
    Args:
        output_path: Path where the template will be saved
        
    Returns:
        str: Path to the generated template file
    """
    # Create sample transactions data
    transactions = pd.DataFrame([
        {"date": "2025-01-01", "debit_account": "Cash", "credit_account": "Revenue", "amount": 1000.00, "description": "Sale income"},
        {"date": "2025-01-02", "debit_account": "Rent Expense", "credit_account": "Cash", "amount": 300.00, "description": "Office rent"},
    ])
    
    # Create chart of accounts
    coa = pd.DataFrame([
        {"account_name": "Cash", "account_type": "Asset", "parent_account": ""},
        {"account_name": "Accounts Receivable", "account_type": "Asset", "parent_account": ""},
        {"account_name": "Accounts Payable", "account_type": "Liability", "parent_account": ""},
        {"account_name": "Owner's Equity", "account_type": "Equity", "parent_account": ""},
        {"account_name": "Revenue", "account_type": "Income", "parent_account": ""},
        {"account_name": "Rent Expense", "account_type": "Expense", "parent_account": ""},
    ])
    
    # Ensure output directory exists
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write to Excel
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        transactions.to_excel(writer, sheet_name="Transactions", index=False)
        coa.to_excel(writer, sheet_name="ChartOfAccounts", index=False)
    
    return str(output_path.absolute())

if __name__ == "__main__":
    path = create_template()
    print(f"Template created at: {path}")
