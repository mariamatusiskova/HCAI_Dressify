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

If you do not have `uv`, you can still run locally with `venv` + `pip`:
```
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

The frontend calls `http://127.0.0.1:8000/remove-bg` by default.