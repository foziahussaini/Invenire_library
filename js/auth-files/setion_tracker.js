import { app, analytics, db, auth } from "../../src/firebase-config.js"; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, updateDoc, increment, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const sessionStartTime = Date.now();

async function syncGlobalUserSession() {
    const localUserSession = localStorage.getItem("userSession");
    if (!localUserSession) return; // Safely exits if no user is logged in yet

    try {
        const sessionData = JSON.parse(localUserSession);
        
        if (sessionData && sessionData.role === "member" && sessionData.uid) {
            const currentUserId = sessionData.uid; 
            const userDocRef = doc(db, "members", currentUserId);
            const docSnap = await getDoc(userDocRef);
            
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const updates = {};

                if (userData["last-login"]) {
                    let dateObj = userData["last-login"].toDate ? userData["last-login"].toDate() : new Date(userData["last-login"]);
                    const lastLoginDay = dateObj.getUTCDate();
                    const todayDay = new Date().getUTCDate();

                    if (lastLoginDay !== todayDay) {
                        updates.active_minutes_last_day = 0;
                        updates["last-login"] = new Date().toISOString(); 
                        
                        await updateDoc(userDocRef, updates);
                        console.log("New day detected! Active minutes cleared to 0.");
                    }
                }
            }
        }
    } catch (error) {
        console.error("Global session tracking error:", error);
    }
}

// Check session on file load
syncGlobalUserSession();

// === CRITICAL FIX: Added safety check inside visibility listener ===
document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "hidden") {
        const localUserSession = localStorage.getItem("userSession");
        if (!localUserSession) return; // 🔥 FIX: Break early if null so it won't crash your login screen!

        try {
            const sessionData = JSON.parse(localUserSession);
            if (sessionData && sessionData.role === "member" && sessionData.uid) {
                const currentUserId = sessionData.uid;
                const timeSpentMs = Date.now() - sessionStartTime;
                const minutesActive = timeSpentMs / (1000 * 60);

                if (minutesActive > 0.1) {
                    const userDocRef = doc(db, "members", currentUserId);
                    await updateDoc(userDocRef, {
                        active_minutes_last_day: increment(Number(minutesActive.toFixed(2))),
                        "last-login": new Date().toISOString()
                    });
                }
            }
        } catch (e) {
            console.error("Failed to compile background time trackers:", e);
        }
    }
});
