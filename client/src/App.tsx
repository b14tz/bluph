import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreateGamePage from "./pages/CreateGamePage";
import JoinGamePage from "./pages/JoinGamePage";

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create" element={<CreateGamePage />} />
                <Route path="/join" element={<JoinGamePage />} />
                <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
        </Router>
    );
}
