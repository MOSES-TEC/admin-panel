import { createContext, useContext, useState } from "react";


const RestartContext = createContext();

export function RestartProvider({children}) {
    const [ showRestartPopup, setShowRestartPopup ] = useState(false);

    const startRestart = () => {
        setShowRestartPopup(true);
    };

    const endRestart = () => {
        setShowRestartPopup(false);
    };

    return (
        <RestartContext.Provider value={{ showRestartPopup, startRestart, endRestart }}>
            {children}
            {showRestartPopup && (
                <div className="restart_overlay">
                    <div className="restart_modal">
                        <h2 className="restart_title">Please Restart the server with "npm run restart"</h2>
                        <div className="restart_content">
                            <div className="restart_spinner_wrapper">
                                <div className="restart_spinner"></div>
                            </div>
                            <p className="restart_message">
                                Please Restart the application for update the changes...
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </RestartContext.Provider>
    )
}

export function useRestart() {
    return useContext(RestartContext);
}


