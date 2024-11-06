const { S3 } = require('@aws-sdk/client-s3');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const HotNew = require('../models/HotNew');
const dotenv = require('dotenv');

dotenv.config();

const BUCKET_NAME = process.env.BUCKET_NAME;
const REGION = process.env.REGION;
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

const s3 = new S3({
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  region: REGION,
});

const fetchS3ImageKeys = async () => {
  let imageKeys = [];
  let continuationToken;

  do {
    const params = {
      Bucket: BUCKET_NAME,
      ContinuationToken: continuationToken,
    };
    const response = await s3.listObjectsV2(params);
    continuationToken = response.NextContinuationToken;

    imageKeys = [
      ...imageKeys,
      ...response.Contents.map((content) => ({
        key: content.Key,
        url: `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${content.Key}`,
      })),
    ];
  } while (continuationToken);

  return imageKeys;
};

const updateImageUrlsInDb = async () => {
  try {
    const s3ImageKeys = await fetchS3ImageKeys();
    const categories = await Category.find({});
    const hotNewImages = await HotNew.find({});

    for (const category of categories) {
      for (const image of category.images) {
        const s3Image = s3ImageKeys.find((s3Image) =>
          s3Image.key.includes(image.key)
        );
        if (s3Image) {
          image.url = s3Image.url;
          console.log(`Updating URL for image key: ${image.key}`);
        }
      }

      const coverImageS3 = s3ImageKeys.find((s3Image) =>
        s3Image.key.includes(category.categoryKey)
      );
      if (coverImageS3) {
        category.coverImage = coverImageS3.url;
        console.log(`Updating coverImage URL for category: ${category.categoryKey}`);
      }

      await category.save();
      console.log(`Updated URLs for category: ${category.categoryKey}`);
    }

    for (const hotNewImage of hotNewImages) {
      const s3HotNewImage = s3ImageKeys.find((s3Image) =>
        s3Image.key.includes(hotNewImage.key)
      );

      if (s3HotNewImage) {
        hotNewImage.url = s3HotNewImage.url;
        await hotNewImage.save();
        console.log(`Updated URL for HotNew image key: ${hotNewImage.key}`);
      }
    }

    console.log("All image URLs updated in MongoDB successfully.");
  } catch (error) {
    console.error("Error updating image URLs:", error);
  } finally {
    mongoose.connection.close();
  }
};

module.exports = {
  updateImageUrlsInDb
};
