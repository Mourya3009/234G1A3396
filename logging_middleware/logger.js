import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const token = process.env.TOKEN;

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