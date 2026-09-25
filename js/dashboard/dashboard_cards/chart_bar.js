import { db } from "../../../src/firebase-config.js";
import { collection, getDocs, query, orderBy} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const trafficChartBar = document.getElementById("chart-bars");

// DEFAULT DATASETS (Used if Firebase has < 40 documents)
const dailyDataDefault = [
    { lable: "8:00", value: "54.6" }, { lable: "9:00", value: "62.3" }, { lable: "10:00", value: "58.1" },
    { lable: "11:00", value: "65.4" }, { lable: "12:00", value: "47.8" }, { lable: "13:00", value: "35.2" },
    { lable: "14:00", value: "65.5" }, { lable: "15:00", value: "89.5" }, { lable: "16:00", value: "74.5" },
    { lable: "17:00", value: "55.5" }, { lable: "18:00", value: "49.5" }, { lable: "19:00", value: "29.5" },
    { lable: "20:00", value: "84.5" }
];

const weeklyDataDefault = [
    { lable: "Mon", value: "54.6" }, { lable: "Tue", value: "62.3" }, { lable: "Wed", value: "58.1" },
    { lable: "Thu", value: "65.4" }, { lable: "Fri", value: "47.8" }, { lable: "Sat", value: "35.2" },
    { lable: "Sun", value: "60.5" }
];

const monthlyDataDefault = [
    { label: "Jan", value: "67" }, { lable: "Feb", value: "65.4" }, { lable: "Mar", value: "47.8" },
    { lable: "Apr", value: "65.2" }, { lable: "May", value: "49.5" }, { lable: "June", value: "89.5" },
    { lable: "July", value: "29.5" }, { lable: "Aug", value: "59.5" }, { lable: "Sep", value: "29.5" },
    { lable: "Oct", value: "79.5" }, { lable: "Nov", value: "29.5" }, { lable: "Dec", value: "39.5" }
];

// Clean formatted output for daily clock
function formatDailyPeak(rawLabel) {
    if (rawLabel.includes(":")) {
        let hour = parseInt(rawLabel.split(":")[0], 10);
        let ampm = hour >= 12 ? "PM" : "AM";
        let displayHour = hour > 12 ? hour - 12 : hour;
        if (displayHour === 0) displayHour = 12;
        return `${displayHour}:00${ampm}`;
    }
    return rawLabel.toLowerCase();
}

// CORE RENDERING ENGINE
function renderBars(cardElement, chartContainer, dataset, viewType) {
    chartContainer.innerHTML = "";

    const chartValue = dataset.map(item => parseFloat(item.value) || 0);
    const maxValue = Math.max(...chartValue, 1);
    
    // Track valid non-zero values to find the absolute lowest metric point
    const positiveValues = chartValue.filter(val => val > 0);
    const minValue = positiveValues.length > 0 ? Math.min(...positiveValues) : 0;

    const totalSum = Math.floor(chartValue.reduce((acc, curr) => acc + curr, 0));
    
    let peakLabel = "";

    dataset.forEach((element, i) => {
        const currentValue = chartValue[i];
        const height = (currentValue / maxValue) * 100;
        const labelText = element.lable || element.label || "";
        
        let highestValueChartLine = "chartBar";
        
        // 1. Evaluate Peak Highlight Class Condition
        if (currentValue === maxValue && currentValue > 0) {
            highestValueChartLine = "highestBar chartBar";
            peakLabel = labelText; 
        } 
        // 2. Evaluate Lowest Point Highlight Class Condition
        else if (currentValue === minValue && currentValue > 0) {
            highestValueChartLine = "lowestBar chartBar";
        }

        chartContainer.innerHTML += `
            <div class="chart-column">
                <div class="bar-wrapper">
                    <div class="${highestValueChartLine}" style="height: ${height}%;" data-label="${labelText}" data-value="$${currentValue}"></div>
                </div>
                <span class="bar-label">${labelText}</span>
            </div>
        `;
    });

    // FIXED: Now accurately targeting your modified class .latestTime-peak selection block
    const peakDisplayZone = cardElement.querySelector(".latestTime-peak span");
    if (peakDisplayZone && peakLabel) {
        peakDisplayZone.textContent = `peak ${formatDailyPeak(peakLabel)}`; 
    }

    const detailsParagraph = cardElement.querySelector(".details");
    if (detailsParagraph) {
        let timeSuffix = viewType === "weekly" ? "this week" : viewType === "monthly" ? "this month" : "today";
        detailsParagraph.textContent = `over ${totalSum} visitors ${timeSuffix}`;
    }
}

