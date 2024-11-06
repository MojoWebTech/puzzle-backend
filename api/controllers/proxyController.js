const sharp = require('sharp');

const convertImageToBase64 = async (req, res) => {
  const { imageUrl } = req.body;

  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let base64Image;
    if (response.headers.get('content-type') === 'image/webp') {
      const jpgBuffer = await sharp(buffer).jpeg().toBuffer();
      base64Image = `data:image/jpeg;base64,${jpgBuffer.toString('base64')}`;
    } else {
      base64Image = `data:${response.headers.get('content-type')};base64,${buffer.toString('base64')}`;
    }

    res.json({ base64Image });
  } catch (error) {
    console.error('Error fetching or converting image:', error);
    res.status(500).json({ error: 'Failed to fetch or convert image' });
  }
};


module.exports = { convertImageToBase64 };
