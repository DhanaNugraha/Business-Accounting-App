from fastapi import FastAPI, UploadFile, File, HTTPException, Response, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import io
from pathlib import Path
from datetime import datetime
import tempfile
import os
import generate_template
    
# Initialize FastAPI app
app = FastAPI(title="Accounting Helper API")

# Enable CORS with dynamic origin handling
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add middleware to handle CORS headers
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    # Allowed origins
    allowed_origins = ["http://localhost:3000", "http://localhost:3001"]
    
    # Get origin from request
    origin = request.headers.get("origin")
    
    # Handle preflight requests
    if request.method == "OPTIONS":
        if origin in allowed_origins:
            response = JSONResponse(
                content={"message": "OK"},
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "86400",  # 24 hours
                },
            )
        else:
            response = JSONResponse(
                content={"error": "Origin not allowed"},
                status_code=403
            )
    else:
        response = await call_next(request)
        # Add CORS headers to all responses
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Vary"] = "Origin"
    
    return response

# Mount static files for frontend if dist directory exists
if Path("dist").exists():
    app.mount("/static", StaticFiles(directory="dist"), name="static")
    print("Serving static files from 'dist' directory")
else:
    print("Note: 'dist' directory not found. Running in API-only mode.")


# Utility functions
def to_camel_case(snake_str: str) -> str:
    """Convert snake_case to camelCase."""
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


# Pydantic models
class TransactionItem(BaseModel):
    """Represents a single transaction entry."""

    tanggal: str
    uraian: str
    penerimaan: Dict[str, float] = {}
    pengeluaran: Dict[str, float] = {}
    saldo: float

    class Config:
        alias_generator = to_camel_case
        allow_population_by_field_name = True


class AccountData(BaseModel):
    """Represents an account with its transactions."""

    name: str
    transactions: List[TransactionItem]


class TemplateData(BaseModel):
    """Wrapper for account data."""

    accounts: List[AccountData]


