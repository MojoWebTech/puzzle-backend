const express = require('express');
const router = express.Router();
const {swapFace} = require('../data/api-calls');
const User = require('../models/User');
const Category = require('../models/Category'); 
require('dotenv').config()


const getDetails = async (asid) => {
    const response = await fetch(`https://graph.fb.gg/v20.0/${asid}?fields=picture,name&access_token=${process.env.ACCESS_TOKEN}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
  
    const data = await response.json();
    const profile_url = data?.picture?.data?.url || null;
    const name = data?.name || null;
    return {name, profile_url};
  };
  

router.post('/', async(req, res) => {
    const {asid, image} = req.body;
    const image_url = image?.url;

    const {name, profile_url} = await getDetails(asid);  
    if (!profile_url) return "error";
  
    const resultUrl = await swapFace(profile_url, image_url);
    const response = {
        resultUrl: resultUrl
    };

    if(resultUrl=="error")
    {
        res.status(200).json(response);
    }
    
    let user = await User.findOne({ asid });
    if (!user) 
    {
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
    if (category) 
    {
        const categoryImage = category.images.find(img => img.key === image.key);
        if (categoryImage) 
        {
            categoryImage.swap_count = (categoryImage.swap_count || 0) + 1;
        }
        await category.save();
    }

    res.status(200).json(response);
});

module.exports = router;