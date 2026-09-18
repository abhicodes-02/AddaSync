import { useState } from "react";
import { FiFile, FiDownload, FiLoader } from "react-icons/fi";
import { decryptFile } from "../../../shared/utils/crypto";

export default function FileAttachment({ m, isMe }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      let finalUrl = m.fileUrl;
      let blobToDownload = null;

      if (m.encryption) {
        // Fetch the encrypted bytes
        const res = await fetch(m.fileUrl);
        if (!res.ok) throw new Error("File not found on server");
        const encryptedBlob = await res.blob();
        
        // Decrypt
        blobToDownload = await decryptFile(encryptedBlob, m.encryption.key, m.encryption.iv, m.fileType);
        finalUrl = URL.createObjectURL(blobToDownload);
      } else {
        // Legacy unencrypted files
        const res = await fetch(m.fileUrl);
        blobToDownload = await res.blob();
        finalUrl = URL.createObjectURL(blobToDownload);
      }

      // Trigger download
      const a = document.createElement("a");
      a.href = finalUrl;
      a.download = m.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      if (m.encryption) {
        setTimeout(() => URL.revokeObjectURL(finalUrl), 10000);
      }
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download file. It may have been deleted.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`
      max-w-[85%] p-1 text-sm leading-relaxed
      ${isMe 
        ? "bg-cyan-600/20 border border-cyan-500/30 rounded-2xl rounded-tr-sm" 
        : "bg-slate-800/80 border border-white/5 rounded-2xl rounded-tl-sm"
      }
    `}>
       <div className="flex items-center gap-3 p-2">
         <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center text-cyan-400 shrink-0">
           <FiFile size={20} />
         </div>
         <div className="min-w-0 flex-1 pr-2">
           <p className="text-white font-medium truncate text-sm" title={m.fileName}>{m.fileName}</p>
           <p className="text-slate-400 text-[10px] uppercase">
             {m.fileSize ? (m.fileSize / 1024 / 1024).toFixed(2) + " MB" : "FILE"}
             {m.encryption && " • E2EE"}
           </p>
         </div>
         <button 
           onClick={handleDownload}
           className="h-10 w-10 shrink-0 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white transition-colors"
           title="Download securely"
         >
           {isDownloading ? <FiLoader className="animate-spin text-cyan-400" /> : <FiDownload size={16} />}
         </button>
       </div>
    </div>
  );
}
