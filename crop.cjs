const Jimp = require('c:\\temp_jimp_workspace\\node_modules\\jimp');

async function processLogos() {
  const basePath = 'C:\\Users\\HP\\Downloads\\improve\\public\\';
  const fullPath = basePath + 'pixelnova-logo-full.png';
  
  const img = await Jimp.read(fullPath);
  img.autocrop();
  
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  
  // Crop the top 60% for the icon mark
  const icon = img.clone().crop(0, 0, w, h * 0.65).autocrop();
  
  await icon.writeAsync(basePath + 'pixelnova-logo-icon.png');
  await icon.writeAsync(basePath + 'pixelnova-logo-navbar.png');
  await icon.writeAsync(basePath + 'pixelnova-logo-footer.png');
  
  // favicon
  const favicon = icon.clone().resize(64, Jimp.AUTO);
  await favicon.writeAsync(basePath + 'favicon.png');
  
  console.log('Cropped images created.');
}

processLogos().catch(console.error);
