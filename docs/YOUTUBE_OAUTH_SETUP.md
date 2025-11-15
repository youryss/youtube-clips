# YouTube OAuth Setup Guide

## Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable YouTube Data API v3:
   - Go to **APIs & Services** → **Library**
   - Search for "YouTube Data API v3"
   - Click **Enable**

## Step 2: Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:

   - User Type: **External** (or Internal if using Google Workspace)
   - App name: "YouTube Viral Clipper"
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Add `https://www.googleapis.com/auth/youtube.upload`
   - Click **Save and Continue**
   - Add test users if needed
   - Click **Back to Dashboard**

4. Create OAuth Client ID:

   - Application type: **Web application**
   - Name: "YouTube Viral Clipper Web"
   - **Authorized JavaScript origins:**
     - `http://localhost:3001`
     - `http://localhost:5001` (if using backend directly)
   - **Authorized redirect URIs:**
     - `docker-compose logs backend | grep "Job 32"`
     - `http://localhost:5001/youtube/callback` (if using backend directly)
   - Click **Create**

5. Download credentials:
   - Click the download icon next to your OAuth 2.0 Client ID
   - Save as `client_secrets.json` in the project root directory

## Step 3: Configure the Application

1. Place `client_secrets.json` in the project root:

   ```
   /Users/yourystancato/youtube-viral-clipper/client_secrets.json
   ```

2. The file should look like:
   ```json
   {
     "web": {
       "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
       "project_id": "your-project-id",
       "auth_uri": "https://accounts.google.com/o/oauth2/auth",
       "token_uri": "https://oauth2.googleapis.com/token",
       "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
       "client_secret": "YOUR_CLIENT_SECRET",
       "redirect_uris": ["http://localhost:3001/youtube/callback"]
     }
   }
   ```

## Step 4: Test the Connection

1. Start the application:

   ```bash
   docker-compose up -d
   ```

2. Go to Settings in the web app
3. Click "Connect YouTube Account"
4. You should be redirected to Google's OAuth page
5. Authorize the application
6. You'll be redirected back to the app

## Troubleshooting

### Error: redirect_uri_mismatch

- **Solution**: Make sure the redirect URI in Google Cloud Console exactly matches:
  - `http://localhost:3001/youtube/callback`
  - Check for typos, trailing slashes, or protocol mismatches (http vs https)

### Error: Invalid client

- **Solution**: Verify `client_secrets.json` is in the project root and contains correct credentials

### Error: Access blocked

- **Solution**:
  - If app is in testing mode, add your Google account as a test user
  - Or publish the app (requires verification for sensitive scopes)

## Production Setup

For production, you'll need to:

1. Add production redirect URIs in Google Cloud Console:

   - `https://yourdomain.com/youtube/callback`

2. Update the OAuth consent screen:

   - Add your domain
   - Submit for verification if using sensitive scopes

3. Update environment variables:
   - Set `CORS_ORIGINS` to your production frontend URL
   - Ensure `client_secrets.json` contains production redirect URIs
