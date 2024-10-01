const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Update this to match your Vite frontend URL
    methods: ["GET", "POST"]
  }
});

const port = 3005;

app.use(cors());
app.use(express.json());

let cronJob;

const BITQUERY_API_KEY = process.env.BITQUERY_API_KEY;
const BITQUERY_ENDPOINT = "https://graphql.bitquery.io";

async function fetchTopWhalesAndTransactions() {
  const query = `
  query MyQuery {
    ethereum(network: bsc) {
      transfers(options: {limit: 10}, amount: {gt: 1000000000000000000}) {
        transaction {
          hash
        }
        sender {
          address
        }
        receiver {
          address
        }
        currency {
          symbol
        }
      }
    }
  }
  `;

  try {
    const response = await axios.post(
      BITQUERY_ENDPOINT,
      { query },
      {
        headers: {
          "X-API-KEY": BITQUERY_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data.ethereum;
  } catch (error) {
    console.error("Error fetching whale data:", error.message);
    return null;
  }
}

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.post("/set-interval", (req, res) => {
  const { interval } = req.body;
  console.log("Setting interval:", interval);
  if (cronJob) {
    cronJob.stop();
  }

  cronJob = cron.schedule(`*/${interval} * * * *`, async () => {
    console.log("Running cron job");
    const whaleData = await fetchTopWhalesAndTransactions();
    console.log("Whale data:", whaleData);
    if (whaleData) {
      io.emit("whaleData", whaleData);
    }
  });

  res.json({ message: `Cron job set to run every ${interval} minutes` });
});

app.get("/test-fetch", async (req, res) => {
  const whaleData = await fetchTopWhalesAndTransactions();
  res.json({ whaleData });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});