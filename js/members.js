import { db } from "../../js/firebase-config.js";
import { collection, getDocs } from "https://gstatic.com";

document.addEventListener("DOMContentLoaded", async () => {
    const memberDisplayContainer = document.querySelector(".members-list-container"); // Your UI container wrapper
    
    // 1. Grab parameter from the browser navigation trackbar
    const urlParams = new URLSearchParams(window.location.search);
    const searchTarget = urlParams.get("search");

    try {
        const querySnapshot = await getDocs(collection(db, "members"));
        memberDisplayContainer.innerHTML = "";

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // 2. If filtering for a specific parameter, skip non-matching objects
            if (searchTarget && data.full_name !== searchTarget) {
                return;
            }

            // Create member interface cards matching your custom key parameters
            const memberCard = document.createElement("div");
            memberCard.className = "member-card";
            memberCard.innerHTML = `
                <h3>${data.full_name}</h3>
                <p>Email: ${data.email}</p>
                <p>Location: ${data.location}</p>
                <p>User ID: ${data.userid}</p>
            `;
            memberDisplayContainer.appendChild(memberCard);
        });
    } catch (error) {
        console.error("Error displaying members registry entries:", error);
    }
});
