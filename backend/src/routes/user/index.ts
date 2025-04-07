import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { signupInput, signinInput } from "@snorlax.karan/medium/dist";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { name, username, password } = signupInput.parse(body);

  try {
    const newUser = await prisma.user.create({
      data: {
        username,
        name,
        password,
      },
    });
    const token = await sign({ userId: newUser?.id }, c.env.JWT_SECRET);
    c.status(201);
    return c.json({
      newUser,
      token,
    });
  } catch (error) {
    c.status(411);
    return c.json({
      error,
    });
  }
});

userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { username, password } = signinInput.parse(body);

  try {
    const user = await prisma.user.findFirst({
      where: {
        username,
        password,
      },
    });
    if (!user) {
      c.status(403);
      return c.json({
        message: "Incorrect credentials",
      });
    }
    const token = await sign({ userId: user.id }, c.env.JWT_SECRET);
    return c.json({ token }, 200);
  } catch (error) {
    return c.json({ error }, 411);
  }
});
