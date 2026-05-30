import axios from 'axios';
import Log from '../logging_middleware/logger.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
const token = process.env.TOKEN;

const headers = {Authorization: `Bearer ${token}`};

async function getDepots() {
    const res = await axios.get("http://4.224.186.213/evaluation-service/depots", { headers });
    return res.data.depots;
}
async function getVehicles() {
    const res = await axios.get("http://4.224.186.213/evaluation-service/vehicles", { headers });
    return res.data.vehicles;
}

function knapsack(vehicles,budget){
    const n = vehicles.length;
    const dp = Array(n+ 1).fill(null).map(()=>Array(budget+1).fill(0));
    let w = budget;
    const picked = [];
    for(let i=1;i<=n;i++){
        const duration= vehicles[i-1].Duration;
        const impact= vehicles[i-1].Impact;
        for(let w=0;w<=budget;w++){
            if(duration<=w){
                dp[i][w]= Math.max(dp[i-1][w],dp[i-1][w-duration]+ impact);
            }else{
                dp[i][w]= dp[i-1][w];
            }
        }
    }
    
    for(let i=n;i>0;i--){
        if(dp[i][w]!==dp[i-1][w]){
            picked.push(vehicles[i-1]);
            w-= vehicles[i-1].Duration;
        }
    }

    return {picked, totalImpact: dp[n][budget]};
}

async function main() {
    try {
        await Log("backend", "info", "service", "scheduler started");

        const depots= await getDepots();
        const vehicles= await getVehicles();

        await Log("backend", "info", "service", `fetched ${depots.length} depots and ${vehicles.length} vehicles`);

        for(let depot of depots){
            const budget= depot.MechanicHours;
            const {picked, totalImpact}= knapsack(vehicles, budget);

            await Log("backend", "info", "service", `depot ${depot.ID}-budget ${budget}hrs-impact ${totalImpact}`);

            console.log(`\nDepot ${depot.ID} , Budget: ${budget} hrs , Total Impact: ${totalImpact}`);
            console.log("Selected vehicles:");
            picked.forEach(v=>{
                console.log(`  - TaskID: ${v.TaskID} , Duration: ${v.Duration} , Impact: ${v.Impact}`);
            });
        }

        await Log("backend", "info", "service", "scheduler completed successfully");

    }catch(err) {
        await Log("backend", "error", "service", "scheduler failed: " + err.message);
        console.log("error", err.message);
    }
}

main();