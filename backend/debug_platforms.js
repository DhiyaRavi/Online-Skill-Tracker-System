
import axios from "axios";

const testHackerRankAPI = async (username) => {
    try {
        console.log(`Testing HackerRank API for ${username}...`);
        
        // Endpoint 1: Badges
        const badgeUrl = `https://www.hackerrank.com/rest/hackers/${username}/badges`;
        try {
            const { data } = await axios.get(badgeUrl, {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            console.log("Badges API Success:", JSON.stringify(data, null, 2));
        } catch (e) {
            console.log("Badges API Failed:", e.response?.status || e.message);
        }

        // Endpoint 2: Profile/Hackers
        const profileUrl = `https://www.hackerrank.com/rest/hackers/${username}`;
        try {
             const { data } = await axios.get(profileUrl, {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            console.log("Profile API Success:", JSON.stringify(data, null, 2));
        } catch (e) {
            console.log("Profile API Failed:", e.response?.status || e.message);
        }

    } catch (e) {
         console.error("General Error:", e.message);
    }
};

testHackerRankAPI("neal_wu");
