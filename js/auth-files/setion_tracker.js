import { app, db, auth } from "../../src/firebase-config.js"; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, updateDoc, increment, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const currentFileName = window.location.pathname.split("/").pop().toLowerCase();

// === SHIELD 1: Stop tracking entirely on auth gateway pages ===
if (["login.html", "signup.html", "auth.html"].includes(currentFileName)) {
    console.log("🛑 Background session tracking bypassed on authentication views.");
} else {
    const sessionStartTime = Date.now();

    // === FIX: Wrap your session sync inside Firebase's Auth state observer ===
    onAuthStateChanged(auth, async (user) => {
        // SHIELD 2: If Firebase Auth states they are not logged in, DO NOT touch Firestore
        if (!user) return; 

        const localUserSession = localStorage.getItem("userSession");
        if (!localUserSession) return; 

        try {
            const sessionData = JSON.parse(localUserSession);
            
            // Confirm the authenticated user matches the storage session user
            if (sessionData && sessionData.role === "member" && sessionData.uid === user.uid) {
                const currentUserId = user.uid; 
                const userDocRef = doc(db, "members", currentUserId);
                const docSnap = await getDoc(userDocRef);
                
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const updates = {};

                    if (userData["last-login"]) {
                        // Safe normalization supporting both native timestamps and ISO string objects
                        let dateObj = (userData["last-login"] && typeof userData["last-login"].toDate === "function") 
                            ? userData["last-login"].toDate() 
                            : new Date(userData["last-login"]);

                        const lastLoginDay = dateObj.getUTCDate();
                        const todayDay = new Date().getUTCDate();

                        if (lastLoginDay !== todayDay) {
                            updates.active_minutes_last_day = 0;
                            updates["last-login"] = new Date().toISOString(); 
                            
                            await updateDoc(userDocRef, updates);
                            console.log("🟢 New day detected! Active minutes reset to 0.");
                        }
                    }
                }
            }
        } catch (error) {
            console.error("❌ Global session tracking error:", error);
        }
    });

    // Background app tab visibility metric tracker
    document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "hidden") {
            // Reverify user existence on firebase auth before pushing background writes
            const user = auth.currentUser;
            const localUserSession = localStorage.getItem("userSession");
            if (!user || !localUserSession) return; 

            try {
                const sessionData = JSON.parse(localUserSession);
                if (sessionData && sessionData.role === "member" && sessionData.uid === user.uid) {
                    const currentUserId = user.uid;
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
                console.error("❌ Failed to compile background time trackers:", e);
            }
        }
    });
}
