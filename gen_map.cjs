const Jimp = require('jimp');

async function run() {
  try {
    // Download and load a reliable earth mask (white ocean, black land, or vice-versa)
    const image = await Jimp.read('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg');
    
    // Resize to 256x128 for a highly detailed mask
    image.resize(256, 128);
    image.greyscale();
    
    const w = 256;
    const h = 128;
    
    // We will pack 8 bits into each byte
    const bytes = [];
    let currentByte = 0;
    let bitIndex = 0;
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Specular map: water is white (255), land is black (0)
        // We want land = 1, water = 0
        const hex = image.getPixelColor(x, y);
        const rgba = Jimp.intToRGBA(hex);
        const isLand = rgba.r < 128 ? 1 : 0;
        
        currentByte = (currentByte << 1) | isLand;
        bitIndex++;
        
        if (bitIndex === 8) {
          bytes.push(currentByte);
          currentByte = 0;
          bitIndex = 0;
        }
      }
    }
    
    const buffer = Buffer.from(bytes);
    console.log("BASE64 MAP DATA:");
    console.log(buffer.toString('base64'));
  } catch (err) {
    console.error(err);
  }
}
run();
