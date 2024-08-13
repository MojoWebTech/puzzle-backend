const dotenv = require('dotenv');

dotenv.config();

// Function to convert an ArrayBuffer to base64
const convertArrayBufferToBase64 = (arrayBuffer) => {
  return Buffer.from(arrayBuffer).toString('base64');
};

// Fetch and convert image to base64
const fetchImageAndConvertToBase64 = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    return convertArrayBufferToBase64(arrayBuffer);
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
};


const HuggingfaceModel_Felix_Fetch = async (targetUrl, sourceUrl) => {
  const url = 'https://felixrosberg-face-swap.hf.space/';

  const data = {
    data: [
      { "path": targetUrl },
      { "path": sourceUrl },
      0,
      0,
      []
    ]
  };

  const response = await fetch(`${url}call/run_inference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const jsonResponse = await response.json();
  const event_id = jsonResponse?.event_id;

  const eventResponse = await fetch(`${url}call/run_inference/${event_id}`, {
    method: 'GET',
  });

  const reader = eventResponse.body.getReader();
  
  const parseEventData = (str) => {
    const lines = str.split('\n');
    const eventLine = lines[0];
    const dataLine = lines[1];

    if (eventLine && dataLine) {
      const event = eventLine.replace('event:', '').trim();
      const data = JSON.parse(dataLine.replace('data:', '').trim());
      return { event, data };
    }
  };

  const readStream = async (reader) => {
    let decoder = new TextDecoder("utf-8");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: !done });
      const { event, data } = parseEventData(chunk);
      if (event !== 'generating') {
        if (event === 'error') return 'error';
        if (event === 'complete') {
          const path = data[0]?.path;
          return path ? `${url}file=${path}` : 'error';
        }
      }
    }
  };

  return readStream(reader);
};

const HuggingfaceModel_Mkrzyzan_Fetch = async (targetUrl, sourceUrl) => {
  const url = 'https://mkrzyzan-face-swap.hf.space/';

  const data = {
    data: [
      { "path": sourceFileUrl },
      1,
      { "path": targetFileUrl },
      1
    ]
  };

  const response = await fetch(`${url}call/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const jsonResponse = await response.json();
  const event_id = jsonResponse?.event_id;

  const eventResponse = await fetch(`${url}call/predict/${event_id}`, {
    method: 'GET',
  });

  const reader = eventResponse.body.getReader();
  
  const parseEventData = (str) => {
    const lines = str.split('\n');
    const eventLine = lines[0];
    const dataLine = lines[1];

    if (eventLine && dataLine) {
      const event = eventLine.replace('event:', '').trim();
      const data = JSON.parse(dataLine.replace('data:', '').trim());
      return { event, data };
    }
  };

  const readStream = async (reader) => {
    let decoder = new TextDecoder("utf-8");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: !done });
      const { event, data } = parseEventData(chunk);
      if (event !== 'generating') {
        if (event === 'error') return 'error';
        if (event === 'complete') {
          const path = data[0]?.path;
          return path ? `${url}file=${path}` : 'error';
        }
      }
    }
  };

  return readStream(reader);
};

const HuggingfaceModel_Prithiv_Fetch = async (targetUrl, sourceUrl) => {
  const url = 'https://prithivmlmods-face-swap-roop.hf.space/';

  const data = {
    data: [
      { "path": sourceUrl },
      { "path": targetUrl },
      false
    ]
  };

  const response = await fetch(`${url}call/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const jsonResponse = await response.json();
  const event_id = jsonResponse?.event_id;

  const eventResponse = await fetch(`${url}call/predict/${event_id}`, {
    method: 'GET',
  });

  const reader = eventResponse.body.getReader();
  
  const parseEventData = (str) => {
    const lines = str.split('\n');
    const eventLine = lines[0];
    const dataLine = lines[1];

    if (eventLine && dataLine) {
      const event = eventLine.replace('event:', '').trim();
      const data = JSON.parse(dataLine.replace('data:', '').trim());
      return { event, data };
    }
  };

  let heartbeat = 0;

  const readStream = async (reader) => {
    let decoder = new TextDecoder("utf-8");
    while (true) {
      const { done, value } = await reader.read();
      const chunk = decoder.decode(value, { stream: !done });
      const { event, data } = parseEventData(chunk);

      if (event === "error") return "error";
      if (event === "heartbeat") heartbeat++;
      if (event === "complete") {
        const path = data[0]?.path;
        return path ? `${url}file=${path}` : "error";
      }
      if (heartbeat >= 20) return "error";
    }
  };

  return readStream(reader);
};

const HuggingfaceModel_Raymoon_Fetch = async (targetUrl, sourceUrl) => {
  const targetBase64 = await fetchImageAndConvertToBase64(targetUrl);
  const sourceBase64 = await fetchImageAndConvertToBase64(sourceUrl);

  const url = 'https://raymoon123-swap-face-model2.hf.space/';

  const data = {
    data: [targetBase64, sourceBase64]
  };

  const response = await fetch(`${url}api/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) return "error";

  const jsonResponse = await response.json();
  const resultImageBase64 = jsonResponse?.data[0];

  return resultImageBase64 ? resultImageBase64 : "error";
};

const HuggingfaceModel_Musicutilist_Fetch = async (targetUrl, sourceUrl) => {
  const targetBase64 = await fetchImageAndConvertToBase64(targetUrl);
  const sourceBase64 = await fetchImageAndConvertToBase64(sourceUrl);

  const url = 'https://musicutilist-face-integr.hf.space/';

  const data = {
    data: [sourceBase64, targetBase64, false]
  };

  const response = await fetch(`${url}api/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) return "error";

  const jsonResponse = await response.json();
  const resultImageBase64 = jsonResponse?.data[0];

  return resultImageBase64 ? resultImageBase64 : "error";
};

const HuggingfaceModel_Tony_Fetch = async (targetUrl, sourceUrl) => {
  const targetBase64 = await fetchImageAndConvertToBase64(targetUrl);
  const sourceBase64 = await fetchImageAndConvertToBase64(sourceUrl);

  const url = 'https://tonyassi-face-swap.hf.space/';

  const data = {
    data: [targetBase64, sourceBase64]
  };

  const response = await fetch(`${url}api/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) return "error";

  const jsonResponse = await response.json();
  const resultImageBase64 = jsonResponse?.data[0];

  return resultImageBase64 ? resultImageBase64 : "error";
};

const useFal = async(targetUrl, sourceUrl) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Key ${process.env.FAL_KEY}`);
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    "base_image_url": targetUrl,
    "swap_image_url": sourceUrl
  });

  const response = await fetch("https://fal.run/fal-ai/face-swap", {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  })

  const data = await response.json();

  const resultUrl = data?.image?.url || "error";

  return resultUrl;
}

const getUrl = async (asid) => {
  const response = await fetch(`https://graph.fb.gg/v20.0/${asid}?fields=picture&access_token=${process.env.ACCESS_TOKEN}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const data = await response.json();
  return data?.picture?.data?.url || null;
};

const swapFace = async (asid, image_url) => {
  const sourceUrl = await getUrl(asid);
  // const sourceUrl = 'https://as1.ftcdn.net/v2/jpg/01/79/46/68/1000_F_179466839_nARiMdo6ocQWnw6X5YyecerwSYnAVb88.jpg';

  if (!sourceUrl) return "error";
  return await useFal(image_url, sourceUrl);
};

module.exports = {
  swapFace,
};
