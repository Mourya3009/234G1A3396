import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import Log from '../logging_middleware/logger.js';

dotenv.config({ path: '../.env' });
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyMzRnMWEzMzk2QHNyaXQuYWMuaW4iLCJleHAiOjE3ODAxMjU4NTQsImlhdCI6MTc4MDEyNDk1NCwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6ImZkMGQzODFhLTJjMjEtNDM2MC1hMDRkLWNlNjBiY2Q2MzJmOCIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6Im1vdXJ5YSBheXlhcHBhIG4iLCJzdWIiOiI3NjAyOTdmMy03NzZiLTRkNzQtOWMyMS1mMzM5MTNjZjE1MDgifSwiZW1haWwiOiIyMzRnMWEzMzk2QHNyaXQuYWMuaW4iLCJuYW1lIjoibW91cnlhIGF5eWFwcGEgbiIsInJvbGxObyI6IjIzNGcxYTMzOTYiLCJhY2Nlc3NDb2RlIjoiU2RrakpHIiwiY2xpZW50SUQiOiI3NjAyOTdmMy03NzZiLTRkNzQtOWMyMS1mMzM5MTNjZjE1MDgiLCJjbGllbnRTZWNyZXQiOiJ2elVOZHFrUmZUdFVZdE1DIn0.CpRNDsDKO0ah81ZlWTNO840WGp0TnRV2WqWSKNFGmKo";

const app = express();

app.use(express.json());

const headers = {Authorization: `Bearer ${token}`};

const priorityWeights={
    "Placement": 3,
    "Result": 2,
    "Event": 1
};

async function getNotifications() {
    const res= await axios.get("http://4.224.186.213/evaluation-service/notifications",{headers});
    return res.data.notifications;
}

function getTopN(notifications, n) {
    return notifications.sort((a, b) => {
        const weightDiff= (priorityWeights[b.Type]||0)- (priorityWeights[a.Type] || 0);
        if (weightDiff!==0) return weightDiff;
        return new Date(b.Timestamp) - new Date(a.Timestamp);
    }).slice(0, n);
}

app.get("/priority-inbox", async (req, res) => {
    try{
        const n=Number(req.query.n) || 10;

        await Log("backend", "info", "route", `priority inbox requested for top ${n}`);

        const notifications=await getNotifications();
        const top= getTopN(notifications, n);

        await Log("backend", "info", "handler", `returning top ${top.length} notifications`);

        console.log(`\nTop ${n} Priority Notifications:`);
        top.forEach((notif, i) => {
            console.log(`${i + 1}.[${notif.Type}] ${notif.Message} - ${notif.Timestamp}`);
        });

        res.json({top});

    } catch (err) {
        await Log("backend", "error", "handler", "priority inbox failed: "+err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log("server running on 3000");
});