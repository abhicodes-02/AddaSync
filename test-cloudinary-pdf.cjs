const fs = require('fs');
async function test() {
  const fileId = "testfile_" + Date.now() + ".pdf";
  const formData = new FormData();
  
  const fileBlob = new Blob(["%PDF-1.4 dummy pdf"], { type: "application/pdf" });
  formData.append("file", fileBlob, fileId);
  formData.append("upload_preset", "cghc6hcu");

  const uploadRes = await fetch("https://api.cloudinary.com/v1_1/rchak3gv/raw/upload", {
    method: "POST",
    body: formData
  });
  
  console.log("Upload Status:", uploadRes.status);
  const uploadData = await uploadRes.json();
  console.log("Upload Response:", uploadData);
}
test();
