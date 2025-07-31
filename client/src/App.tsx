import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreatePage from "./pages/CreatePage";
import JoinPage from "./pages/JoinPage";
import GamePage from "./pages/GamePage";

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create" element={<CreatePage />} />
                <Route path="/join" element={<JoinPage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
        </Router>
    );
}
