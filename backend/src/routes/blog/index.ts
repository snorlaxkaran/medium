import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { createBlogInput, updateBlogInput } from "@snorlax.karan/medium/dist";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const authHeader = c.req.header("Authorization") || "";
  try {
    const user = (await verify(authHeader, c.env.JWT_SECRET)) as {
      userId: string;
    };

    if (user) {
      c.set("userId", user.userId);
      await next();
    } else {
      return c.json({ message: "You are not logged in" }, 403);
    }
  } catch (error) {
    return c.json({ message: "You are not logged in" }, 403);
  }
});

blogRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = createBlogInput.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }
  const { title, content } = parsed.data;

  const newBlog = await prisma.blog.create({
    data: {
      content,
      title,
      authorId: userId,
    },
  });
  return c.json({ newBlog }, 201);
});

blogRouter.put("/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blogId = c.req.param("id");

  const body = await c.req.json();
  const parsed = updateBlogInput.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }
  const { title, content } = parsed.data;

  const newBlog = await prisma.blog.update({
    where: {
      id: blogId,
    },
    data: {
      content,
      title,
    },
  });
  return c.json({ newBlog }, 201);
});

blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blogs = await prisma.blog.findMany({});
    return c.json<{ blogs: typeof blogs }>({ blogs }, 200);
  } catch (error) {
    return c.json({ error }, 400);
  }
});

blogRouter.get("/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const blogId = c.req.param("id");

  try {
    const blog = await prisma.blog.findFirst({
      where: {
        id: blogId,
      },
    });
    return c.json({ blog }, 200);
  } catch (error) {
    return c.json({ error }, 400);
  }
});
