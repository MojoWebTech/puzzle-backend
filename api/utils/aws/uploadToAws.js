const { Upload } = require('@aws-sdk/lib-storage');
const { S3 } = require('@aws-sdk/client-s3');
const Category = require('../../models/Category');
const HotNew = require('../../models/HotNew');
const dotenv = require('dotenv');
const { detectFacesInImageUrl } = require('../face-detect/faceDetect');
const { categorizedData } = require('../dummyData');

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

const uploadToS3 = async (fileName, fileContent) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileContent,
    ContentType: 'image/jpeg',
  };

  const upload = new Upload({
    client: s3,
    params,
  });

  upload.on('httpUploadProgress', (progress) => {
    console.log(`Uploading ${fileName}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
  });

  return (
    upload
  );
};

const fetchImageBlob = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
};

const fetchCategoryImages = async (id) => {
  const allImages = [];
  let attempts = 0;
  const seenImageKeys = new Set();

  while (allImages.length < 100 && attempts < 20) {
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
      images.map((image) => {
          if (!seenImageKeys.has(image.key)) {
          seenImageKeys.add(image.key); // Add key to the set
          allImages.push(image); // Add unique images to the array
          }
      });
      }
  }

  return allImages;
};

const extractThemeDetails = (themeId) => {

  const upperCaseThemeId = themeId.toUpperCase();
  const parts = upperCaseThemeId.split('_');
  const filteredParts = parts.filter(part => !/^\d/.test(part));

  const genders = [];

  const remainingParts = filteredParts.filter(part => {
    if (part === 'F' || part === 'FEMALE') {
      genders.push('FEMALE');
      return false;
    }
    if (part === 'M' || part === 'MALE') {
      genders.push('MALE');
      return false;
    }
    if (part === 'G') {
      genders.push('FEMALE', 'MALE');
      return false;
    }
    return true;
  });
  
  const themeName = remainingParts.join(' ').trim();
  return {
    themeName,
    genders: [...new Set(genders)] 
  };
};

const fetchHotNew = async (title) => {
  try {
    const response = await fetch(`https://api.thebetter.ai/api/v1/home/images/${title}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
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
      const existingCategory = await Category.findOne({ categoryKey });
      // Determine the new image ID based on the number of existing images
      const imageId = existingCategory ? existingCategory.images.length : 0;

      const face_count = item?.multi_face ? 2 : await detectFacesInImageUrl(uploadedImageUrl);

      const imageObject = {
        id: imageId, 
        key: item.key,
        url: uploadedImageUrl,
        tag: title, 
        theme_id: item.theme_id,
        swap_count: 0,
        face_count: face_count
      };

      let gender = '';

      if (existingCategory) {
        existingCategory.images.push(imageObject);
        await existingCategory.save();
        gender = existingCategory.gender;
        console.log(`Added new ${title} image to existing category in MongoDB: ${categoryKey}, face_count: ${face_count}`);
      } else {
        const themedetails = extractThemeDetails(categoryKey);

        const newCategory = new Category({
          themeName: themedetails.themeName,
          coverImage: uploadedImageUrl, 
          categoryKey: categoryKey,
          gender: themedetails.genders, 
          images: [imageObject],
        });
        await newCategory.save();

        gender = themedetails.genders;

        console.log(`Created new category in MongoDB and added  ${title} image: ${categoryKey}, face_count: ${face_count}`);
      }
      
      const hotNewImage = new HotNew({
        id: imageObject.id,
        url: imageObject.url,
        key: imageObject.key,
        tag: imageObject.tag,
        theme_id: imageObject.theme_id, 
        face_count: imageObject.face_count,
        swap_count: imageObject.swap_count || 0,
        gender: gender || ["MALE", "FEMALE"],
      });

      await hotNewImage.save();
    }

    console.log(`All  ${title} images processed and saved to S3 and MongoDB successfully.`);
  } catch (error) {
    console.error(`Error processing  ${title} images:`, error);
  }
};

