const fs = require('fs');

async function test() {
  const fileId = "testfile_" + Date.now() + ".txt";
  const formData = new FormData();
  
  const fileBlob = new Blob(["hello txt file"], { type: "text/plain" });
  formData.append("file", fileBlob, fileId);
  formData.append("upload_preset", "cghc6hcu");

  console.log("Uploading txt...");
  const uploadRes = await fetch("https://api.cloudinary.com/v1_1/rchak3gv/raw/upload", {
    method: "POST",
    body: formData
  });
  
  const uploadData = await uploadRes.json();
  console.log("Upload Status:", uploadRes.status);
  console.log("Upload secure_url:", uploadData.secure_url);
  
  if (uploadData.secure_url) {
    const dl = await fetch(uploadData.secure_url);
    console.log("Download Status:", dl.status);
  }
}
test();
