# MrkniAI Coming Soon Page Deployment Guide

This folder contains all the files needed to deploy the MrkniAI coming soon page to your live website at https://www.mrkniai.com.

## Files Overview

- `index.html` - Redirects to the welcome page
- `welcome/index.html` - The main coming soon page with countdown timer and email registration form
- `_next/` - Contains all the static assets (JavaScript, CSS, etc.)
- `public/` - Contains images, videos, and other static files
- `.htaccess` - Apache configuration file for URL routing and security
- `api/register-interest/index.php` - PHP script to handle email registration

## Deployment Instructions

### Using FTP

1. Connect to your Forpsi hosting using FTP (FileZilla or similar)
2. Navigate to the public directory of your hosting (usually `public_html` or `www`)
3. Upload all the contents of this folder to your hosting

### Important Notes

- Make sure to preserve the directory structure when uploading
- The API endpoint for email registration (`/api/register-interest`) will need to be configured on the server
- The countdown timer is set to April 21, 2025

## Testing After Deployment

After uploading the files, visit your website to ensure everything is working correctly:

1. Check that the countdown timer is working
2. Test the email registration form
3. Verify that YouTube and TikTok links work correctly
4. Test on different devices and browsers

## Troubleshooting

If you encounter issues:
- Check that all files were uploaded correctly
- Ensure your domain is properly configured in Forpsi control panel
- Check the browser console for any JavaScript errors

## API Configuration

The email registration form submits to `/api/register-interest`. A simple PHP script has been included to handle this endpoint:

- `/api/register-interest/index.php` - Handles the form submission and stores emails in a CSV file

This script will create a CSV file (`interested_users.csv`) in the same directory to store the submitted email addresses. Make sure the directory has write permissions.

## Contact

If you need assistance with the deployment, please contact the development team.
