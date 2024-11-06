const { BlobServiceClient } = require("@azure/storage-blob");
const axios = require("axios");
const dotenv = require('dotenv');
const Category = require("../../models/Category");
const HotNew = require("../../models/HotNew");
const { AZURE_BLOB_URL } = require("../../config/utils");
dotenv.config();

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

async function getOrCreateContainer(containerName) {
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const exists = await containerClient.exists();
    if (!exists) {
        await containerClient.create();
        console.log(`Container "${containerName}" created.`);
    } else {
        console.log(`Container "${containerName}" already exists.`);
    }

    await containerClient.setAccessPolicy('blob');

    return containerClient;
}

async function uploadImageToAzure(containerClient, imageUrl, blobName) {
    try {
        const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const imageData = response.data;

        const extension = imageUrl.split('.').pop().toLowerCase();
        let contentType = "image/png";
        
        if (extension === "jpg" || extension === "jpeg") {
            contentType = "image/jpeg";
        }

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        const options = {
            blobHTTPHeaders: {
                blobContentType: contentType
            }
        };

        await blockBlobClient.uploadData(imageData, options);

        console.log(`Image uploaded successfully: ${blobName}, URL: ${blockBlobClient.url}`);
        return blockBlobClient.url;
    } catch (error) {
        console.error("Error uploading image:", error.message);
        throw error;
    }
}


async function uploadAllImagesToAzure() {
    const categories = await Category.find().lean();
    const hotnewItems = await HotNew.find().lean();

    for (const category of categories) {
        const containerClient = await getOrCreateContainer(`category-${category._id}`);

        if (category.coverImage && !category.coverImage.startsWith(AZURE_BLOB_URL)) {
            const blobName = `cover-${new Date().getTime()}`;
            const newImageUrl = await uploadImageToAzure(containerClient, category.coverImage, blobName);
            await Category.updateOne({ _id: category._id }, { coverImage: newImageUrl, oldCoverImage: category.coverImage });
        }

        for (const image of category.images) {
            if (image.url && !image.url.startsWith(AZURE_BLOB_URL)) {
                const blobName = `image-${image.id}-${new Date().getTime()}`;
                const newImageUrl = await uploadImageToAzure(containerClient, image.url, blobName);
                await Category.updateOne(
                    { _id: category._id, "images._id": image._id },
                    { $set: { "images.$.url": newImageUrl, "images.$.oldUrl": image.url } }
                );
            }
        }
    }

    const hotnewContainer = await getOrCreateContainer("hotnew");
    for (const item of hotnewItems) {
        if (item.url && !item.url.startsWith(AZURE_BLOB_URL)) {
            const blobName = `${item.tag}-${item.id}-${new Date().getTime()}`;
            const newImageUrl = await uploadImageToAzure(hotnewContainer, item.url, blobName);
            await HotNew.updateOne({ _id: item._id }, { url: newImageUrl, oldUrl: item.url });
        }
    }

    console.log("All images processed, uploaded to separate containers, and URLs updated.");
}

module.exports = {
    uploadAllImagesToAzure
};
