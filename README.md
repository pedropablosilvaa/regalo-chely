# Regalo Romántico - Sitio Estático

Este es un sitio web estático construido con Hugo, diseñado como un regalo romántico. Es minimalista, rápido y 100% responsivo.

## Características

- **Galería de Fotos**: Grid responsivo con modal para ver imágenes en grande con detalles.
- **Cartas por Estado de Ánimo**: Generador aleatorio de mensajes basado en cómo se siente la persona (Feliz, Triste, Romántico, etc.) sin repeticiones inmediatas.
- **100% Editable**: Todo el contenido (fotos, textos, moods) está en archivos YAML sencillos en la carpeta `data/`.

## Cómo Editar

### Fotos
Edita `data/photos.yaml`. Agrega o quita bloques como este:
```yaml
- id: 1
  src: "URL_DE_TU_FOTO" # Puede ser una URL externa o ruta a /static/photos/img.jpg
  title: "Título"
  caption: "Descripción corta"
  date: "2023-01-01"
  place: "Lugar"
```

### Cartas
Edita `data/letters.yaml`.
```yaml
- id: "uniqueID"
  moodId: "happy" # Debe coincidir con un id en moods.yaml
  text: "El cuerpo de la carta..."
  memory: "Un recuerdo especial..."
```

## Configuración de Despliegue (Google Cloud Storage)

Para que el sitio esté online, usaremos Google Cloud Storage (GCS) y GitHub Actions.

### 1. Preparar Google Cloud
1. Crea un proyecto en GCP.
2. Crea un **Bucket** en Cloud Storage:
   - Nombre único (ej. `mi-regalo-especial.com` o algo random).
   - Location: `us-central1` (o lo que prefieras).
   - **Desactiva "Enforce public access prevention"** (debe ser público).
   - Acceso: "Uniform".
3. En la lista de buckets, da click en los 3 puntos -> **Edit access**.
   - Add principal: `allUsers`
   - Role: `Storage Object Viewer`.
4. En los 3 puntos del bucket -> **Edit website configuration**.
   - Index page: `index.html`
   - 404 page: `404.html`

### 2. Configurar Autenticación (Workload Identity Federation)
Esta es la forma segura (sin keys descargadas).
1. Sigue la guía oficial o usa este resumen:
   Let `PROJECT_ID` be your GCP project ID.
   Let `REPO` be `usuario/repo`.
   
   ```bash
   gcloud iam service-accounts create my-site-deployer
   
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:my-site-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.admin"
     
   gcloud iam workload-identity-pools create "github-pool" \
     --project="$PROJECT_ID" \
     --location="global" \
     --display-name="GitHub Pool"
     
   gcloud iam workload-identity-pools providers create-oidc "github-provider" \
     --project="$PROJECT_ID" \
     --location="global" \
     --workload-identity-pool="github-pool" \
     --display-name="GitHub Provider" \
     --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
     --issuer-uri="https://token.actions.githubusercontent.com"
     
   gcloud iam service-accounts add-iam-policy-binding "my-site-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
     --project="$PROJECT_ID" \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/[PROJECT_NUMBER]/locations/global/workloadIdentityPools/github-pool/attribute.repository/$REPO"
   ```
   
   *Nota: Reemplaza `[PROJECT_NUMBER]` con el número de proyecto numérico.*

2. Obtén el **Provider Resource Name**:
   ```bash
   gcloud iam workload-identity-pools providers describe "github-provider" \
     --project="$PROJECT_ID" \
     --location="global" \
     --workload-identity-pool="github-pool" \
     --format="value(name)"
   ```
   Esto te dará algo como: `projects/123456/locations/global/workloadIdentityPools/github-pool/providers/github-provider`.

### 3. Configurar GitHub Secrets
En tu repositorio de GitHub, ve a Settings -> Secrets and variables -> Actions -> New repository secret. Agrega:

- `GCS_BUCKET_NAME`: El nombre de tu bucket (ej. `mi-regalo.com`).
- `WORKLOAD_IDENTITY_PROVIDER`: El string largo obtenido en el paso anterior.
- `SERVICE_ACCOUNT_EMAIL`: `my-site-deployer@$PROJECT_ID.iam.gserviceaccount.com`.

### 4. Deploy
Haz un push a la rama `main`. La acción se ejecutará, construirá el sitio t lo subirá al bucket.
Podrás ver tu sitio en `https://storage.googleapis.com/NOMBRE_DEL_BUCKET/index.html` o configurando un dominio personalizado (CNAME apuntando a `c.storage.googleapis.com`).

## Desarrollo Local

1. Instala Hugo.
2. Clona el repo.
3. Corre el servidor de desarrollo (incluye borradores):
   ```bash
   hugo server -D
   ```
4. Abre `http://localhost:1313`.
