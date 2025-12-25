import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`[USER SERVICE] is running on port ${PORT}`);
});
