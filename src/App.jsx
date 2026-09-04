import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast.jsx";
import LoadingScreen from "./components/ui/LoadingScreen.jsx";

const JoinRoom = lazy(() => import("./components/JoinRoom.jsx"));
const VideoRoom = lazy(() => import("./components/VideoRoom.jsx"));

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen message="Loading..." />}>
          <Routes>
            <Route path="/" element={<JoinRoom />} />
            <Route path="/room/:roomId" element={<VideoRoom />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;

