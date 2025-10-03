# Examples and Quickstart

Base URL: `http://localhost:5000`

## cURL

- Health
```bash
curl http://localhost:5000/health
```

- Simple contract
```bash
curl -X POST http://localhost:5000/api/contract \
  -H 'Content-Type: application/json' \
  -d '{"text":"Soy freelancer, ofrezco $2000, cliente solicita $5000, proyecto de 20 días"}'
```

- Full AI flow
```bash
curl -X POST http://localhost:5000/api/full_flow \
  -H 'Content-Type: application/json' \
  -d '{"text":"Freelancer ofrezco 2000 dolares. Cliente solicita 5000 dolares. Proyecto de 20 días."}'
```

- Structured contract
```bash
curl -X POST http://localhost:5000/api/structured_contract \
  -H 'Content-Type: application/json' \
  -d '{
    "description":"Sitio web corporativo",
    "offeredAmount":2000,
    "requestedAmount":5000,
    "days":20,
    "role":"freelancer",
    "freelancerWallet":"0x0000000000000000000000000000000000000000"
  }'
```

- Validate wallet
```bash
curl -X POST http://localhost:5000/api/validate_wallet \
  -H 'Content-Type: application/json' \
  -d '{"address":"0x0000000000000000000000000000000000000000","network":"polygon"}'
```

- Chat session and message
```bash
curl -X POST http://localhost:5000/api/chat/session -H 'Content-Type: application/json' -d '{"user_id":"demo","agent_type":"contract"}'
# then
curl -X POST http://localhost:5000/api/chat/message -H 'Content-Type: application/json' \
  -d '{"message":"Hola","session_id":"<SESSION_ID>","user_id":"demo"}'
```

## JavaScript (fetch)

```js
const API = 'http://localhost:5000';

async function simpleContract(text) {
  const res = await fetch(`${API}/api/contract`, {
    method: 'POST', headers: { 'Content-Type: 'application/json' },
    body: JSON.stringify({ text })
  });
  return res.json();
}

async function fullFlow(text) {
  const res = await fetch(`${API}/api/full_flow`, {
    method: 'POST', headers: { 'Content-Type: 'application/json' },
    body: JSON.stringify({ text })
  });
  return res.json();
}

async function structuredContract(payload) {
  const res = await fetch(`${API}/api/structured_contract`, {
    method: 'POST', headers: { 'Content-Type: 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function validateWallet(address, network = 'polygon') {
  const res = await fetch(`${API}/api/validate_wallet`, {
    method: 'POST', headers: { 'Content-Type: 'application/json' },
    body: JSON.stringify({ address, network })
  });
  return res.json();
}
```

## Python (requests)

```python
import requests
API = 'http://localhost:5000'

r = requests.post(f'{API}/api/contract', json={ 'text': 'Cliente solicita 5000 dolares, 14 días' })
print(r.json())
```