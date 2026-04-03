### Prerequisites:
- Python 3.11
- uv

To install uv run:
```
pip install uv
```

To run the frontend:
```
npm ci
npm run dev
```

To run the backend:
```
cd backend
uv run uvicorn main:app --reload
```