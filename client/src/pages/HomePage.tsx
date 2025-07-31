import { Link } from "react-router-dom";

export default function HomePage() {
    return (
        <div className="mt-40 flex flex-col items-center space-y-2">
            <Link to="/" className="text-[100px]">
                bluph
            </Link>
            <div className="flex space-x-4">
                <Link to="/create" className="border-1 p-2 rounded-md">
                    Create Game
                </Link>
                <Link to="/join" className="border-1 p-2 rounded-md">
                    Join Game
                </Link>
            </div>
        </div>
    );
}
