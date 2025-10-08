# 📊 GigChain Data Storage & Export Guide

**Date:** October 8, 2025  
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Where is Data Stored?](#where-is-data-stored)
2. [Database Structure](#database-structure)
3. [Export System](#export-system)
4. [Time Range Options](#time-range-options)
5. [Export Formats](#export-formats)
6. [API Reference](#api-reference)
7. [Usage Examples](#usage-examples)
8. [Backup System](#backup-system)

---

## 🗄️ Where is Data Stored?

### Storage Location

All GigChain data is stored **locally on your server** in **SQLite databases**. No external cloud storage is used.

**Default location:** `/workspace/` (or where you run `python main.py`)

### Database Files

| Database File | Size | Purpose | Location |
|--------------|------|---------|----------|
| **analytics.db** | ~2-50 MB | Platform metrics, KPIs, events | `/workspace/analytics.db` |
| **admin.db** | ~1-10 MB | Admin accounts, users, settings | `/workspace/admin.db` |
| **wcsap_auth.db** | ~1-5 MB | W-CSAP authentication sessions | `/workspace/wcsap_auth.db` |

---

## 🗃️ Database Structure

### 1. Analytics Database (`analytics.db`)

**Purpose:** Stores all platform metrics, KPIs, and events

#### Tables:
- `metrics` - All platform events and metrics
  - contract_created, contract_completed, contract_disputed
  - user_registered, user_authenticated
  - payment_processed, payment_released
  - AI agent calls, chat messages
  - NFT minting, milestone completions

**Example Data:**
```sql
SELECT * FROM metrics WHERE metric_type = 'contract_created' LIMIT 5;
```

**Data Stored:**
- User activity
- Contract lifecycle
- Financial transactions
- Platform engagement
- AI agent usage
- System performance

### 2. Admin Database (`admin.db`)

**Purpose:** Stores admin accounts and platform user data

#### Tables:
- `admin_users` - Admin accounts and credentials
- `admin_sessions` - Admin login sessions
- `admin_activity_log` - All admin actions
- `platform_users` - Platform user profiles
  - Wallet addresses
  - Reputation scores
  - Total contracts
  - Total earnings
- `platform_settings` - System configuration
- `moderation_queue` - Content moderation
- `system_alerts` - Platform alerts
- `admin_mfa_settings` - MFA configuration
- `admin_mfa_attempts` - MFA login attempts
- `admin_wallets` - Admin wallet mappings

**Example Data:**
```sql
SELECT user_id, wallet_address, reputation_score, total_earned 
FROM platform_users 
ORDER BY total_earned DESC 
LIMIT 10;
```

### 3. Authentication Database (`wcsap_auth.db`)

**Purpose:** Stores W-CSAP authentication data

#### Tables:
- `auth_challenges` - Authentication challenges
- `auth_sessions` - User sessions
- `auth_events` - Authentication events

---

## 📥 Export System

### What Can You Export?

✅ **KPIs & Metrics** - Platform statistics and analytics  
✅ **Users List** - Complete user data with wallet addresses  
✅ **Contracts** - Contract events and transactions  
✅ **Custom Reports** - Any time range you need

### Time Range Options

| Option | Description | Use Case |
|--------|-------------|----------|
| **24h** | Last 24 hours | Daily reports |
| **7d** | Last 7 days | Weekly reviews |
| **30d** | Last 30 days | Monthly reports |
| **90d** | Last 90 days | Quarterly analysis |
| **this_month** | Current month (from day 1) | Month-to-date |
| **last_month** | Previous month | Monthly reports |
| **this_year** | Current year (from Jan 1) | Year-to-date |
| **all_time** | All historical data | Complete exports |
| **custom** | Specify start & end dates | Ad-hoc reports |

---

## 💾 Export Formats

### JSON Format
```json
{
  "metadata": {
    "export_date": "2025-10-08T10:30:00",
    "time_range": "7d",
    "start_date": "2025-10-01T00:00:00",
    "end_date": "2025-10-08T10:30:00"
  },
  "platform_metrics": {
    "total_events": 1523,
    "unique_users": 87,
    "unique_contracts": 145
  },
  "user_metrics": {
    "total_users": 87,
    "active_users": 72,
    "suspended_users": 2,
    "banned_users": 0,
    "average_reputation": 85.5,
    "total_contracts": 145,
    "total_earnings": 45780.50
  },
  "contract_metrics": {
    "contracts_created": 145,
    "contracts_completed": 128,
    "contracts_disputed": 5,
    "contracts_cancelled": 12,
    "success_rate": 88.28,
    "total_contract_value": 125300.00
  },
  "financial_metrics": {
    "payments_processed": 128,
    "payments_released": 115,
    "total_payment_volume": 125300.00,
    "total_released_volume": 112500.00,
    "platform_revenue": 6265.00
  },
  "engagement_metrics": {
    "total_logins": 523,
    "chat_messages": 892,
    "ai_agent_calls": 245,
    "nfts_minted": 15,
    "milestones_completed": 234
  }
}
```

### CSV Format
```csv
Metric,Value
metadata.export_date,2025-10-08T10:30:00
metadata.time_range,7d
platform_metrics.total_events,1523
platform_metrics.unique_users,87
user_metrics.total_users,87
user_metrics.active_users,72
contract_metrics.contracts_created,145
contract_metrics.success_rate,88.28
financial_metrics.platform_revenue,6265.00
```

---

## 📡 API Reference

### 1. Export KPIs

**Endpoint:** `GET /api/admin/export/kpis`

**Parameters:**
- `time_range`: 24h, 7d, 30d, 90d, this_month, last_month, this_year, all_time, custom
- `format`: json, csv
- `start_date`: (Optional) For custom range (ISO format)
- `end_date`: (Optional) For custom range (ISO format)

**Example:**
```bash
# JSON export (last 7 days)
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/admin/export/kpis?time_range=7d&format=json"

# CSV export (custom range)
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/admin/export/kpis?time_range=custom&format=csv&start_date=2025-10-01T00:00:00&end_date=2025-10-08T00:00:00"
```

### 2. Export Users

**Endpoint:** `GET /api/admin/export/users`

**Parameters:**
- `time_range`: Time range filter (by user creation date)
- `format`: json, csv

**Example:**
```bash
# Export all users as CSV
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/admin/export/users?time_range=all_time&format=csv" \
  -o users_export.csv
```

**Response Fields:**
- user_id
- wallet_address
- username
- email
- status (active, suspended, banned)
- reputation_score
- total_contracts
- total_earned
- trust_score
- created_at
- last_active

### 3. Export Contracts

**Endpoint:** `GET /api/admin/export/contracts`

**Parameters:**
- `time_range`: Time range filter
- `format`: json, csv

**Example:**
```bash
# Export last 30 days contracts
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/admin/export/contracts?time_range=30d&format=json" \
  -o contracts_30d.json
```

### 4. Database Information

**Endpoint:** `GET /api/admin/export/database-info`

**Example:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/admin/export/database-info"
```

**Response:**
```json
{
  "success": true,
  "databases": {
    "analytics": {
      "path": "/workspace/analytics.db",
      "exists": true,
      "size_mb": 12.5,
      "description": "Stores all platform metrics, KPIs, and analytics data"
    },
    "admin": {
      "path": "/workspace/admin.db",
      "exists": true,
      "size_mb": 3.2,
      "description": "Stores admin accounts, users, and platform management data"
    },
    "authentication": {
      "path": "/workspace/wcsap_auth.db",
      "exists": true,
      "size_mb": 1.8,
      "description": "Stores W-CSAP authentication sessions and challenges"
    }
  }
}
```

### 5. Create Backup

**Endpoint:** `POST /api/admin/export/backup`

**Requirements:** Super Admin only

**Example:**
```bash
curl -X POST -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  "http://localhost:5000/api/admin/export/backup"
```

**Response:**
```json
{
  "success": true,
  "message": "Backup created successfully",
  "backups": {
    "analytics": "/workspace/backups/backup_20251008_103045/analytics.db",
    "admin": "/workspace/backups/backup_20251008_103045/admin.db",
    "authentication": "/workspace/backups/backup_20251008_103045/wcsap_auth.db"
  }
}
```

---

## 💡 Usage Examples

### Example 1: Export Last 7 Days KPIs as JSON

```javascript
// Frontend
const exportKPIs = async () => {
  const response = await fetch(
    'http://localhost:5000/api/admin/export/kpis?time_range=7d&format=json',
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }
  );
  
  const data = await response.json();
  
  // Save to file
  const jsonString = JSON.stringify(data.data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kpis_7d.json';
  a.click();
};
```

### Example 2: Export This Month Users as CSV

```bash
#!/bin/bash
# Bash script to export monthly user report

TOKEN="your_admin_token_here"
DATE=$(date +%Y%m%d)

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/admin/export/users?time_range=this_month&format=csv" \
  -o "users_report_${DATE}.csv"

echo "User report saved to users_report_${DATE}.csv"
```

### Example 3: Custom Date Range Export

```python
# Python script
import requests
from datetime import datetime, timedelta

# Calculate date range (last 14 days)
end_date = datetime.now()
start_date = end_date - timedelta(days=14)

# Format dates
params = {
    'time_range': 'custom',
    'format': 'json',
    'start_date': start_date.isoformat(),
    'end_date': end_date.isoformat()
}

# Export KPIs
response = requests.get(
    'http://localhost:5000/api/admin/export/kpis',
    params=params,
    headers={'Authorization': f'Bearer {admin_token}'}
)

data = response.json()
print(f"Contracts created: {data['data']['contract_metrics']['contracts_created']}")
print(f"Revenue: ${data['data']['financial_metrics']['platform_revenue']}")
```

### Example 4: Automated Daily Backup

```bash
#!/bin/bash
# Add to crontab: 0 2 * * * /path/to/backup.sh

TOKEN="your_super_admin_token"
DATE=$(date +%Y%m%d)

# Create backup
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/admin/export/backup" \
  > /var/log/gigchain_backup_${DATE}.log

# Optional: Compress old backups
find /workspace/backups/ -type f -mtime +30 -exec gzip {} \;
```

---

## 💾 Backup System

### Automatic Backup Creation

Backups create **exact copies** of all database files with timestamps.

**Backup location:** `/workspace/backups/backup_YYYYMMDD_HHMMSS/`

**Example structure:**
```
/workspace/backups/
├── backup_20251008_103045/
│   ├── analytics.db       (12.5 MB)
│   ├── admin.db           (3.2 MB)
│   └── wcsap_auth.db      (1.8 MB)
├── backup_20251007_020000/
│   ├── analytics.db
│   ├── admin.db
│   └── wcsap_auth.db
└── ...
```

### Manual Backup (via GUI)

1. Go to Admin Panel → Export & Backup
2. Scroll to "Database Information" section
3. Click "Create Backup Now"
4. Files are saved to `/workspace/backups/`

### Restore from Backup

```bash
# Stop server
# Replace current databases with backup
cp /workspace/backups/backup_YYYYMMDD_HHMMSS/analytics.db /workspace/analytics.db
cp /workspace/backups/backup_YYYYMMDD_HHMMSS/admin.db /workspace/admin.db
cp /workspace/backups/backup_YYYYMMDD_HHMMSS/wcsap_auth.db /workspace/wcsap_auth.db

# Restart server
python3 main.py
```

---

## 🔒 Data Security

### Storage Security

✅ **Local Storage Only** - No cloud uploads  
✅ **SQLite Encrypted** - Can enable encryption if needed  
✅ **File Permissions** - Readable only by server user  
✅ **Backup Rotation** - Keep 30 days of backups  
✅ **Export Logging** - All exports are logged in admin activity

### Access Control

- ✅ All export endpoints require admin authentication
- ✅ Backup creation requires Super Admin role
- ✅ All actions are logged with timestamp, IP, and admin ID
- ✅ Rate limiting prevents abuse

---

## 📊 Data Size Estimates

### Typical Database Sizes

| Usage Level | analytics.db | admin.db | wcsap_auth.db | Total |
|-------------|--------------|----------|---------------|-------|
| **Small** (100 users) | 5 MB | 1 MB | 0.5 MB | ~7 MB |
| **Medium** (1,000 users) | 25 MB | 5 MB | 2 MB | ~32 MB |
| **Large** (10,000 users) | 150 MB | 25 MB | 10 MB | ~185 MB |
| **Enterprise** (100,000 users) | 1.2 GB | 150 MB | 75 MB | ~1.4 GB |

### Growth Rate

- **Daily growth:** ~0.5-2 MB per 100 active users
- **Monthly growth:** ~15-60 MB per 100 active users
- **Annual growth:** ~180-720 MB per 100 active users

---

## 🔧 Database Maintenance

### Cleanup Old Data

```python
# Remove metrics older than 1 year
import sqlite3
from datetime import datetime, timedelta

one_year_ago = (datetime.now() - timedelta(days=365)).isoformat()

with sqlite3.connect('analytics.db') as conn:
    cursor = conn.cursor()
    cursor.execute('DELETE FROM metrics WHERE timestamp < ?', (one_year_ago,))
    conn.commit()
    print(f"Deleted {cursor.rowcount} old records")
```

### Vacuum Database (Reclaim Space)

```bash
# Compress and optimize databases
sqlite3 analytics.db "VACUUM;"
sqlite3 admin.db "VACUUM;"
sqlite3 wcsap_auth.db "VACUUM;"
```

### Database Health Check

```bash
# Check database integrity
sqlite3 analytics.db "PRAGMA integrity_check;"
sqlite3 admin.db "PRAGMA integrity_check;"
sqlite3 wcsap_auth.db "PRAGMA integrity_check;"
```

---

## 📈 Accessing Raw Data

### Direct SQLite Access

```bash
# Open database
sqlite3 analytics.db

# List tables
.tables

# Query data
SELECT metric_type, COUNT(*) as count 
FROM metrics 
WHERE timestamp > datetime('now', '-7 days')
GROUP BY metric_type 
ORDER BY count DESC;

# Export to CSV
.mode csv
.output contracts.csv
SELECT * FROM metrics WHERE metric_type LIKE 'contract%';
.quit
```

### Python Script Access

```python
import sqlite3

# Connect to database
conn = sqlite3.connect('analytics.db')
cursor = conn.cursor()

# Query metrics
cursor.execute("""
    SELECT metric_type, COUNT(*), SUM(value)
    FROM metrics
    WHERE timestamp > datetime('now', '-30 days')
    GROUP BY metric_type
""")

for metric_type, count, total_value in cursor.fetchall():
    print(f"{metric_type}: {count} events, ${total_value:.2f}")

conn.close()
```

---

## 🎯 Best Practices

### Export Best Practices

1. **Regular Exports** - Schedule weekly/monthly exports
2. **Multiple Formats** - Keep both JSON and CSV
3. **Version Control** - Name files with dates
4. **Secure Storage** - Store exports in secure location
5. **Test Restores** - Periodically test backup restoration

### Backup Best Practices

1. **Automated Backups** - Run daily at 2 AM
2. **Off-site Storage** - Copy backups to external location
3. **Retention Policy** - Keep 30 days of daily backups
4. **Test Regularly** - Monthly restore test
5. **Monitor Size** - Alert if database grows unusually

### Performance Tips

1. **Index Usage** - Databases have proper indexes
2. **Query Optimization** - Use time range filters
3. **Export During Off-Peak** - Run large exports at night
4. **Compress Old Data** - Gzip backups older than 7 days
5. **Monitor Disk Space** - Ensure 2x database size free

---

## 📞 Support

### Questions?

- **Technical Documentation:** See `ADMIN_MFA_SECURITY_GUIDE.md`
- **API Documentation:** Visit `http://localhost:5000/docs`
- **Database Schema:** Check `.sql` files in `/workspace/`

### Common Issues

**Q: Where is my data stored?**  
A: Check `/workspace/` directory for `.db` files

**Q: How do I move databases?**  
A: Copy `.db` files to new location, update paths in code if needed

**Q: Can I use PostgreSQL instead?**  
A: Yes, modify database connections in code (requires code changes)

**Q: How do I schedule automatic exports?**  
A: Use cron jobs (Linux) or Task Scheduler (Windows) to call API

---

## ✅ Summary

### Where Data Lives

```
/workspace/
├── analytics.db        ← All metrics, KPIs, events
├── admin.db           ← Admin accounts, users, settings
├── wcsap_auth.db      ← Authentication sessions
└── backups/           ← Timestamped database backups
    └── backup_YYYYMMDD_HHMMSS/
        ├── analytics.db
        ├── admin.db
        └── wcsap_auth.db
```

### Key Features

✅ **Local storage** - Everything on your server  
✅ **SQLite databases** - Fast, reliable, portable  
✅ **Multiple export formats** - JSON, CSV  
✅ **Flexible time ranges** - 24h to all-time  
✅ **Automated backups** - One-click backup creation  
✅ **Full API access** - Programmatic exports  
✅ **Activity logging** - All exports tracked  

---

**End of Document**

*Last Updated: October 8, 2025*  
*Document Version: 1.0.0*
