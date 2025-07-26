import { useState } from "react";
import Chat from "./components/Chat";

function App() {
    const [count, setCount] = useState(0);

    return (
        <>
            <div>
                <button onClick={() => setCount((count) => count + 1)}>{count}</button>
                <Chat />
            </div>
        </>
    );
}

export default App;
