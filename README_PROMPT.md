```
# README — PROMPT.md (GigChain)


## ¿Qué es?
Prompt de sistema para Grok/OpenAI que estandariza cómo el agente construye código, usa herramientas y entrega resultados para el MVP de GigChain.


## Cómo usarlo
1. Pega `PROMPT.md` en el root del repo.
2. Configura tu proveedor (Grok u OpenAI) para usar el contenido de `PROMPT.md` como **System Prompt** del agente principal.
3. (Opcional) Ajusta variables de entorno/secrets en Codex para integrar SDKs (OpenAI, Thirdweb, Stripe).


## Validación rápida (local)
- Ejecuta `pytest -q` si el repo ya tiene tests.
- Revisa que las respuestas sigan la plantilla **## Fase → Pasos → Código → Tests → Deploy**.


## Notas
- No exponer *chain-of-thought* en la respuesta al usuario.
- Usa herramientas solo si incrementan certeza o reducen retrabajo.
```
