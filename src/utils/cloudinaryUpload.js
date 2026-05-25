export const getCloudinaryUploadConfig = () => ({
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
});

export const isCloudinaryConfigured = () => {
  const { cloudName, uploadPreset } = getCloudinaryUploadConfig();
  return Boolean(cloudName && uploadPreset);
};

export const uploadToCloudinary = async (file) => {
  const { cloudName, uploadPreset } = getCloudinaryUploadConfig();

  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your frontend environment.",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || "Unable to upload image to Cloudinary.",
    );
  }

  return payload.secure_url;
};