# API Endpoints
@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint to check if the API is running."""
    return {"message": "Accounting Helper API is running"}


@app.get("/api/template")
async def download_template() -> FileResponse:
    """Download the Excel template file with the new format."""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
            filepath = tmp.name

        template_path = generate_template.create_template(output_path=filepath)
        filename = f"accounting_template_{datetime.now().strftime('%Y%m%d')}.xlsx"

        return FileResponse(
            template_path,
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating template: {str(e)}"
        )
    finally:
        if os.path.exists(filepath):
            os.unlink(filepath)


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)) -> JSONResponse:
    """Process uploaded Excel file and return structured data."""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400, detail="Only Excel files (.xlsx, .xls) are supported"
        )

    try:
        contents = await file.read()
        xls = pd.ExcelFile(io.BytesIO(contents))
        accounts = _process_excel_sheets(xls)

        if not accounts:
            raise HTTPException(status_code=400, detail="No valid account sheets found")

        return JSONResponse(content={"accounts": accounts})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@app.post("/api/save")
async def save_file(data: TemplateData) -> Response:
    """Save the edited data back to an Excel file."""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
            filepath = tmp.name

        _create_excel_file(data, filepath)

        with open(filepath, "rb") as f:
            content = f.read()

        filename = f"accounting_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating Excel file: {str(e)}"
        )
    finally:
        if os.path.exists(filepath):
            os.unlink(filepath)


# Helper functions
def _process_excel_sheets(xls: pd.ExcelFile) -> List[Dict[str, Any]]:
    """Process all sheets in the Excel file and return account data."""
    accounts = []
    required_columns = ["Tanggal", "Uraian", "Saldo"]

    for sheet_name in xls.sheet_names:
        try:
            df = pd.read_excel(xls, sheet_name=sheet_name).fillna("")
            
            # Check for required columns
            if not all(col in df.columns for col in required_columns):
                continue
                
            # Get all Penerimaan and Pengeluaran columns
            penerimaan_cols = [col for col in df.columns if col.startswith("Penerimaan_")]
            pengeluaran_cols = [col for col in df.columns if col.startswith("Pengeluaran_")]

            transactions = _process_transactions(df, penerimaan_cols, pengeluaran_cols)
            accounts.append({"name": sheet_name, "transactions": transactions})
        except Exception as e:
            print(f"Error processing sheet '{sheet_name}': {str(e)}")
            continue

    return accounts


def _process_transactions(
    df: pd.DataFrame, 
    penerimaan_cols: List[str], 
    pengeluaran_cols: List[str]
) -> List[Dict[str, Any]]:
    """Convert DataFrame rows to transaction dictionaries with dynamic columns."""
    transactions = []
    
    for _, row in df.iterrows():
        try:
            # Process Penerimaan
            penerimaan = {}
            for col in penerimaan_cols:
                value = row[col]
                if pd.notna(value) and value != "" and float(value) != 0:
                    category = col.replace("Penerimaan_", "")
                    penerimaan[category] = float(value)
            
            # Process Pengeluaran
            pengeluaran = {}
            for col in pengeluaran_cols:
                value = row[col]
                if pd.notna(value) and value != "" and float(value) != 0:
                    category = col.replace("Pengeluaran_", "")
                    pengeluaran[category] = float(value)
            
            # Create transaction
            transaction = {
                "tanggal": row["Tanggal"].strftime("%Y-%m-%d") if pd.notna(row["Tanggal"]) else "",
                "uraian": str(row["Uraian"]) if pd.notna(row["Uraian"]) else "",
                "penerimaan": penerimaan,
                "pengeluaran": pengeluaran,
                "saldo": float(row["Saldo"]) if pd.notna(row["Saldo"]) else 0.0,
            }
            transactions.append(transaction)
            
        except Exception as e:
            print(f"Error processing row {_ + 1}: {str(e)}")
            continue
            
    return transactions


def _create_excel_file(data: TemplateData, output_path: str) -> None:
    """Create an Excel file from the template data with dynamic columns."""
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        for account in data.accounts:
            if not account.transactions:
                continue
                
            # Get all unique categories across all transactions
            all_penerimaan = set()
            all_pengeluaran = set()
            
            for t in account.transactions:
                all_penerimaan.update(t.penerimaan.keys())
                all_pengeluaran.update(t.pengeluaran.keys())
            
            # Create rows with dynamic columns
            rows = []
            for t in account.transactions:
                row = {
                    "Tanggal": t.tanggal,
                    "Uraian": t.uraian,
                }
                
                # Add Penerimaan columns
                for category in sorted(all_penerimaan):
                    col_name = f"Penerimaan_{category}"
                    row[col_name] = t.penerimaan.get(category, 0)
                
                # Add Pengeluaran columns
                for category in sorted(all_pengeluaran):
                    col_name = f"Pengeluaran_{category}"
                    row[col_name] = t.pengeluaran.get(category, 0)
                
                # Add Saldo
                row["Saldo"] = t.saldo
                
                rows.append(row)
            
            # Create DataFrame and write to Excel
            df = pd.DataFrame(rows)
            
            # Reorder columns: Tanggal, Uraian, Penerimaan_*, Pengeluaran_*, Saldo
            columns_order = ["Tanggal", "Uraian"]
            columns_order.extend(sorted([col for col in df.columns if col.startswith("Penerimaan_")]))
            columns_order.extend(sorted([col for col in df.columns if col.startswith("Pengeluaran_")]))
            columns_order.append("Saldo")
            
            df = df[columns_order]
            df.to_excel(writer, sheet_name=account.name, index=False)

            # Auto-adjust column widths
            worksheet = writer.sheets[account.name]
            for column in df:
                column_length = min(
                    max(df[column].astype(str).map(len).max(), len(column)) + 2,
                    30  # Max width of 30
                )
                col_idx = df.columns.get_loc(column)
                worksheet.column_dimensions[chr(65 + col_idx)].width = column_length


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
