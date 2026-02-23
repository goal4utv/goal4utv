import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup for ES Modules (Vite default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace this with your actual custom domain if you buy one later!
const DOMAIN = 'https://goal4utv.netlify.app'; 
const LEAGUES = ['EPL', 'ESP', 'ITSA', 'DEB', 'FRL1','UCL'];
const RAW_GITHUB_URL = 'https://raw.githubusercontent.com/gowrapavan/shortsdata/main/matches';

async function generateSitemap() {
  console.log('🌍 Generating dynamic sitemap...');
  
  // Start the XML file
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Add your static core pages
  const staticPages = ['/', '/profile', '/login', '/register'];
  for (const route of staticPages) {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${DOMAIN}${route}</loc>\n`;
    sitemap += `    <priority>${route === '/' ? '1.0' : '0.8'}</priority>\n`;
    sitemap += `    <changefreq>daily</changefreq>\n`;
    sitemap += `  </url>\n`;
  }

  // 2. Fetch matches and create a unique URL for every single game
  let matchCount = 0;
  
  for (const league of LEAGUES) {
    try {
      const response = await fetch(`${RAW_GITHUB_URL}/${league}.json`);
      if (response.ok) {
        const matches = await response.json();
        
        for (const match of matches) {
          if (match.GameId) {
            matchCount++;
            sitemap += `  <url>\n`;
            sitemap += `    <loc>${DOMAIN}/match/${match.GameId}</loc>\n`;
            sitemap += `    <priority>0.9</priority>\n`;
            sitemap += `    <changefreq>hourly</changefreq>\n`;
            sitemap += `  </url>\n`;
          }
        }
      }
    } catch (error) {
      console.error(`🚨 Failed to fetch matches for ${league}:`, error);
    }
  }

  // Close the XML file
  sitemap += `</urlset>`;

  // 3. Write it directly to the public folder so Vite serves it
  const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, sitemap);
  
  console.log(`✅ Sitemap successfully generated with ${staticPages.length} core pages and ${matchCount} match pages!`);
}

generateSitemap();