# Open Graph Images Setup Guide

## Overview

This application generates custom Open Graph (OG) images for workout summaries and routines to display when links are shared on social media platforms like Messages, WhatsApp, Twitter, etc.

## How It Works

1. **Client-side Generation**: When a workout is completed or a routine is edited, a custom OG image is generated in the browser using HTML Canvas
2. **Storage**: The image is uploaded to Supabase Storage in the `og-images` bucket
3. **Database**: The public URL is saved to `workouts.og_image_url` or `routines.og_image_url`
4. **Serving**: When social media crawlers request the link, the server returns HTML with meta tags pointing to the stored image

## Supabase Storage Configuration

For OG images to work properly, the `og-images` bucket must be configured to allow public access.

### Verify Bucket Configuration

1. **Log into Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Look for the `og-images` bucket

3. **Check Public Access**
   - Click on the `og-images` bucket
   - Look for a "Public" badge or setting
   - If the bucket is not public, images will not be accessible to social media crawlers

### Make Bucket Public

If the bucket is not public:

1. Click on the `og-images` bucket
2. Click the settings/configuration icon
3. Enable "Public bucket" option
4. Save changes

### Alternative: Configure Public Access Policy

Instead of making the entire bucket public, you can create a policy:

1. Go to Storage → Policies
2. Create a new policy for the `og-images` bucket
3. Add a policy that allows public SELECT (read) access:

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'og-images');
```

## Testing

### Test Image Generation

1. Complete a workout or edit a routine
2. Check the browser console for OG image generation logs
3. Verify the image was uploaded to Supabase Storage
4. Check that `og_image_url` was saved to the database

### Test Social Media Preview

1. Share a workout or routine link
2. Check server logs for bot detection:
   ```
   [public-page] { type, id, isBot, userAgent }
   [public-page] Routine/Workout OG image: { hasCustomImage, ogImageUrl }
   ```
3. Check OG image API logs:
   ```
   [OG] Found custom image for workout/routine: id, url
   ```

### Test with Link Preview Tools

Use these tools to validate OG tags:
- **Facebook Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

### Manual Test URLs

To force bot mode for testing, add `?og=true` to workout URLs (if implemented).

Example test:
```
https://www.swiper.fit/history/public/workout/[workout-id]
https://www.swiper.fit/routines/public/[routine-id]
```

## Troubleshooting

### Images Not Showing

1. **Check if images are being generated**
   - Look for console logs during workout completion
   - Check Supabase Storage for files in `og-images` bucket

2. **Check if bucket is public**
   - Verify bucket settings in Supabase Dashboard
   - Try accessing an image URL directly in a browser

3. **Check bot detection**
   - Review server logs for user agent detection
   - Verify `isBot` is true for social media crawlers

4. **Check API endpoint**
   - Verify `/api/og-images` returns correct URLs
   - Check for 302 redirects to image URLs

5. **Clear social media cache**
   - Most platforms cache OG data
   - Use the debugging tools above to refresh

### Common Issues

- **Default image always shows**: API endpoint not fetching from database
- **No image at all**: Bucket not public or bot detection failing
- **Old image shows**: Social media platform cache (clear with debugging tools)
- **Blank/broken image**: CORS issue or invalid URL

## Image Specifications

- **Dimensions**: 1200 x 630 pixels
- **Format**: PNG
- **File naming**: `{id}-v{version}-{timestamp}.png` or `routine-{id}-v{version}-{timestamp}.png`
- **Storage**: Supabase Storage bucket `og-images`

## API Endpoints

- **Public Page**: `/api/public-page?type=workout&id={id}` or `/api/public-page?type=routine&id={id}`
- **OG Image**: `/api/og-images?type=workout&workoutId={id}` or `/api/og-images?type=routine&routineId={id}`

## Files Modified

- `api/og-images.js` - Fetches and serves OG images
- `api/public-page.js` - Serves HTML with OG meta tags
- `src/lib/ogImageGenerator.ts` - Generates images
- `src/lib/ogImageStorage.ts` - Uploads to Supabase

