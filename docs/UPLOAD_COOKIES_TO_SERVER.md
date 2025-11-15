# Upload cookies.txt to Server

The `cookies.txt` file exists on your local machine but needs to be uploaded to your DigitalOcean server.

## Quick Upload Methods

### Method 1: SCP (Secure Copy) - Recommended

From your **local machine** (Mac):

```bash
# Replace with your actual server details
scp cookies.txt root@164.90.193.41:~/youtube-viral-clipper/
```

You'll be prompted for your server password.

### Method 2: SFTP

```bash
# Connect via SFTP
sftp root@164.90.193.41

# Navigate to project directory
cd youtube-viral-clipper

# Upload the file
put cookies.txt

# Exit
exit
```

### Method 3: Direct Copy-Paste (If file is small)

1. **On your local machine**, view the file:

   ```bash
   cat cookies.txt
   ```

2. **Copy the entire content**

3. **On the server**, create the file:

   ```bash
   nano ~/youtube-viral-clipper/cookies.txt
   ```

4. **Paste the content** (right-click or Cmd+V)
5. **Save**: Ctrl+X, then Y, then Enter

### Method 4: Using Git (If you have a private repo)

**Note:** Only do this if you have a private repository and cookies.txt is in .gitignore (which it should be).

```bash
# On local machine
git add cookies.txt
git commit -m "Add cookies (temporary)"
git push

# On server
git pull
```

**Then immediately remove it from git:**

```bash
git rm --cached cookies.txt
git commit -m "Remove cookies from git"
git push
```

## Verify Upload

After uploading, verify on the server:

```bash
# Check file exists
ls -la ~/youtube-viral-clipper/cookies.txt

# Check file content (first few lines)
head -n 5 ~/youtube-viral-clipper/cookies.txt

# Should show: # Netscape HTTP Cookie File
```

## Restart Backend

After uploading:

```bash
docker-compose restart backend
```

## Verify in Container

Check that the file is accessible inside the container:

```bash
docker-compose exec backend ls -la /app/cookies.txt
docker-compose exec backend head -n 3 /app/cookies.txt
```

## Troubleshooting

**File still not found in container?**

- Make sure you're in the project root directory on the server
- Check the volume mount in docker-compose.yml: `./cookies.txt:/app/cookies.txt:ro`
- The file must be in the same directory as docker-compose.yml

**Permission denied?**

```bash
chmod 644 cookies.txt
```

**File too large?**

- The cookies.txt file can be large (1000+ lines is normal)
- Make sure you're uploading the complete file
