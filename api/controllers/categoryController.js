
const { GENDER_API_URL } = require('../config/utils');
const Category = require('../models/Category');


const getGender = async (name) => {
  const response = await fetch(`${GENDER_API_URL}/${name}`, {
    method: "GET",
    headers: {
      "X-API-KEY": process.env.GENDER_API_KEY,
      "Accept": "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch gender: ${response.statusText}`);
  }
  const data = await response.json();
  return data?.likelyGender?.toUpperCase() || "MALE";
};


const cleanCategories = async (req, res) => {
  const categories = await Category.find().select('themeName coverImage categoryKey gender images');

  for (const category of categories) {
    const seenUrls = new Set();
    const uniqueImages = [];

    category.images.map((image) => {
      if (!seenUrls.has(image.url)) {
        seenUrls.add(image.url);
        uniqueImages.push(image);
      }
    });

    category.images = uniqueImages;
    await category.save();
  }

  res.status(200).json({ message: 'Duplicate images removed successfully.' });
};


const getFirstData = async (req, res) => {
  let { name, gender } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!gender) {
    try {
      gender = await getGender(name);
    } catch (error) {
      console.error("Error fetching gender:", error);
      return res.status(500).json({ message: "Failed to determine gender." });
    }
  }

  const categories = await Category.find()
    .select({ themeName: 1, coverImage: 1, categoryKey: 1, gender: 1, images: { $slice: 10 } })
    .lean();

  const sameCategories = [];
  const differentCategories = [];

  categories.map((category) => {
    if (category.gender.includes(gender)) {
      sameCategories.push(category);
    } else {
      differentCategories.push(category);
    }
  });

  const sortedCategories = [...sameCategories, ...differentCategories];

  const hotnew = await HotNew.find({
    tag: 'hotnew',
    gender: { $in: [gender] },
  });

  const banner = await HotNew.find({
    tag: 'banner',
    gender: { $in: [gender] },
  });


  res.status(200).json({
    categories: sortedCategories, 
    hotnew: hotnew,
    banner: banner,
    gender: gender
  });
};


const getCategoryImages = async (req, res) => {
  const { categoryKey } = req.params;
  const { skip = 0, limit = 10 } = req.query;

  const category = await Category.findOne({ categoryKey })
    .select({ images: { $slice: [Number.parseInt(skip), Number.parseInt(limit)] } })
    .lean();

  if (!category || !category.images.length) {
    return res.status(404).json({ error: 'Category not found or no images available.' });
  }

  res.status(200).json(category.images);
};




module.exports = { 
    cleanCategories, 
    getFirstData, 
    getCategoryImages 
};