// MAIN INTERACTIVE CARD FUNCTION
async function updateTrafficChartBar(cardElement) {
    if (!cardElement) return;

    const visualChartZone = cardElement.querySelector(".traffic-chart");
    if (!visualChartZone) return;

    // Create Initial Shell
    const headerHTML = `
        <div class="traffic-card-header">
            <span class="title-main">Peak Traffic Hours</span>
            <div class="latestTime-peak"><span>peak ...</span></div>
            <div class="traffic-toggle-tabs">
                <button class="tab-btn active" data-view="daily">Daily</button>
                <button class="tab-btn" data-view="weekly">Weekly</button>
                <button class="tab-btn" data-view="monthly">Monthly</button>
            </div>
            <p class="details">Loading traffic data...</p>
        </div>
    `;
    cardElement.insertAdjacentHTML("afterbegin", headerHTML);

    // Standard working variables that hold the active live or fallback data
    let activeDaily = dailyDataDefault;
    let activeWeekly = weeklyDataDefault;
    let activeMonthly = monthlyDataDefault;

    try {
        // Fetch direct from your Firestore logs collection
        const trafficRef = collection(db, "library-traffic");
        const trafficQuery = query(trafficRef, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(trafficQuery);

        // THRESHOLD CHECK: Must have 40 or more active data entries
        if (!snapshot.empty && snapshot.size >= 40) {
            
            // Re-initialize buckets
            let hourBuckets = {};
            dailyDataDefault.forEach(d => hourBuckets[parseInt(d.lable, 10)] = 0);

            let weekBuckets = { "Mon":0, "Tue":0, "Wed":0, "Thu":0, "Fri":0, "Sat":0, "Sun":0 };
            
            let monthBuckets = { "Jan":0, "Feb":0, "Mar":0, "Apr":0, "May":0, "June":0, "July":0, "Aug":0, "Sep":0, "Oct":0, "Nov":0, "Dec":0 };

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.timestamp) {
                    const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
                    
                    // 1. Process Hours
                    const hr = date.getHours();
                    if (hourBuckets[hr] !== undefined) hourBuckets[hr]++;

                    // 2. Process Weeks
                    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const dayStr = dayNames[date.getDay()];
                    if (weekBuckets[dayStr] !== undefined) weekBuckets[dayStr]++;

                    // 3. Process Months
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const monthStr = monthNames[date.getMonth()];
                    if (monthBuckets[monthStr] !== undefined) monthBuckets[monthStr]++;
                }
            });

            // Map buckets cleanly into arrays
            activeDaily = Object.keys(hourBuckets).map(h => ({ lable: `${h}:00`, value: hourBuckets[h].toString() }));
            activeWeekly = Object.keys(weekBuckets).map(w => ({ lable: w, value: weekBuckets[w].toString() }));
            activeMonthly = Object.keys(monthBuckets).map(m => ({ lable: m, value: monthBuckets[m].toString() }));
        }
    } catch (error) {
        console.warn("Firestore data collection low or unreadable. Displaying native backup data sets.", error);
    }

    // Initial render pass (Defaults to Daily Data)
    let dynamicStateTracker = "daily";
    let activeCollectionDataset = activeDaily;
    renderBars(cardElement, visualChartZone, activeCollectionDataset, dynamicStateTracker);

    // Click tab handler triggers
    const tabsContainer = cardElement.querySelector(".traffic-toggle-tabs");
    tabsContainer.addEventListener("click", (event) => {
        const clickedButton = event.target.closest(".tab-btn");
        if (!clickedButton) return;

        tabsContainer.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
        clickedButton.classList.add("active");

        dynamicStateTracker = clickedButton.getAttribute("data-view");
        
        if (dynamicStateTracker === "daily") activeCollectionDataset = activeDaily;
        if (dynamicStateTracker === "weekly") activeCollectionDataset = activeWeekly;
        if (dynamicStateTracker === "monthly") activeCollectionDataset = activeMonthly;

        renderBars(cardElement, visualChartZone, activeCollectionDataset, dynamicStateTracker);
    });
}

updateTrafficChartBar(trafficChartBar);
