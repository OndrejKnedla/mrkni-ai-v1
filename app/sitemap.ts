import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/config' // Import siteConfig for the base URL

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url

  // List of public static routes to include in the sitemap
  // Pages requiring login (e.g., /gallery, /video, /subscription) are excluded
  const staticRoutes = [
    '/',
    '/ai-models',
    '/terms-of-service',
    '/privacy-policy',
    '/cookie-policy',
    '/gdpr',
    '/how-to-work',
    '/welcome', // Added the welcome page
    // Add other public static routes here if any (e.g., /about, /contact)
  ]

  const sitemapEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route === '/' ? '' : route}`, // Handle base URL correctly for root path
    lastModified: new Date(), // Use current date as last modified
    changeFrequency: 'monthly', // Adjust frequency based on how often content changes
    priority: route === '/' ? 1 : 0.8, // Give homepage higher priority
  }))

  // --- Optional: Add Dynamic Routes ---
  // If you have dynamic public pages (e.g., public model detail pages), generate their URLs here.
  // Example for public image model pages (assuming they exist at /models/image/[id]):
  /*
  const publicImageModels = modelConfig.models.map((model) => {
    const modelPart = model.id.split('/').pop() || model.id;
    return {
      url: `${baseUrl}/models/image/${encodeURIComponent(modelPart)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    };
  });
  sitemapEntries.push(...publicImageModels);
  */

  // Example for public video model pages (assuming they exist at /models/video/[id]):
  /*
  const publicVideoModels = videoModels.map((model) => {
     const modelPart = model.id.split('/').pop() || model.id;
     return {
       url: `${baseUrl}/models/video/${encodeURIComponent(modelPart)}`,
       lastModified: new Date(),
       changeFrequency: 'weekly',
       priority: 0.7,
     };
   });
  sitemapEntries.push(...publicVideoModels);
  */

  return sitemapEntries
}
