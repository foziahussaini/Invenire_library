// greeting.js - Handles dynamic time-of-day greetings, book subtexts, and weather API

document.addEventListener("DOMContentLoaded", () => {
    // 1. DOM SELECTORS
    const welcomeNameElement = document.getElementById("dashboardWelcomeName");
    const greetingTextElement = document.getElementById("dashboardGreetingText");
    const weatherTextElement = document.getElementById("dashboardWeather");
    const weatherIconElement = document.querySelector(".welcome-card .weather i");

    // 2. EXTRACT LOGGED-IN USER SESSION CACHE
    const localUserCache = localStorage.getItem("invenireUser");
    let userFirstName = "Book Friend";

    if (localUserCache) {
        try {
            const userData = JSON.parse(localUserCache);
            const fullName = userData.full_name || "Book Friend";
            // Grab only the first name string before any spacing gaps
            userFirstName = fullName.trim().split(" ")[0];
        } catch (e) {
            console.error("Failed to compile background local user cache state:", e);
        }
    }

    // =========================================================================
    // PART A: DYNAMIC TIME-OF-DAY MANAGER
    // =========================================================================
    function getTimedGreeting(name) {
        const currentHour = new Date().getHours();
        let timePeriodMessage = "Hello";

        if (currentHour >= 5 && currentHour < 12) {
            timePeriodMessage = "Good morning";
        } else if (currentHour >= 12 && currentHour < 17) {
            timePeriodMessage = "Good afternoon";
        } else if (currentHour >= 17 && currentHour < 21) {
            timePeriodMessage = "Good evening";
        } else {
            timePeriodMessage = "Good night";
        }

        return `${timePeriodMessage}, ${name}!`;
    }

    // Set time greeting immediately on execution context
    if (welcomeNameElement) {
        welcomeNameElement.textContent = getTimedGreeting(userFirstName);
    }

    // =========================================================================
    // PART B: RANDOM BOOK SUBTEXT ARRAYS MATRIX
    // =========================================================================
    const warmGreetings = [
        "Your next great adventure is waiting between the pages.",
        "Hello book friend! Ready to get lost in another world today?",
        "Step inside, escape the noise, and find your next story.",
        "Every book is a quiet friend waiting to talk to you.",
        "Welcome back to your happy place. Let’s find a story to warm your heart today."
    ];

    function setRandomBookSubtext() {
        if (!greetingTextElement) return;
        const randomIndex = Math.floor(Math.random() * warmGreetings.length);
        greetingTextElement.textContent = warmGreetings[randomIndex];
    }

    setRandomBookSubtext();

    // =========================================================================
    // PART C: ASYNCHRONOUS IP-BASED WEATHER API SYSTEM
    // =========================================================================
    async function fetchLiveLocalWeather() {
        if (!weatherTextElement) return;

        try {
            const response = await fetch("https://wttr.in");
            if (!response.ok) throw new Error("Weather network API rejected connection reference.");

            const weatherData = await response.json();
            
            // Extract temperature parameters safely
            const currentTempC = weatherData.current_condition[0].temp_C;
            const weatherDesc = (weatherData.current_condition[0].weatherDesc[0].value || "").toLowerCase();

            // Render live Celsius details into layout span tag
            weatherTextElement.textContent = `${currentTempC}°C`;

            // Transform weather graphics classes safely matching current conditions
            if (weatherIconElement) {
                weatherIconElement.className = "fas"; // Clear baseline styles first
                if (weatherDesc.includes("rain") || weatherDesc.includes("shower") || weatherDesc.includes("drizzle")) {
                    weatherIconElement.classList.add("fa-cloud-showers-heavy");
                } else if (weatherDesc.includes("cloud") || weatherDesc.includes("overcast") || weatherDesc.includes("mist")) {
                    weatherIconElement.classList.add("fa-cloud");
                } else if (weatherDesc.includes("snow") || weatherDesc.includes("ice") || weatherDesc.includes("sleet")) {
                    weatherIconElement.classList.add("fa-snowflake");
                } else if (weatherDesc.includes("thunder") || weatherDesc.includes("storm")) {
                    weatherIconElement.classList.add("fa-cloud-bolt");
                } else {
                    weatherIconElement.classList.add("fa-sun"); // Default Clear Sky sunny day asset fallback
                }
            }
        } catch (error) {
            console.warn("Weather API offline. Setting structural fallback:", error.message);
            weatherTextElement.textContent = "25°C"; // Graceful fallback prevents blank dashboards
            if (weatherIconElement) weatherIconElement.className = "fas fa-sun";
        }
    }

    fetchLiveLocalWeather();
});
