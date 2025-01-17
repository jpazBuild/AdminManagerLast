"use client"
import { useState } from "react";
import { Dashboard } from "../Layouts/dashboard"


const Reports = () =>{
      const [darkMode,setDarkMode] = useState(false);
    
    const handleToggleDarkMode = (darkMode: boolean) => {
        setDarkMode(darkMode)
       };
    return(
        <Dashboard onToggleDarkMode={handleToggleDarkMode}>
            <h2 className="text-center mt-3">Reports saved</h2>

        </Dashboard>
    )
}

export default Reports;