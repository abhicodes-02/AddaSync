const fs = require('fs');
let file = fs.readFileSync('src/features/room/hooks/useWebRTC.js', 'utf8');

// I will just locate the exact catch(e) {} and replace it.
const searchStr = `        // Delete Filebin (E2EE files)
        try {
          const binName = "addasync_" + roomId.toLowerCase().replace(/[^a-z0-9]/g, "");
          await fetch(\`https://filebin.net/\${binName}\`, { method: "DELETE" });
        } catch(e) {}
}, [roomId]);`;

// actually let's just do it manually by reading line by line
const lines = file.split(/\r?\n/);
const newLines = [];
let i = 0;
while(i < lines.length) {
  if (lines[i].includes('} catch(e) {}') && lines[i+1] && lines[i+1].includes('}, [roomId]);')) {
    newLines.push(lines[i]);
    newLines.push('        // 3. Delete Main Room Document');
    newLines.push('        try {');
    newLines.push('          await deleteDoc(doc(db, "calls", roomId));');
    newLines.push('        } catch (e) {');
    newLines.push('          console.warn("Failed to delete room document:", e);');
    newLines.push('        }');
    newLines.push('      }');
    newLines.push('    } catch (err) {');
    newLines.push('      console.warn("Participant cleanup error:", err);');
    newLines.push('    }');
    newLines.push('  }, [roomId]);');
    i += 2;
  } else {
    newLines.push(lines[i]);
    i++;
  }
}

fs.writeFileSync('src/features/room/hooks/useWebRTC.js', newLines.join('\n'));
