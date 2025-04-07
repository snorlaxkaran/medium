import { Hono } from "hono";
import { blogRouter } from "./routes/blog";
import { userRouter } from "./routes/user";

const app = new Hono();

app.route("/api/v1/blog", blogRouter);
app.route("/api/v1/user", userRouter);

export default app;
