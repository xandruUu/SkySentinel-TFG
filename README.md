# SkySentinel

SkySentinel es una aplicación web progresiva para seguimiento de aeronaves en tiempo real, orientada a spotters y personal logístico aeroportuario.

## Tecnologías

- React
- Vite
- Tailwind CSS
- MapLibre GL JS
- FastAPI
- SQLAlchemy
- PostgreSQL / PostGIS
- Docker Compose
- OpenSky Network API

## Funcionalidades principales

- Registro e inicio de sesión de usuarios.
- Visualización de aeronaves en tiempo real sobre mapa.
- Filtros por país, velocidad, altitud e identificadores.
- Creación de alertas por modelo o compañía.
- Notificaciones locales en navegador/PWA.
- Persistencia de usuarios, aeronaves, estados de vuelo y alertas.

## Ejecución con Docker

```bash
docker compose --env-file .env.compose up --build