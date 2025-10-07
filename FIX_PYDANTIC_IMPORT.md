# 🔧 Fix for Pydantic v2 Import Error

## ❌ Problem

Tests failing with:
```
PydanticImportError: `BaseSettings` has been moved to the `pydantic-settings` package.
```

## ✅ Solution

### 1. Install Missing Dependency

```bash
pip install pydantic-settings==2.5.2
```

### 2. Verify Fix Applied

The import in `auth/config.py` has been updated from:
```python
from pydantic import BaseSettings, Field, validator
```

To:
```python
from pydantic import Field, validator
from pydantic_settings import BaseSettings
```

### 3. Requirements Updated

`requirements.txt` now includes:
```
pydantic-settings==2.5.2
```

## 🚀 Run Tests

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
pytest tests/ -v
```

## ✅ Status

- [x] Import statement fixed in `auth/config.py`
- [x] Dependency added to `requirements.txt`
- [ ] Install `pydantic-settings` in your environment
- [ ] Re-run tests

The fix is complete. You just need to install the new dependency!
