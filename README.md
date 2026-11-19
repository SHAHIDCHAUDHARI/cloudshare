# CloudShare

A cloud-based file sharing website built with Java Spring Boot. Upload any file, get a short link and QR code, and share it with anyone. Links expire automatically and the file is removed from cloud storage.

**Live demo:** https://cloudshare-y7u8.onrender.com

---

## Features

- Upload any file type (images, PDFs, videos, documents, archives) up to 10 MB
- Unique 8-character share link for every upload
- Expiry options: 1 hour, 1 day, 3 days or 7 days
- QR code for each link, with download and share options
- Share through the device share menu or WhatsApp
- Download page with live countdown and download counter
- Scheduled job that deletes expired files every hour
- Clear error pages for expired or invalid links

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.5 (Web, Data JPA, Scheduling) |
| Database | PostgreSQL (Supabase), H2 for local development |
| File storage | Supabase Storage (private bucket) |
| Frontend | HTML, CSS, JavaScript |
| Hosting | Render (Docker) |
| Build tool | Maven |

## Architecture

```
Browser  ──►  Spring Boot app (Render)  ──►  PostgreSQL (Supabase)   file details
                                         └─►  Supabase Storage        file contents
```

1. The user uploads a file from the website.
2. `FileController` receives it and passes it to `FileService`.
3. `FileService` stores the file through `StorageService` and saves its details (token, name, size, expiry) in the database.
4. The user receives a link of the form `/f/{token}`.
5. When the link is opened, the server checks the expiry and streams the file back.
6. A scheduled task removes expired files from storage and the database.

## Project Structure

```
src/main/java/com/fileshare
├── CloudShareApplication.java      Application entry point
├── controller
│   ├── FileController.java         REST API: upload, file info, download
│   └── PageController.java         Serves the download page for /f/{token}
├── service
│   └── FileService.java            Upload, expiry check, download, cleanup
├── model
│   └── SharedFile.java             JPA entity for file metadata
├── repository
│   └── SharedFileRepository.java   Database access (Spring Data JPA)
├── storage
│   ├── StorageService.java         Storage interface
│   ├── LocalStorageService.java    Local disk storage (development)
│   └── SupabaseStorageService.java Supabase Storage (production)
└── exception                       Custom exceptions and global handler

src/main/resources
├── static                          Website pages, styles and scripts
├── application.properties          Local configuration
└── application-prod.properties     Cloud configuration
```

## API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload a file (`file`, `expiryHours`) |
| GET | `/api/files/{token}` | Get file details |
| GET | `/api/files/{token}/download` | Download the file |
| GET | `/f/{token}` | Download page |

## Running Locally

Requirements: Java 17 or newer and Maven.

```bash
git clone https://github.com/SHAHIDCHAUDHARI/cloudshare.git
cd cloudshare
mvn spring-boot:run
```

Open http://localhost:8080. Locally the app uses an H2 database and stores files in the `uploads` folder, so no cloud account is needed.

## Deployment

The app is deployed on Render using the included `Dockerfile`. The `prod` profile is activated automatically and reads these environment variables:

| Variable | Description |
|---|---|
| `DB_URL` | JDBC URL of the Supabase PostgreSQL session pooler |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase secret key |
| `SUPABASE_BUCKET` | Storage bucket name (default `files`) |

Every push to the `main` branch triggers a new deployment on Render.

## Team

Integrated Project for Java Programming and Cloud Computing
B.Tech CSE, 5th Semester, JG University

| Name | Enrollment No. |
|---|---|
| Shahid Chaudhari | 2501442019 |
| Baria Harsh | 2501442004 |
| Mevada Nandini | 2501442052 |
| Minhal Narsinh | 2501442058 |
| Shaikh Mohammad Sarjil | 2501442120 |
| Malek Sahran Khan | 2501442050 |