const processAndSaveCategories = async () => {
  try{
    const categorizedImages = {...categorizedData};

    let c=5;
    while(c>0)
    {
      const response = await fetch('https://api.thebetter.ai/api/v1/fb/themes/v2?page=2&version=1&lang=en', {
        mode:'cors',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJQRS1KU1FMSkgiLCJhdWQiOiJhaS1qaWdzYXciLCJwcm92aWRlciI6InV1aWQiLCJpc3MiOiJhaS1qaWdzYXciLCJleHAiOjIwMzg2NTQ3OTMsImlhdCI6MTcyMzI5NDc5M30.OEeMdVD87ppXyX9yenopQ6GqMxYfVcaP_pEQH_wycmOxcB8VDql8w6LalZI87bg1d1rL2ss4Cvllysr38xcid_RVThilm9nKHwVnS1fce9FzZXlFyNIwtEysqNx7jK6vQubLqTi2TgacURHYvbn2VdP7EdLOzIMtJqAWbfRFoPs',
          'x-app-id': 'ai-jigsaw'
        }
      });
      const responseData = await response.json(); 
      responseData?.data?.list.map((item) => {
        categorizedImages[item?.theme_id] = {
          themeName: item?.name,
          coverImage: item?.cover,
          images: [] 
        };
      });
      c--;  
    }

    for (const categoryKey in categorizedImages) {
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      if (categorizedImages.hasOwnProperty(categoryKey)) {

        const existingCategory = await Category.findOne({ categoryKey });
        
        if (existingCategory && existingCategory.images.length>20) {
          console.log("\nRepeat\n")
          continue;
        }

        const categoryData = categorizedImages[categoryKey];
        console.log(`Processing category: ${categoryKey}`);

        const images = await fetchCategoryImages(categoryKey);

        const coverImageBlob = await fetchImageBlob(categoryData.coverImage);
        const coverImageName = `${categoryKey}/cover`;
        const coverImageUploadResponse = await uploadToS3(coverImageName, coverImageBlob);
        const coverImageUrl = coverImageUploadResponse.Location;

        const processedImages = [];
        let imageId = 0;

        for (const image of images) {
          console.log(`Processing image: ${image.key}`);

          const imageBlob = await fetchImageBlob(image.thn_url);
          const imageName = image.key || `${categoryKey}/${image.key}`;
          const imageUploadResponse = await uploadToS3(imageName, imageBlob);
          const imageUrl = imageUploadResponse.Location;
          
          const face_count = image?.multi_face ? 2 : await detectFacesInImageUrl(imageUrl);

          processedImages.push({
            id: imageId++,
            key: image.key,
            url: imageUrl,
            theme_id: image.theme_id,
            face_count: face_count
          });

          console.log(`Image uploaded: ${imageName}, face_count: ${face_count}`);
        }

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Save to MongoDB
        if (existingCategory) {
          // Append new images
          existingCategory.images.push(...processedImages);
          await existingCategory.save();
          console.log(`Updated existing category in MongoDB: ${categoryKey}`);
        } else {
          // Create new category
          const themedetails = extractThemeDetails(categoryKey);

          const newCategory = new Category({
            themeName: categoryData.themeName,
            coverImage: coverImageUrl,
            categoryKey: categoryKey,
            gender: themedetails.genders || ["MALE", "FEMALE"],
            images: processedImages,
          });

          await newCategory.save();

          console.log(`Created new category in MongoDB: ${categoryKey}`);
        }
      }
    }

    console.log('All categories and images processed and saved to MongoDB successfully.');
    
    console.log("\n\nFetching hotnew");
    await fetchHotNew('hotnew');

    console.log("\n\nFetching banner");
    await fetchHotNew('banner');
  
  }
  catch (error) {
    console.error('Error processing and saving categories:', error);
  }
};



async function filterAndSaveHotNewImages() {
  try {
    const categories = await Category.find({});

    for (const category of categories) {
      for (const image of category.images) {
        if (image.tag === 'banner' || image.tag === 'hotnew') {

          const hotNewImage = new HotNew({
            id: image.id,
            url: image.url,
            key: image.key,
            tag: image.tag,
            theme_id: image.theme_id, 
            face_count: image.face_count,
            swap_count: image.swap_count || 0,
            gender: category.gender || ["MALE", "FEMALE"],
          });

          await hotNewImage.save();
        }
      }
    }
    console.log('Filtered images have been saved to HotNew schema.');
  } catch (error) {
    console.error('Error filtering and saving images:', error);
  }
}

async function updateImageGender() {
  try {
    const categories = await Category.find({});

    for (const category of categories) {
      for (const image of category.images) {
        image.gender = category.gender;
      }

      await category.save();
    }

    console.log('Image genders updated successfully.');
  } catch (error) {
    console.error('Error updating image genders:', error);
  }
}


module.exports = {
  processAndSaveCategories,
  updateImageGender,
};
