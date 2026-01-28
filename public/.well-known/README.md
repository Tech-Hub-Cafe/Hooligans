# Apple Pay Domain Verification File

This directory should contain the Apple Pay domain verification file.

## How to Get the File

1. Go to [Square Developer Console](https://developer.squareup.com/apps)
2. Select your application
3. Navigate to **Apple Pay** in the left sidebar
4. Click **Add Sandbox Domain** (for testing) or **Add Domain** (for production)
5. Enter your domain: `www.hooligans.net.au` (or `hooligans.net.au` without www)
6. Square will generate a domain verification file
7. Download the file (it should be named `apple-developer-merchantid-domain-association`)
8. Place it in this directory: `public/.well-known/apple-developer-merchantid-domain-association`

## Important Notes

- The file must be accessible at: `https://www.hooligans.net.au/.well-known/apple-developer-merchantid-domain-association`
- The file must NOT have any file extension (no `.txt`, `.json`, etc.)
- The file must be served with the correct Content-Type header (Square/Apple will handle this)
- After placing the file, deploy your site and verify it's accessible at the URL above

## Verification

After deploying, test the file is accessible by visiting:
- `https://www.hooligans.net.au/.well-known/apple-developer-merchantid-domain-association`

You should see the file contents (not a 404 error).
