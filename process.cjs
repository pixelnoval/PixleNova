const Jimp = require('c:\\temp_jimp_workspace\\node_modules\\jimp');

async function processLogo() {
  try {
    const inputPath = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\ee7fefd9-3bec-442c-a977-3c8df350eca8\\.user_uploaded\\media_1788774592790.jpg';
    const outFull = 'C:\\Users\\HP\\Downloads\\improve\\public\\pixelnova-logo-full.png';

    const image = await Jimp.read(inputPath);
    const fullLogo = image.clone();

    fullLogo.scan(0, 0, fullLogo.bitmap.width, fullLogo.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];

      // Assuming gold is high in red/green and background is dark
      const threshold = 50;
      if (red < threshold && green < threshold && blue < threshold) {
        this.bitmap.data[idx + 3] = 0; // Alpha to 0
      } else {
        // Boost alpha
        this.bitmap.data[idx + 3] = 255;
      }
    });

    await fullLogo.writeAsync(outFull);
    console.log('Full logo written to', outFull);
    console.log('Dimensions:', fullLogo.bitmap.width, 'x', fullLogo.bitmap.height);
  } catch (err) {
    console.error(err);
  }
}

processLogo();
