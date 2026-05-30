import axios from 'axios';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyMzRnMWEzMzk2QHNyaXQuYWMuaW4iLCJleHAiOjE3ODAxMjA1NjMsImlhdCI6MTc4MDExOTY2MywiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjMyNmUxZWM5LTM0ODUtNDU0Ny1hMGIyLTI0NGY3MjgyMDY5OCIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6Im1vdXJ5YSBheXlhcHBhIG4iLCJzdWIiOiI3NjAyOTdmMy03NzZiLTRkNzQtOWMyMS1mMzM5MTNjZjE1MDgifSwiZW1haWwiOiIyMzRnMWEzMzk2QHNyaXQuYWMuaW4iLCJuYW1lIjoibW91cnlhIGF5eWFwcGEgbiIsInJvbGxObyI6IjIzNGcxYTMzOTYiLCJhY2Nlc3NDb2RlIjoiU2RrakpHIiwiY2xpZW50SUQiOiI3NjAyOTdmMy03NzZiLTRkNzQtOWMyMS1mMzM5MTNjZjE1MDgiLCJjbGllbnRTZWNyZXQiOiJ2elVOZHFrUmZUdFVZdE1DIn0.FMC3cYI7gAyvQiUDBkIiX2fQyCeAHJQpnVWuon4yAlo";

async function Log(stack,level,pkg,message){
     try {
        const res = await axios.post("http://4.224.186.213/evaluation-service/logs", {
            stack: stack,
            level: level,
            package: pkg,
            message: message
        },
        {
            headers: {
                Authorization: `token ${token}`
            }
        });
    } catch (err) {
        console.log("couldnt send log", err.message);
    }
}

Log("backend", "info", "handler", "testing if logger works");

export default Log;