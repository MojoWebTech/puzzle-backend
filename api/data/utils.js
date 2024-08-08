const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const dotenv = require('dotenv');

dotenv.config();

const BUCKET_NAME = process.env.BUCKET_NAME;
const REGION = process.env.REGION;
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

// Configure AWS SDK with your credentials
AWS.config.update({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_KEY,
  region: REGION,
});

const s3 = new AWS.S3();

const uploadToS3 = async (fileName, fileContent) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileContent,
    ContentType: 'image/jpeg',
  };

  const upload = s3.upload(params);

  upload.on('httpUploadProgress', (progress) => {
    console.log(`Uploading ${fileName}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
  });

  return upload.promise();
};

const fetchImageBlob = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
};
  
const fetchCategoryImages = async (id) => {
  let allImages = [];
  let attempts = 0;
  const seenImageKeys = new Set();

  while (allImages.length < 50 && attempts < 3) {
      attempts++;
      const response = await fetch(`https://api.thebetter.ai/api/v1/theme/images?theme_id=${id}`, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
      },
      });
      const data = await response.json();
      const images = data?.data;

      if (images) {
      images.forEach((image) => {
          if (!seenImageKeys.has(image.key)) {
          seenImageKeys.add(image.key); // Add key to the set
          allImages.push(image); // Add unique images to the array
          }
      });
      }
  }

  return allImages;
};

const fetchHotNew = async (title) => {
  try {
    const response = await fetch(`https://api.thebetter.ai/api/v1/home/images/${title}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // console.log(response);

    const data = await response.json();
    // console.log(data);
    const hotNewData = data.data.list;
    const prefixUrl = data.data.prefix_url || '';

    for (const item of hotNewData) {
      const categoryKey = item.theme_id;
      const imageKey = item.key;
      const imageUrl = `${prefixUrl}${item.thn}`;
      const tag = title;

      // Fetch the image blob
      const imageBlob = await fetchImageBlob(imageUrl);
      const imageName = imageKey || `${categoryKey}/${imageKey}`;

      // Upload the image to S3
      const imageUploadResponse = await uploadToS3(imageName, imageBlob);
      const uploadedImageUrl = imageUploadResponse.Location;

      // Fetch existing category from MongoDB
      let existingCategory = await Category.findOne({ categoryKey });

      // Determine the new image ID based on the number of existing images
      let imageId = existingCategory ? existingCategory.images.length : 0;

      const imageObject = {
        id: imageId, // Set the ID based on the number of images already in the category
        key: item.key,
        url: uploadedImageUrl,
        tag: title, // Add the tag if available
        theme_id: item.theme_id
      };

      if (existingCategory) {
        // Add the new image to the existing category
        existingCategory.images.push(imageObject);
        await existingCategory.save();
        console.log(`Added new hotnew image to existing category in MongoDB: ${categoryKey}`);
      } else {
        // Create a new category if it doesn't exist
        const newCategory = new Category({
          themeName: categoryKey, // You can fetch the actual theme name if needed
          coverImage: uploadedImageUrl, // Set the first image as cover if it's a new category
          categoryKey: categoryKey,
          gender: ["MALE", "FEMALE"], // Default genders, adjust based on actual data
          images: [imageObject],
        });

        await newCategory.save();
        console.log(`Created new category in MongoDB and added hotnew image: ${categoryKey}`);
      }
    }

    console.log('All hotnew images processed and saved to S3 and MongoDB successfully.');
  } catch (error) {
    console.error('Error processing hotnew images:', error);
  }
};

const processAndSaveCategories = async (categorizedImages) => {
  try{
    // for (const categoryKey in categorizedImages) {
    //   if (categorizedImages.hasOwnProperty(categoryKey)) {
    //     const categoryData = categorizedImages[categoryKey];
    //     console.log(`Processing category: ${categoryKey}`);

    //     // Fetch the images for the category
    //     const images = await fetchCategoryImages(categoryKey);

    //     // Upload the cover image to S3
    //     const coverImageBlob = await fetchImageBlob(categoryData.coverImage);
    //     const coverImageName = `${categoryKey}/cover`;

    //     const coverImageUploadResponse = await uploadToS3(coverImageName, coverImageBlob);
    //     const coverImageUrl = coverImageUploadResponse.Location;

    //     // Process and upload each image
    //     let processedImages = [];
    //     let imageId = 0;

    //     for (const image of images) {
    //       console.log(`Processing image: ${image.key}`);

    //       const imageBlob = await fetchImageBlob(image.thn_url);
    //       const imageName = image.key || `${categoryKey}/${image.key}`;

    //       const imageUploadResponse = await uploadToS3(imageName, imageBlob);
    //       const imageUrl = imageUploadResponse.Location;

    //       processedImages.push({
    //         id: imageId++,
    //         key: image.key,
    //         url: imageUrl,
    //         theme_id: image.theme_id
    //       });

    //       console.log(`Image uploaded: ${imageName}`);
    //     }

    //     // Save to MongoDB
    //     const existingCategory = await Category.findOne({ categoryKey });

    //     if (existingCategory) {
    //       // Update existing category
    //       existingCategory.themeName = categoryData.themeName;
    //       existingCategory.coverImage = coverImageUrl;
    //       existingCategory.gender = categoryData.gender || ["MALE", "FEMALE"];

    //       // Append new images
    //       existingCategory.images.push(...processedImages);
    //       await existingCategory.save();

    //       console.log(`Updated existing category in MongoDB: ${categoryKey}`);
    //     } else {
    //       // Create new category
    //       const newCategory = new Category({
    //         themeName: categoryData.themeName,
    //         coverImage: coverImageUrl,
    //         categoryKey: categoryKey,
    //         gender: categoryData.gender || ["MALE", "FEMALE"],
    //         images: processedImages,
    //       });

    //       await newCategory.save();

    //       console.log(`Created new category in MongoDB: ${categoryKey}`);
    //     }
    //   }
    // }
    // console.log('All categories and images processed and saved to MongoDB successfully.');
    console.log("\n\nFetching hotnew");
    await fetchHotNew('hotnew');
    console.log("\n\nFetching banner");
    await fetchHotNew('banner');
  
  }
  catch (error) {
    console.error('Error processing and saving categories:', error);
  }
};

module.exports = {
  processAndSaveCategories,
};
