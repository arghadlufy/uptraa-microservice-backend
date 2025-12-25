import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`[AUTH SERVICE] is running on port ${PORT}`);
});
