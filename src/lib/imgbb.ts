// Replace with your actual ImgBB API key
const IMG_BB_API_KEY = "3b6f5336f726dec2bc9cc5f6cbf88f07";

export const uploadToImgBB = async (file: File): Promise<string> => {
  if (!IMG_BB_API_KEY) {
    throw new Error('IMG_BB_API_KEY is not configured');
  }

  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', IMG_BB_API_KEY);

  try {
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.data.url;
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    throw error;
  }
};
