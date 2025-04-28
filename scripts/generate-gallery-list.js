const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
// Point to the correct directory containing the desired media
const mediaBaseDir = path.join(publicDir, 'coming-soon');
const outputFile = path.join(process.cwd(), 'lib', 'gallery-items.json'); // Output file in lib

// Helper function to recursively get files relative to their base directory
const getFilesRecursively = (dir, baseDir) => {
  let files = [];
  try {
    if (!fs.existsSync(dir)) {
      console.warn(`Directory not found during build script: ${dir}`);
      return files;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getFilesRecursively(fullPath, baseDir));
      } else {
        // Get path relative to the specific base (images-ai or videos-ai)
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        files.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir} in build script:`, error);
  }
  return files;
};

console.log(`Generating gallery item list from ${mediaBaseDir}...`);

// Get all relevant files from the single directory
const mediaFiles = getFilesRecursively(mediaBaseDir, mediaBaseDir);

const imageFiles = mediaFiles
  .filter(file => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file))
  .map(file => `/coming-soon/${file}`); // Use correct public path segment

// Exclude videos for now
// const videoFiles = mediaFiles
//   .filter(file => /\.(mp4|webm|ogg)$/i.test(file))
//   .map(file => `/coming-soon/${file}`); // Use correct public path segment

let allItems = [
  ...imageFiles.map((url, index) => ({ id: `img-${index}-${path.basename(url)}`, type: 'image', url })),
  // ...videoFiles.map((url, index) => ({ id: `vid-${index}-${path.basename(url)}`, type: 'video', url })), // Videos excluded
];

// Shuffle the array
for (let i = allItems.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
}

// Limit the number of items
const MAX_GALLERY_ITEMS = 50; // Keep the limit consistent
const limitedItems = allItems.slice(0, MAX_GALLERY_ITEMS);

try {
  // Ensure lib directory exists
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  // Write the JSON file
  fs.writeFileSync(outputFile, JSON.stringify(limitedItems, null, 2));
  console.log(`Successfully generated ${limitedItems.length} gallery items to ${outputFile}`);
} catch (error) {
  console.error(`Error writing gallery items JSON file:`, error);
  process.exit(1); // Exit with error code
}
