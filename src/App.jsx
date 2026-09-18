import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./shared/components/Toast.jsx";
import LoadingScreen from "./shared/components/LoadingScreen.jsx";

const JoinRoom = lazy(() => import("./features/home/Home.jsx"));
const VideoRoom = lazy(() => import("./features/room/Room.jsx"));

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


