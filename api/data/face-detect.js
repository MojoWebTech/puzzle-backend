process.env.TF_CPP_MIN_LOG_LEVEL = '2';


// require('@tensorflow/tfjs-node');
require('@tensorflow/tfjs');
const canvas = require('canvas');
// const tf = require('@tensorflow/tfjs-node')
const tf = require('@tensorflow/tfjs');
const faceapi = require('@vladmandic/face-api');const path = require('path');

// import face from '../../public/models' 

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });


async function loadModels() {
  const modelPath = path.join(__dirname, '../../public/models');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
}

async function detectFacesInImageUrl(imageUrl) {
  try {
    // const fetch = (await import('node-fetch')).default;
    await loadModels();
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const img = new Image();
    img.src = buffer;

    // const canvasImage = faceapi.createCanvasFromMedia(img);
    const detections = await faceapi.detectAllFaces(img);
    
    return detections.length;

  } catch (error) {
    console.error('Error detecting faces:', error);
    throw error;
  }
}

module.exports = {detectFacesInImageUrl};
