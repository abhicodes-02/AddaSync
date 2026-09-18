const fs = require('fs');
async function test() {
  const fileId = "testfile_" + Date.now() + ".txt"; // Append .txt to bypass security
  const formData = new FormData();
  
  const fileBlob = new Blob(["%PDF-1.4 dummy pdf content..."], { type: "application/pdf" });
  formData.append("file", fileBlob, fileId);
  formData.append("upload_preset", "cghc6hcu");

  console.log("Uploading fake pdf as txt...");
  const uploadRes = await fetch("https://api.cloudinary.com/v1_1/rchak3gv/raw/upload", {
    method: "POST",
    body: formData
  });
  
  const uploadData = await uploadRes.json();
  console.log("Upload Status:", uploadRes.status);
  
  if (uploadData.secure_url) {
    const dl = await fetch(uploadData.secure_url);
    console.log("Download Status:", dl.status);
    console.log("Downloaded bytes:", (await dl.arrayBuffer()).byteLength);
  }
}
test();
