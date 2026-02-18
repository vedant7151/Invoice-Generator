# Invoice Generator

Full-stack invoice management app with React frontend and Express backend.

- **Frontend:** React, Vite, Tailwind, Clerk
- **Backend:** Express, MongoDB, PDF generation, Brevo email

## File Uploads & Business Profile Images

- Business profile assets (logo, stamp, signature) are uploaded via the backend `businessProfile` routes and saved to an `uploads` directory at the backend project root.
- The backend statically serves these files from `/uploads/...` and stores the fully qualified image URLs (for example, `https://your-backend.com/uploads/business-...png`) in the `BusinessProfile` document fields `logoUrl`, `stampUrl`, and `signatureUrl`.
- In production, set the `BACKEND_URL` environment variable on the backend to the public base URL of the API (for example, `https://your-backend.onrender.com`) so that generated image URLs are correct.

### Persistence Notes

- On local development, uploads are written to disk under the `uploads` folder and will persist across server restarts as long as that folder is not deleted.
- On fully ephemeral platforms (for example, certain Render/Vercel setups that rebuild from an image on each deploy), local disk uploads may not persist across deploys. For long-term production storage, plan to migrate image uploads to a persistent cloud storage service (such as S3, Cloudinary, or similar) while continuing to store the resulting HTTPS URLs in `logoUrl`, `stampUrl`, and `signatureUrl`.
