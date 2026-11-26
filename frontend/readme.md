frontend start :
npm run dev


backend start:
<!-- 1 - python -m venv .venv
2 - .\.venv\Scripts\Activate.ps1
3 - $env:TERAMAX_SIM = "1"
    $env:TERAMAX_ADMIN_PASSWORD = "admin12345" -->
    uvicorn app.main:app --reload
4 - python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload