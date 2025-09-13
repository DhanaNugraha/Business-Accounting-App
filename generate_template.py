import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta

def create_template(output_path: str = "template.xlsx") -> str:
    """
    Generate an Excel template for accounting with multiple accounts.
    
    The template includes sample transactions with Indonesian column headers and supports multiple accounts.
    Each Penerimaan and Pengeluaran category will be in its own column.
    
    Args:
        output_path: Path where the template will be saved
        
    Returns:
        str: Path to the generated template file
    """
    # Get current date for sample data
    today = datetime.now()
    
    # Helper function to parse transaction entries
    def parse_entries(entry_dict):
        """Convert dictionary of entries to string representation"""
        return ', '.join(f"{k}: {v}" for k, v in entry_dict.items()) if entry_dict else ""
    
    # Create sample data for Kas (Cash) account
    kas_transactions = [
        {
            "Tanggal": (today - timedelta(days=2)).strftime("%Y-%m-%d"),
            "Uraian": "Modal Awal",
            "Penerimaan": {"Tunai": 10000000},
            "Pengeluaran": {},
            "Saldo": 10000000
        },
        {
            "Tanggal": (today - timedelta(days=1)).strftime("%Y-%m-%d"),
            "Uraian": "Pembelian Peralatan",
            "Penerimaan": {},
            "Pengeluaran": {"Peralatan": 2500000},
            "Saldo": 7500000
        },
        {
            "Tanggal": today.strftime("%Y-%m-%d"),
            "Uraian": "Pendapatan Jasa",
            "Penerimaan": {"Jasa": 3500000},
            "Pengeluaran": {},
            "Saldo": 11000000
        }
    ]
    
    # Create sample data for Bank account
    bank_transactions = [
        {
            "Tanggal": (today - timedelta(days=1)).strftime("%Y-%m-%d"),
            "Uraian": "Setoran Awal",
            "Penerimaan": {"Setoran": 5000000},
            "Pengeluaran": {},
            "Saldo": 5000000
        },
        {
            "Tanggal": today.strftime("%Y-%m-%d"),
            "Uraian": "Pembayaran Tagihan",
            "Penerimaan": {},
            "Pengeluaran": {"Internet": 500000},
            "Saldo": 4500000
        }
    ]
    
    # Create sample data for E-Wallet account
    ewallet_transactions = [
        {
            "Tanggal": today.strftime("%Y-%m-%d"),
            "Uraian": "Top Up",
            "Penerimaan": {"Transfer": 1000000},
            "Pengeluaran": {},
            "Saldo": 1000000
        }
    ]
    
    # Create a dictionary to hold all account data
    accounts_data = {
        "Kas": kas_transactions,
        "Bank": bank_transactions,
        "E-Wallet": ewallet_transactions
    }
    
    # Create output path in the current working directory with a timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"accounting_template_{timestamp}.xlsx"
    output_path = Path.cwd() / output_filename
    
    # Create a new Excel writer
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        # Create a worksheet for each account
        for account_name, transactions in accounts_data.items():
            # Find all unique column names for Penerimaan and Pengeluaran
            penerimaan_columns = set()
            pengeluaran_columns = set()
            
            for tx in transactions:
                penerimaan_columns.update(tx["Penerimaan"].keys())
                pengeluaran_columns.update(tx["Pengeluaran"].keys())
            
            # Create a list to hold all rows
            rows = []
            
            for tx in transactions:
                row = {
                    "Tanggal": tx["Tanggal"],
                    "Uraian": tx["Uraian"]
                }
                
                # Add Penerimaan columns
                for col in sorted(penerimaan_columns):
                    row[f"Penerimaan_{col}"] = tx["Penerimaan"].get(col, 0)
                
                # Add Pengeluaran columns
                for col in sorted(pengeluaran_columns):
                    row[f"Pengeluaran_{col}"] = tx["Pengeluaran"].get(col, 0)
                
                # Add Saldo
                row["Saldo"] = tx["Saldo"]
                
                rows.append(row)
            
            # Create DataFrame
            df = pd.DataFrame(rows)
            
            # Reorder columns: Tanggal, Uraian, Penerimaan_*, Pengeluaran_*, Saldo
            columns_order = ["Tanggal", "Uraian"]
            columns_order.extend(sorted([col for col in df.columns if col.startswith("Penerimaan_")]))
            columns_order.extend(sorted([col for col in df.columns if col.startswith("Pengeluaran_")]))
            columns_order.append("Saldo")
            
            df = df[columns_order]
            
            # Write to Excel with sheet name = account name
            df.to_excel(writer, sheet_name=account_name, index=False)
            
            # Auto-adjust column widths
            worksheet = writer.sheets[account_name]
            for column in df:
                column_length = max(df[column].astype(str).map(len).max(), len(column)) + 2
                col_idx = df.columns.get_loc(column)
                worksheet.column_dimensions[chr(65 + col_idx)].width = min(column_length, 30)  # Cap width at 30
    
    print(f"Template created with accounts: {', '.join(accounts_data.keys())}")
    return str(output_path.absolute())

if __name__ == "__main__":
    path = create_template()
    print(f"Template created at: {path}")
