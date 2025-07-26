import { useState } from "react";

function App() {
    const [count, setCount] = useState(0);

    return (
        <>
            <div>
                <button onClick={() => setCount((count) => count + 1)}>{count}</button>
            </div>
        </>
    );
}

export default App;
