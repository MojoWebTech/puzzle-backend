const fetch = require('node-fetch');
const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/models');
}

async function detectFacesInImageUrl(imageUrl) {
  try {
    await loadModels();
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    const img = new Image();
    img.src = buffer;
    const canvasImage = faceapi.createCanvasFromMedia(img);
    const detections = await faceapi.detectAllFaces(canvasImage);
    return detections.length;

  } catch (error) {
    console.error('Error detecting faces:', error);
    throw error;
  }
}

module.exports = {detectFacesInImageUrl};
