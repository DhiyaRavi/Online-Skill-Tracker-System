
import axios from 'axios';

async function test() {
    try {
        console.log("Testing POST http://localhost:5000/api/ai/leetcode-guide");
        const res = await axios.post("http://localhost:5000/api/ai/leetcode-guide", {
            username: "test_user",
            stats: {
                acSubmissionNum: [
                    { difficulty: "All", count: 100 },
                    { difficulty: "Easy", count: 50 },
                    { difficulty: "Medium", count: 30 },
                    { difficulty: "Hard", count: 20 }
                ]
            }
        });
        console.log("Success:", res.data);
    } catch (e) {
        if (e.response) {
            console.error("Error Status:", e.response.status);
            console.error("Error Data:", e.response.data);
        } else {
            console.error("Error:", e.message);
        }
    }
}

test();
