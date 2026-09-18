const fs = require('fs');

async function test() {
  const fileId = "testfile_" + Date.now() + ".bin";
  const formData = new FormData();
  
  // Create a tiny text file as a blob
  const fileBlob = new Blob(["hello world"], { type: "application/octet-stream" });
  formData.append("file", fileBlob, fileId);
  formData.append("upload_preset", "cghc6hcu");

  console.log("Uploading...");
  const uploadRes = await fetch("https://api.cloudinary.com/v1_1/rchak3gv/raw/upload", {
    method: "POST",
    body: formData
  });
  
  console.log("Upload Status:", uploadRes.status);
  const uploadData = await uploadRes.json();
  console.log("Upload Response:", uploadData);
  
  if (uploadData.secure_url) {
    console.log("Downloading from:", uploadData.secure_url);
    const dlRes = await fetch(uploadData.secure_url);
    console.log("Download Status:", dlRes.status);
    console.log("Download Text:", await dlRes.text());
  }
}
test();
