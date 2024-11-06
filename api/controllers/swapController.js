const User = require('../models/User');
const Category = require('../models/Category');
const { swapFace } = require('../swap/api-calls');
const { FB_GRAPH_URL } = require('../config/utils');
require('dotenv').config();


const getDetails = async (asid) => {
  try {
    const response = await fetch(`${FB_GRAPH_URL}/${asid}?fields=picture,name&access_token=${process.env.ACCESS_TOKEN}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    const profile_url = data?.picture?.data?.url || null;
    const name = data?.name || null;
    return { name, profile_url };
  } catch (error) {
    console.error("Error fetching details from Facebook API:", error);
    throw new Error("Failed to fetch user details");
  }
};


const handleFaceSwap = async (req, res) => {
  const { asid, image } = req.body;
  const image_url = image?.url;

  try {
    console.log("asid --->", asid);
    console.log("image_url --->", image_url);

    const { name, profile_url } = await getDetails(asid);
    console.log("name --->", name);
    console.log("profile_url --->", profile_url);

    if (!profile_url) {
      return res.status(400).json({ error: "Invalid profile URL" });
    }

    const resultUrl = await swapFace(profile_url, image_url);
    console.log("resultUrl --->", resultUrl);

    if (resultUrl === "error") {
      return res.status(500).json({ error: "Face swap failed" });
    }

    let user = await User.findOne({ asid });
    if (!user) {
      user = new User({
        name,
        asid,
        image_url: profile_url,
        images: [{ ...image, swap_count: 1 }]
      });
    } else {
      const existingImage = user.images.find(img => img.url === image_url);
      if (existingImage) {
        existingImage.swap_count += 1;
      } else {
        user.images.push({ ...image, swap_count: 1 });
      }
    }
    await user.save();

    const category = await Category.findOne({ categoryKey: image.theme_id });
    if (category) {
      const categoryImage = category.images.find(img => img.key === image.key);
      if (categoryImage) {
        categoryImage.swap_count = (categoryImage.swap_count || 0) + 1;
      }
      await category.save();
    }

    res.status(200).json({ resultUrl });
  } catch (error) {
    console.error('Error processing face swap:', error);
    res.status(500).json({ error: 'An error occurred while processing the face swap' });
  }
};



module.exports = { handleFaceSwap };
