import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`[JOB SERVICE] is running on port ${PORT}`);
});
