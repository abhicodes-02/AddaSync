const fs = require('fs');
let file = fs.readFileSync('src/features/room/hooks/useWebRTC.js', 'utf8');

file = file.replace(
  `} catch(e) {}\n    }, [roomId]);`,
  `} catch(e) {}\n          // 3. Delete Main Room Document\n          try {\n            await deleteDoc(doc(db, "calls", roomId));\n          } catch (e) {\n            console.warn("Failed to delete room document:", e);\n          }\n        }\n      } catch (err) {\n        console.warn("Participant cleanup error:", err);\n      }\n    }, [roomId]);`
);
fs.writeFileSync('src/features/room/hooks/useWebRTC.js', file);
