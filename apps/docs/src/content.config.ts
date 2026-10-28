import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// The pages are written by scripts/generate.mjs into src/content/docs.
const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.enum(["handbook", "engineering", "runbooks", "product", "people", "security"]),
    order: z.number().int(),
    owner: z.string(),
    team: z.string(),
    updated: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { docs };
