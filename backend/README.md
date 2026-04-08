### Prerequisites:
- Python 3.11
- uv

To install uv run:
```
pip install uv
```

**Note:** If you do not have Python 3.11 installed then uv will install it automatically when you run it.

### Run app locally
To run the frontend:
```
npm ci
npm run dev
```

To run the backend:
```
cd backend
uv run python main.py
```